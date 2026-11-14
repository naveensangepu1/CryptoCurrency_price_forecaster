import uuid
from datetime import datetime, timezone
from typing import Dict, Optional
from ..models.schemas import UserProfile

# In-memory user database
_users_db: Dict[str, dict] = {
    "demo@crypto.com": {
        "id": "usr-demo-001",
        "name": "Demo Trader",
        "email": "demo@crypto.com",
        "password": "password123",
        "created_at": "2026-01-01T00:00:00Z"
    }
}

# Token to user email mapping
_tokens_db: Dict[str, str] = {}

def register_user(name: str, email: str, password: str) -> UserProfile:
    email_clean = email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise ValueError("Please provide a valid email address.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")
    if email_clean in _users_db:
        raise ValueError("An account with this email already exists.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()
    _users_db[email_clean] = {
        "id": user_id,
        "name": name.strip() or "Crypto Trader",
        "email": email_clean,
        "password": password,
        "created_at": created_at
    }

    token = f"jwt-mock-{uuid.uuid4().hex}"
    _tokens_db[token] = email_clean

    return UserProfile(
        id=user_id,
        name=_users_db[email_clean]["name"],
        email=email_clean,
        token=token,
        created_at=created_at
    )

def login_user(email: str, password: str) -> UserProfile:
    email_clean = email.strip().lower()
    user_record = _users_db.get(email_clean)
    if not user_record or user_record["password"] != password:
        raise ValueError("Invalid email or password.")

    token = f"jwt-mock-{uuid.uuid4().hex}"
    _tokens_db[token] = email_clean

    return UserProfile(
        id=user_record["id"],
        name=user_record["name"],
        email=email_clean,
        token=token,
        created_at=user_record["created_at"]
    )

def get_user_by_token(token: str) -> Optional[UserProfile]:
    email = _tokens_db.get(token)
    if not email or email not in _users_db:
        return None
    u = _users_db[email]
    return UserProfile(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        token=token,
        created_at=u["created_at"]
    )
