from database import connection


# rds settings
def migrate(event, context):
    with connection.cursor() as cur:
        cur.execute(open("schema.sql", "r").read())


def lambda_handler(event, context):
    return "Hello, Fede"
