from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from ..models.requests import AIConfig, AIChat, AIQuerySuggestion, AIAnalyzeQuery
from ..models.responses import AIProviderResponse, AIChatResponse, AIAnalysisResponse, ErrorResponse
from ..core.security import key_store
from ..llm.router import llm_router
from ..llm.context import context_manager

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/providers", response_model=List[AIProviderResponse])
async def get_providers():
    providers = llm_router.get_available_providers()
    result = []
    
    for provider in providers:
        models = llm_router.get_models_for_provider(provider)
        is_configured = key_store.has_key(provider)
        
        result.append(AIProviderResponse(
            provider=provider,
            models=models,
            is_configured=is_configured
        ))
    
    return result


@router.post("/config")
async def configure_provider(request: AIConfig):
    provider = request.provider.lower()
    
    if provider not in llm_router.get_available_providers():
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider: {request.provider}"
        )
    
    key_store.set_key(provider, request.api_key)
    
    return {
        "success": True,
        "provider": provider,
        "message": f"API key configured for {provider}"
    }


@router.delete("/config/{provider}")
async def remove_provider_config(provider: str):
    provider = provider.lower()
    
    if not key_store.has_key(provider):
        raise HTTPException(
            status_code=404,
            detail=f"No configuration found for provider: {provider}"
        )
    
    key_store.remove_key(provider)
    
    return {
        "success": True,
        "provider": provider,
        "message": f"API key removed for {provider}"
    }


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChat):
    if not key_store.has_key(request.provider):
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for provider: {request.provider}"
        )
    
    messages = []
    
    if request.include_schema:
        schema_context = context_manager.get_schema_context()
        messages.append({
            "role": "system",
            "content": f"You are a helpful SQL assistant. Here is the current database schema:\n\n{schema_context}"
        })
    
    history = context_manager.get_chat_messages_for_llm()
    messages.extend(history)
    
    messages.append({"role": "user", "content": request.message})
    
    try:
        response = await llm_router.chat(
            provider=request.provider,
            model=request.model,
            messages=messages
        )
        
        context_manager.add_chat_message({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat()
        })
        context_manager.add_chat_message({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return AIChatResponse(
            response=response,
            provider=request.provider,
            model=request.model,
            timestamp=datetime.utcnow().isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


@router.post("/suggest", response_model=AIChatResponse)
async def suggest_query(request: AIQuerySuggestion):
    if not key_store.has_key(request.provider):
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for provider: {request.provider}"
        )
    
    schema_context = context_manager.get_schema_context()
    
    try:
        response = await llm_router.suggest_query(
            provider=request.provider,
            model=request.model,
            prompt=request.prompt,
            schema_context=schema_context
        )
        
        return AIChatResponse(
            response=response,
            provider=request.provider,
            model=request.model,
            timestamp=datetime.utcnow().isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_query(request: AIAnalyzeQuery):
    if not key_store.has_key(request.provider):
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for provider: {request.provider}"
        )
    
    schema_context = context_manager.get_schema_context()
    
    try:
        analysis = await llm_router.analyze_query(
            provider=request.provider,
            model=request.model,
            query=request.query,
            schema_context=schema_context
        )
        
        return AIAnalysisResponse(
            explanation=analysis.get("explanation", ""),
            affected_tables=analysis.get("affected_tables", []),
            risk_level=analysis.get("risk_level", "unknown"),
            suggestions=analysis.get("suggestions", [])
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


@router.delete("/history")
async def clear_chat_history():
    context_manager.clear_chat_history()
    return {"success": True, "message": "Chat history cleared"}
