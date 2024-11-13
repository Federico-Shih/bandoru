import { Component, EventEmitter, Input, Output } from '@angular/core';

export enum BookmarkState {
  NO_USER,
  NOT_BOOKMARKED,
  BOOKMARKED,
  LOADING
}

@Component({
  selector: 'app-bookmark-button',
  standalone: true,
  imports: [],
  templateUrl: './bookmark-button.component.html',
  styleUrl: './bookmark-button.component.scss'
})
export class BookmarkButtonComponent {
  @Input() public bookmarkState!: BookmarkState;
  @Output() onBookmark = new EventEmitter<void>();
  @Output() onUnbookmark = new EventEmitter<void>();

  public BookmarkState = BookmarkState;

  public bookmark() {
    this.onBookmark.emit();
  }

  public unbookmark() {
    this.onUnbookmark.emit();
  }
}
