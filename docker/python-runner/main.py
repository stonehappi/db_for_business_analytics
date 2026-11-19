import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from executor import execute_python_code

app = FastAPI(
    title="Python Sandbox Execution Runner",
    version="1.0.0",
    description="Isolated environment for executing student Python analytics code"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_SANDBOX_DB_URL = os.environ.get(
    "SANDBOX_STUDENT_DATABASE_URL",
    "postgresql://student_sandbox_user:sandbox_safe_pw@postgres-sandbox:5432/sandbox_db"
)

class ExecuteRequest(BaseModel):
    code: str = Field(..., description="Python source code to execute")
    verificationCode: Optional[str] = Field(None, description="Optional Python verification assertions script")
    sandboxDbUrl: Optional[str] = Field(None, description="Optional Postgres connection string")
    timeoutSeconds: Optional[float] = Field(5.0, description="Max execution duration in seconds")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "python-sandbox"}

@app.post("/execute")
def execute_code(req: ExecuteRequest):
    if not req.code or not req.code.strip():
        raise HTTPException(status_code=400, detail="code parameter is required")

    db_url = req.sandboxDbUrl or DEFAULT_SANDBOX_DB_URL
    # Rewrite host-mapped localhost addresses to container network names
    if "localhost:5435" in db_url or "127.0.0.1:5435" in db_url:
        db_url = db_url.replace("localhost:5435", "postgres-sandbox:5432").replace("127.0.0.1:5435", "postgres-sandbox:5432")
    elif "localhost:5432" in db_url or "127.0.0.1:5432" in db_url:
        db_url = db_url.replace("localhost:5432", "postgres-sandbox:5432").replace("127.0.0.1:5432", "postgres-sandbox:5432")

    timeout = min(max(req.timeoutSeconds or 5.0, 1.0), 15.0)

    result = execute_python_code(
        code_str=req.code,
        verification_code=req.verificationCode,
        sandbox_db_url=db_url,
        timeout_seconds=timeout
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
