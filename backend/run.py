import uvicorn
from app.core.config import settings
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False,
        workers=1
    )
