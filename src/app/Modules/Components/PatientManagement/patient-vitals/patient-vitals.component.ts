import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-patient-vitals',
   imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './patient-vitals.component.html',
  styleUrl: './patient-vitals.component.scss'
})
export class PatientVitalsComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      vitalList: this.fb.array([])
    });
    this.addVital(); // Add one row by default
  }

  get getFormControls() {
    return this.form.get('vitalList') as FormArray;
  }

  trackByIndex(index: number): number {
    return index;
  }

  addVital() {
    const group = this.fb.group({
      readingDateTime: [null, Validators.required],
      systolic: [null, Validators.min(50)],
      diastolic: [null, Validators.min(30)],
      sugarFasting: [null],
      sugarPP: [null],
      heartRate: [null],
      respiratoryRate: [null],
      temperature: [null],
      spo2: [null],
      weight: [null],
      height: [null],
      bmi: [{ value: null, disabled: true }],
      isDeleted: [false]
    });

    // Auto-calc BMI
    group.get('weight')?.valueChanges.subscribe(() => this.calculateBMI(group));
    group.get('height')?.valueChanges.subscribe(() => this.calculateBMI(group));

    this.getFormControls.push(group);
  }

  calculateBMI(group: FormGroup) {
    const weight = group.get('weight')?.value;
    const height = group.get('height')?.value;
    if (weight && height) {
      const bmi = +(weight / Math.pow(height / 100, 2)).toFixed(2);
      group.get('bmi')?.setValue(bmi);
    }
  }

  removeVital(index: number) {
    const ctrl = this.getFormControls.at(index);
    if (ctrl) {
      ctrl.patchValue({ isDeleted: true });
    }
  }

  saveAll() {
    const payload = this.getFormControls.value.filter((v: any) => !v.isDeleted);
    console.log('Save Vitals:', payload);
    // TODO: Call .NET API here
  }

  cancel() {
    this.form.reset();
  }
}
