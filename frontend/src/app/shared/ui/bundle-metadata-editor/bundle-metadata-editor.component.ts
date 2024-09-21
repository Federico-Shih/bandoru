import {Component, Input} from '@angular/core';
import {FormControl, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-bundle-metadata-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './bundle-metadata-editor.component.html',
})
export class BundleMetadataEditorComponent {
  @Input()
  nameFormControl!: FormControl<string | null>;

  @Input()
  descriptionFormControl!: FormControl<string | null>;
}
