from datetime import datetime
from typing import Optional
from uuid import uuid4

from shared import database
from shared.bandoru_s3_bucket import create_file_post_url
from shared.forms import CreateBandoruForm
from shared.models import File, Bandoru
from shared.utils import uuid4_to_base64, uuid4_from_base64


def create(form: CreateBandoruForm) -> dict:
    files = [File(**file.model_dump(), id=uuid4_to_base64(uuid4())) for file in form.files]
    bandoru = form.model_dump()
    bandoru["id"] = uuid4_to_base64(uuid4())
    bandoru["files"] = files

    timestamp=int(round(datetime.now().timestamp()))
    bandoru = Bandoru(**bandoru, created_at=timestamp, last_modified=timestamp)

    urls: list[dict] = []

    database.put_item(f"BANDORU#{bandoru.id}", None, bandoru.model_dump())

    # Presigned URLs for each file
    for file in files:
        file_id = file.id
        urls.append(create_file_post_url(file_id, file.filename))

    return {
        'bandoru_id': bandoru.id,
        'post_urls': urls
    }

def get(bandoru_id: str) -> Optional[Bandoru]:
    bandoru: Optional[Bandoru] = None

    item = database.get_item(f"BANDORU#{bandoru_id}")
    if item is not None:
        bandoru = Bandoru(**item)

    return bandoru
