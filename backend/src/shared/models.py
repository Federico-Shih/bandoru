from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4


class File(BaseModel):
    id: UUID4
    filename: str

class Bandoru(BaseModel):
    id: UUID4
    files: list[File]
    description: Optional[str] = None
    parent_id: Optional[UUID4] = None
    created_at: datetime
    last_modified: datetime
