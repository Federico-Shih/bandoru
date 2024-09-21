import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup} from "@angular/forms";

export type BundleFormType = ReturnType<SaveBundleFormService['linkForm']>;

@Injectable()
export class SaveBundleFormService {
  private bundleForm = new FormGroup({
    bundles: new FormArray([
      this.newBundle(),
    ]),
  });

  constructor() { }

  public linkForm() {
    return this.bundleForm;
  }

  private newBundle() {
    return new FormGroup({
      fileName: new FormControl(''),
      bundleText: new FormControl(''),
    });
  }

  public addBundle() {
    const bundles = this.bundleForm.get('bundles') as FormArray;
    bundles.push(this.newBundle());
  }
}
