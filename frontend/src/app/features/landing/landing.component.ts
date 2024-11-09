import {Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import {asFormControl, BundleFormType, SaveBundleFormService} from "../../shared/state/save-bundle-form/save-bundle-form.service";
import {BundleEditorComponent} from "../../shared/ui/bundle-editor/bundle-editor.component";
import {BundleMetadataEditorComponent} from "../../shared/ui/bundle-metadata-editor/bundle-metadata-editor.component";
import {BundleRepository} from "../../shared/data-access/bundle-repository/bundle-repository.service";
import {map, retry, switchMap, take, zip,filter, tap, merge} from "rxjs";
import {AbstractControl, FormArray, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Router,ActivatedRoute} from "@angular/router";
import {ToastService} from "../../shared/state/toast/toast.service";
import {JsonPipe} from "@angular/common";
import {AuthModalComponent} from "../../shared/ui/auth-modal/auth-modal.component";
import { AuthService, NO_USER } from '../../shared/data-access/auth-service/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

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
    AuthModalComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  providers: [SaveBundleFormService]
})
export class LandingComponent {
  bundleForm: BundleFormType;
  state: State = State.OK;

  loadingBundle = signal(true);

  public UIState = State;
  @ViewChild(AuthModalComponent) authModal!: AuthModalComponent;

  authService = inject(AuthService);

  constructor(private readonly saveBundleFormService: SaveBundleFormService,
              private readonly bundleRepository: BundleRepository,
              private readonly router: Router,
              private readonly toast: ToastService,
              private routeParams: ActivatedRoute) {

    const textDecoder = new TextDecoder();
    this.routeParams.queryParamMap
      .pipe(takeUntilDestroyed(), map((queryParamMap) => queryParamMap.get('fork')))
      .pipe(tap((param) => {
        console.log(param);
        this.loadingBundle.set(true);
        if (!param) {
          this.router.navigate(['/']);
        }
      }))
      .pipe(filter((value): value is string => value !== null))
      .pipe(switchMap((id) => this.bundleRepository.getBundle(id)))
      .pipe(tap((bundle) => {
        this.loadingBundle.set(false);
        this.saveBundleFormService.loadBundle(bundle);
      })).pipe(
        switchMap(({ files }) => {
          return merge(...files.map((file, index) => this.bundleRepository.downloadFile(file.url ?? '').pipe(map((fileContent) => ({ fileContent, ...file, index })))))
        })
      )
      .subscribe({
        next: ({ fileContent, index }) => {
          const fileControl = this.bundleForm.controls.files.at(index).controls;
          fileControl.loading.setValue(false);
          fileControl.bundleText.setValue(textDecoder.decode(fileContent));
        },
        error: (err) => {
          this.loadingBundle.set(false);
          if (err instanceof HttpErrorResponse) {
            this.router.navigate(['/']);
          }
        },
      });
    this.bundleForm = saveBundleFormService.linkForm();
  }

  addFile() {
    this.saveBundleFormService.addFile();
  }

  removeFile(id: number) {
    this.saveBundleFormService.removeFile(id);
  }

  uploadPrivate(bundleForm: BundleFormType) {
    this.bundleForm.controls.private.setValue(true);
    this.authService.getAuthUser().pipe(take(1)).subscribe({
      next: (user) => {
        if (user === NO_USER) {
          this.authModal.openDialog('login');
        } else {
          this.uploadBundle(bundleForm);
        }
      }
    })
  }

  uploadPublic(bundleForm: BundleFormType) {
    this.bundleForm.controls.private.setValue(false);
    this.uploadBundle(bundleForm);
  }

  afterSignIn() {
    this.uploadBundle(this.bundleForm);
  }

  @ViewChild('shareDropdown') dropdown!: ElementRef<HTMLDetailsElement>;

  uploadBundle(bundleForm: BundleFormType) {
    if (this.dropdown) {
      this.dropdown.nativeElement.open = false;
    }
    if (bundleForm.invalid) {
      bundleForm.markAsDirty();
      return;
    }
    this.state = State.SENDING;
    const bundle = bundleForm.getRawValue();
    this.bundleRepository.postBundle({
      description: bundle.description ?? '',
      files: (bundle.files ?? []).map(file => ({ filename: file.fileName || '' })),
      private: bundle.private!,
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
