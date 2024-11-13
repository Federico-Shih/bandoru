from datetime import datetime
from typing import Optional
from uuid import uuid4

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler.exceptions import *
from boto3.dynamodb.conditions import Key

from shared import database, notification_service
from shared.bandoru_s3_bucket import create_file_post_url, delete_files
from shared.forms import CreateBandoruForm, SetBandoruWebhooksForm
from shared.models import File, Bandoru, FailedWebhook
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


def replace(
    bandoru_id: str, form: CreateBandoruForm, logged_username: Optional[str] = None
) -> dict:
    if logged_username is None:
        raise ServiceError(401, "Unauthorized")

    cur_bandoru = get(bandoru_id, logged_username)
    if cur_bandoru is None:
        raise NotFoundError
    if cur_bandoru.owner_id != logged_username:
        raise ServiceError(403, "Forbidden")

    files = [
        File(**file.model_dump(), id=uuid4_to_base64(uuid4())) for file in form.files
    ]
    timestamp = int(round(datetime.now().timestamp()))
    bandoru = form.model_dump()
    bandoru["id"] = bandoru_id
    bandoru["PK"] = bandoru["SK"] = f"BANDORU#{bandoru['id']}"
    bandoru["files"] = [file.model_dump() for file in files]
    bandoru["created_at"] = cur_bandoru.created_at
    bandoru["last_modified"] = timestamp

    bandoru["owner_id"] = logged_username
    bandoru["GSI1PK"] = f"USER#{logged_username}"
    bandoru["GSI1SK"] = bandoru["PK"]

    urls: list[dict] = []

    database.db_table.put_item(Item=bandoru)

    # Presigned URLs for each file
    for file in files:
        file_id = file.id
        urls.append(create_file_post_url(file_id, file.filename))

    # TODO: Notify webhooks

    delete_files(cur_bandoru.files)

    return {"bandoru_id": bandoru["id"], "post_urls": urls}


def get(bandoru_id: str, logged_username: Optional[str] = None) -> Optional[Bandoru]:
    pk = f"BANDORU#{bandoru_id}"
    res = database.db_table.get_item(Key={"PK": pk, "SK": pk})
    item = res["Item"] if "Item" in res else None

    bandoru: Optional[Bandoru] = None
    if item is not None:
        bandoru = Bandoru(**item)
        if bandoru.private and bandoru.owner_id != logged_username:
            raise ServiceError(403, "Forbidden")
    return bandoru


def get_by_user(user_id: str) -> list[Bandoru]:
    pk = f"USER#{user_id}"

    res = database.db_table.query(
        IndexName=database.user_idx, KeyConditionExpression=Key("GSI1PK").eq(pk)
    )
    items = res["Items"] if "Items" in res else []
    return [Bandoru(**item) for item in items]


def notify_updated(bandoru_id: str, logged_user: Optional[str]):
    if logged_user is None:
        raise ServiceError(401, "Unauthorized")

    bandoru = get(bandoru_id, logged_user)
    if bandoru is None:
        raise NotFoundError
    if bandoru.owner_id != logged_user:
        raise ServiceError(403, "Forbidden")

    urls = get_webhooks(bandoru_id, logged_user)

    notification_service.send_update_notification(bandoru_id, urls, bandoru.description)


def set_webhooks(
    bandoru_id: str, form: SetBandoruWebhooksForm, logged_username: Optional[str]
):
    if logged_username is None:
        raise ServiceError(401, "Unauthorized")

    bandoru = get(bandoru_id, logged_username)
    if bandoru is None:
        raise NotFoundError
    if bandoru.owner_id != logged_username:
        raise ServiceError(403, "Forbidden")

    pk = f"WEBHOOK#{bandoru_id}"
    item = {
        "PK": pk,
        "SK": pk,
        "bandoru_id": bandoru_id,
        "urls": form.root,
    }

    database.db_table.put_item(Item=item)


def get_webhooks(bandoru_id: str, logged_username: Optional[str]) -> list[str]:
    if logged_username is None:
        raise ServiceError(401, "Unauthorized")

    bandoru = get(bandoru_id, logged_username)
    if bandoru is None:
        raise NotFoundError
    if bandoru.owner_id != logged_username:
        raise ServiceError(403, "Forbidden")

    pk = f"WEBHOOK#{bandoru_id}"
    res = database.db_table.get_item(Key={"PK": pk, "SK": pk})
    if "Item" not in res:
        return []

    item = res["Item"]
    if "urls" not in item:
        return []

    return item["urls"]


def get_failed_webhooks(
    bandoru_id: str, logged_username: Optional[str]
) -> list[FailedWebhook]:
    if logged_username is None:
        raise ServiceError(401, "Unauthorized")

    bandoru = get(bandoru_id, logged_username)
    if bandoru is None:
        raise NotFoundError
    if bandoru.owner_id != logged_username:
        raise ServiceError(403, "Forbidden")

    pk = f"FAILED_WEBHOOK_CALL#{bandoru_id}"
    res = database.db_table.query(KeyConditionExpression=Key("PK").eq(pk))
    if "Items" not in res:
        return []

    items = res["Items"]

    return [
        FailedWebhook(
            bandoru_id=item["bandoru_id"],
            webhook_url=item["webhook_url"],
            timestamp=item["timestamp"],
        )
        for item in items
    ]
