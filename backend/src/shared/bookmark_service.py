from typing import Optional

from aws_lambda_powertools.event_handler.exceptions import ServiceError, NotFoundError
from boto3.dynamodb.conditions import Key

from shared import database, bandoru_service
from shared.models import Bandoru


def add(bandoru_id: str, user_id: str, logged_user_id: Optional[str]):
    if user_id != logged_user_id:
        raise ServiceError(403, "Forbidden")

    if bandoru_service.get(bandoru_id, logged_user_id) is None:
        raise NotFoundError

    pk = f"BOOKMARKS#{user_id}"
    sk = bandoru_id
    item = {
        "PK": pk,
        "SK": sk,
        "bandoru_id": bandoru_id,
        "user_id": user_id
    }

    database.db_table.put_item(Item=item)

def get(user_id: str, logged_user_id: Optional[str]) -> list[Bandoru]:
    if user_id != logged_user_id:
        raise ServiceError(403, "Forbidden")

    pk = f"BOOKMARKS#{user_id}"
    res = database.db_table.query(KeyConditionExpression=Key('PK').eq(pk))
    items = res["Items"] if "Items" in res else []

    return [bandoru_service.get(item["bandoru_id"], logged_user_id) for item in items]

def remove(bandoru_id: str, user_id: str, logged_user_id: Optional[str]):
    if user_id != logged_user_id:
        raise ServiceError(403, "Forbidden")

    pk = f"BOOKMARKS#{user_id}"
    sk = bandoru_id
    database.db_table.delete_item(Key={'PK':pk,'SK':sk})
