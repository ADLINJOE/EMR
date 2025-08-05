import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { AllergyDto } from '../../../Interface/PatientFile';

@Component({
  selector: 'app-allergy',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgFor,
  ],
  templateUrl: './allergy.component.html',
  styleUrls: ['./allergy.component.scss']
})
export class AllergyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
    private sharedService = inject(SharedServiceService);
  patientDetails = computed(() => this.sharedService.patientDetails());
    form: FormGroup;
   constructor() {
    this.form = this.fb.group({
      allergyList: this.fb.array([])
    });
  }


createAllergy(data?: any, isNew = true): FormGroup {
  const group = this.fb.group({
    id: [data?.id || null],
    patientId: [data?.patientId || '',],
    description: [data?.description || '', Validators.required],
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

// Helper to get FormArray strongly typed
get allergyList(): FormArray {
  return this.form.get('allergyList') as FormArray;
}

// Example: Adding a new allergy row
addAllergy(data?: any, isNew = true) {
  this.allergyList.push(this.createAllergy(data, isNew));
}

  ngOnInit(): void {
     this.loadMedicationsFromAPI();
  }

  get getFormControls(): FormArray {
    return this.form.get('allergyList') as FormArray;
  }
 loadMedicationsFromAPI() {
    const meds = this.getFormControls;
    meds.clear();
    const details = this.patientDetails();
    if (!details) return;

    const payload = {
      mode: 'GET',
      patientId: details.patientID
    };

    this.commonService.Post("CurrentMedication/Allergy/", payload).subscribe({
      next: (res: any) => {
        if (res.success && res.result) {
          const medsAllergy = this.getFormControls;
          medsAllergy.clear();
          res.result.forEach((med: any) => medsAllergy.push(this.createAllergy(med, false)));
              if(medsAllergy.controls.length == 0){
          medsAllergy.push(this.createAllergy())
          }
        }
      },
      error: () => {
        this.getFormControls.clear();
        this.getFormControls.push(this.createAllergy());
      }
    });
  }
  

  
  saveAll(): void {
    const medsArray = this.getFormControls;
    const details = this.patientDetails();
    if (!details?.patientID) return console.error('Patient ID missing.');

    let hasInvalid = false;

    // Mark controls as touched to trigger validation errors in UI
    medsArray.controls.forEach(ctrl => {
      if (ctrl.invalid && !ctrl.get('isDeleted')?.value) {
        hasInvalid = true;
        ctrl.markAllAsTouched(); // Mark all fields for that medication
      }
    });

    if (hasInvalid) {
      this.sharedService.Messages('error', 'Allergy', 'Fill Mandatory Fields', 3000);
      return;
    }
    const rows = medsArray.controls.map(ctrl => ctrl.value);

    const toSave = rows.filter(med => (med.isNew || med.isEdited) && !med.isDeleted);
    const toDelete = rows.filter(med => med.isDeleted && med.id);

    const allRequests = [];

    if (toSave.length > 0) {
 const savePayload: AllergyDto = {
  Mode: 'SAVE',
  PatientId: details.patientID,
  AllergyList: toSave.map(med => ({
    Id: med.id,
    PatientId: details.patientID, // <-- capital P, capital I
    Description: med.description,
    Deleted: med.deleted,
    LastEditedBy: details.email
  }))
};

  allRequests.push(
    this.commonService.Post("CurrentMedication/Allergy/", savePayload).toPromise()
  );
}


    if (toDelete.length > 0) {
      const deletePayload: AllergyDto = {
        Mode: 'DELETE',
        PatientId: details.patientID,
         AllergyList: toDelete.map(med => ({
    Id: med.id,
    PatientId: details.patientID, // <-- capital P, capital I
    Description: med.description,
    Deleted: med.deleted,
    LastEditedBy: details.email
  }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/Allergy/", deletePayload).toPromise());
    }

    Promise.all(allRequests)
      .then(() => this.loadMedicationsFromAPI())
      .catch(err => console.error('Save failed', err));
  }
cancel(){
     this.loadMedicationsFromAPI();
}

removeAllergy(index: number) {
  const meds = this.getFormControls;
  const ctrl = meds.at(index) as FormGroup;
  if (!ctrl) return;

  // Mark as deleted
  ctrl.patchValue({
    isDeleted: true,
    isEdited: false
  });

  

}


  trackByIndex(index: number): number {
    return index;
  }
}
