import base64
from uuid import UUID


def uuid4_to_base64(value: UUID):
    return base64.urlsafe_b64encode(value.bytes).rstrip(b'=').decode('ascii')


def uuid4_from_base64(value: str):
    padding = '=' * (4 - len(value) % 4)
    value += padding

    uuid_bytes = base64.urlsafe_b64decode(value)
    return UUID(bytes=uuid_bytes)

def file_extension(filename: str) -> str:
    return filename.split('.')[-1]
