import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # We can also check if we are in mock mode when GEMINI_API_KEY is empty
    @property
    def is_mock_mode(self) -> bool:
        return not self.GEMINI_API_KEY

settings = Settings()
