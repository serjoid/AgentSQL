import litellm
from litellm import acompletion
from typing import AsyncGenerator, Optional
import json

from ..core.security import key_store


PROVIDERS = {
    'openai': {
        'models': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        'prefix': 'openai'
    },
    'gemini': {
        'models': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        'prefix': 'gemini'
    },
    'deepseek': {
        'models': ['deepseek-chat', 'deepseek-coder'],
        'prefix': 'deepseek'
    },
    'nvidia': {
        'models': ['nvidia/llama-3.1-nemotron-70b', 'nvidia/meta/llama-3.1-405b-instruct'],
        'prefix': 'nvidia'
    },
    'anthropic': {
        'models': ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
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
