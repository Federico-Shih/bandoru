from json import JSONDecodeError

from psycopg2 import connect
from pydantic import ValidationError

from database import connection
from uuid import uuid4
import json

from forms import BandoruForm


def lambda_handler(event, context):
    body = event['body']
    if body is None:
        return {
            "statusCode": 400,
            "body": json.dumps("Empty body")
        }

    try:
        data = json.loads(body)
    except JSONDecodeError:
        return {
            "statusCode": 400,
            "body": json.dumps("Invalid JSON")
        }

    try:
        bandoru_id = post_bandoru(BandoruForm(**data))

        return {
            "statusCode": 201,
            "body": json.dumps({
                "id": bandoru_id
            })
        }
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps(e.errors())
        }

def post_bandoru(bandoru: BandoruForm) -> str:
    description = bandoru.description
    files = bandoru.files
    parent_id = None if bandoru.parent_id is None else str(bandoru.parent_id)

    bandoru_id = str(uuid4())
    revision_id = str(uuid4())
    file_ids = [str(uuid4()) for _ in range(len(files))]

    with connection.cursor() as cur:
        cur.execute("INSERT INTO bandoru(id, description, parent_id) VALUES (%s, %s, %s)", (bandoru_id, description, parent_id))
        cur.execute("INSERT INTO bandoru_revision(id, bandoru_id) VALUES (%s, %s)", (revision_id, bandoru_id))

        for i, file in enumerate(files):
            file_id = file_ids[i]
            filename = file.filename
            cur.execute("INSERT INTO file(id, revision_id, filename) VALUES (%s, %s, %s)", (file_id, revision_id, filename))

        connection.commit()

    # TODO: save to s3

    return bandoru_id
