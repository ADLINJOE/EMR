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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,

  ],
  templateUrl: './patient-vitals.component.html',
  styleUrls: ['./patient-vitals.component.scss', '../../../Shared/styles/table-template.scss']
})
export class PatientVitalsComponent {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  patientDetails = computed(() => this.sharedService.patientDetails());
  patientglobal =  computed(() => this.sharedService.patient());

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      vitalList: this.fb.array([])
    });
  }

  // Create a new vital form group
  createVital(data?: any, isNew = true): FormGroup {
    let readingDate = null;
    let readingTime = '';
    
    if (data?.readingDateTime) {
      const dateTime = new Date(data.readingDateTime);
      readingDate = dateTime;
      readingTime = dateTime.toTimeString().substring(0, 5); // HH:MM format
    }
    
    const group = this.fb.group({
      id: [data?.id || null],
      patientId: [data?.patientId || ''],
      readingDate: [readingDate, Validators.required],
      readingTime: [readingTime, Validators.required],
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
    
    // Scroll to the new row after DOM update with longer delay
    setTimeout(() => {
      this.scrollToNewRow(vitals.length +1);
    }, 600);
  }
// private scrollToNewRow(index: number) {
//     const tableContainer = document.querySelector('.emr-table-container');
//     if (tableContainer) {
//       // Simple scroll to bottom to show new row
//       tableContainer.scrollTo({
//         top: tableContainer.scrollHeight,
//         behavior: 'smooth'
//       });
//     }
//   }
  ngOnInit(): void {
    this.loadVitalsFromAPI();
  }

  // Load vitals from API
  loadVitalsFromAPI() {
    const vitals = this.getFormControls;
    vitals.clear();

    var details = this.patientDetails();
    var ptDetails  = this.patientglobal()

    const payload = {
      mode: 'GET',
      patientId: details?.patientID??ptDetails.patientId
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
     var details = this.patientDetails();
    var ptDetails  = this.patientglobal()

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
        PatientId: details?.patientID?? ptDetails.patientId,
        VitalList: toSave.map(v => ({
          Id: v.id,
          PatientId: details?.patientID?? ptDetails.patientId,
          ReadingDateTime: this.combineDateAndTime(v.readingDate, v.readingTime),
          Systolic: v.systolic,
          Diastolic: v.diastolic,
          SugarFasting: v.sugarFasting,
          SugarPP: v.sugarPP,
          Deleted: v.deleted,
          LastEditedBy: details?.email?? ptDetails.email
        }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/Vitals", savePayload).toPromise());
    }

    if (toDelete.length > 0) {
      const deletePayload: VitalDto = {
        Mode: 'DELETE',
        PatientId: details?.patientID?? ptDetails.patientId,
        VitalList: toDelete.map(v => ({
          Id: v.id,
          PatientId:  details?.patientID?? ptDetails.patientId,
          ReadingDateTime: this.combineDateAndTime(v.readingDate, v.readingTime),
          Systolic: v.systolic,
          Diastolic: v.diastolic,
          SugarFasting: v.sugarFasting,
          SugarPP: v.sugarPP,
          Deleted: v.deleted,
          LastEditedBy: details?.email?? ptDetails.email
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
private scrollToNewRow(index: number) {
    const tableContainer = document.querySelector('.emr-table-container');
    if (tableContainer) {
      const rows = tableContainer.querySelectorAll('tbody tr:not([style*="display: none"])');
      const targetRow = rows[index] as HTMLElement;
     if (targetRow) {
        // Add highlight animation to the new row
        targetRow.classList.add('row-added');
        
        // Simple scroll to bottom to show new row
        tableContainer.scrollTo({
          top: tableContainer.scrollHeight,
          behavior: 'smooth'
        });
        
        // Remove row highlight after animation completes
        setTimeout(() => {
          targetRow.classList.remove('row-added');
        }, 4000);
      }
    }
  }
  // Helper method to combine date and time into Date object
  private combineDateAndTime(date: Date | null, time: string): Date {
    if (!date || !time) {
      return new Date();
    }
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateTimeStr = `${dateStr}T${time}:00`; // YYYY-MM-DDTHH:MM:SS
    return new Date(dateTimeStr);
  }

  // TrackBy for ngFor
  trackByIndex(index: number): number {
    return index;
  }
}
