import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, merge, mergeAll, switchMap, tap } from 'rxjs';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { BundleGetResponse } from '../../shared/models/Bundle';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BundleEditorComponent } from '../../shared/ui/bundle-editor/bundle-editor.component';
import {BundleFormType, SaveBundleFormService} from "../../shared/state/save-bundle-form/save-bundle-form.service";
import { CopyLinkComponent } from "../../shared/ui/copy-link/copy-link.component";

@Component({
  selector: 'app-view-bundle',
  standalone: true,
  imports: [BundleEditorComponent, CopyLinkComponent],
  templateUrl: './view-bundle.component.html',
  providers: [SaveBundleFormService]
})
export class ViewBundleComponent {
  protected form: BundleFormType;

  constructor(
    private readonly routeParams: ActivatedRoute,
    private readonly bundleRepository: BundleRepository,
    private readonly router: Router,
    private readonly saveBundleFormService: SaveBundleFormService,
  ) {
    const textDecoder = new TextDecoder();
    this.routeParams.paramMap
      .pipe(takeUntilDestroyed(), map((paramMap) => paramMap.get('id')))
      .pipe(tap((param) => {
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
          const fileControl = this.form.controls.files.at(index).controls;
          fileControl.loading.setValue(false);
          fileControl.bundleText.setValue(textDecoder.decode(fileContent));
        },
        error: (err) => {
          this.loadingBundle.set(false);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 404) {
              this.router.navigate(['/404']);
            }
          }
        },
      });
    this.form = this.saveBundleFormService.linkForm();
  }

  currentUrl = window.location.href;

  loadingBundle = signal(true);
}
