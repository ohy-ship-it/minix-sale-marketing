from pathlib import Path
import os
from urllib.parse import urljoin

from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware


ROOT = Path(__file__).resolve().parent
app = FastAPI(title="minix marketing dashboard")
session_secret = os.environ.get("APP_SESSION_SECRET")
if not session_secret and os.environ.get("RENDER") == "true":
    raise RuntimeError("APP_SESSION_SECRET 환경변수가 필요합니다.")

app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret or "local-development-only",
    https_only=os.environ.get("RENDER", "") == "true",
    same_site="lax",
)

oauth = OAuth()
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=os.environ.get("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET"),
    client_kwargs={"scope": "openid email profile"},
)


def is_authenticated(request: Request) -> bool:
    email = request.session.get("user_email", "")
    return email.lower().endswith("@athomecorp.com")


def login_page(message: str = "") -> HTMLResponse:
    return HTMLResponse(
        f"""<!doctype html><html lang="ko"><meta charset="utf-8"><title>minix 로그인</title>
        <style>body{{font-family:system-ui;margin:0;display:grid;place-items:center;height:100vh;background:#f7f7f4;color:#222}}main{{text-align:center;background:#fff;padding:42px;border:1px solid #e9e8e2;border-radius:14px}}a{{display:inline-block;background:#20211e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px}}p{{color:#b84b35}}</style>
        <main><h1>minix 마케팅 대시보드</h1><p>{message}</p><a href="/login">회사 Google 계정으로 로그인</a></main></html>"""
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/login", response_model=None)
async def login(request: Request) -> RedirectResponse | HTMLResponse:
    if not oauth.google.client_id or not oauth.google.client_secret:
        return login_page("관리자에게 Google OAuth 환경변수 설정을 요청하세요.")
    redirect_uri = urljoin(str(request.base_url), "auth/callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/callback", response_model=None)
async def auth_callback(request: Request) -> HTMLResponse | RedirectResponse:
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        email = (user_info or {}).get("email", "").lower()
    except Exception:
        return login_page("Google 인증에 실패했습니다. 다시 시도하세요.")

    if not email.endswith("@athomecorp.com"):
        request.session.clear()
        return login_page("athomecorp.com 회사 계정만 사용할 수 있습니다.")
    request.session["user_email"] = email
    request.session["user_name"] = (user_info or {}).get("name", email)
    return RedirectResponse("/", status_code=303)


@app.get("/logout", response_model=None)
def logout(request: Request) -> RedirectResponse:
    request.session.clear()
    return RedirectResponse("/", status_code=303)


@app.get("/{path:path}", response_model=None)
def dashboard(request: Request, path: str) -> FileResponse | HTMLResponse:
    if not is_authenticated(request):
        return login_page()
    requested_file = (ROOT / path).resolve()
    if requested_file.is_file() and ROOT in requested_file.parents:
        return FileResponse(requested_file)
    return FileResponse(ROOT / "index.html")


@app.get("/", response_model=None)
def index(request: Request) -> FileResponse | HTMLResponse:
    if not is_authenticated(request):
        return login_page()
    return FileResponse(ROOT / "index.html")
