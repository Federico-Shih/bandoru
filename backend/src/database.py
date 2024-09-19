import os
import sys
import psycopg2
import psycopg2.extras
from psycopg2.extensions import connection as Connection
import logging

user = os.environ["DB_USER"]
password = os.environ["DB_PASS"]
host = os.environ["DB_HOST"]
dbname = os.environ["DB_NAME"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)

psycopg2.extras.register_uuid()


# create the database connection outside of the handler to allow connections to be
# re-used by subsequent function invocations.

connection: Connection


def connect():
    global connection
    connection = psycopg2.connect(
        host=host,
        user=user,
        password=password,
        dbname=dbname
    )


def create_db():
    con = psycopg2.connect(
        host=host,
        user=user,
        password=password
    )

    con.autocommit = True

    with con.cursor() as cur:
        cur.execute(f"CREATE DATABASE {dbname}")

    con.close()


def migrate():
    with connection.cursor() as cur:
        cur.execute(open("schema.sql", "r").read())
        connection.commit()


try:
    connect()
except Exception as e:
    try:
        create_db()
        connect()
        migrate()
    except Exception as e2:
        logger.error("ERROR: Unexpected error: Could not connect to RDS instance.")
        logger.error(e)
        sys.exit(1)
