import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeUpdate


class ResumeRepository:
  def __init__(self, db: AsyncSession):
    self.db = db

  async def list_for_owner(self, owner_id: str) -> list[Resume]:
    stmt = select(Resume).where(Resume.owner_id == owner_id).order_by(desc(Resume.updated_at))
    result = await self.db.execute(stmt)
    return list(result.scalars().all())

  async def get_for_owner(self, resume_id: uuid.UUID, owner_id: str) -> Resume | None:
    stmt = select(Resume).where(Resume.id == resume_id, Resume.owner_id == owner_id)
    result = await self.db.execute(stmt)
    return result.scalar_one_or_none()

  async def create(self, owner_id: str, payload: ResumeCreate) -> Resume:
    resume = Resume(
      owner_id=owner_id,
      title=payload.title,
      content=payload.content.model_dump()
    )
    self.db.add(resume)
    await self.db.commit()
    await self.db.refresh(resume)
    return resume

  async def update(self, resume: Resume, payload: ResumeUpdate) -> Resume:
    if payload.title is not None:
      resume.title = payload.title
    if payload.content is not None:
      resume.content = payload.content.model_dump()

    await self.db.commit()
    await self.db.refresh(resume)
    return resume
