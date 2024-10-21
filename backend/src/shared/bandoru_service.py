from datetime import datetime
from typing import Optional
from uuid import uuid4
from aws_lambda_powertools.event_handler.exceptions import *
from aws_lambda_powertools import Tracer, Logger

from shared import database
from shared.bandoru_s3_bucket import create_file_post_url
from shared.forms import CreateBandoruForm
from shared.models import File, Bandoru
from shared.utils import uuid4_to_base64, uuid4_from_base64

logger = Logger()

def create(form: CreateBandoruForm,logged_username:Optional[str] = None) -> dict:
    logger.debug("Start Create")

    files = [File(**file.model_dump(), id=uuid4_to_base64(uuid4())) for file in form.files]
    timestamp = int(round(datetime.now().timestamp()))
    bandoru = form.model_dump()
    bandoru["id"] = uuid4_to_base64(uuid4())
    pk = f"BANDORU#{bandoru['id']}"
    bandoru["files"] = [file.model_dump() for file in files]
    bandoru["created_at"] = bandoru["last_modified"] = timestamp

    if logged_username is not None:
        bandoru["owner_id"] = logged_username
        bandoru["GSI1PK"] = f"USER#{logged_username}"
        bandoru["GSI1SK"] = pk

    urls: list[dict] = []

    database.put_item(pk, None, bandoru)

    # Presigned URLs for each file
    for file in files:
        file_id = file.id
        urls.append(create_file_post_url(file_id, file.filename))

    return {
        'bandoru_id': bandoru['id'],
        'post_urls': urls
    }

def get(bandoru_id: str,logged_username:Optional[str] = None) -> Optional[Bandoru]:
    bandoru: Optional[Bandoru] = None

    item = database.get_item(f"BANDORU#{bandoru_id}")
    if item is not None:
        bandoru = Bandoru(**item)
        if bandoru.private and bandoru.owner_id != logged_username:
            raise ServiceError(403, "Forbidden")
    return bandoru

