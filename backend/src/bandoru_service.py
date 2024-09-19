from typing import Optional
from uuid import uuid4

import psycopg2.extras

from bandoru_s3_bucket import create_file_post_url
from database import connection
from forms import CreateBandoruForm
from models import BandoruCurrent
from utils import uuid4_to_base64, uuid4_from_base64


def create(form: CreateBandoruForm) -> dict:
    description = form.description
    files = form.files
    parent_id = None if form.parent_id is None else str(form.parent_id)

    bandoru_id = uuid4()
    revision_id = uuid4()
    file_ids = [uuid4() for _ in range(len(files))]

    urls: list[dict] = []

    with connection.cursor() as cur:
        cur.execute("INSERT INTO bandoru(id, description, parent_id) VALUES (%s, %s, %s)",
                    (bandoru_id, description, parent_id))
        cur.execute("INSERT INTO bandoru_revision(id, bandoru_id) VALUES (%s, %s)", (revision_id, bandoru_id))

        for i, file in enumerate(files):
            file_id = file_ids[i]
            filename = file.filename
            cur.execute("INSERT INTO file(id, revision_id, filename) VALUES (%s, %s, %s)",
                        (file_id, revision_id, filename))

        for i, file in enumerate(files):
            file_id = uuid4_to_base64(file_ids[i])
            urls.append(create_file_post_url(file_id, file.filename))

        connection.commit()


    return {
        'bandoru_id': uuid4_to_base64(bandoru_id),
        'post_urls': urls
    }


def get_all() -> list[BandoruCurrent]:
    bandorus: list[BandoruCurrent]
    with connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM bandoru_current")
        rows = cur.fetchall()
        bandorus = [BandoruCurrent.from_row(row) for row in rows]

    return bandorus


def get(bandoru_id_str: str) -> Optional[BandoruCurrent]:
    try:
        bandoru_id = uuid4_from_base64(bandoru_id_str)
    except ValueError:
        return None

    bandoru: Optional[BandoruCurrent] = None
    with connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM bandoru_current WHERE id = %s", (bandoru_id,))
        row = cur.fetchone()
        if row is not None:
            bandoru = BandoruCurrent.from_row(row)

    return bandoru
