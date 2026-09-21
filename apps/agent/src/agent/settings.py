from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[4]
ENV_FILE = ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    agent_port: int = 8100
    agent_internal_token: str = ""
    database_url: str = ""
    opencode_go_api_key: str = ""
    deepseek_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = "deepseek-v4.1-flash"
    llm_base_url: str = "https://opencode.ai/zen/go/v1"
    api_origin: str = "http://127.0.0.1:3001"
    langsmith_api_key: str = ""
    langsmith_project: str = "ledger-tally"

    @property
    def llm_api_key(self) -> str:
        return (self.opencode_go_api_key or self.deepseek_api_key or self.openai_api_key).strip()


settings = Settings()
