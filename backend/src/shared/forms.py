from typing import Optional

from pydantic import BaseModel, conbytes, conlist, constr, UUID4, ConfigDict


class FileForm(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: constr(max_length=127, pattern=r'^.*[.].+$')

class CreateBandoruForm(BaseModel):
    model_config = ConfigDict(extra="forbid")

    files: conlist(FileForm, min_length=1, max_length=32)
    description: Optional[constr(max_length=127)] = None
    parent_id: Optional[UUID4] = None
    private: Optional[bool] = False

class PatchBandoruForm(BaseModel):
    model_config = ConfigDict(extra="forbid")

