from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from auth_service import verify_password, get_password_hash, create_access_token, decode_token
from tmdb_service import tmdb_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_plan: str = "free"

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Profile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    avatar_url: str = ""
    is_kids: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileCreate(BaseModel):
    name: str
    is_kids: bool = False

class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    tmdb_id: int
    media_type: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WatchlistAdd(BaseModel):
    tmdb_id: int
    media_type: str

class WatchHistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    tmdb_id: int
    media_type: str
    position: int = 0
    duration: int = 0
    last_watched: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WatchHistoryUpdate(BaseModel):
    tmdb_id: int
    media_type: str
    position: int
    duration: int

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_access_token({"user_id": user.id})
    return Token(access_token=token)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user["id"]})
    return Token(access_token=token)

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "id": current_user.id, "subscription_plan": current_user.subscription_plan}

# Profile routes
@api_router.post("/profiles", response_model=Profile)
async def create_profile(profile_data: ProfileCreate, current_user: User = Depends(get_current_user)):
    profile = Profile(
        user_id=current_user.id,
        name=profile_data.name,
        is_kids=profile_data.is_kids
    )
    
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.profiles.insert_one(doc)
    return profile

@api_router.get("/profiles", response_model=List[Profile])
async def get_profiles(current_user: User = Depends(get_current_user)):
    profiles = await db.profiles.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    for p in profiles:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return profiles

# TMDb routes
@api_router.get("/titles/popular")
async def get_popular(media_type: str = "movie", page: int = 1):
    if media_type == "movie":
        data = await tmdb_service.get_popular_movies(page)
    else:
        data = await tmdb_service.get_popular_tv(page)
    return data

@api_router.get("/titles/trending")
async def get_trending(media_type: str = "all"):
    data = await tmdb_service.get_trending(media_type)
    return data

@api_router.get("/titles/search")
async def search_titles(query: str, page: int = 1):
    data = await tmdb_service.search(query, page)
    return data

@api_router.get("/titles/{media_type}/{title_id}")
async def get_title_details(media_type: str, title_id: int):
    if media_type == "movie":
        data = await tmdb_service.get_movie_details(title_id)
    else:
        data = await tmdb_service.get_tv_details(title_id)
    return data

# Watchlist routes
@api_router.post("/watchlist")
async def add_to_watchlist(item: WatchlistAdd, profile_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.watchlist.find_one({"profile_id": profile_id, "tmdb_id": item.tmdb_id}, {"_id": 0})
    if existing:
        return {"message": "Already in watchlist"}
    
    watchlist_item = WatchlistItem(
        profile_id=profile_id,
        tmdb_id=item.tmdb_id,
        media_type=item.media_type
    )
    doc = watchlist_item.model_dump()
    doc['added_at'] = doc['added_at'].isoformat()
    await db.watchlist.insert_one(doc)
    return {"message": "Added to watchlist"}

@api_router.get("/watchlist")
async def get_watchlist(profile_id: str, current_user: User = Depends(get_current_user)):
    items = await db.watchlist.find({"profile_id": profile_id}, {"_id": 0}).to_list(1000)
    return items

@api_router.delete("/watchlist/{tmdb_id}")
async def remove_from_watchlist(tmdb_id: int, profile_id: str, current_user: User = Depends(get_current_user)):
    await db.watchlist.delete_one({"profile_id": profile_id, "tmdb_id": tmdb_id})
    return {"message": "Removed from watchlist"}

# Watch history routes
@api_router.post("/watch-history")
async def update_watch_history(item: WatchHistoryUpdate, profile_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.watch_history.find_one({"profile_id": profile_id, "tmdb_id": item.tmdb_id}, {"_id": 0})
    
    if existing:
        await db.watch_history.update_one(
            {"profile_id": profile_id, "tmdb_id": item.tmdb_id},
            {"$set": {
                "position": item.position,
                "duration": item.duration,
                "last_watched": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        history_item = WatchHistoryItem(
            profile_id=profile_id,
            tmdb_id=item.tmdb_id,
            media_type=item.media_type,
            position=item.position,
            duration=item.duration
        )
        doc = history_item.model_dump()
        doc['last_watched'] = doc['last_watched'].isoformat()
        await db.watch_history.insert_one(doc)
    
    return {"message": "Watch history updated"}

@api_router.get("/watch-history")
async def get_watch_history(profile_id: str, current_user: User = Depends(get_current_user)):
    items = await db.watch_history.find({"profile_id": profile_id}, {"_id": 0}).sort("last_watched", -1).to_list(100)
    return items

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
