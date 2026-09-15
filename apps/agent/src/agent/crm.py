from __future__ import annotations

from typing import Any

import httpx


class CrmClient:
    def __init__(self, api_base: str, internal_token: str, user_id: str) -> None:
        self.api_base = api_base.rstrip("/")
        self.headers = {
            "X-Internal-Token": internal_token,
            "X-Acting-User-Id": user_id,
            "Content-Type": "application/json",
        }

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.get(f"{self.api_base}{path}", headers=self.headers, params=params)
            res.raise_for_status()
            return res.json()

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(f"{self.api_base}{path}", headers=self.headers, json=json)
            res.raise_for_status()
            return res.json()

    async def patch(self, path: str, json: dict[str, Any]) -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.patch(f"{self.api_base}{path}", headers=self.headers, json=json)
            res.raise_for_status()
            return res.json()
