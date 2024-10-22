import {Component, ViewChild} from '@angular/core';
import {asFormControl, BundleFormType, SaveBundleFormService} from "../../shared/state/save-bundle-form/save-bundle-form.service";
import {BundleEditorComponent} from "../../shared/ui/bundle-editor/bundle-editor.component";
import {BundleMetadataEditorComponent} from "../../shared/ui/bundle-metadata-editor/bundle-metadata-editor.component";
import {BundleRepository} from "../../shared/data-access/bundle-repository/bundle-repository.service";
import {map, Observable, retry, switchMap, zip, zipAll} from "rxjs";
import {AbstractControl, FormArray, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastService} from "../../shared/state/toast/toast.service";
import {JsonPipe} from "@angular/common";
import {AuthModalComponent} from "../../shared/ui/auth-modal/auth-modal.component";

enum State {
  OK,
  SENDING,
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    BundleEditorComponent,
    BundleMetadataEditorComponent,
    ReactiveFormsModule,
    JsonPipe,
    AuthModalComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  providers: [SaveBundleFormService]
})
export class LandingComponent {
  bundleForm: BundleFormType;
  state: State = State.OK;

  public UIState = State;

  constructor(private readonly saveBundleFormService: SaveBundleFormService,
              private readonly bundleRepository: BundleRepository,
              private readonly router: Router,
              private readonly toast: ToastService) {
    this.bundleForm = saveBundleFormService.linkForm();
  }

  addFile() {
    this.saveBundleFormService.addFile();
  }

  removeFile(id: number) {
    this.saveBundleFormService.removeFile(id);
  }

  uploadBundle(bundleForm: BundleFormType) {
    if (bundleForm.invalid) {
      bundleForm.markAsDirty();
      return;
    }
    this.state = State.SENDING;
    const bundle = bundleForm.getRawValue();
    this.bundleRepository.postBundle({
      description: bundle.description ?? '',
      files: (bundle.files ?? []).map(file => ({ filename: file.fileName || '' })),
    }).pipe(switchMap((bundleResponse) => {
      const uploads = bundleResponse.post_urls.map((url, index) => {
        const blob = new Blob([bundle?.files?.[index]?.bundleText ?? '']);
        const file = new File([blob], "placeholder_filename");
        return this.bundleRepository.uploadFile(url, file).pipe(retry(2));
      });
      return zip(uploads).pipe(map(() => ({ ...bundleResponse})));
    })).subscribe({
      next: ({ bandoru_id }) => {
        this.state = State.OK;
        this.toast.success('Bundle created successfully!');
        this.router.navigate(['share', bandoru_id]);
      },
      error: (err) => {
        this.state = State.OK;
        console.error(err);
        this.toast.error(`Error in uploading Bundle: ${err.statusText}`);
      }
    });
  }

  getFormErrors(control: AbstractControl): any {
    let errors: any = {};

    if (control instanceof FormGroup) {
      // Loop through each control in the form group
      Object.keys(control.controls).forEach(key => {
        const childControl = control.get(key);
        if (childControl) {
          const childErrors = this.getFormErrors(childControl);
          if (Object.keys(childErrors).length > 0) {
            errors[key] = childErrors;
          }
        }
      });
    } else if (control instanceof FormArray) {
      // Loop through each control in the form array
      control.controls.forEach((childControl, index) => {
        const childErrors = this.getFormErrors(childControl);
        if (Object.keys(childErrors).length > 0) {
          errors[index] = childErrors;
        }
      });
    } else {
      // If it's a form control, get its errors directly
      if (control.errors && control.touched) {
        errors = control.errors;
      }
    }
    return errors;
  }

  getUIState(): State {
    return this.state;
  }

  protected readonly asFormControl = asFormControl;
}
