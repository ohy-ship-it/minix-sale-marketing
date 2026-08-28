from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse


ROOT = Path(__file__).resolve().parent
app = FastAPI(title="minix marketing dashboard")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/{path:path}")
def dashboard(path: str) -> FileResponse:
    requested_file = (ROOT / path).resolve()
    if requested_file.is_file() and ROOT in requested_file.parents:
        return FileResponse(requested_file)
    return FileResponse(ROOT / "index.html")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(ROOT / "index.html")
