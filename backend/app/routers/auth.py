import logging
import secrets
from datetime import datetime, timedelta, timezone

import resend
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _verification_email_html(verification_url: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #0ea5e9;">Activez votre compte FacturaAI</h2>
      <p style="color: #334155;">Bonjour,</p>
      <p style="color: #334155;">
        Cliquez sur le bouton ci-dessous pour activer votre compte FacturaAI.<br/>
        Le lien expire dans <strong>24 heures</strong>.
      </p>
      <a href="{verification_url}"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                background-color: #0ea5e9; color: white; text-decoration: none;
                border-radius: 8px; font-weight: bold;">
        Activer mon compte
      </a>
      <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">
        Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    </div>
    """


async def _send_verification_email(to_email: str, token: str) -> None:
    resend.api_key = settings.RESEND_API_KEY
    verification_url = f"{settings.FRONTEND_URL}/verify?token={token}"
    resend.Emails.send({
        "from": settings.FROM_EMAIL,
        "to": to_email,
        "subject": "Activez votre compte FacturaAI",
        "html": _verification_email_html(verification_url),
    })


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email déjà utilisé.")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        verification_token=token,
        verification_token_expires=expires,
    )
    db.add(user)
    await db.commit()

    try:
        await _send_verification_email(payload.email, token)
    except Exception as e:
        logger.warning("Failed to send verification email to %s: %s", payload.email, e)

    return {"message": "Compte créé. Vérifiez votre email pour activer votre compte."}


@router.post("/login", response_model=Token)
async def login(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides.")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Veuillez vérifier votre email avant de vous connecter.",
        )

    return Token(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/verify")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Lien de vérification invalide.")

    if user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien de vérification expiré.")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    await db.commit()

    return {"message": "Email vérifié avec succès. Vous pouvez maintenant vous connecter."}
