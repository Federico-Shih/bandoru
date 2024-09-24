import { Component } from '@angular/core';
import {asFormControl, BundleFormType, SaveBundleFormService} from "./state/save-bundle-form.service";
import {BundleEditorComponent} from "../../shared/ui/bundle-editor/bundle-editor.component";
import {BundleMetadataEditorComponent} from "../../shared/ui/bundle-metadata-editor/bundle-metadata-editor.component";
import {BundleRepository} from "../../shared/data-access/bundle-repository/bundle-repository.service";
import {Observable, switchMap, zip, zipAll} from "rxjs";
import {ReactiveFormsModule} from "@angular/forms";

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
    ReactiveFormsModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  providers: [SaveBundleFormService]
})
export class LandingComponent {
  bundleForm: BundleFormType;
  state: State = State.OK;

  public UIState = State;

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
    this.state = State.SENDING;
    const bundle = bundleForm.getRawValue();
    this.bundleRepository.postBundle({
      description: bundle.description ?? '',
      files: (bundle.files ?? []).map(file => ({ filename: file.fileName || '' })),
    }).pipe(switchMap((bundleResponse) => {
      const uploads = bundleResponse.post_urls.map((url, index) => {
        const blob = new Blob([bundle?.files?.[index]?.bundleText ?? '']);
        const file = new File([blob], "placeholder_filename");
        return this.bundleRepository.uploadFile(url, file);
      });
      return zip(uploads);
    }))
      .subscribe({
      next: () => {
        this.state = State.OK;
        console.log('Bundle uploaded');
        alert('Bundle uploaded');
      },
      error: (err) => {
        this.state = State.OK;
        console.error(err);
        alert(`Error in uploading Bundle: ${err.statusText}`)
      }
    });
  }

  getUIState(): State {
    return this.state;
  }

  protected readonly asFormControl = asFormControl;
}
