import { Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonService, DeployUrl } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { map, Observable, of, startWith, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { MatAutocomplete } from "@angular/material/autocomplete";
import { MatSelectModule } from "@angular/material/select";
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PatientlistComponent } from '../../Patient/patientlist/patientlist.component';


@Component({
  selector: 'app-adr',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatAutocomplete,
    MatSelectModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    FormsModule,
 

  
   
  ],
  templateUrl: './adr.component.html',
  styleUrls: ['./adr.component.scss', 
    '../../../Shared/styles/table-template.scss','../../Patient/patientlist/patientlist.component.scss']
})
export class ADRComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private Http = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  searchPatientControl = new FormControl<string | null>('');
  filteredPatients: Observable<any[]> | undefined;

  adrForm: FormGroup;
  UserSetGlobal: any;
  patients: any[] = [];
  // Drug master and autocomplete lists (per-row)
  drugList: any[] = [];
  filteredDrugs: Observable<any[]>[] = [];

  // Reports popup state
  showReports = false;
  reportsDrugControl = new FormControl<string | null>('');
  filteredReportDrugs: Observable<any[]> = of([]);
  reportResults: any[] = [];
  constructor() {
    this.adrForm = this.fb.group({
      reactions: this.fb.array([])
    });
   // this.addReaction();
  }
  userinfo = computed(() => this.sharedService.userInfo());
  ngOnInit(): void {
    this.UserSetGlobal = this.userinfo();
    const payload = {
      UserType: this.UserSetGlobal.userType,
      UserId: this.UserSetGlobal.userID
    }
    this.Http.Post('PatientHandle/Getmypatients', payload).subscribe({
      next: (res) => {

        if (res.success) {
          this.patients = res.patients.filter((x: any) => x.isRegistered === true);
          this.setupPatientFilter();
        }

      },

    });
    // Load drug master for autocomplete usage
    this.loadDrugMaster();
    // Setup reports drug autocomplete stream
    this.filteredReportDrugs = this.reportsDrugControl.valueChanges.pipe(
      startWith('' as string | null),
      debounceTime(150),
      distinctUntilChanged(),
      map((value: string | null) => this.filterDrugs(typeof value === 'string' ? value : ''))
    );

    // Auto-load report results as user types in the reports popup
    this.reportsDrugControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(v => (typeof v === 'string' ? v.trim() : '')),
        filter(v => v.length >= 2)
      )
      .subscribe(name => this.loadAdrByDrug(name));
  }
  private setupPatientFilter() {
    this.filteredPatients = this.searchPatientControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value || ''))
    );
  }
  get reactions(): FormArray {
    return this.adrForm.get('reactions') as FormArray;
  }

