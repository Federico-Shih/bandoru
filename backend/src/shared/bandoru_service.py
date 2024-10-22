from datetime import datetime
from typing import Optional
from uuid import uuid4

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler.exceptions import *
from boto3.dynamodb.conditions import Key

from shared import database
from shared.bandoru_s3_bucket import create_file_post_url
from shared.forms import CreateBandoruForm
from shared.models import File, Bandoru
from shared.utils import uuid4_to_base64

logger = Logger()


def create(form: CreateBandoruForm, logged_username: Optional[str] = None) -> dict:
    files = [
        File(**file.model_dump(), id=uuid4_to_base64(uuid4())) for file in form.files
    ]
    timestamp = int(round(datetime.now().timestamp()))
    bandoru = form.model_dump()
    bandoru["id"] = uuid4_to_base64(uuid4())
    bandoru["PK"] = bandoru["SK"] = f"BANDORU#{bandoru['id']}"
    bandoru["files"] = [file.model_dump() for file in files]
    bandoru["created_at"] = bandoru["last_modified"] = timestamp

    if logged_username is not None:
        bandoru["owner_id"] = logged_username
        bandoru["GSI1PK"] = f"USER#{logged_username}"
        bandoru["GSI1SK"] = bandoru["PK"]

    urls: list[dict] = []

    database.db_table.put_item(Item=bandoru)

    # Presigned URLs for each file
    for file in files:
        file_id = file.id
        urls.append(create_file_post_url(file_id, file.filename))

    return {"bandoru_id": bandoru["id"], "post_urls": urls}


def get(bandoru_id: str, logged_username: Optional[str] = None) -> Optional[Bandoru]:
    pk = f"BANDORU#{bandoru_id}"
    item = database.db_table.get_item(Key={'PK':pk,'SK':pk})["Item"]

    bandoru: Optional[Bandoru] = None
    if item is not None:
        bandoru = Bandoru(**item)
        if bandoru.private and bandoru.owner_id != logged_username:
            raise ServiceError(403, "Forbidden")
    return bandoru

def get_by_user(user_id: str) -> list[Bandoru]:
    pk = f'USER#{user_id}'

    items = database.db_table.query(IndexName=database.user_idx, KeyConditionExpression=Key('GSI1PK').eq(pk))["Items"]
    return [Bandoru(**item) for item in items]
