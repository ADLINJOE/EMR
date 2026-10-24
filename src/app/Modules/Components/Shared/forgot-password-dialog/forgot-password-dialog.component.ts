import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss']
})
export class ForgotPasswordDialogComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isEmailSent = false;

  constructor(
    private fb: FormBuilder,
    private http: CommonService,
    private sharedService: SharedServiceService,
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      this.http.Post('api/Auth/ForgotPassword', { email }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.isEmailSent = true;
            this.sharedService.Messages('success', 'Password Reset', response.message, 5000);
          } else {
            this.sharedService.Messages('error', 'Password Reset', response.message, 5000);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.sharedService.Messages('error', 'Password Reset', 'Something went wrong. Please try again.', 5000);
        }
      });
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  onSendAnother() {
    this.isEmailSent = false;
    this.forgotPasswordForm.reset();
  }
}
