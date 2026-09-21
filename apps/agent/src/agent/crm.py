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

    @staticmethod
    def _parse(res: httpx.Response) -> Any:
        if res.status_code >= 400:
            body = (res.text or res.reason_phrase or "request failed")[:800]
            return {"error": {"status": res.status_code, "message": body}}
        try:
            return res.json()
        except ValueError:
            return {"error": {"status": res.status_code, "message": "invalid json from api"}}

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(f"{self.api_base}{path}", headers=self.headers, params=params)
                return self._parse(res)
        except httpx.RequestError as exc:
            return {"error": {"status": 0, "message": str(exc)}}

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(f"{self.api_base}{path}", headers=self.headers, json=json)
                return self._parse(res)
        except httpx.RequestError as exc:
            return {"error": {"status": 0, "message": str(exc)}}

    async def patch(self, path: str, json: dict[str, Any]) -> Any:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.patch(f"{self.api_base}{path}", headers=self.headers, json=json)
                return self._parse(res)
        except httpx.RequestError as exc:
            return {"error": {"status": 0, "message": str(exc)}}
