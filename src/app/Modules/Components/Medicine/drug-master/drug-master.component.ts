import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { drugfilter } from '../../../pipes/drugfilter.pipe';

@Component({
  selector: 'app-drug-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, drugfilter, FormsModule],
  templateUrl: './drug-master.component.html',
  styleUrls: ['./drug-master.component.scss']
})
export class DrugMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  form: FormGroup;
  today = new Date().toISOString().split('T')[0];
  patientDetails = computed(() => this.sharedService.patientDetails());
searchText: string = '';
  medicineTypes = ['Tablet', 'Injection', 'Syrup', 'Capsule', 'Ointment', 'Powder'];

  constructor() {
    this.form = this.fb.group({
      drugs: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadDrugsFromAPI();
  }

  get getFormControls(): FormArray {
    return this.form.get('drugs') as FormArray;
  }

  createDrug(data?: any, isNew = true): FormGroup {
  const group = this.fb.group({
    id: [data?.id ?? null],
drugName: [data?.drugName ?? '', Validators.required],
genericName: [data?.genericName ?? ''],
brandName: [data?.brandName ?? ''],
drugCode: [data?.drugCode ?? ''],
strength: [data?.strength ?? ''],
dosageForm: [data?.dosageForm ?? ''],
medicineType: [data?.medicineType ?? '', Validators.required],
drugCategory : [data?.drugCategory?? ''],
unitPrice: [data?.unitPrice ?? null],
status: [data?.status ?? 'Active'],
lastEditedBy: [data?.lastEditedBy ?? ''],
isNew: [isNew],
isEdited: [data?.isEdited ?? false],
isDeleted: [data?.isDeleted ?? false]

  });

  group.valueChanges.subscribe(() => {
    if (!group.get('IsNew')?.value && !group.get('isEdited')?.value) {
      group.get('isEdited')?.setValue(true, { emitEvent: false });
    }
  });

  return group;
}


  loadDrugsFromAPI() {
  const drugsArray = this.getFormControls;
  drugsArray.clear();

  const payload = { Mode: 'GET' };

  this.commonService.Post('Drug/DrugMaster', payload).subscribe({
    next: (res: any) => {
      if (res?.success && Array.isArray(res.result)) {
        res.result.forEach((drug: any) => 
          drugsArray.push(this.createDrug(drug, false))
        );
      }

      if (drugsArray.length === 0) {
        drugsArray.push(this.createDrug());
      }
    },
    error: () => {
      drugsArray.clear();
      drugsArray.push(this.createDrug());
    }
  });
}


  addDrug(): void {
    const drugs = this.getFormControls;
    const last = drugs.at(drugs.length - 1);
    if (last?.invalid) {
      last.markAllAsTouched();
      return;
    }
    drugs.push(this.createDrug());
     var selectElement: any = document.getElementById('scroll');
if (selectElement) {
    selectElement.focus();
    selectElement.selectedIndex = 0;

    setTimeout(function () {
        // 👇 scroll to bottom
        selectElement.scrollTop = selectElement.scrollHeight;
    }, 100);
}

  }

  removeDrug(index: number): void {
    const ctrl = this.getFormControls.at(index) as FormGroup;
    if (!ctrl) return;
    ctrl.patchValue({
      isDeleted: true,
      isEdited: false
    });
  }

  saveAll(): void {
    const drugsArray = this.getFormControls;

    let hasInvalid = false;
    drugsArray.controls.forEach(ctrl => {
      if (ctrl.invalid && !ctrl.get('isDeleted')?.value) {
        hasInvalid = true;
        ctrl.markAllAsTouched();
      }
    });

    if (hasInvalid) {
      this.sharedService.Messages('error', 'Drug Master', 'Fill Mandatory Fields', 3000);
      return;
    }

    const rows = drugsArray.controls.map(ctrl => ctrl.value);

    const toSave = rows.filter(d => (d.isNew || d.isEdited) && !d.isDeleted);
    const toDelete = rows.filter(d => d.isDeleted && d.id);

    const allRequests = [];

    if (toSave.length > 0) {
      const savePayload = {
        mode: 'SAVE',
        DrugList: toSave
      };
      allRequests.push(this.commonService.Post('Drug/DrugMaster', savePayload).toPromise());
    }

    if (toDelete.length > 0) {
      const deletePayload = {
        mode: 'DELETE',
        DrugList: toDelete
      };
      allRequests.push(this.commonService.Post('Drug/DrugMaster', deletePayload).toPromise());
    }

    Promise.all(allRequests)
      .then(() => this.loadDrugsFromAPI())
      .catch(err => console.error('Save failed', err));
  }

  cancel(): void {
    this.loadDrugsFromAPI();
  }

  clear(): void {
    const drugs = this.getFormControls;
    drugs.clear();
    drugs.push(this.createDrug());
  }

  get visibleDrugs() {
    return this.getFormControls.controls.filter(ctrl => !ctrl.value.isDeleted);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
