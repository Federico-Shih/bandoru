import os

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

deserializer = TypeDeserializer()
serializer = TypeSerializer()

db_table_name = os.environ["DB_TABLE"]
user_idx = os.environ["DB_USER_IDX"]
dynamo = boto3.resource("dynamodb")

db_table = dynamo.Table(db_table_name)
