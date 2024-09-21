import { Component } from '@angular/core';
import {asFormControl, BundleFormType, SaveBundleFormService} from "./state/save-bundle-form.service";
import {BundleEditorComponent} from "../../shared/ui/bundle-editor/bundle-editor.component";
import {BundleMetadataEditorComponent} from "../../shared/ui/bundle-metadata-editor/bundle-metadata-editor.component";
import {BundleRepository} from "../../shared/data-access/bundle-repository/bundle-repository.service";
import {Observable, switchMap, zip, zipAll} from "rxjs";
import {ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    BundleEditorComponent,
    BundleMetadataEditorComponent,
    ReactiveFormsModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  providers: [SaveBundleFormService]
})
export class LandingComponent {
  bundleForm: BundleFormType;

  constructor(private readonly saveBundleFormService: SaveBundleFormService, private readonly bundleRepository: BundleRepository) {
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
      return;
    }
    const bundle = bundleForm.getRawValue();
    this.bundleRepository.postBundle({
      description: bundle.description ?? '',
      files: (bundle.files ?? []).map(file => ({ filename: file.fileName || '' })),
    }).pipe(switchMap((bundleResponse) => {
      const uploads = bundleResponse.post_urls.map(({ url, file_id }, index) => {
        const blob = new Blob([bundle?.files?.[index]?.bundleText ?? ''], { type: 'text/plain' });
        const file = new File([blob], file_id, { type: 'text/plain' });
        return this.bundleRepository.uploadFile(url, file);
      });
      return zip(uploads);
    }))
      .subscribe({
      next: () => {
        console.log('Bundle uploaded');
        alert('Bundle uploaded');
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  protected readonly asFormControl = asFormControl;
}
