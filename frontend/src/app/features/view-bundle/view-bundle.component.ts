import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router} from '@angular/router';
import { filter, map, merge, mergeAll, Observable, of, switchMap, tap } from 'rxjs';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { BundleGetResponse } from '../../shared/models/Bundle';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BundleEditorComponent } from '../../shared/ui/bundle-editor/bundle-editor.component';
import {BundleFormType, SaveBundleFormService} from "../../shared/state/save-bundle-form/save-bundle-form.service";
import { CopyLinkComponent } from "../../shared/ui/copy-link/copy-link.component";
import { AuthService } from '../../shared/data-access/auth-service/auth.service';

enum BookmarkState {
  NO_USER,
  NOT_BOOKMARKED,
  BOOKMARKED,
  LOADING
}

@Component({
  selector: 'app-view-bundle',
  standalone: true,
  imports: [BundleEditorComponent, CopyLinkComponent],
  templateUrl: './view-bundle.component.html',
  providers: [SaveBundleFormService]
})
export class ViewBundleComponent {
  protected form: BundleFormType;
  public BookmarkState = BookmarkState;
  private bookmarkState = signal<BookmarkState>(BookmarkState.LOADING);
  private userId: string | undefined = undefined;
  private bundleId: string | undefined = undefined;

  constructor(
    private readonly routeParams: ActivatedRoute,
    private readonly bundleRepository: BundleRepository,
    private readonly router: Router,
    private readonly saveBundleFormService: SaveBundleFormService,
    private readonly authService: AuthService,
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
      .pipe(switchMap((id) => {
        this.bundleId = id;
        this.authService.getUser().subscribe({
          next: (user) => {
            if (user != "NO_USER") {
              this.userId = user.id;
              this.bundleRepository.isBookmarked(user.id, id).subscribe({
                next: (isBookmarked) => {
                  if (isBookmarked) {
                    this.bookmarkState.set(BookmarkState.BOOKMARKED);
                  } else {
                    this.bookmarkState.set(BookmarkState.NOT_BOOKMARKED);
                  }
                }
              });
            } else {
              this.bookmarkState.set(BookmarkState.NO_USER);
            }
          }
        });
        return this.bundleRepository.getBundle(id)
      }))
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
            this.router.navigate(['/404']);
          }
        },
      });
    this.form = this.saveBundleFormService.linkForm();
  }

  getBookmarkState(): BookmarkState {
    return this.bookmarkState();
  }

  bookmarkBundle() {
    if (!this.userId || !this.bundleId) {
      return;
    }
    this.bookmarkState.set(BookmarkState.LOADING);
    this.bundleRepository.postBookmark(this.userId, this.bundleId).subscribe({
      next: () => {
        this.bookmarkState.set(BookmarkState.BOOKMARKED);
      }
    });
  }

  unbookmarkBundle() {
    if (!this.userId || !this.bundleId) {
      return;
    }
    this.bookmarkState.set(BookmarkState.LOADING);
    this.bundleRepository.deleteBookmark(this.userId, this.bundleId).subscribe({
      next: () => {
        this.bookmarkState.set(BookmarkState.NOT_BOOKMARKED);
      }
    });
  }

  currentUrl = window.location.href;

  public getID(): string | null {
    return this.routeParams.snapshot.paramMap.get('id');
  }
  public fork(){
    this.router.navigate(['/'], { queryParams: { fork: this.getID() } });
  }

  loadingBundle = signal(true);
}
