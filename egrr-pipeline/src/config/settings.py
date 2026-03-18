"""
Configuration settings using Pydantic Settings.

Loads environment variables with validation.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Ollama Configuration (Local LLM)
    ollama_base_url: str = "http://localhost:11434"
    llm_model_id: str = "deepseek-coder:6.7b-instruct"
    llm_max_tokens: int = 1000
    llm_temperature: float = 0.1  # Low for deterministic output
    llm_seed: int = 42  # For reproducibility

    # Pipeline Configuration
    max_iterations: int = 5
    execution_timeout: int = 30

    # Embedding Configuration
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance. Clear cache on server restart."""
    return Settings()


def clear_settings_cache() -> None:
    """Clear the settings cache to reload from .env."""
    get_settings.cache_clear()
