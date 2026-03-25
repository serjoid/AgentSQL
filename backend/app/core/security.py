from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Optional


class SecurityManager:
    def __init__(self, encryption_key: str):
        self._key = encryption_key.encode()
        self._fernet = self._create_fernet()
    
    def _create_fernet(self) -> Fernet:
        salt = b'sgbd_static_salt_'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self._key))
        return Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        if not plaintext:
            return ""
        return self._fernet.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        if not ciphertext:
            return ""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except Exception:
            return ""
    
    def mask_api_key(self, api_key: str) -> str:
        if not api_key or len(api_key) < 8:
            return "***"
        return f"{api_key[:4]}...{api_key[-4:]}"


security_manager: Optional[SecurityManager] = None


def get_security_manager() -> SecurityManager:
    global security_manager
    if security_manager is None:
        from .config import settings
        security_manager = SecurityManager(settings.ENCRYPTION_KEY)
    return security_manager


class InMemoryKeyStore:
    _instance = None
    _keys: dict[str, str] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def set_key(self, provider: str, api_key: str) -> None:
        self._keys[provider.lower()] = api_key
    
    def get_key(self, provider: str) -> Optional[str]:
        return self._keys.get(provider.lower())
    
    def remove_key(self, provider: str) -> None:
        self._keys.pop(provider.lower(), None)
    
    def clear_all(self) -> None:
        self._keys.clear()
    
    def list_providers(self) -> list[str]:
        return list(self._keys.keys())
    
    def has_key(self, provider: str) -> bool:
        return provider.lower() in self._keys


key_store = InMemoryKeyStore()
