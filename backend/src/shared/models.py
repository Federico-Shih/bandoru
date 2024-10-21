from typing import Optional

from pydantic import BaseModel, UUID4


class File(BaseModel):
    id: str
    filename: str

class Bandoru(BaseModel):
    id: str
    files: list[File]
    description: Optional[str] = None
    parent_id: Optional[UUID4] = None
    created_at: int
    last_modified: int
