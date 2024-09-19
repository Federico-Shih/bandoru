from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4


class FileCurrent(BaseModel):
    id: UUID4
    filename: str

class BandoruCurrent(BaseModel):
    id: UUID4
    files: list[FileCurrent]
    description: Optional[str] = None
    parent_id: Optional[UUID4] = None
    created_at: datetime
    last_modified: datetime

    def from_row(row:dict):
        files: list[FileCurrent] = []
        ids = row['file_ids']
        filenames = row['filenames']

        for i, id in enumerate(ids):
            files.append(FileCurrent(id=id, filename=filenames[i]))

        return BandoruCurrent(**row, files=files)
