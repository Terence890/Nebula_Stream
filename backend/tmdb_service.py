import httpx
import os
from typing import Dict, List, Optional

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "YOUR_TMDB_API_KEY_PLACEHOLDER")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

class TMDbService:
    def __init__(self):
        self.api_key = TMDB_API_KEY
        self.base_url = TMDB_BASE_URL
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        if params is None:
            params = {}
        params["api_key"] = self.api_key
        
        url = f"{self.base_url}/{endpoint}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"TMDb API error: {e}")
                return None
    
    async def get_popular_movies(self, page: int = 1) -> Optional[Dict]:
        return await self._make_request("movie/popular", {"page": page})
    
    async def get_popular_tv(self, page: int = 1) -> Optional[Dict]:
        return await self._make_request("tv/popular", {"page": page})
    
    async def get_trending(self, media_type: str = "all", time_window: str = "week") -> Optional[Dict]:
        return await self._make_request(f"trending/{media_type}/{time_window}")
    
    async def search(self, query: str, page: int = 1) -> Optional[Dict]:
        return await self._make_request("search/multi", {"query": query, "page": page})
    
    async def get_movie_details(self, movie_id: int) -> Optional[Dict]:
        return await self._make_request(f"movie/{movie_id}", {"append_to_response": "videos,credits"})
    
    async def get_tv_details(self, tv_id: int) -> Optional[Dict]:
        return await self._make_request(f"tv/{tv_id}", {"append_to_response": "videos,credits"})
    
    @staticmethod
    def get_image_url(path: str, size: str = "original") -> str:
        if not path:
            return ""
        return f"{TMDB_IMAGE_BASE_URL}/{size}{path}"

tmdb_service = TMDbService()
