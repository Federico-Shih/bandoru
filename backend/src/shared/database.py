import os
from typing import Optional

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

deserializer = TypeDeserializer()
serializer = TypeSerializer()

db_table = os.environ["DB_TABLE"]
dynamo = boto3.client("dynamodb")

def put_item(pk: str, sk: str, data: dict) -> dict:
    serialized = {k: serializer.serialize(v) for k, v in data.items()}

    serialized["PK"] = serializer.serialize(pk)
    serialized["SK"] = serializer.serialize(sk) if sk is not None else serialized["PK"]

    return dynamo.put_item(TableName=db_table, Item=serialized)

def get_item(pk: str, sk: str = None) -> Optional[dict]:
    key = {"PK": {"S": pk}, "SK": {"S": sk} if sk is not None else {"S": pk}}

    res = dynamo.get_item(TableName=db_table, Key=key)

    deserialized = {k: deserializer.deserialize(v) for k, v in res["Item"].items()}
    return deserialized

def query(key_condition_expression: str, expression_attribute_values: Optional[dict] = None) -> list[dict]:
    values = None if expression_attribute_values is None else {k: serializer.serialize(v) for k, v in expression_attribute_values.items()}
    res = dynamo.query(TableName=db_table, KeyConditionExpression=key_condition_expression, ExpressionAttributeValues=values)

    items = res["Items"]
    deserialized = [{k: deserializer.deserialize(v) for k, v in item.items()} for item in items]

    return deserialized
