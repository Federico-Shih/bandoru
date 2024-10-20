from typing import Optional
from uuid import uuid4

import database
from bandoru_s3_bucket import create_file_post_url
from forms import CreateBandoruForm
from models import Bandoru, File
from utils import uuid4_to_base64, uuid4_from_base64


def create(form: CreateBandoruForm) -> dict:
    files = [File(**file.model_dump(), id=uuid4()) for file in form.files]
    bandoru = Bandoru(**form.model_dump(), id=uuid4(), files=files)

    urls: list[dict] = []

    database.put_item(f"BANDORU#{bandoru.id}", None, bandoru.model_dump())

    # Presigned URLs for each file
    for file in files:
        file_id = uuid4_to_base64(file.id)
        urls.append(create_file_post_url(file_id, file.filename))

    return {
        'bandoru_id': uuid4_to_base64(bandoru.id),
        'post_urls': urls
    }


def get_all() -> list[Bandoru]:
    query_res = database.query("begins_with(pk, 'BANDORU#')")
    bandorus = [Bandoru(**item) for item in query_res]

    return bandorus


def get(bandoru_id_str: str) -> Optional[Bandoru]:
    try:
        bandoru_id = uuid4_from_base64(bandoru_id_str)
    except ValueError:
        return None

    bandoru: Optional[Bandoru] = None

    item = database.get_item(f"BANDORU#{bandoru_id}")
    if item is not None:
        bandoru = Bandoru(**item)

    return bandoru
