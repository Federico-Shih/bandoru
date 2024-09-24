import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {BundleGetResponse} from "../../../shared/models/Bundle";

export type BundleFormType = ReturnType<SaveBundleFormService['linkForm']>;
export type FileFormType = ReturnType<SaveBundleFormService['newBundle']>;

export const asFormControl = (control: any) => control as FormControl;

@Injectable()
export class SaveBundleFormService {
  private index = 0;
  private bundleForm = new FormGroup({
    files: new FormArray<FileFormType>([
      this.newBundle(),
    ]),
    description: new FormControl<string|null>(''),
  });

  constructor() { }

  public linkForm() {
    return this.bundleForm;
  }

  private newBundle() {
    return new FormGroup({
      fileName: new FormControl<string>(''),
      bundleText: new FormControl<string>(''),
      id: new FormControl<number>(this.index++),
    });
  }

  private withBundle({ fileName, bundleText }: { fileName: string, bundleText: string }) {
    return new FormGroup({
      fileName: new FormControl(fileName),
      bundleText: new FormControl(bundleText),
      id: new FormControl(this.index++),
    });
  }

  public addFile() {
    const bundles = this.bundleForm.controls.files;
    bundles.push(this.newBundle());
  }

  public loadBundle({ files, description }: BundleGetResponse) {
    this.bundleForm.controls.files.clear();
    this.bundleForm.controls.description.setValue(description ?? '');
    files.forEach((file) => {
      this.bundleForm.controls.files.push(this.withBundle({
        fileName: file.filename,
        bundleText: ''
      }));
    });
  }

  public removeFile(id: number) {
    const bundles = this.bundleForm.controls.files;
    if (bundles.length === 1) {
      return;
    }
    for (let i = 0; i < bundles.length; i++) {
      if (bundles.at(i).get('id')?.value === id) {
        bundles.removeAt(i);
        break;
      }
    }
  }
}
