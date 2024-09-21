import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleEditorComponent } from './bundle-editor.component';

describe('BundleEditorComponent', () => {
  let component: BundleEditorComponent;
  let fixture: ComponentFixture<BundleEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
