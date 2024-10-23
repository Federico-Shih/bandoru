import { Component, inject, OnInit } from '@angular/core';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { AuthService } from '../../shared/data-access/auth-service/auth.service';
import { switchMap } from 'rxjs';
import {BundleGetResponse} from "../../shared/models/Bundle";
import {User} from "../../shared/models/User";
import {RouterModule} from "@angular/router";

@Component({
  selector: 'app-my-bundles',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './my-bundles.component.html',
  styleUrl: './my-bundles.component.scss'
})
export class MyBundlesComponent implements OnInit {
  bundleRepository = inject(BundleRepository);
  authService = inject(AuthService);
  bundles:BundleGetResponse[] | null = null;
  loading: boolean = true;
  user:User | "NO_USER" = 'NO_USER';
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
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      }
    });
  }

}
