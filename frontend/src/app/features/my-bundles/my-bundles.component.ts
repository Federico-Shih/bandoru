import { Component, inject, OnInit, signal } from '@angular/core';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { AuthService } from '../../shared/data-access/auth-service/auth.service';
import {map, merge, retry, switchMap, zip} from 'rxjs';
import {BundleGetResponse} from "../../shared/models/Bundle";
import {User} from "../../shared/models/User";
import {Router, RouterModule} from "@angular/router";
import { CopyLinkComponent } from "../../shared/ui/copy-link/copy-link.component";
import { BundleEditorComponent } from "../../shared/ui/bundle-editor/bundle-editor.component";
import { SaveBundleFormService } from '../../shared/state/save-bundle-form/save-bundle-form.service';
import {fromPartialFile} from "../../shared/models/BundlePostDto";
import {ToastService} from "../../shared/state/toast/toast.service";
import {WebhookEditorComponent} from "../../shared/ui/webhook-editor/webhook-editor.component";
import { BookmarkButtonComponent, BookmarkState } from "../../shared/ui/bookmark-button/bookmark-button.component";
import { ForkLinkComponent } from "../../shared/ui/fork-link/fork-link.component";

@Component({
  selector: 'app-my-bundles',
  standalone: true,
  imports: [RouterModule, CopyLinkComponent, BundleEditorComponent, WebhookEditorComponent, BookmarkButtonComponent, ForkLinkComponent],
  providers: [SaveBundleFormService],
  templateUrl: './my-bundles.component.html',
  styleUrl: './my-bundles.component.scss'
})
export class MyBundlesComponent implements OnInit {
  public BookmarkState = BookmarkState;
  private bookmarkState = signal<BookmarkState>(BookmarkState.LOADING);
  private userId: string | undefined = undefined;
  private bundleId: string | undefined = undefined;

  bundleRepository = inject(BundleRepository);
  authService = inject(AuthService);
  bundleService = inject(SaveBundleFormService);
  toast = inject(ToastService);
  router = inject(Router);

  bundles: BundleGetResponse[] | null = null;
  loading: boolean = true;
  user:User | "NO_USER" = 'NO_USER';

  loadingFiles = signal(true);
  loadingBundle = signal(true);
  hasBundle = signal(false);

  selectedBundle = signal<BundleGetResponse | null>(null);
  editable = signal(false);
  form = this.bundleService.linkForm();
  currentUrl = '';

  trySaved = signal(false);
  savingBandoru = signal(false);

  // Webhooks
  savingWebhooks = signal(false);
  webhooks = signal<string[]>([]);

  ngOnInit(): void {
    this.authService.getUser().pipe(
      switchMap((user) => {
          if (user != "NO_USER") {
            this.user = user;
            this.userId = user.id;
            return this.bundleRepository.getBundles(user.id);
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
        if (bundles.length > 0) {
          this.setCurrentBundle(bundles[0]);
        } else {
          this.loadingBundle.set(false);
          this.loadingFiles.set(false);
          this.hasBundle.set(false);
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

  setCurrentBundle(bundle:BundleGetResponse){
    const textDecoder = new TextDecoder();
    this.currentUrl = window.location.origin + `/share/${bundle.id}`;
    // Loading current bundle
    this.loadingFiles.set(true);
    this.hasBundle.set(true);
    this.selectedBundle.set(bundle);
    this.bundleService.loadBundle(bundle);
    this.bundleId = bundle.id;
    this.bundleRepository.getWebhooks(bundle.id).subscribe({
      next: (webhooks) => {
        this.webhooks.set(webhooks);
      }
    });

    this.bundleRepository.getBundle(bundle.id).pipe(
      switchMap(({ files }) => {
        return merge(...files.map((file, index) => this.bundleRepository.downloadFile(file.url ?? '').pipe(map((fileContent) => ({ fileContent, ...file, index })))))
      })
    ).subscribe({
      next: ({ fileContent, index }) => {
        const fileControl = this.form.controls.files.at(index).controls;
        fileControl.loading.setValue(false);
        fileControl.bundleText.setValue(textDecoder.decode(fileContent));
        this.loadingBundle.set(false);
        this.loadingFiles.set(false);
      },
      error: (err) => {
        this.loadingBundle.set(false);
        this.loadingFiles.set(false);
      },
    })
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

  saveWebhooks(webhooks: string[]) {
    const selectedBundle = this.selectedBundle();
    if (selectedBundle === null) {
      return;
    }
    this.savingWebhooks.set(true);
    this.bundleRepository.putWebhooks(selectedBundle.id, webhooks).subscribe({
      next: () => {
        this.toast.success('Webhooks saved successfully');
      },
      error: (err) => {
        this.toast.error('Error saving webhooks');
      },
      complete: () =>{
        this.savingWebhooks.set(false);
      }
    });
  }

  onFileRemove(index: number) {
    this.bundleService.removeFile(index);
  }

  addFile() {
    this.bundleService.addFile();
  }

  saveBundle() {
    // TODO: implement diff
    const selectedBundle = this.selectedBundle();
    if (selectedBundle === null) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAsDirty();
      this.trySaved.set(true);
      return;
    }

    this.savingBandoru.set(true);
    const bundle = this.form.getRawValue();
    this.bundleRepository.putBundle(selectedBundle.id, {
      description: bundle.description ?? '',
      files: (bundle.files ?? []).map(fromPartialFile),
      private: bundle.private!,
    }).subscribe({
      next: (response) => {
        // TODO: set new bandorus as new normal
          this.toast.success("Bandoru saved successfully");
      },
      error: (err) => {
        this.toast.error("Error saving bandoru");
      },
      complete: () => {
        this.savingBandoru.set(false);
      }
    });
  }

  toggleEdit() {
    this.editable.update((prev) => !prev);
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
