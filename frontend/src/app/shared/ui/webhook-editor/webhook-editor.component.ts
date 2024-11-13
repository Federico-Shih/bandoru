import {Component, effect, ElementRef, EventEmitter, inject, input, Output, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DatePipe, NgOptimizedImage} from "@angular/common";
import {ToastService} from "../../state/toast/toast.service";
import {HttpClient} from "@angular/common/http";
import {ExecutionFailResponse} from "../../models/Bundle";

const WEBHOOK_STATUS = {
  UNTESTED: 'untested',
  TESTING: 'testing',
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;

type KEY_TYPE = keyof typeof WEBHOOK_STATUS;

type Webhook = {
  webhook: string;
  status: (typeof WEBHOOK_STATUS)[KEY_TYPE];
}

@Component({
  selector: 'app-webhook-editor',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './webhook-editor.component.html',
  styleUrl: './webhook-editor.component.scss'
})
export class WebhookEditorComponent {
  MAX_WEBHOOKS = 5;
  toast = inject(ToastService);
  httpClient = inject(HttpClient);

  @ViewChild('dialogRef') dialogRef!: ElementRef<HTMLDialogElement>;

  form = new FormGroup({
    webhooks: new FormArray<FormGroup<{
      webhook: FormControl<string | null>,
      status: FormControl<Webhook["status"] | null>
    }>>([]),
  });

  constructor() {
    effect(() => {
      this.initializeWebhooks(this.webhooks());
    });
  }

  initializeWebhooks(webhooks: string[] | null) {
    this.form.controls.webhooks.clear();
    if (!webhooks || webhooks.length === 0) {
      this.form.controls.webhooks.push(this.buildWebhookForm(''))
      return;
    }
    webhooks.forEach((webhook) => {
      this.form.controls.webhooks.push(this.buildWebhookForm(webhook));
    });
  }

  buildWebhookForm(webhook: string) {
    return new FormGroup(
      {
        webhook: new FormControl(webhook, { validators: [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)] }),
        status: new FormControl<Webhook["status"]>(WEBHOOK_STATUS.UNTESTED),
      }
    );
  }

  deleteWebhook(index: number) {
    this.form.controls.webhooks.removeAt(index);
  }

  addWebhook() {
    if (this.form.controls.webhooks.length < this.MAX_WEBHOOKS) {
      this.form.controls.webhooks.push(this.buildWebhookForm(''))
    } else {
      this.toast.warning(`Maximum ${this.MAX_WEBHOOKS} webhooks allowed`);
    }
  }

  testWebhook(index: number) {
    const webhookValue = this.form.controls.webhooks.at(index).value.webhook ?? '';
    if (webhookValue === '') {
      this.toast.warning('Webhook URL cannot be empty');
      return;
    }
    this.form.controls.webhooks.at(index).controls.status.setValue(WEBHOOK_STATUS.TESTING);
    this.httpClient.post(webhookValue, { content: 'Test integration' }).subscribe({
      next: () => {
        this.form.controls.webhooks.at(index).controls.status.setValue(WEBHOOK_STATUS.SUCCESS);
        this.toast.success('Webhook test successful');
      },
      error: (err) => {
        console.error(err);
        this.form.controls.webhooks.at(index).controls.status.setValue(WEBHOOK_STATUS.FAILURE);
        this.toast.error('Webhook test failed');
      }
    });
  }

  saveWebhooks() {
    if (this.form.invalid) {
      this.toast.error('There are empty or invalid webhooks!');
      return;
    }
    this.save.next(this.form.controls.webhooks.value.map((webhook) => webhook.webhook ?? ''));
  }

  webhooks = input<string[]>([]);
  loading = input<boolean>(false);
  executions = input<ExecutionFailResponse[]>([]);
  @Output()
  save = new EventEmitter<string[]>();

  showExecutions() {
    this.dialogRef.nativeElement.showModal();
  }
}
