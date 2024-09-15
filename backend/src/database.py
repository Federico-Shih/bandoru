import os
import sys
import psycopg2
import logging

user_name = os.environ["USER_NAME"]
password = os.environ["PASSWORD"]
rds_proxy_host = os.environ["RDS_PROXY_HOST"]
db_name = os.environ["DB_NAME"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# create the database connection outside of the handler to allow connections to be
# re-used by subsequent function invocations.
try:
    connection = psycopg2.connect(
        host=rds_proxy_host,
        user=user_name,
        password=password,
        dbname=db_name,
    )
except Exception as e:
    logger.error("ERROR: Unexpected error: Could not connect to RDS instance.")
    logger.error(e)
    sys.exit(1)

# rds settings
def migrate():
    with connection.cursor() as cur:
        cur.execute(open("schema.sql", "r").read())

migrate()
