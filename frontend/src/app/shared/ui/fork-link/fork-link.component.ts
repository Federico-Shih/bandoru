import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-fork-link',
  standalone: true,
  imports: [],
  templateUrl: './fork-link.component.html',
  styleUrl: './fork-link.component.scss'
})
export class ForkLinkComponent {
  @Output() onClick = new EventEmitter<void>();

  public handleClick() {
    this.onClick.emit();
  }
}
