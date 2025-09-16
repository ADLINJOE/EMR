import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { ForgotPasswordDialogComponent } from '../../Shared/forgot-password-dialog/forgot-password-dialog.component';

@Component({
  selector: 'app-patient-registrationlink',
  imports: [MatInputModule, ReactiveFormsModule, MatSelectModule, CommonModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatOptionModule],
  templateUrl: './patient-registrationlink.component.html',
  styleUrl: './patient-registrationlink.component.scss'
})
export class PatientRegistrationlinkComponent implements OnInit {
  showLogin = true;
  previewUrl: string | ArrayBuffer | null = null;

  loginForm: FormGroup;
  registerForm: FormGroup;
  PatientEmail: string | null;
  HideRegister: boolean = true;
 @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.key === 'F5') || (event.ctrlKey && event.key === 'r')) {
      event.preventDefault();
      event.stopPropagation();
      alert('Page reload is disabled on registration screen.');
    }
  }

  // Warn or block refresh / tab close
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    $event.preventDefault();
    $event.returnValue = 'You will lose unsaved registration data.';
  }

  ngOnDestroy(): void {
    // Clear beforeunload when leaving
    window.onbeforeunload = null;
  }
  constructor(private router: Router, private fb: FormBuilder, private route: ActivatedRoute, private Commonservice: CommonService, private Sharedservice: SharedServiceService, private dialog: MatDialog) {
    this.PatientEmail = this.route.snapshot.queryParamMap.get('email');
    this.CheckPatientRegister()
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      FirstName: ['', Validators.required],
      LastName: ['', Validators.required],
      age: ['', Validators.required],
      gender: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      photo: [null]
    });
  }
  ngOnInit(): void {

  }
  CheckPatientRegister() {
    if (this.PatientEmail) {
      this.Commonservice.Post('PatientRegistercheck', { Email: this.PatientEmail }).subscribe({
        next: (response) => {
          if (response.exists) {

          //  this.HideRegister = false;
this.registerForm.get('email')?.setValue(this.PatientEmail);
this.registerForm.get('email')?.disable();
    this.router.navigate(['MainLayout', 'login']);

          } else {
            this.showLogin = false;
            this.Sharedservice.Messages('error', 'Login', 'Email not found.', 3000);
           this.registerForm.get('email')?.setValue(this.PatientEmail);
this.registerForm.get('email')?.disable();

          }
        },
        error: (error) => {
          console.error('API Error:', error);
        }
      });
    } else {
      this.Sharedservice.Messages('error', 'Error', 'No email found in query parameters.', 3000);
    }
  }

  photoBase64: string | null = null;
  toggleForm() {
    this.showLogin = !this.showLogin;
    this.previewUrl = null;
    this.registerForm.reset();
    this.loginForm.reset();
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');

    if (emailFromQuery) {
      this.registerForm.patchValue({
        email: emailFromQuery
      });
    }

    this.router.navigate(['MainLayout', 'login']);
  }
  onLoginSubmit() {
    if (this.loginForm.valid) {
      console.log('Login form:', this.loginForm.value);
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      const formData = new FormData();
      Object.entries(this.registerForm.value).forEach(([key, value]) => {
        formData.append(key, value as any);
      });
      const formDataAPI = {
        ...this.registerForm.value,
        photoBase64: this.photoBase64,
        email : this.PatientEmail
      };
      this.Commonservice.Post('PatientRegisterNew', formDataAPI).subscribe({
        next: (response) => {
          if (response.success) {
            this.Sharedservice.Messages('success', 'Login', response.message, 3000);
            this.toggleForm();
            // this.UserType = true;
          } else {
            this.Sharedservice.Messages('error', 'Login', response.message, 3000);
          }
        },
        error: (error) => {

        }
      });
      console.log('Register form data:', formData);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photoBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  resetLogin() {
    this.loginForm.reset();
  }

  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '450px',
      disableClose: false,
      panelClass: 'forgot-password-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle any post-dialog actions if needed
    });
  }

}


