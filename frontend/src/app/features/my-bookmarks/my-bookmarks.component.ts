import { Component, inject, OnInit, signal } from '@angular/core';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { AuthService } from '../../shared/data-access/auth-service/auth.service';
import { map, merge, switchMap } from 'rxjs';
import {BundleGetResponse} from "../../shared/models/Bundle";
import {User} from "../../shared/models/User";
import {Router, RouterModule} from "@angular/router";
import { CopyLinkComponent } from "../../shared/ui/copy-link/copy-link.component";
import { BundleEditorComponent } from "../../shared/ui/bundle-editor/bundle-editor.component";
import { SaveBundleFormService } from '../../shared/state/save-bundle-form/save-bundle-form.service';
import { BookmarkState, BookmarkButtonComponent } from '../../shared/ui/bookmark-button/bookmark-button.component';
import { ForkLinkComponent } from "../../shared/ui/fork-link/fork-link.component";

@Component({
  selector: 'app-my-bundles',
  standalone: true,
  imports: [RouterModule, CopyLinkComponent, BundleEditorComponent, BookmarkButtonComponent, ForkLinkComponent],
  providers: [SaveBundleFormService],
  templateUrl: './my-bookmarks.component.html',
  styleUrl: './my-bookmarks.component.scss'
})
export class MyBookmarksComponent implements OnInit {
  public BookmarkState = BookmarkState;
  private bookmarkState = signal<BookmarkState>(BookmarkState.LOADING);
  private userId: string | undefined = undefined;
  private bundleId: string | undefined = undefined;

  bundleRepository = inject(BundleRepository);
  authService = inject(AuthService);
  bundleService = inject(SaveBundleFormService);
  router = inject(Router);

  bundles:BundleGetResponse[] | null = null;
  loading: boolean = true;
  user:User | "NO_USER" = 'NO_USER';

  loadingFiles = signal(true);
  loadingBundle = signal(true);
  hasBundle = signal(false);
  form = this.bundleService.linkForm();
  currentUrl = '';


  ngOnInit(): void {
    this.authService.getUser().pipe(
      switchMap((user) => {
          if (user != "NO_USER") {
            this.user = user;
            this.userId = user.id;
            return this.bundleRepository.getBookmarks(user.id);
          }else{
            this.bookmarkState.set(BookmarkState.NO_USER);
            return [];
          }
        }
      )
    ).subscribe({
      next: (bundles) => {
        this.bundles = bundles;
        this.loading = false;
        if (bundles !== null && bundles.length > 0) {
          this.bundleRepository.getBundle(bundles[0].id).subscribe({
            next: (bundle) => {
              this.loadingBundle.set(false);
              this.loadBundle(bundle);
            },
            error: (error) => {
              console.error(error);
              this.loadingBundle.set(false);
            }
          })
        }
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
        this.loadingBundle.set(false);
        this.loadingFiles.set(false);
        this.hasBundle.set(false);
      }
    });
  }

  loadBundle(bundle:BundleGetResponse){
    const textDecoder = new TextDecoder();
    this.currentUrl = window.location.origin + `/share/${bundle.id}`;
    this.loadingFiles.set(true);
    this.bundleService.loadBundle(bundle);
    this.hasBundle.set(true);
    this.bundleId = bundle.id;
    this.bundleRepository.getBundle(bundle.id).pipe(
      switchMap(({ files }) => {
        return merge(...files.map((file, index) => this.bundleRepository.downloadFile(file.url ?? '').pipe(map((fileContent) => ({ fileContent, ...file, index })))))
      })
    ).subscribe({
      next: ({ fileContent, index }) => {
        const fileControl = this.form.controls.files.at(index).controls;
        fileControl.loading.setValue(false);
        fileControl.bundleText.setValue(textDecoder.decode(fileContent));

        this.loadingFiles.set(false);
      },
      error: (err) => {
        this.loadingBundle.set(false);
        this.loadingFiles.set(false);
      },
    });
    this.bundleRepository.isBookmarked(this.userId!, bundle.id).subscribe({
      next: (isBookmarked) => {
        if (isBookmarked) {
          this.bookmarkState.set(BookmarkState.BOOKMARKED);
        } else {
          this.bookmarkState.set(BookmarkState.NOT_BOOKMARKED);
        }
      }
    });

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

  public fork(){
    this.router.navigate(['/'], { queryParams: { fork: this.bundleId } });
  }

}
