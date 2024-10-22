import { Component, inject, OnInit } from '@angular/core';
import { BundleRepository } from '../../shared/data-access/bundle-repository/bundle-repository.service';
import { AuthService } from '../../shared/data-access/auth-service/auth.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-my-bundles',
  standalone: true,
  imports: [],
  templateUrl: './my-bundles.component.html',
  styleUrl: './my-bundles.component.scss'
})
export class MyBundlesComponent implements OnInit {
  bundleRepository = inject(BundleRepository);
  authService = inject(AuthService);
  ngOnInit(): void {
    this.authService.getUser().pipe(
      switchMap((user) => {
        return this.bundleRepository.getBundles(user.id);
      })
    );
    // TODO: load first bundle. Use the same as gist.
  }

}
