from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.config import get_settings
import secrets

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_api_key() -> str:
    return secrets.token_urlsafe(32)


def generate_websocket_url(user_id: int) -> str:
    token = secrets.token_urlsafe(16)
    return f"wss://your-domain.com/ws/{user_id}/{token}"


class EncryptionHandler:
    def __init__(self):
        # In production, use settings.ENCRYPTION_KEY
        # Ensure it's a valid Fernet key (32 url-safe base64-encoded bytes)
        fallback_key = b'Zp7HPciAvlyAs6pcwSuHdmnrI1CPXiEOfMA5vb3XUNc='
        
        try:
            # Check if key is set and not the default placeholder
            key = settings.ENCRYPTION_KEY
            if not key or "your-encryption-key" in key or len(key) < 32:
                self.cipher = Fernet(fallback_key)
                print(f"ℹ️ Using development fallback encryption key (prefix: {fallback_key[:5].decode()})")
            else:
                # Try to use the provided key
                try:
                    self.cipher = Fernet(key.encode())
                    print(f"ℹ️ Using ENCRYPTION_KEY from environment (prefix: {key[:5]})")
                except Exception:
                    print(f"⚠️ Invalid ENCRYPTION_KEY in .env. Using fallback.")
                    self.cipher = Fernet(fallback_key)
                    print(f"ℹ️ Using development fallback encryption key (prefix: {fallback_key[:5].decode()})")
        except Exception as e:
            print(f"⚠️ Encryption setup failed: {e}. Using fallback.")
            self.cipher = Fernet(fallback_key)
    
    def encrypt(self, data: str) -> str:
        try:
            return self.cipher.encrypt(data.encode()).decode()
        except Exception as e:
            print(f"❌ Encryption failed: {e}")
            raise
    
    def decrypt(self, encrypted_data: str) -> Optional[str]:
        try:
            return self.cipher.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            print(f"❌ Decryption failed: {e}. key_id: {self.cipher._signing_key[:5] if hasattr(self.cipher, '_signing_key') else 'unknown'}")
            return None


encryption_handler = EncryptionHandler()
