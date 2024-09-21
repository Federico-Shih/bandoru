import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup} from "@angular/forms";

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
    name: new FormControl<string>(''),
    description: new FormControl<string>(''),
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

  public addFile() {
    const bundles = this.bundleForm.controls.files;
    bundles.push(this.newBundle());
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
