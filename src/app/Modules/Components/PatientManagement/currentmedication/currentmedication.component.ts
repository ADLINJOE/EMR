import { Component, OnInit, inject, computed } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { AllergyComponent } from '../allergy/allergy.component';
import { MedicationRequestDto } from '../../../Interface/PatientFile';

@Component({
  selector: 'app-currentmedication',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AllergyComponent],
  templateUrl: './currentmedication.component.html',
  styleUrls: ['./currentmedication.component.scss']
})
export class CurrentmedicationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  form: FormGroup;
  patientDetails = computed(() => this.sharedService.patientDetails());
   patientglobal =  computed(() => this.sharedService.patient());
  today: any;

  constructor() {
    this.form = this.fb.group({
      Currentmedicine: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadMedicationsFromAPI();
  }

  get getFormControls(): FormArray {
    return this.form.get('Currentmedicine') as FormArray;
  }

  createMedication(data?: any, isNew = true): FormGroup {
    const dateOnly = data?.startDate ? data.startDate.split('T')[0] : '';
    const group = this.fb.group({
      id: [data?.id || null],
      medname: [data?.medname || '', Validators.required],
      dosage: [data?.dosage || '', Validators.required],
      frequency: [data?.frequency || '', Validators.required],
      startDate: [dateOnly, Validators.required],
      ongoing: [data?.ongoing ?? false, Validators.required],
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

  loadMedicationsFromAPI() {
    const meds = this.getFormControls;
    meds.clear();
    var details = this.patientDetails();
  var ptDetails  = this.patientglobal()
  

    const payload = {
      mode: 'GET',
      patientId:  details?.patientID ?? ptDetails.patientId
    };

    this.commonService.Post("CurrentMedication/currentmedication/", payload).subscribe({
      next: (res: any) => {
        if (res.success && res.result) {
          const medsArray = this.getFormControls;
          medsArray.clear();
          res.result.forEach((med: any) => medsArray.push(this.createMedication(med, false)));
          if(medsArray.controls.length == 0){
          medsArray.push(this.createMedication())
          }
        }
      },
      error: () => {
        this.getFormControls.clear();
        this.getFormControls.push(this.createMedication());
      }
    });
  }

  addMedication() {
    const meds = this.getFormControls;
    const last = meds.at(meds.length - 1);
    if (last?.invalid) {
      last.markAllAsTouched();
      return;
    }
    meds.push(this.createMedication());
  }

  get visibleMedications() {
    return this.getFormControls.controls.filter(ctrl => !ctrl.value.isDeleted);
  }

  saveAll(): void {
    const medsArray = this.getFormControls;
    var details = this.patientDetails();
     var ptDetails  = this.patientglobal()
 

    let hasInvalid = false;

    // Mark controls as touched to trigger validation errors in UI
    medsArray.controls.forEach(ctrl => {
      if (ctrl.invalid && !ctrl.get('isDeleted')?.value) {
        hasInvalid = true;
        ctrl.markAllAsTouched(); // Mark all fields for that medication
      }
    });

    if (hasInvalid) {
      this.sharedService.Messages('error', 'Current Medication', 'Fill Mandatory Fields', 3000);
      return;
    }
    const rows = medsArray.controls.map(ctrl => ctrl.value);

    const toSave = rows.filter(med => (med.isNew || med.isEdited) && !med.isDeleted);
    const toDelete = rows.filter(med => med.isDeleted && med.id);

    const allRequests = [];

    if (toSave.length > 0) {
      const savePayload: MedicationRequestDto = {
        mode: 'SAVE',
        patientId: details?.patientID ?? ptDetails.patientId,
        medicationList: toSave.map(med => ({
          ...med,
          lastEditedBy: details?.email ?? ptDetails.email
        }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/currentmedication/", savePayload).toPromise());
    }

    if (toDelete.length > 0) {
      const deletePayload: MedicationRequestDto = {
        mode: 'DELETE',
        patientId: details!.patientID,
        medicationList: toDelete.map(med => ({
          ...med,
          lastEditedBy: details!.email
        }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/currentmedication/", deletePayload).toPromise());
    }

    Promise.all(allRequests)
      .then(() => {  this.sharedService.Messages('success', 'Current Medication', 'Saved Successfully', 3000);
        this.loadMedicationsFromAPI()})
      .catch(err => console.error('Save failed', err));
  }

removeMedication(index: number) {
  const meds = this.getFormControls;
  const ctrl = meds.at(index) as FormGroup;
  if (!ctrl) return;

  // Mark as deleted
  ctrl.patchValue({
    isDeleted: true,
    isEdited: false
  });

  

}

  clear() {
    const meds = this.getFormControls;
    meds.clear();
    meds.push(this.createMedication());
  }

  cancel() {
    this.loadMedicationsFromAPI();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
