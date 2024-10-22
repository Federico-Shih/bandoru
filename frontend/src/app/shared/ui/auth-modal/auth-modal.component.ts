import {Component, computed, effect, ElementRef, inject, Input, signal, ViewChild} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {JsonPipe} from "@angular/common";
import { signUp, signIn, fetchAuthSession, confirmSignIn, confirmSignUp } from "aws-amplify/auth"
import {AuthService} from "../../data-access/auth-service/auth.service";

function passwordFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      // If the value is empty, consider it valid, so it doesn't block other validators.
      return null;
    }

    // Regular expression to check for at least one upper and one lower case
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);

    const isValid = hasUpperCase && hasLowerCase;

    return isValid ? null : { passwordFormat: 'Password must contain at least one uppercase and one lowercase letter' };
  };
}

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe
  ],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss'
})
export class AuthModalComponent {
  authService = inject(AuthService);
  @ViewChild('dialogRef') dialogRef!: ElementRef<HTMLDialogElement>;

  submitLoading = signal(false);

  formGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  codeFormControl = new FormGroup({
    code: new FormControl('', [Validators.required]),
    email: new FormControl(''),
    password: new FormControl(''),
  });

  authState = signal<'login' | 'signup' | 'confirm'>('login');

  authStateLabel = computed(() => {
    const authState = this.authState();
    if (authState === 'login') {
      return 'Log in';
    } else if (authState === 'signup') {
      return 'Sign up';
    } else {
      return 'Confirm code';
    }
  });

  constructor() {
    effect(() => {
      this.formGroup.reset();
      const authState = this.authState();
      this.formGroup.controls.password.clearValidators();

      if (authState == 'login') {
        this.formGroup.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
      } else {
        this.formGroup.controls.password.setValidators([Validators.required, Validators.minLength(8), passwordFormatValidator()]);
      }
    });
  }

  openDialog(initialAuthState: 'login' | 'signup') {
    this.authState.set(initialAuthState);
    this.dialogRef.nativeElement.showModal(); // Programmatically open the dialog
  }

  async submit() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.submitLoading.set(true);
    if (this.authState() === 'login') {
      // Call login API
      try {
        const { nextStep } = await signIn({
          username: this.formGroup.value.email!,
          password: this.formGroup.value.password!
        });
        this.submitLoading.set(false);
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          this.authState.set('confirm');
          this.codeFormControl.controls.email.setValue(this.formGroup.value.email!);
          this.codeFormControl.controls.password.setValue(this.formGroup.value.password!);          return;
        }
        this.authService.pullUser().subscribe({
          next: () => {
            this.closeDialog();
          }
        });
      } catch (err) {
        // @ts-ignore
        this.formGroup.setErrors({ loginFailed: true });
        this.submitLoading.set(false);
      }

    } else {
      try {
        const { isSignUpComplete} = await signUp({
          username: this.formGroup.value.email!,
          password: this.formGroup.value.password!,
        });
        this.submitLoading.set(false);
        if (!isSignUpComplete) {
          this.codeFormControl.controls.email.setValue(this.formGroup.value.email!);
          this.codeFormControl.controls.password.setValue(this.formGroup.value.password!);
          this.authState.set('confirm');
          return;
        }
      } catch (err) {
        this.submitLoading.set(false);
        // @ts-ignore
        if (err?.name === 'UsernameExistsException') {
          // @ts-ignore
          this.formGroup.setErrors({ signUpFailed: 'Username already exists' });
        } else {
          this.formGroup.setErrors({ signUpFailed: 'Unknown error' });
        }
      }
      return;
    }
  }

  async submitCode() {
    if (this.codeFormControl.invalid) return;
    try {
      this.submitLoading.set(true);
      const { isSignUpComplete } = await confirmSignUp({
        username: this.codeFormControl.value.email!,
        confirmationCode: this.codeFormControl.value.code!
      });
      this.submitLoading.set(false);
      if (isSignUpComplete) {
        try {
          await signIn({
            username: this.codeFormControl.value.email!,
            password: this.codeFormControl.value.password!
          });
          this.authService.pullUser().subscribe({
            next: () => {
              this.closeDialog();
            }
          });
        } catch (err) {
          this.authState.set('login');
        }
      }
    } catch (err) {
      this.codeFormControl.setErrors({ codeFailed: true });
      this.submitLoading.set(false);
    }
  }

  closeDialog() {
    this.dialogRef.nativeElement.close(); // Close the dialog
  }
}
