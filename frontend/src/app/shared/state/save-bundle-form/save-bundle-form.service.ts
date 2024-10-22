import { inject, Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {BundleGetResponse} from "../../models/Bundle";
import { BundleRepository } from '../../data-access/bundle-repository/bundle-repository.service';
import { map, Observable, zip } from 'rxjs';

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
    private: new FormControl<boolean>(true),
  });

  constructor(private readonly bundleRepository: BundleRepository) { }

  public linkForm() {
    return this.bundleForm;
  }

  private newBundle() {
    return this.withBundle({ fileName: '', bundleText: '', loading: false, url: '' });
  }

  private withBundle({ fileName, bundleText, loading, url }: { fileName: string, bundleText: string, loading: boolean, url: string }) {
    return new FormGroup({
      fileName: new FormControl(fileName, { validators: [Validators.required] }),
      bundleText: new FormControl(bundleText, { validators: [Validators.required, Validators.minLength(1)]}),
      id: new FormControl(this.index++),
      loading: new FormControl<boolean>(loading),
      url: new FormControl<string>(url),
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
        bundleText: '',
        loading: true,
        url: file.url,
      }));
    })
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
