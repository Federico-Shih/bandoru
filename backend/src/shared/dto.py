from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4

from shared.bandoru_s3_bucket import get_file_url
from shared.models import File, Bandoru
from shared.utils import uuid4_to_base64


class FileDTO(BaseModel):
    id: str
    filename: str
    url: Optional[str] = None

    @staticmethod
    def from_model(model: File, with_url: bool = False):
        model_data = model.model_dump()

        if with_url:
            model_data['url'] = get_file_url(model_data['id'],model.filename)

        return FileDTO(**model_data)

class BandoruDTO(BaseModel):
    id: str
    parent_id: Optional[UUID4] = None
    description: Optional[str] = None
    files: list[FileDTO]
    created_at: datetime
    last_modified: datetime

    @staticmethod
    def from_model(model: Bandoru, with_urls: bool = False):
        model_data = model.model_dump()
        model_data['files'] = [FileDTO.from_model(file, with_urls) for file in model.files]
        model_data['parent_id'] = None if model.parent_id is None else uuid4_to_base64(model.parent_id)

        return BandoruDTO(**model_data)
