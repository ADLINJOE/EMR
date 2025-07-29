import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-patient-registrationlink',
  imports: [MatInputModule, ReactiveFormsModule, MatSelectModule,MatNativeDateModule,
     CommonModule, MatDatepickerModule, MatFormFieldModule, MatButtonModule,],
  templateUrl: './patient-registrationlink.component.html',
  styleUrl: './patient-registrationlink.component.scss'
})
export class PatientRegistrationlinkComponent {
  isLoginMode = true;
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      age: ['', Validators.required],
      dob: ['', Validators.required],
      gender: ['', Validators.required],
      guardian: [''],
      MobileNo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      photo: [null]
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login Data:', this.loginForm.value);
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Register Data:', this.registerForm.value);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({ photo: file });
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }
}
