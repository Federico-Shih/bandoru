import os
from typing import Optional

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

deserializer = TypeDeserializer()
serializer = TypeSerializer()

db_table = os.environ["DB_TABLE"]
dynamo = boto3.client("dynamodb")

def put_item(pk: str, sk: Optional[str], data: dict) -> dict:
    serialized = {k: serializer.serialize(v) for k, v in data.items()}
    serialized["pk"] = serializer.serialize(pk)
    serialized["sk"] = serializer.serialize(sk)

    return dynamo.put_item(TableName=db_table, Item=serialized)

def get_item(pk: str, sk: str = None) -> Optional[dict]:
    key = {"pk": {"S": pk}}
    if sk is not None:
        key["sk"] = {"S": sk}

    res = dynamo.get_item(TableName=db_table, Key=key)

    deserialized = {k: deserializer.deserialize(v) for k, v in res["Item"].items()}
    return deserialized

def query(key_condition_expression: str) -> list[dict]:
    res = dynamo.query(TableName=db_table, KeyConditionExpression=key_condition_expression)

    items = res["Items"]
    deserialized = [{k: deserializer.deserialize(v) for k, v in item.items()} for item in items]

    return deserialized
