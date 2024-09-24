import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { BundleGetResponse } from '../../shared/models/Bundle';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BundleEditorComponent } from '../../shared/ui/bundle-editor/bundle-editor.component';
import {BundleFormType, SaveBundleFormService} from "../landing/state/save-bundle-form.service";

@Component({
  selector: 'app-view-bundle',
  standalone: true,
  imports: [BundleEditorComponent],
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
    this.routeParams.paramMap
      .pipe(takeUntilDestroyed(), map((paramMap) => paramMap.get('id')))
      .pipe(tap((param) => {
        this.loadingBundle.set(true);
        if (!param) {
          this.router.navigate(['/']);
        }
      }))
      .pipe(filter((value): value is string => value !== null))
      .pipe(tap(console.log))
      .pipe(switchMap((id) => this.bundleRepository.getBundle(id)))
      .subscribe({
        next: (bundle) => {
          this.loadingBundle.set(false);
          this.saveBundleFormService.loadBundle(bundle);
        },
        error: (err) => {
          console.error(err);
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

  loadingBundle = signal(true);
}