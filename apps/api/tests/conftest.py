import os

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///./test_resumeforge.db"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["DEBUG"] = "false"

from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_database():
  Base.metadata.drop_all(bind=engine)
  Base.metadata.create_all(bind=engine)
  yield
  Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
  with TestClient(app) as c:
    yield c
