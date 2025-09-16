import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './allergy.component.html',
  styleUrls: ['./allergy.component.scss', '../../../Shared/styles/table-template.scss']
})
export class AllergyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
    private sharedService = inject(SharedServiceService);
  patientDetails = computed(() => this.sharedService.patientDetails());
    patientglobal =  computed(() => this.sharedService.patient());
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
    isDeleted: [false],
    isEditable: [isNew]
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
   const meds = this.getFormControls;
    const last = meds.at(meds.length - 1);
    if (last?.invalid) {
      last.markAllAsTouched();
      return;
    }
    meds.push(this.createAllergy());
    setTimeout(() => {
      this.scrollToNewRow(meds.length - 1);
    }, 100);
}
private scrollToNewRow(index: number) {
    const tableContainer = document.querySelector('.emr-table-container');
    if (tableContainer) {
      const rows = tableContainer.querySelectorAll('tbody tr:not([style*="display: none"])');
      const targetRow = rows[index] as HTMLElement;
      if (targetRow) {
        // Calculate the position to scroll to show the new row
        const containerHeight = tableContainer.clientHeight;
        const rowHeight = targetRow.offsetHeight;
        const rowTop = targetRow.offsetTop;
        const headerHeight = 50; // Approximate header height
        
        // Scroll to show the new row at the bottom of visible area
        const scrollTop = Math.max(0, rowTop - containerHeight + rowHeight + headerHeight);
        tableContainer.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
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
      var ptDetails  = this.patientglobal()

    const payload = {
      mode: 'GET',
      patientId: details?.patientID ?? ptDetails.patientId
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
  PatientId: details?.patientID ?? ptDetails.patientId,
  AllergyList: toSave.map(med => ({
    Id: med.id,
    PatientId: details?.patientID ?? ptDetails.patientId,
    Description: med.description,
    Deleted: med.deleted,
    LastEditedBy: details?.email ?? ptDetails.email
  }))
};

  allRequests.push(
    this.commonService.Post("CurrentMedication/Allergy/", savePayload).toPromise()
  );
}


    if (toDelete.length > 0) {
      const deletePayload: AllergyDto = {
        Mode: 'DELETE',
        PatientId: details?.patientID ?? ptDetails.patientId,
         AllergyList: toDelete.map(med => ({
    Id: med.id,
    PatientId: details?.patientID ?? ptDetails.patientId,
    Description: med.description,
    Deleted: med.deleted,
    LastEditedBy: details?.email ?? ptDetails.email
  }))
      };
      allRequests.push(this.commonService.Post("CurrentMedication/Allergy/", deletePayload).toPromise());
    }

    Promise.all(allRequests)
      .then(() => {  this.sharedService.Messages('success', 'Allergy', 'Saved Successfully', 3000);this.loadMedicationsFromAPI()})
      .catch(err => console.error('Save failed', err));
  }
cancel(){
     this.loadMedicationsFromAPI();
}

removeAllergy(index: number) {
  const meds = this.getFormControls;
  const ctrl = meds.at(index) as FormGroup;
  if (!ctrl) return;

  const description = ctrl.get('description')?.value?.trim();

  if (!description) {
    // If description is empty → remove control
    meds.removeAt(index);
  } else {
    // If description has value → just mark deleted
    ctrl.patchValue({
      isDeleted: true,
      isEdited: false
    });
  }
}



  trackByIndex(index: number): number {
    return index;
  }

  editAllergy(index: number) {
    const allergy = this.getFormControls.at(index) as FormGroup;
    if (allergy) {
      allergy.patchValue({ isEditable: true });
    }
  }

  saveAllergy(index: number) {
    const allergy = this.getFormControls.at(index) as FormGroup;
    if (allergy && allergy.valid) {
      allergy.patchValue({ 
        isEditable: false,
        isNew: false,
        isEdited: !allergy.get('isNew')?.value
      });
    } else {
      allergy?.markAllAsTouched();
    }
  }

  cancelEdit(index: number) {
    const allergy = this.getFormControls.at(index) as FormGroup;
    if (allergy) {
      if (allergy.get('isNew')?.value) {
        this.getFormControls.removeAt(index);
      } else {
        allergy.patchValue({ isEditable: false });
        // Reset to original values if needed
      }
    }
  }

  allAllergiesDeleted(): boolean {
    return this.getFormControls.controls.every(ctrl => 
      (ctrl as FormGroup).get('isDeleted')?.value === true
    );
  }
}
