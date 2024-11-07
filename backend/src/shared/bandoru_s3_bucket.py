import os

import boto3

from shared.models import File

bucket = os.environ["S3_BUCKET"]
max_file_size = 1 * 2**20 # 1MB
url_expiration_seconds = 300

s3 = boto3.client('s3')

def create_file_post_url(file_id: str, filename: str) -> dict:
    conditions = [
        ["content-length-range", 1, max_file_size],
    ]

    url = s3.generate_presigned_post(Bucket=bucket, Key=f"{file_id}/{filename}", Conditions=conditions, ExpiresIn=url_expiration_seconds)
    return url

def get_file_url(file_id: str, filename: str) -> str:
    return s3.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': f"{file_id}/{filename}"}, ExpiresIn=url_expiration_seconds)

def delete_file(file_id: str, filename: str):
    s3.delete_object(Bucket=bucket, Key=f"{file_id}/{filename}")

def delete_files(files: list[File]):
    s3.delete_objects(
        Bucket=bucket,
        Delete={
            "Objects": [{"Key": f"{file.id}/{file.filename}"} for file in files]
        }
    )
