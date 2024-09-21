import { Component } from '@angular/core';
import {SaveBundleFormService} from "./state/save-bundle-form.service";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private form;

  constructor(private readonly saveBundleFormService: SaveBundleFormService) {
    this.form = saveBundleFormService.linkForm();
  }
}
