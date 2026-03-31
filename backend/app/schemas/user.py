from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    trial_ends_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    token: str
    user: UserOut
