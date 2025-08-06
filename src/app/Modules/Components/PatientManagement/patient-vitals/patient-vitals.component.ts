import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { VitalDto } from '../../../Interface/PatientFile';

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
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  patientDetails = computed(() => this.sharedService.patientDetails());

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      vitalList: this.fb.array([])
    });
  }

  // Create a new vital form group
  createVital(data?: any, isNew = true): FormGroup {
    const dateOnly = data?.readingDateTime
  ? data.readingDateTime.replace(' ', 'T').substring(0, 16)
  : '';
    const group = this.fb.group({
      id: [data?.id || null],
      patientId: [data?.patientId || ''],
      readingDateTime: [dateOnly, Validators.required],
      systolic: [data?.systolic || null, [Validators.required,]],
      diastolic: [data?.diastolic || null, [Validators.required, ]],
      sugarFasting: [data?.sugarFasting || null, [Validators.required, ]],
      sugarPP: [data?.sugarPP || null, [Validators.required,]],
      deleted: [data?.deleted ?? false],
      lastEditedBy: [data?.lastEditedBy || ''],
      isNew: [isNew],
      isEdited: [false],
      isDeleted: [false]
    });

    group.valueChanges.subscribe(() => {
      if (!group.get('isNew')?.value && !group.get('isEdited')?.value) {
        group.get('isEdited')?.setValue(true, { emitEvent: false });
      }
    });

    return group;
  }

  // Getter for FormArray
  get getFormControls(): FormArray {
    return this.form.get('vitalList') as FormArray;
  }

  // Add a new row
  addVital(data?: any, isNew = true) {
    const vitals = this.getFormControls;
    const last = vitals.at(vitals.length - 1);
    if (last?.invalid) {
      last.markAllAsTouched();
      return;
    }
    vitals.push(this.createVital(data, isNew));
  }

  ngOnInit(): void {
    this.loadVitalsFromAPI();
  }

  // Load vitals from API
  loadVitalsFromAPI() {
    const vitals = this.getFormControls;
    vitals.clear();

    const details = this.patientDetails();
    if (!details) return;

    const payload = {
      mode: 'GET',
      patientId: details.patientID
    };

    this.commonService.Post("CurrentMedication/Vitals", payload).subscribe({
      next: (res: any) => {
        if (res.success && res.result) {
          const vitalsList = this.getFormControls;
          vitalsList.clear();
          res.result.forEach((v: any) => vitalsList.push(this.createVital(v, false)));

          if (vitalsList.controls.length === 0) {
            vitalsList.push(this.createVital());
          }
        }
      },
      error: () => {
        this.getFormControls.clear();
        this.getFormControls.push(this.createVital());
      }
    });
  }

  // Save vitals
  saveAll(): void {
    const vitalsArray = this.getFormControls;
    const details = this.patientDetails();
    if (!details?.patientID) return console.error('Patient ID missing.');

    let hasInvalid = false;
    vitalsArray.controls.forEach(ctrl => {
      if (ctrl.invalid && !ctrl.get('isDeleted')?.value) {
        hasInvalid = true;
        ctrl.markAllAsTouched();
      }
    });

    if (hasInvalid) {
      this.sharedService.Messages('error', 'Vitals', 'Fill Mandatory Fields', 3000);
      return;
    }

    const rows = vitalsArray.controls.map(ctrl => ctrl.value);
    const toSave = rows.filter(v => (v.isNew || v.isEdited) && !v.isDeleted);
    const toDelete = rows.filter(v => v.isDeleted && v.id);

    const allRequests = [];

    if (toSave.length > 0) {
      const savePayload: VitalDto = {
        Mode: 'SAVE',
        PatientId: details.patientID,
        VitalList: toSave.map(v => ({
          Id: v.id,
          PatientId: details.patientID,
          ReadingDateTime: v.readingDateTime,
          Systolic: v.systolic,
          Diastolic: v.diastolic,
          SugarFasting: v.sugarFasting,
          SugarPP: v.sugarPP,
          Deleted: v.deleted,
          LastEditedBy: details.email
        }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/Vitals", savePayload).toPromise());
    }

    if (toDelete.length > 0) {
      const deletePayload: VitalDto = {
        Mode: 'DELETE',
        PatientId: details.patientID,
        VitalList: toDelete.map(v => ({
          Id: v.id,
          PatientId: details.patientID,
          ReadingDateTime: v.readingDateTime,
          Systolic: v.systolic,
          Diastolic: v.diastolic,
          SugarFasting: v.sugarFasting,
          SugarPP: v.sugarPP,
          Deleted: v.deleted,
          LastEditedBy: details.email
        }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/Vitals", deletePayload).toPromise());
    }

    Promise.all(allRequests)
      .then(() => this.loadVitalsFromAPI())
      .catch(err => console.error('Save failed', err));
  }

  // Cancel edit
  cancel() {
    this.loadVitalsFromAPI();
  }

  // Soft delete
  removeVital(index: number) {
    const vitals = this.getFormControls;
    const ctrl = vitals.at(index) as FormGroup;
    if (!ctrl) return;

    ctrl.patchValue({
      isDeleted: true,
      isEdited: false
    });
  }

  // TrackBy for ngFor
  trackByIndex(index: number): number {
    return index;
  }
}