createReaction(patient?: any, isNew: boolean = false): FormGroup {
  return this.fb.group({
    ID: [patient?.id || 0],
    patientName: [patient?.patientName || null],
    email: [patient?.email || null],
    drugname: [patient?.drugName || '', isNew ? Validators.required : []],
    description: [patient?.description || '', isNew ? Validators.required : []],
    dateOccurred: [patient?.dateOccurred || new Date],
    aiSeveritySuggestion: [patient?.aiSeveritySuggestion || ''],
    patientId: [patient?.patientId || null, Validators.required]
  });
}



  addReaction() {
  // get last form group
  const lastReaction = this.reactions.at(this.reactions.length - 1);

  if (lastReaction) {
    // check if required fields are filled
    const { drugname, description, dateOccurred } = lastReaction.value;

    const isFilled =
   
      drugname && drugname.trim() !== '' &&
      description && description.trim() !== '' &&
      dateOccurred;

    if (!isFilled) {
      console.warn("Please fill the current reaction before adding a new one.");
      return; // stop adding new row
    }
  }
   if (this.selectedPatient) {
         this.reactions.push(this.createReaction({ patientId: this.selectedPatient.patientId , email: this.selectedPatient.email,id : this.selectedPatient.id }, true));
         // setup autocomplete stream for the newly added row
         const newIndex = this.reactions.length - 1;
         this.ensureFilteredDrugsSize(newIndex);
         this.setupAutocomplete(newIndex);
   }
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


  private _filterPatients(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.patients.filter(p =>
      p.name?.toLowerCase().includes(filterValue) 
      // ||
      // p.patientId?.toLowerCase().includes(filterValue) ||
      // p.email?.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }





  removeReaction(index: number) {
    this.reactions.removeAt(index);
  }

  async checkSeverity(index: number) {
    const group = this.reactions.at(index) as FormGroup;
    const description = group.get('description')?.value;
    const drugname = group.get('drugname')?.value;

    if (!description) return;

    // Build payload description (do not update form control)
    const payloadDescription = `Drug: ${drugname || 'Unknown'}, Description: ${description}`;

    try {
      const response: any = await this.http
        .post(`${DeployUrl.URL}api/ADR/check-severity`, { description: payloadDescription })
        .toPromise();

      const severity = response.severity || 'Unknown';
      group.patchValue({ aiSeveritySuggestion: severity });
    } catch (error:any) {
      if (error.status === 429) {
       this.sharedService.Messages('warning', 'AI Analysis', 'Rate limit exceeded. Please try later or upgrade your plan.', 3000);
      } else {
        console.error('ADR API Analysis error:', error);
      }
      
      group.patchValue({ aiSeveritySuggestion: 'Error from AI' });
    }
  }

 displayPatient(patient: any): string {
  return patient ? patient.name : '';
}
selectedPatient: any = null;

patientselect(patid: number) {
  console.log("Selected Patient ID:", patid);
  this.selectedPatient = this.patients.find(p => p.patientId === patid) || null;
  const payload = {
    patID: patid,
    email: this.selectedPatient?.email
  };
  this.reactions.clear();
  this.Http.Post('api/ADR/getByPatient', payload).subscribe({
    next: (res: any[]) => {
      console.log("ADR Data:", res);
      this.reactions.clear();
      if (!res || res.length === 0) {
        this.reactions.push(this.createReaction({ patientId: patid, email: this.selectedPatient?.email, id: this.selectedPatient?.id }, true));
        const idx = this.reactions.length - 1;
        this.ensureFilteredDrugsSize(idx);
        this.setupAutocomplete(idx);
      } else {
        res.forEach((med: any, i: number) => {
          this.reactions.push(this.createReaction(med));
          const idx = this.reactions.length - 1;
          this.ensureFilteredDrugsSize(idx);
          this.setupAutocomplete(idx);
        });
      }
    },
    error: (err) => {
      console.error("Error fetching ADRs", err);
    }
  });
}




  
  saveForm() {
    if(this.selectedPatient.patientId == null || this.selectedPatient.patientId == undefined){
      alert("Please select patient");
      return;
    }
  this.reactions.controls.forEach((ctrl, index) => {
    ctrl.markAllAsTouched();

    if (ctrl.invalid) {
      console.warn(`Row ${index + 1} has validation errors:`);

      const group = ctrl as FormGroup;
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key);
        if (control && control.invalid) {
          console.warn(`  - Control: ${key}, Errors:`, control.errors);
        }
      });
    }
  });

  if (this.reactions.invalid) {
    console.warn("Some rows are incomplete, fix the above errors before saving.");
    return;
  }

  // ✅ proceed with saving if no errors
  console.log("All rows valid. Proceeding to save...");



    // convert FormArray to simple array payload
    const payload = (this.reactions.controls || []).map(ctrl => {
      const val = ctrl.value;
      // normalize date to ISO or 'yyyy-MM-dd HH:mm:ss' if backend expects that
      let dateOccurred = val.dateOccurred;
      if (dateOccurred) {
        // If Date object, convert to ISO string
        if (dateOccurred instanceof Date) {
          dateOccurred = dateOccurred.toISOString(); // backend can parse
        } else {
          // If mat-datepicker gives {year,month,day} or string, try new Date(...)
          const d = new Date(dateOccurred);
          dateOccurred = isNaN(d.getTime()) ? null : d.toISOString();
        }
      }
  this.selectedPatient = this.patients.find(p => p.patientId === val.patientId) || null;
      return {
        ID: val.ID || 0,  // assuming 0 for new entries
        PatientId: val.patientId ?? null,             // optional; include if you have it
        PatientName: this.selectedPatient?.name || '',
        Email: val.email || '',
        DrugName: val.drugname || null,
        Description: val.description || null,
        DateOccurred: dateOccurred,
        AISeveritySuggestion: val.aiSeveritySuggestion || null
      };
    });

    this.http.post(`${DeployUrl.URL}api/ADR/save`, payload).subscribe({
      next: res => {

        this.patientselect(this.selectedPatient.patientId);
      },
      error: err => {
        console.error('Save failed', err);
        // show error message
      }
    });
  }


  resetForm() {
    this.adrForm = this.fb.group({
      reactions: this.fb.array([])
    });
    this.reactions.clear();
     if (this.selectedPatient) {
      this.selectedPatient = null;
          this.searchPatientControl.setValue('');
      this.searchPatientControl.markAsPristine();
      this.searchPatientControl.markAsUntouched();
  } else {
    // fallback blank row if no patient is selected
    this.addReaction();
  }
         this.searchPatientControl.setValue('');
      this.searchPatientControl.markAsPristine();
      this.searchPatientControl.markAsUntouched();
  }

  trackByIndex(index: number): number {
    return index;
  }

  // =========================
  // Drug autocomplete helpers
  // =========================
  private loadDrugMaster() {
    this.Http.Post('Drug/DrugMaster', { Mode: 'GET' }).subscribe({
      next: (res: any) => {
        this.drugList = res?.success && Array.isArray(res.result) ? res.result : [];
        // refresh existing rows' autocomplete
        for (let i = 0; i < this.reactions.length; i++) {
          this.ensureFilteredDrugsSize(i);
          this.setupAutocomplete(i);
        }
      },
      error: () => {
        this.drugList = [];
      }
    });
  }

  private ensureFilteredDrugsSize(index: number) {
    while (this.filteredDrugs.length <= index) {
      this.filteredDrugs.push(of(this.drugList.slice(0, 10)));
    }
  }

  private setupAutocomplete(index: number) {
    const reactionControl = this.reactions.at(index) as FormGroup;
    if (!reactionControl) return;

    const drugCtrl = reactionControl.get('drugname') as FormControl;
    if (!drugCtrl) return;

    this.filteredDrugs[index] = drugCtrl.valueChanges.pipe(
      startWith((drugCtrl.value as string) || ''),
      debounceTime(150),
      distinctUntilChanged(),
      map((value: string) => this.filterDrugs(typeof value === 'string' ? value : ''))
    );
  }

  private filterDrugs(value: string): any[] {
    if (!this.drugList?.length) return [];
    if (!value || value.trim() === '') return this.drugList.slice(0, 10);
    const fv = value.toLowerCase();
    return this.drugList.filter((drug: any) =>
      (drug.drugName || '').toLowerCase().includes(fv) ||
      (drug.genericName || '').toLowerCase().includes(fv)
    ).slice(0, 10);
  }

  displayDrugName = (drugName: string): string => drugName || '';

  onDrugSelected(drugName: string, index: number) {
    const reactionControl = this.reactions.at(index) as FormGroup;
    if (!reactionControl) return;
    reactionControl.get('drugname')?.setValue(drugName);
  }

  // =========================
  // Reports modal handlers
  // =========================
  openReports() {
    this.showReports = true;
    // reset previous state
    this.reportResults = [];
    this.reportsDrugControl.setValue('');
  }

  closeReports() {
    this.showReports = false;
  }

  // Open reports prefilled for a given drug (used from drug autocomplete field)
  openReportsForDrug(drugName: string | null | undefined) {
    const name = (drugName || '').toString().trim();
    if (!name) { return; }
    this.showReports = true;
    this.reportResults = [];
    this.reportsDrugControl.setValue(name);
    this.loadAdrByDrug(name);
  }

  selectReportDrug(drugName: string) {
    this.reportsDrugControl.setValue(drugName);
    this.loadAdrByDrug(drugName);
  }

  private loadAdrByDrug(drugName: string) {
    if (!drugName || !drugName.trim()) return;
    const payload = { drugName: drugName.trim() };
    this.Http.Post('api/ADR/getByDrug', payload).subscribe({
      next: (res: any) => {
        // Expecting array of ADR entries with patient info
        this.reportResults = Array.isArray(res) ? res : (res?.data || res?.result || []);
      },
      error: (err) => {
        console.error('Failed to load ADR by drug', err);
        this.reportResults = [];
      }
    });
  }
}
