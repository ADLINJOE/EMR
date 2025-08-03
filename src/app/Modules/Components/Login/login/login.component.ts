import { Component, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors, ValidatorFn, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatOptionModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  signupForm: FormGroup;
  showLogin = true;
  ShowRegister = false;
  // UserType = false;

  constructor(private fb: FormBuilder, private Http: CommonService, private Sharedservice: SharedServiceService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      //  email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.signupForm = this.fb.group(
      {
        Name: ['', Validators.required],
        Mobile: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
        Email: ['', [Validators.required, Validators.email]],
        Password: ['', Validators.required],
        ConfirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator() } // ✅ sync validator
    );

  }

  passwordMatchValidator(): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      const password = form.get('Password')?.value;
      const confirmPassword = form.get('ConfirmPassword')?.value;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  toggleForm() {
    //  this.showLogin = !this.showLogin;
    this.signupForm.reset();
    this.loginForm.reset();
  }

  userTypes = ['Doctor', 'Nurse', 'Pharmacist'];
  selectedUserType: string | null = null;
  showUserTypeSelection = false;

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    // Bypass API for admin
    if (email === 'Admin123@gmail.com' && password === 'Admin@123') {
      this.showLogin = false;
      this.toggleForm();
      return;
    }

    this.Http.Post("Login/Login/", this.loginForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.patient) {
            this.Sharedservice.setPatientDetails(response.patient)
          }
          this.Sharedservice.Messages('success', 'Login', response.message, 3000);
          this.showUserTypeSelection = true;
          this.onLoginSuccess(response.components);
        } else {
          this.Sharedservice.Messages('error', 'Login', response.message, 3000);
        }
      },
      error: (error) => {
        console.error('Login API error:', error);
        this.Sharedservice.Messages('error', 'Login Failed', 'Something went wrong.', 3000);
      }
    });
  }

  toggleLoginForm() {
    this.showLogin = !this.showLogin;
  }
  onLoginSuccess(response: any) {
    const menuItems = response.filter((item: any) => item.componentName !== 'LoginComponent');
    this.Sharedservice.setMenuItems(menuItems);
    this.router.navigate(['/MainLayout']);
  }

  onUserTypeSelected() {
    if (this.selectedUserType) {

      alert('Logged in as ' + this.selectedUserType);
    }
  }
  onSignupSubmit() {
    if (this.signupForm.valid) {
      this.Http.Post("Login/Register/", this.signupForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.Sharedservice.Messages('success', 'Registration', response.message, 3000);
            this.toggleLoginForm()
          } else {
            this.Sharedservice.Messages('error', 'Registration', response.message, 3000);
          }
        },
        error: (error) => {

        }
      });
    } else {
      console.warn('Form is invalid');

      this.signupForm.markAllAsTouched();
    }
  }


}
