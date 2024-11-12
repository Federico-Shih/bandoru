import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebhookEditorComponent } from './webhook-editor.component';

describe('WebhookEditorComponent', () => {
  let component: WebhookEditorComponent;
  let fixture: ComponentFixture<WebhookEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebhookEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebhookEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
