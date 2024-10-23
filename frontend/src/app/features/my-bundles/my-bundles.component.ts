import { Component, inject, OnInit, signal } from '@angular/core';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { AuthService } from '../../shared/data-access/auth-service/auth.service';
import { map, merge, switchMap } from 'rxjs';
import {BundleGetResponse} from "../../shared/models/Bundle";
import {User} from "../../shared/models/User";
import {RouterModule} from "@angular/router";
import { CopyLinkComponent } from "../../shared/ui/copy-link/copy-link.component";
import { BundleEditorComponent } from "../../shared/ui/bundle-editor/bundle-editor.component";
import { SaveBundleFormService } from '../../shared/state/save-bundle-form/save-bundle-form.service';

@Component({
  selector: 'app-my-bundles',
  standalone: true,
  imports: [RouterModule, CopyLinkComponent, BundleEditorComponent,],
  providers: [SaveBundleFormService],
  templateUrl: './my-bundles.component.html',
  styleUrl: './my-bundles.component.scss'
})
export class MyBundlesComponent implements OnInit {
  bundleRepository = inject(BundleRepository);
  authService = inject(AuthService);
  bundleService = inject(SaveBundleFormService);

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
            return this.bundleRepository.getBundles(user.id);
          }else{
            return [];
          }
        }
      )
    ).subscribe({
      next: (bundles) => {
        this.bundles = bundles;
        this.loading = false;
        if (bundles.length > 0) {
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
        this.hasBundle.set(true);
      },
      error: (err) => {
        this.loadingBundle.set(false);
        this.loadingFiles.set(false);
      },
    })
    
    // .subscribe({
    //   next: (bundle) => {
    //     this.loadingBundle.set(false);
    //   },
    //   error: (error) => {
    //     console.error(error);
    //     this.loadingBundle.set(false);
    //   }
    // });
  }

}
