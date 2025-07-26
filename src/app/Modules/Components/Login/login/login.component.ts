import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors, ValidatorFn, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../../../Service/common.service';

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
  UserType = false;

  constructor(private fb: FormBuilder, private Http: CommonService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
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
      { validators: this.passwordMatchValidator() }
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
    this.showLogin = !this.showLogin;
  }

  userTypes = ['Doctor', 'Nurse', 'Pharmacist'];
  selectedUserType: string | null = null;
  showUserTypeSelection = false;

  onLoginSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      // TODO: Replace with real API authentication
      if (email === 'joe' && password === '123') {

        this.showUserTypeSelection = true;
        this.toggleForm();
        this.UserType = true;
      } else {
        alert('Invalid credentials');
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onUserTypeSelected() {
    if (this.selectedUserType) {
      // Navigate to main page
      // Example: this.router.navigate(['/dashboard'], { queryParams: { role: this.selectedUserType } });
      alert('Logged in as ' + this.selectedUserType);
    }
  }
 onSignupSubmit() {
  if (this.signupForm.valid) {
    this.Http.Post("Login/Register/", this.signupForm.value).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        // optionally redirect or show a success message
      },
      error: (error) => {
        console.error('Registration error:', error);
        // handle error (e.g., show error message to user)
      }
    });
  } else {
    console.warn('Form is invalid');
    // optionally mark all fields as touched to show validation errors
    this.signupForm.markAllAsTouched();
  }
}

}
