import { inject, Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {BundleGetResponse} from "../../../shared/models/Bundle";
import { BundleRepository } from '../../../shared/data-access/bundle-repository/bundle-repository.service';
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
  });

  constructor(private readonly bundleRepository: BundleRepository) { }

  public linkForm() {
    return this.bundleForm;
  }

  private newBundle() {
    return new FormGroup({
      fileName: new FormControl<string>(''),
      bundleText: new FormControl<string>(''),
      id: new FormControl<number>(this.index++),
      loading: new FormControl<boolean>(false),
    });
  }

  private withBundle({ fileName, bundleText, loading }: { fileName: string, bundleText: string, loading: boolean }) {
    return new FormGroup({
      fileName: new FormControl(fileName),
      bundleText: new FormControl(bundleText),
      id: new FormControl(this.index++),
      loading: new FormControl<boolean>(true),
    });
  }

  public addFile() {
    const bundles = this.bundleForm.controls.files;
    bundles.push(this.newBundle());
  }

  bundleService = inject(BundleRepository);

  public loadBundle({ files, description }: BundleGetResponse) {
    this.bundleForm.controls.files.clear();
    this.bundleForm.controls.description.setValue(description ?? '');
  
    files.forEach((file) => {
      this.bundleForm.controls.files.push(this.withBundle({
        fileName: file.filename,
        bundleText: '',
        loading: true,
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
