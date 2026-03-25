import litellm
from litellm import acompletion
from typing import AsyncGenerator, Optional
import json
import httpx

from ..core.security import key_store


PROVIDERS = {
    'openai': {
        'models': ['gpt-4o', 'gpt-4o-mini', 'gpt-4.5-preview', 'o1', 'o3-mini'],
        'prefix': 'openai'
    },
    'gemini': {
        'models': ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        'prefix': 'gemini'
    },
    'deepseek': {
        'models': ['deepseek-chat', 'deepseek-reasoner'],
        'prefix': 'deepseek'
    },
    'nvidia': {
        'models': ['nvidia/llama-3.1-nemotron-70b', 'nvidia/meta/llama-3.1-405b-instruct'],
        'prefix': 'nvidia'
    },
    'anthropic': {
        'models': ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-4.6'],
        'prefix': 'anthropic'
    }
}


class LLMRouter:
    def __init__(self):
        self._provider_configs = PROVIDERS
    
    def get_available_providers(self) -> list[str]:
        return list(self._provider_configs.keys())
    
    def get_models_for_provider(self, provider: str) -> list[str]:
        config = self._provider_configs.get(provider.lower())
        if config:
            return config['models']
        return []

    async def fetch_remote_models(self, provider: str) -> list[str]:
        provider = provider.lower()
        config = self._provider_configs.get(provider)
        if not config:
            return []
            
        api_key = key_store.get_key(provider)
        fallback_models = config['models']
        if not api_key:
            return fallback_models
            
        try:
            async with httpx.AsyncClient() as client:
                if provider == 'openai':
                    r = await client.get('https://api.openai.com/v1/models', headers={'Authorization': f'Bearer {api_key}'})
                    if r.status_code == 200:
                        data = r.json()
                        # Filter to chat completion models usually (like gpt-, o1, o3)
                        return sorted([m['id'] for m in data.get('data', []) if m['id'].startswith(('gpt-', 'o1', 'o3'))], reverse=True)
                
                elif provider == 'deepseek':
                    r = await client.get('https://api.deepseek.com/models', headers={'Authorization': f'Bearer {api_key}'})
                    if r.status_code == 200:
                        data = r.json()
                        return [m['id'] for m in data.get('data', [])]
                
                elif provider == 'gemini':
                    r = await client.get(f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}')
                    if r.status_code == 200:
                        data = r.json()
                        models = [m['name'].replace('models/', '') for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
                        return sorted(models, reverse=True)
                
                # Anthropic doesn't have a public GET /models endpoint yet, and generic fallbacks
                return fallback_models
        except Exception as e:
            pass
            
        return fallback_models
    
    def _normalize_model(self, provider: str, model: str) -> str:
        config = self._provider_configs.get(provider.lower())
        if not config:
            raise ValueError(f"Unknown provider: {provider}")
        
        prefix = config['prefix']
        
        if model.startswith(f"{prefix}/"):
            return model
        return f"{prefix}/{model}"
    
    def _get_api_key(self, provider: str) -> str:
        api_key = key_store.get_key(provider)
        if not api_key:
            raise ValueError(f"No API key configured for provider: {provider}")
        return api_key
    
    async def chat(
        self,
        provider: str,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        normalized_model = self._normalize_model(provider, model)
        api_key = self._get_api_key(provider)
        
        response = await acompletion(
            model=normalized_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key
        )
        
        return response.choices[0].message.content
    
    async def chat_stream(
        self,
        provider: str,
        model: str,
        messages: list[dict],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        normalized_model = self._normalize_model(provider, model)
        api_key = self._get_api_key(provider)
        
        response = await acompletion(
            model=normalized_model,
            messages=messages,
            temperature=temperature,
            stream=True,
            api_key=api_key
        )
        
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    async def analyze_query(
        self,
        provider: str,
        model: str,
        query: str,
        schema_context: str
    ) -> dict:
        system_prompt = """You are a SQL expert assistant. Analyze the provided SQL query and return a JSON object with the following structure:
{
    "explanation": "Brief explanation of what the query does",
    "affected_tables": ["table1", "table2"],
    "risk_level": "low|medium|high",
    "suggestions": ["optional optimization suggestions"]
}

Focus on correctness, performance implications, and potential risks."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Schema:\n{schema_context}\n\nQuery:\n{query}"}
        ]
        
        response = await self.chat(provider, model, messages, temperature=0.3)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "explanation": response,
                "affected_tables": [],
                "risk_level": "unknown",
                "suggestions": []
            }
    
    async def suggest_query(
        self,
        provider: str,
        model: str,
        prompt: str,
        schema_context: str
    ) -> str:
        system_prompt = """You are a SQL expert assistant. Generate SQL queries based on user requests.
Return ONLY the SQL query, no explanations or markdown formatting.
Ensure queries are valid and optimized for the provided schema."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Schema:\n{schema_context}\n\nRequest:\n{prompt}"}
        ]
        
        return await self.chat(provider, model, messages, temperature=0.5)


llm_router = LLMRouter()
