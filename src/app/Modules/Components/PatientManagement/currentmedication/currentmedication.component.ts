import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Observable, of, startWith, map, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';

import { DrugMonographComponent } from "../../Medicine/drug-monograph/drug-monograph.component";
import { AllergyComponent } from "../allergy/allergy.component";
import { AiInteractionCheckerComponent } from '../../Medicine/ai-interaction-checker/ai-interaction-checker.component';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { MedicationDto } from '../../../Interface/PatientFile';

@Component({
  selector: 'app-currentmedication',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatInputModule, MatSelectModule, MatFormFieldModule,
    MatAutocompleteModule, MatOptionModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule,
    AllergyComponent, AiInteractionCheckerComponent, DrugMonographComponent
  ],
  templateUrl: './currentmedication.component.html',
  styleUrls: ['./currentmedication.component.scss','../../../Shared/styles/table-template.scss']
})
export class CurrentmedicationComponent implements OnInit {


  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
  private cdr = inject(ChangeDetectorRef);

  medicationForm: FormGroup;
  drugList: any[] = [];
  // filteredDrugs is an array of Observables — one per row
  filteredDrugs: Observable<any[]>[] = [];

  isLoading = false;
  originalValues: Map<number, any> = new Map();

  // Follow-up overlay properties
  showFollowUp = false;
  followUpDate: Date | null = null;
  followUpNotes = '';
  emailReminder = true;
  reminderDaysBefore = true;
  
  // Upcoming follow-up notification
  nextFollowUp: any = null;
  showFollowUpNotification = false;

  // AI Interaction Checker properties
  showAiChecker = false;
  pendingMedicationIndex = -1;
  @ViewChild(AiInteractionCheckerComponent) aiCheckerComponent!: AiInteractionCheckerComponent;
  @ViewChild(DrugMonographComponent) drugMonographComponent!: DrugMonographComponent;
  
  // Drug Monograph properties
  showDrugMonograph = false;

  // OCR Upload properties
  showOcrValidation = false;
  ocrExtractedData: any = null;
  ocrValidationMessage = '';
  selectedFile: File | null = null;

  patientDetails = computed(() => this.sharedService.patientDetails());
  patientglobal = computed(() => this.sharedService.patient());

  userinfo = computed(() => this.sharedService.userInfo());

  frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Every other day', value: 'every_other_day' },
    { label: 'Twice a day (BID)', value: 'bid' },
    { label: 'Three times a day (TID)', value: 'tid' },
    { label: 'Four times a day (QID)', value: 'qid' },
    { label: 'At bedtime (QHS)', value: 'qhs' },
    { label: 'Every 4 hours (Q4h)', value: 'q4h' },
    { label: 'Every 6 hours (Q6h)', value: 'q6h' },
    { label: 'Every 8 hours (Q8h)', value: 'q8h' },
    { label: 'Every 12 hours (Q12h)', value: 'q12h' },
    { label: 'As needed (PRN)', value: 'prn' }
  ];

  constructor() {
    this.medicationForm = this.fb.group({
      medications: this.fb.array([])
    });
  }

  // Compute end date based on startDate + duration
  private computeEndDate(startDate: Date | string | null, durationValue?: number | null, durationUnit?: string | null): Date | null {
    if (!startDate || !durationValue || !durationUnit) return null;
    const base = new Date(startDate);
    if (isNaN(base.getTime())) return null;
    const d = new Date(base);
    switch ((durationUnit || '').toLowerCase()) {
      case 'days': d.setDate(d.getDate() + durationValue); break;
      case 'weeks': d.setDate(d.getDate() + durationValue * 7); break;
      case 'months': d.setMonth(d.getMonth() + durationValue); break;
      default: return null;
    }
    // Normalize to end of day
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private daysUntil(date: Date | null): number | null {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  ngOnInit(): void {
    this.loadDrugsAndMedications();
    this.loadNextFollowUp();
  }

  get medicationsArray(): FormArray {
    return this.medicationForm.get('medications') as FormArray;
  }

  // helper to get raw controls
  get getFormControls(): FormArray {
    return this.medicationsArray;
  }

  // display label for frequency
  getFrequencyLabel(value: string): string {
    const match = this.frequencyOptions.find(f => f.value === value);
    return match ? match.label : value;
  }

  // load drug master first, then medications
  loadDrugsAndMedications() {
    this.commonService.Post('Drug/DrugMaster', { Mode: 'GET' }).subscribe({
      next: (res: any) => {
        this.drugList = res?.success && Array.isArray(res.result) ? res.result : [];
        this.loadMedications();
      },
      error: () => {
        this.drugList = [];
        this.loadMedications();
      }
    });
  }

  // Create a new FormGroup for a medication row
  private createMedicationFormGroup(data?: any): FormGroup {
    const isNew = !data;

    const group = this.fb.group({
      id: [data?.id ?? null],
      medname: [data?.medname ?? '', Validators.required],
      dosage: [data?.dosage ?? ''],
      frequency: [data?.frequency ?? null, Validators.required],
      startDate: [data?.startDate ?? null, Validators.required],
      // Duration fields (optional): e.g., 7 days, 2 weeks, 3 months
      durationValue: [data?.durationValue ?? null],
      durationUnit: [data?.durationUnit ?? 'days'],
      ongoing: [data?.ongoing ?? false],
      isNew: [isNew],
      isEdited: [false],
      isDeleted: [false],
      isEditable: [isNew]
    });

    if (!isNew) {
      this.disableRow(group); // ensure existing rows start readonly
    }

    return group;
  }
 


  // Add a new, empty medication row at top
addMedication() {
  const hasIncompleteNew = this.medicationsArray.controls.some(ctrl => {
    const fg = ctrl as FormGroup;
    return fg.get('isNew')?.value && !fg.get('medname')?.value?.trim();
  });
  
  if (hasIncompleteNew) {
    this.sharedService.Messages('warning', 'Incomplete Entry', 'Complete current entry first.', 3000);
    return;
  }

  this.cancelAllEdits();

  const newMedication = this.createMedicationFormGroup();
  this.enableRow(newMedication);

  // ✅ insert at end of FormArray so new rows appear at bottom
  this.medicationsArray.push(newMedication); 
  const newIndex = this.medicationsArray.length - 1;

  // ✅ add to filteredDrugs to match array length
  this.filteredDrugs.push(of(this.drugList.slice(0, 10)));
  this.setupAutocomplete(newIndex);

  this.cdr.markForCheck();
  
  // Scroll to the new row after view update
  setTimeout(() => {
    this.scrollToNewRow(newIndex);
  }, 100);
}


medarray:any
  private setupAutocomplete(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    const mednameControl = medicationControl.get('medname') as FormControl;
    if (!mednameControl) return;

    // ensure filteredDrugs length is enough
    while (this.filteredDrugs.length <= index) {
      this.filteredDrugs.push(of([]));
    }

    // Build observable: startWith current value so dropdown shows initial suggestions
    this.filteredDrugs[index] = mednameControl.valueChanges.pipe(
      startWith(mednameControl.value || ''),
      debounceTime(150),
      distinctUntilChanged(),
      map(value => {
        const searchValue = typeof value === 'string' ? value : (value?.toString() || '');
        return this.filterDrugs(searchValue);
      })
    );
  }

  // Safe display function: medname is string; kept simple
  displayFn = (drugName: string): string => drugName || '';

  // When user selects an option, fill related fields
  onDrugSelected(drugName: string, index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    const selectedDrug = this.drugList.find(d => d.drugName === drugName);
    if (selectedDrug) {
      medicationControl.get('medname')?.setValue(drugName);
      // only set dosage if empty (user may override)
      if (selectedDrug.dosageForm && !medicationControl.get('dosage')?.value) {
        medicationControl.get('dosage')?.setValue(selectedDrug.dosageForm);
      }
      if (!medicationControl.get('isNew')?.value) {
        medicationControl.get('isEdited')?.setValue(true);
      }
    }
  }

  // Load medications for the selected patient
  loadMedications() {
    this.isLoading = true;
    this.medicationsArray.clear();
    this.filteredDrugs = [];
    this.originalValues.clear();

    const details = this.patientDetails();
    const ptDetails = this.patientglobal();
    const patientId = details?.patientID ?? ptDetails?.patientId;

    if (!patientId) {
      this.sharedService.Messages('error', 'Patient Error', 'No patient selected.', 3000);
      this.isLoading = false;
      return;
    }

    const payload = { Mode: 'GET', PatientId: patientId };
    this.medarray = [];
    this.commonService.Post("CurrentMedication/currentmedication/", payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success && Array.isArray(res.result)) {
          res.result.forEach((med: any, index: number) => {
            const group = this.createMedicationFormGroup(med);
            this.medarray = res.result
            this.medicationsArray.push(group);
            // maintain filteredDrugs entry for each row
            this.filteredDrugs.push(of(this.drugList.slice(0, 10)));
            // setup autocomplete for this index
            this.setupAutocomplete(index);
            // store original for cancel
            this.originalValues.set(index, { ...group.getRawValue() });
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load medications', err);
        this.sharedService.Messages('error', 'Load Failed', 'Failed to load medications. Please refresh.', 3000);
      }
    });
  }

  // Edit: enable controls and save original
  editMedication(index: number) {
    // Cancel other edits
    this.cancelAllEdits();

    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    // store original snapshot
    this.originalValues.set(index, { ...medicationControl.getRawValue() });

    medicationControl.patchValue({ isEditable: true });
    ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => medicationControl.get(f)?.enable());
    this.setupAutocomplete(index); // ensure autocomplete active
    this.cdr.detectChanges();
  }

  saveMedication(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    if (medicationControl.invalid) {
      medicationControl.markAllAsTouched();
      this.sharedService.Messages('error', 'Validation Error', 'Please fill all required fields.', 3000);
      return;
    }

    // Check if this is a new medication
    const isNewMedication = medicationControl.get('isNew')?.value;
    
    if (isNewMedication) {
      // For new medications, show AI interaction confirmation popup
      this.showUpdateConfirmationPopup(index);
    } else {
      // For existing medications, save directly
      this.completeMedicationSave(index);
    }
  }

  showUpdateConfirmationPopup(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    const medicationName = medicationControl?.get('medname')?.value || 'medication';
    
    // Create custom styled popup
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.3s ease-out;
    `;
    
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      max-width: 480px;
      width: 90%;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    popup.innerHTML = `
      <div style="background: linear-gradient(135deg, #26a69a, #00695c); color: white; padding: 24px; text-align: center;">
        <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
          🤖
        </div>
        <h3 style="margin: 0; font-size: 20px; font-weight: 600;">AI Drug Interaction Analysis</h3>
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333; text-align: center;">
          Do you want to run AI analysis for <strong style="color: #26a69a;">${medicationName}</strong>?
        </p>
        <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
          This will check for potential interactions with other medications.
        </p>
      </div>
      
      <div style="padding: 0 24px 24px 24px; display: flex; gap: 12px;">
        <button id="skipBtn" style="
          flex: 1;
          padding: 14px 20px;
          border: 2px solid #e0e0e0;
          background: white;
          color: #666;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Skip Analysis</button>
        
        <button id="runBtn" style="
          flex: 1;
          padding: 14px 20px;
          border: none;
          background: linear-gradient(135deg, #26a69a, #00695c);
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(38, 166, 154, 0.3);
        ">Run AI Analysis</button>
      </div>
    `;
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const skipBtn = popup.querySelector('#skipBtn') as HTMLButtonElement;
    const runBtn = popup.querySelector('#runBtn') as HTMLButtonElement;
    
    skipBtn.addEventListener('mouseenter', () => {
      skipBtn.style.borderColor = '#26a69a';
      skipBtn.style.color = '#26a69a';
      skipBtn.style.transform = 'translateY(-1px)';
    });
    
    skipBtn.addEventListener('mouseleave', () => {
      skipBtn.style.borderColor = '#e0e0e0';
      skipBtn.style.color = '#666';
      skipBtn.style.transform = 'translateY(0)';
    });
    
    runBtn.addEventListener('mouseenter', () => {
      runBtn.style.background = 'linear-gradient(135deg, #00695c, #004d40)';
      runBtn.style.transform = 'translateY(-2px)';
      runBtn.style.boxShadow = '0 6px 20px rgba(38, 166, 154, 0.4)';
    });
    
    runBtn.addEventListener('mouseleave', () => {
      runBtn.style.background = 'linear-gradient(135deg, #26a69a, #00695c)';
      runBtn.style.transform = 'translateY(0)';
      runBtn.style.boxShadow = '0 4px 12px rgba(38, 166, 154, 0.3)';
    });
    
    // Handle button clicks
    skipBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
      this.completeMedicationSave(index);
    });
    
    runBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
      this.pendingMedicationIndex = index;
      this.checkDrugInteractions(index);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
        this.completeMedicationSave(index);
      }
    });
  }

  checkDrugInteractions(medicationIndex: number) {
    const medicationControl = this.medicationsArray.at(medicationIndex) as FormGroup;
    if (!medicationControl) return;

    const newMedication = medicationControl.get('medname')?.value;
    const existingMedications = this.medicationsArray.controls
      .filter((ctrl, idx) => idx !== medicationIndex && !ctrl.get('isDeleted')?.value)
      .map(ctrl => ctrl.get('medname')?.value)
      .filter(name => name && name.trim());

    if (existingMedications.length === 0) {
      // No existing medications to check against
      this.completeMedicationSave(medicationIndex);
      return;
    }else {
     this.completeMedicationSave(medicationIndex);
    }

    // Show AI interaction checker with current medication context
    this.pendingMedicationIndex = medicationIndex;
    this.showAiChecker = true;
    
  }

  completeMedicationSave(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    const wasNew = medicationControl.get('isNew')?.value;
    medicationControl.patchValue({
      isEditable: false,
      isNew: wasNew,
      isEdited: !wasNew
    });
    // disable controls after save
    ['medname', 'dosage', 'frequency', 'startDate', 'ongoing'].forEach(f => medicationControl.get(f)?.disable());
    this.originalValues.delete(index);

    this.medicationForm.updateValueAndValidity();
    this.cdr.detectChanges();

    this.saveAllMedications()
  }

  onAiCheckComplete() {
    this.showAiChecker = false;
    if (this.pendingMedicationIndex >= 0) {
      // Show final confirmation popup to add medication to current medications
      this.showFinalSaveConfirmationPopup(this.pendingMedicationIndex);
    } else {
      // Reload current medication form with same patient
      this.reloadCurrentMedicationForm();
    }
  }

  showFinalSaveConfirmationPopup(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    const medicationName = medicationControl?.get('medname')?.value || 'medication';
    
    // Create final confirmation popup
    const popup = document.createElement('div');
    popup.className = 'confirmation-popup-overlay';
    popup.innerHTML = `
      <div class="confirmation-popup">
        <div class="popup-header">
          <h3>Add to Current Medications</h3>
        </div>
        <div class="popup-content">
          <p>AI interaction analysis completed for <strong>${medicationName}</strong>.</p>
          <p class="popup-subtitle">Do you want to add this medication to current medications?</p>
        </div>
        <div class="popup-actions">
          <button class="popup-btn cancel-btn" id="dontAdd">Don't Add</button>
          <button class="popup-btn confirm-btn" id="addMedication">Add Medication</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Handle button clicks
    const dontAddBtn = popup.querySelector('#dontAdd') as HTMLButtonElement;
    const addBtn = popup.querySelector('#addMedication') as HTMLButtonElement;

    dontAddBtn?.addEventListener('click', () => {
      document.body.removeChild(popup);
      // Remove the medication without saving
      if (medicationControl?.get('isNew')?.value) {
        this.medicationsArray.removeAt(index);
        if (this.filteredDrugs.length > index) {
          this.filteredDrugs.splice(index, 1);
        }
      }
      this.pendingMedicationIndex = -1;
      this.reloadCurrentMedicationForm();
    });

    addBtn?.addEventListener('click', () => {
      document.body.removeChild(popup);
      this.completeMedicationSave(index);
      this.pendingMedicationIndex = -1;
      this.reloadCurrentMedicationForm();
    });

    // Close on overlay click - default to don't add
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        document.body.removeChild(popup);
        if (medicationControl?.get('isNew')?.value) {
          this.medicationsArray.removeAt(index);
          if (this.filteredDrugs.length > index) {
            this.filteredDrugs.splice(index, 1);
          }
        }
        this.pendingMedicationIndex = -1;
        this.reloadCurrentMedicationForm();
      }
    });
  }

  onAiCheckCancel() {
    this.showAiChecker = false;
    
    // Cancel any ongoing analysis and stop spinner
    if (this.aiCheckerComponent) {
      this.aiCheckerComponent.cancelAnalysis();
    }
    
    if (this.pendingMedicationIndex >= 0) {
      // Remove the pending medication if user cancels
      const medicationControl = this.medicationsArray.at(this.pendingMedicationIndex) as FormGroup;
      if (medicationControl?.get('isNew')?.value) {
        this.medicationsArray.removeAt(this.pendingMedicationIndex);
        if (this.filteredDrugs.length > this.pendingMedicationIndex) {
          this.filteredDrugs.splice(this.pendingMedicationIndex, 1);
        }
        this.reindexOriginalValuesAfterDelete(this.pendingMedicationIndex);
      }
      this.pendingMedicationIndex = -1;
    }
    // Reload current medication form with same patient
    this.reloadCurrentMedicationForm();
  }

  reloadCurrentMedicationForm() {
    // Get current patient from shared service
    const currentPatient = this.sharedService.getPatient();
    if (currentPatient && currentPatient.patientId) {
      // Clear current medications array
      this.medicationsArray.clear();
      this.filteredDrugs = [];
      this.originalValues.clear();
      
      // Reload medications for the same patient
      this.loadMedications();
      
      // Show success message
      this.sharedService.Messages('success', 'Medications Reloaded', 
        `Medication list refreshed for ${currentPatient.name || 'current patient'}`, 3000);
    } else {
      // If no patient selected, just clear the form
      this.resetForm();
      this.sharedService.Messages('info', 'Form Reset', 'Medication form has been reset', 2000);
    }
  }

  // Open drug monograph for selected medication
  openDrugMonograph(medicationName: string) {
    if (!medicationName) return;
    
    // Store the selected drug name in shared service for the monograph component
    this.sharedService.setSelectedDrug(medicationName);
    
    // Navigate to drug monograph or open in modal
    this.showDrugMonograph = true;
  }

  closeDrugMonograph() {
    // Cancel any ongoing API calls in the drug monograph component
    if (this.drugMonographComponent) {
      this.drugMonographComponent.cancelCurrentSearch();
    }
    this.showDrugMonograph = false;
  }

  // OCR Upload Methods
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.processOCRFile(file);
    }
  }

  processOCRFile(file: File) {
    this.isLoading = true;
    
    // Simulate OCR processing - replace with actual OCR service
    setTimeout(() => {
      // Mock OCR extracted data
      this.ocrExtractedData = {
        patientName: 'John Doe',
        patientId: 'P12345',
        email: 'john.doe@email.com',
        medications: [
          { name: 'Aspirin', dosage: '100mg', frequency: 'Daily' },
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
        ]
      };
      
      this.validatePatientDetails();
      this.isLoading = false;
    }, 2000);
  }

  validatePatientDetails() {
    const currentPatient = this.patientDetails() || this.patientglobal();
    
    if (!currentPatient) {
      this.ocrValidationMessage = 'No patient selected. Please select a patient first.';
      this.showOcrValidation = true;
      return;
    }

    const extractedName = this.ocrExtractedData.patientName?.toLowerCase();
    const extractedId = this.ocrExtractedData.patientId?.toLowerCase();
    const extractedEmail = this.ocrExtractedData.email?.toLowerCase();

    const currentName = (currentPatient.patientName || currentPatient.name)?.toLowerCase();
    const currentId = (currentPatient.patientID || currentPatient.patientId)?.toLowerCase();
    const currentEmail = currentPatient.email?.toLowerCase();

    let isValid = false;
    let validationDetails = [];

    // Check name match
    if (extractedName && currentName && extractedName.includes(currentName.split(' ')[0])) {
      isValid = true;
      validationDetails.push('✓ Name matches');
    } else if (extractedName && currentName) {
      validationDetails.push('✗ Name mismatch');
    }

    // Check ID match
    if (extractedId && currentId && extractedId === currentId) {
      isValid = true;
      validationDetails.push('✓ Patient ID matches');
    } else if (extractedId && currentId) {
      validationDetails.push('✗ Patient ID mismatch');
    }

    // Check email match
    if (extractedEmail && currentEmail && extractedEmail === currentEmail) {
      isValid = true;
      validationDetails.push('✓ Email matches');
    } else if (extractedEmail && currentEmail) {
      validationDetails.push('✗ Email mismatch');
    }

    if (isValid) {
      this.ocrValidationMessage = `Patient validation successful!\n${validationDetails.join('\n')}\n\nFound ${this.ocrExtractedData.medications?.length || 0} medications to add.`;
    } else {
      this.ocrValidationMessage = `Patient validation failed!\n${validationDetails.join('\n')}\n\nPlease verify the document belongs to the selected patient.`;
    }

    this.showOcrValidation = true;
  }

  confirmOcrUpload() {
    if (!this.ocrExtractedData?.medications?.length) {
      this.sharedService.Messages('warning', 'No Medications', 'No medications found in the uploaded document', 3000);
      this.closeOcrValidation();
      return;
    }

    // Add medications from OCR
    this.ocrExtractedData.medications.forEach((med: any) => {
      this.addMedication();
      const lastIndex = this.medicationsArray.length - 1;
      const medicationControl = this.medicationsArray.at(lastIndex) as FormGroup;
      
      if (medicationControl) {
        medicationControl.patchValue({
          medname: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: 'Added via OCR upload',
          startDate: new Date(),
          ongoing: true
        });
      }
    });

    this.sharedService.Messages('success', 'OCR Upload', `Added ${this.ocrExtractedData.medications.length} medications from OCR`, 3000);
    this.closeOcrValidation();
  }

  closeOcrValidation() {
    this.showOcrValidation = false;
    this.ocrExtractedData = null;
    this.ocrValidationMessage = '';
    this.selectedFile = null;
  }

  cancelEdit(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    if (medicationControl.get('isNew')?.value) {
      // Remove the new row
      this.medicationsArray.removeAt(index);
      if (this.filteredDrugs.length > index) this.filteredDrugs.splice(index, 1);
      // adjust originalValues mapping
      this.reindexOriginalValuesAfterDelete(index);
    } else {
      const originalValue = this.originalValues.get(index);
      if (originalValue) {
        medicationControl.patchValue(originalValue);
        this.originalValues.delete(index);
      }
      medicationControl.patchValue({ isEditable: false });
      // ensure controls disabled
      ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => medicationControl.get(f)?.disable());
    }

    this.medicationForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // Save all modified and deleted items to server
  saveAllMedications(): void {
    if (this.isLoading) return;
    const medsArray = this.medicationsArray;
    let hasInvalid = false;

    medsArray.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      // only validate rows that are not marked for deletion
      if (!formGroup.get('isDeleted')?.value && formGroup.enabled) {
        if (formGroup.invalid) {
          hasInvalid = true;
          formGroup.markAllAsTouched();
        }
      }
    });

    if (hasInvalid) {
      this.sharedService.Messages('error', 'Validation Error', 'Please fix validation errors before saving.', 3000);
      return;
    }

    const details = this.patientDetails();
    const ptDetails = this.patientglobal();
    const patientId = details?.patientID ?? ptDetails?.patientId;
    const userEmail = details?.email ?? ptDetails?.email ?? 'system';

    if (!patientId) {
      this.sharedService.Messages('error', 'Patient Error', 'No patient selected.', 3000);
      return;
    }

    const rows = medsArray.controls.map((ctrl) => (ctrl as FormGroup).getRawValue());

    const toSave = rows.filter((m: any) => (m.isNew || m.isEdited) && !m.isDeleted);
    const toDelete = rows.filter((m: any) => m.isDeleted && m.id);

    if (toSave.length === 0 && toDelete.length === 0) {
      this.sharedService.Messages('info', 'No Changes', 'No changes to save.', 3000);
      return;
    }

    this.isLoading = true;

    const requests: Observable<any>[] = [];

    if (toSave.length > 0) {
      const savePayload = {
        mode: 'SAVE',
        patientId: patientId,
        PatientEmail: details?.email ?? ptDetails?.email ?? 'system',
        medicationList: toSave.map((m: MedicationDto) => ({
          id: m.id ?? null,
          patientId: patientId,
          medname: m.medname,
          dosage: m.dosage || '',
          frequency: m.frequency,
          startDate: m.startDate,
          DurationValue: (m as any).durationValue ?? null,
          DurationUnit: (m as any).durationUnit ?? null,
          ongoing: m.ongoing || false,
          EndDate: this.computeEndDate(m.startDate as any, (m as any).durationValue ?? null, (m as any).durationUnit ?? null)?.toISOString() ?? null,
          lastEditedBy: userEmail
        }))
      };
      requests.push(this.commonService.Post("CurrentMedication/currentmedication/", savePayload));
      console.log('Save Payload', savePayload);
    }

    if (toDelete.length > 0) {
      const deletePayload = {
        mode: 'DELETE',
        patientId: patientId,
        medicationList: toDelete.map((m: any) => ({
          id: m.id,
          patientId: patientId,
          medname: m.medname,
          dosage: m.dosage || '',
          frequency: m.frequency,
          startDate: m.startDate,
          ongoing: m.ongoing || false,
          lastEditedBy: userEmail,
          Deleted: true
        }))
      };
      requests.push(this.commonService.Post("CurrentMedication/currentmedication/", deletePayload));
      console.log('Delete Payload', deletePayload);
    }

    // Run all requests in parallel
    forkJoin(requests).subscribe({
      next: (responses) => {
        this.isLoading = false;
        // If API returns an array of responses, check success
        const allSuccessful = responses.every((r: any) => r?.success !== false);
        if (allSuccessful) {
          this.sharedService.Messages('success', 'Current Medication', 'Saved Successfully', 3000);
          // After saving, schedule alerts for meds ending in <= 2 days
          this.scheduleEndAlerts(patientId);
          this.loadMedications();
        } else {
          console.error('Some operations failed', responses);
          this.sharedService.Messages('error', 'Partial Save Failed', 'Some operations failed. Please check and try again.', 5000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Save failed', err);
        const errMsg = err?.error?.message || err?.message || 'Failed to save medications. Please try again.';
        this.sharedService.Messages('error', 'Save Failed', errMsg, 5000);
      }
    });
  }

  // Call backend to schedule alert emails for meds ending within next 2 days
  private scheduleEndAlerts(patientId: string) {
    const meds = this.medicationsArray.controls
      .map(ctrl => (ctrl as FormGroup).getRawValue())
      .filter((m: any) => !m.isDeleted && !m.ongoing && m.startDate && m.durationValue && m.durationUnit);

    const items = meds.map((m: any) => {
      const end = this.computeEndDate(m.startDate, m.durationValue, m.durationUnit);
      const days = this.daysUntil(end);
      return {
        id: m.id ?? null,
        medname: m.medname,
        startDate: m.startDate,
        durationValue: m.durationValue,
        durationUnit: m.durationUnit,
        endDate: end ? end.toISOString() : null,
        daysUntilEnd: days
      };
    }).filter(x => x.endDate && x.daysUntilEnd !== null && x.daysUntilEnd <= 2 && x.daysUntilEnd >= 0);

    if (items.length === 0) return;

    const payload = { patientId, items };
    this.commonService.Post('currentmed/schedule-end-alerts', payload).subscribe({
      next: (res: any) => {
        if (res?.success !== false) {
          console.log('Scheduled medication end alerts:', items.length);
        }
      },
      error: (err) => {
        console.error('Failed to schedule end alerts', err);
      }
    });
  }

  // Delete row from UI: new rows removed, existing rows marked deleted
  deleteMedication(index: number) {
    const medicationControl = this.medicationsArray.at(index) as FormGroup;
    if (!medicationControl) return;

    if (medicationControl.get('isNew')?.value) {
      // remove completely
      this.medicationsArray.removeAt(index);
      if (this.filteredDrugs.length > index) this.filteredDrugs.splice(index, 1);
      this.reindexOriginalValuesAfterDelete(index);
    } else {
      // mark existing as deleted (will be sent on save)
      medicationControl.patchValue({
        isDeleted: true,
        isEditable: false
      });
      // disable controls visually
      ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => medicationControl.get(f)?.disable());
      this.originalValues.delete(index);
    }

    this.medicationForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // enable/disable helpers
  enableRow(row: FormGroup) {
    ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => {
      const control = row.get(f);
      if (control) control.enable();
    });
  }

  disableRow(row: FormGroup) {
    ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => row.get(f)?.disable());
  }

  enableMedicationRow(row: FormGroup) { this.enableRow(row); }
  disableMedicationRow(row: FormGroup) { this.disableRow(row); }

  // simpler trackBy
  trackByFn(index: number): number { return index; }

  // Enhanced scroll to newly added row with animation
  private scrollToNewRow(index: number) {
    const tableContainer = document.querySelector('.tablefix');
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

  private cancelAllEdits() {
    this.medicationsArray.controls.forEach((ctrl, index) => {
      const formGroup = ctrl as FormGroup;
      if (formGroup.get('isEditable')?.value) {
        // restore original snapshot if exists
        const originalValue = this.originalValues.get(index);
        if (originalValue) {
          formGroup.patchValue(originalValue);
          this.originalValues.delete(index);
        }
        formGroup.patchValue({ isEditable: false });
        ['medname', 'dosage', 'frequency', 'startDate', 'durationValue', 'durationUnit', 'ongoing'].forEach(f => formGroup.get(f)?.disable());
      }
    });
    this.cdr.detectChanges();
  }

  // reindex map after deletion
  private reindexOriginalValuesAfterDelete(deletedIndex: number) {
    const newMap = new Map<number, any>();
    Array.from(this.originalValues.entries()).forEach(([idx, val]) => {
      if (idx < deletedIndex) newMap.set(idx, val);
      else if (idx > deletedIndex) newMap.set(idx - 1, val);
    });
    this.originalValues = newMap;
  }

  allMedicationsDeleted(): boolean {
    if (this.medicationsArray.length === 0) return true;
    return this.medicationsArray.controls.every((ctrl) => (ctrl as FormGroup).get('isDeleted')?.value === true);
  }

  // hasChanges: true if any new/edited OR any deleted
  hasChanges(): boolean {
    const anyModified = this.medicationsArray.controls.some((ctrl) => {
      const g = ctrl as FormGroup;
      return (g.get('isNew')?.value === true) || (g.get('isEdited')?.value === true);
    });
    const anyDeleted = this.medicationsArray.controls.some((ctrl) => (ctrl as FormGroup).get('isDeleted')?.value === true);
    const result = anyModified || anyDeleted;
    // debug
    // console.log('hasChanges -> modified:', anyModified, 'deleted:', anyDeleted);
    return result;
  }

  resetForm() {
    this.loadMedications();
  }

  cancel() {
    this.loadMedications();
  }

  // helper used by template to show human-readable drug name when value is id or string
  getDrugNameById = (id: number | string): string => {
    if (id === null || id === undefined) return '';
    const drug = this.drugList.find(d => d.id == id);
    return drug ? drug.drugName : (typeof id === 'string' ? id : '');
  };

  private filterDrugs(value: string): any[] {
    if (!this.drugList?.length) return [];
    if (!value || value.trim() === '') return this.drugList.slice(0, 10);
    const fv = value.toLowerCase();
    return this.drugList.filter(drug =>
      (drug.drugName || '').toLowerCase().includes(fv) ||
      (drug.genericName || '').toLowerCase().includes(fv)
    ).slice(0, 10);
  }

  // Print patient details and medications
  printMedications(): void {
    const patientDetails = this.patientDetails();
    const patientGlobal = this.patientglobal();
    const patient = patientDetails || patientGlobal;

    if (!patient) {
      this.sharedService.Messages('warning', 'Print', 'No patient details available', 3000);
      return;
    }

    const printContent = this.generatePatientAndMedicationsPrintContent(patient);
    this.openPrintWindow(printContent);
  }

  private generatePatientAndMedicationsPrintContent(patient: any): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Medication Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .patient-info { margin-bottom: 20px; background: #f5f5f5; padding: 20px; border-radius: 8px; }
          .patient-info h3 { margin-top: 0; color: #333; font-size: 18px; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #ddd; }
          .info-label { font-weight: bold; color: #555; }
          .info-value { color: #333; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Patient Medication Report</h1>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="patient-info">
          <h3>Patient Information</h3>
          <div class="info-row">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${patient?.patientID || patient?.patientId || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${patient?.patientName || patient?.name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Age:</span>
            <span class="info-value">${patient?.age || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patient?.gender || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${patient?.email || 'N/A'}</span>
          </div>
      
        </div>

        ${this.generateMedicationsTable()}

        <div class="footer">
          <p>This report was generated from the Electronic Medical Records (EMR) System</p>
          <p>For medical inquiries, please contact Rxsmart healthcare provider</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateMedicationsTable(): string {
    const medications = this.medicationsArray.controls;
    
    if (!medications.length) {
      return `
        <div class="medications-section">
          <h3>Current Medications</h3>
          <p style="text-align: center; color: #666; font-style: italic;">No medications currently prescribed</p>
        </div>
      `;
    }

    let tableRows = '';
  medications.forEach((med, index) => {
  const medValue = med.getRawValue(); // ✅ includes disabled fields

  tableRows += `
    <tr>
      <td>${index + 1}</td>
      <td>${medValue.medname || 'N/A'}</td>
      <td>${medValue.dosage || 'N/A'}</td>
      <td>${medValue.frequency || 'N/A'}</td>
      <td>${medValue.ongoing ? 'Yes' : 'No'}</td>
      <td>${medValue.durationValue ?? 'N/A'}</td>
      <td>${medValue.durationUnit || 'N/A'}</td>

      <td>${medValue.startDate ? new Date(medValue.startDate).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `;
});


    return `
      <div class="medications-section" style="margin-top: 30px;">
        <h3 style="color: #333; border-bottom: 2px solid #00796b; padding-bottom: 10px;">Current Medications</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #00796b; color: white;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">#</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Medicine Name</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Dosage</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Frequency</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Ongoing</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Duration Value</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Duration Unit</th>


              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Start Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private openPrintWindow(content: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  // Follow-up overlay methods
  showFollowUpOverlay(): void {
    this.showFollowUp = true;
    this.followUpDate = null;
    this.followUpNotes = '';
    this.emailReminder = true;
    this.reminderDaysBefore = true;
  }

  hideFollowUpOverlay(): void {
    this.showFollowUp = false;
  }

  saveFollowUp(): void {
    if (!this.followUpDate) {
      this.sharedService.Messages('warning', 'Follow-up', 'Please select a follow-up date', 3000);
      return;
    }
    const userInfo = this.userinfo();
    const patientDetails = this.patientDetails();
    const patientGlobal = this.patientglobal();
    const patient = patientDetails || patientGlobal;

    if (!patient) {
      this.sharedService.Messages('error', 'Follow-up', 'Patient details not available', 3000);
      return;
    }

    const followUpData = {
      patientId: patient.patientID?.toString() || patient.patientId?.toString(),
      followUpDate: this.followUpDate,
      notes: this.followUpNotes,
      emailReminder: this.emailReminder,
      reminderDaysBefore: this.reminderDaysBefore ? 2 : 0,
      createdBy: userInfo.name  || 'SYSTEM',
      createdDate: new Date()
    };

    // Save follow-up reminder
    this.commonService.Post("api/PatientManagement/FollowUp", followUpData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sharedService.Messages('success', 'Follow-up', 'Follow-up reminder set successfully', 3000);
          this.hideFollowUpOverlay();
          
          // Schedule email reminder if enabled
          if (this.emailReminder) {
            this.scheduleEmailReminder(followUpData);
          }
        } else {
          this.sharedService.Messages('error', 'Follow-up', 'Failed to set follow-up reminder', 3000);
        }
      },
      error: (error) => {
        console.error('Error saving follow-up:', error);
        this.sharedService.Messages('error', 'Follow-up', 'Error setting follow-up reminder', 3000);
      }
    });
  }

  private scheduleEmailReminder(followUpData: any): void {
    const reminderPayload = {
      patientId: followUpData.patientId,
      followUpDate: followUpData.followUpDate,
      reminderDate: new Date(new Date(followUpData.followUpDate).getTime() - (followUpData.reminderDaysBefore * 24 * 60 * 60 * 1000)).toISOString(),
      emailTemplate: 'follow_up_reminder',
      recipientEmail: this.patientDetails()?.email || this.patientglobal()?.email,
      notes: followUpData.notes
    };

    this.commonService.Post("api/Notifications/ScheduleEmail", reminderPayload).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Email reminder scheduled successfully');
        }
      },
      error: (error) => {
        console.error('Error scheduling email reminder:', error);
      }
    });
  }

  // Load next upcoming follow-up for notification banner
  loadNextFollowUp(): void {
    const patientDetails = this.patientDetails();
    const patientGlobal = this.patientglobal();
    const patient = patientDetails || patientGlobal;

    if (!patient) {
      this.showFollowUpNotification = false;
      return;
    }

    const patientId = patient.patientID?.toString() || patient.patientId?.toString();
    if (!patientId) {
      this.showFollowUpNotification = false;
      return;
    }

    this.commonService.Post(`api/PatientManagement/FollowUp/Next/${patientId}`, { Mode: 'GET' }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.nextFollowUp = {
            ...response.data,
            followUpDate: new Date(response.data.followUpDate)
          };
          this.showFollowUpNotification = true;
        } else {
          this.showFollowUpNotification = false;
        }
      },
      error: (error) => {
        console.error('Error loading next follow-up:', error);
        this.showFollowUpNotification = false;
      }
    });
  }

  // Dismiss follow-up notification
  dismissFollowUpNotification(): void {
    this.showFollowUpNotification = false;
  }

  // Navigate to follow-ups page
  goToFollowUps(): void {
    // This would typically use Angular Router to navigate
    // For now, just dismiss the notification
    this.dismissFollowUpNotification();
  }
vitals:any
loadVitalsFromAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.getFormControls.clear();

    const details = this.patientDetails();
    const ptDetails = this.patientglobal();

    const payload = {
      mode: 'GET',
      patientId: details?.patientID ?? ptDetails.patientId
    };

    this.commonService.Post("CurrentMedication/Vitals", payload).subscribe({
      next: (res: any) => {
        if (res.success && res.result) {
          this.vitals = res.result;
        }
        resolve(); // Done loading
      },
      error: () => {
        this.getFormControls.clear();
        resolve(); // Still resolve so Promise.all continues
      }
    });
  });
}

  allergy:any
 loadAllergyFromAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.getFormControls.clear();

    const details = this.patientDetails();
    const ptDetails = this.patientglobal();

    const payload = {
      mode: 'GET',
      patientId: details?.patientID ?? ptDetails.patientId
    };

    this.commonService.Post("CurrentMedication/Allergy/", payload).subscribe({
      next: (res: any) => {
        if (res.success && res.result) {
          this.allergy = res.result;
        }
        resolve();
      },
      error: () => {
        this.getFormControls.clear();
        resolve();
      }
    });
  });
}

async printPatientDetails(): Promise<void> {
  try {
    this.isLoading = true;
    const patient = this.patientDetails() || this.patientglobal();

    if (!patient) {
      this.sharedService.Messages('warning', 'Print', 'No patient details available', 3000);
      return;
    }

    // ✅ Wait for vitals and allergy data to be fully loaded
    await Promise.all([
      this.loadVitalsFromAPI(),
      this.loadAllergyFromAPI()
    ]);

    // ✅ Once data is ready, generate and print
    const printContent = this.generatePrintContent(patient, this.vitals || [], this.allergy || []);
    this.openPrintWindowfull(printContent);
  } catch (error) {
    console.error('Error preparing print content:', error);
    this.sharedService.Messages('error', 'Error', 'Failed to prepare print content', 3000);
  } finally {
    this.isLoading = false;
    this.ngOnInit(); // if needed
  }
}


// Add this helper method to generate the print content
private generatePrintContent(patient: any, vitals: any[], allergies: any[]): string {
  const datePipe = new DatePipe('en-US');
  const currentDate = new Date();
  const formattedDate = datePipe.transform(currentDate, 'medium');
  const patientId = patient.patientID || patient.patientId;

  // Start building the HTML content
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Patient Summary - ${patient.patientName || patient.name || 'Unknown'}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 15px;
          border-bottom: 2px solid #2196F3;
        }
        .section { 
          margin-bottom: 30px; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #2196F3;
          border-bottom: 1px solid #ddd; 
          padding-bottom: 5px; 
          margin: 30px 0 15px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 13px;
          border: 1px solid #ddd;
        }
        th { 
          background-color: #f5f5f5; 
          text-align: left; 
          padding: 10px; 
          border: 1px solid #ddd; 
          font-weight: 600;
        }
        td { 
          padding: 10px; 
          border: 1px solid #eee; 
          vertical-align: top; 
        }
        .patient-info { 
          display: grid; 
          grid-template-columns: 150px 1fr 150px 1fr; 
          gap: 10px 20px; 
          margin: 20px 0;
        }
        .info-label { 
          font-weight: bold; 
          color: #555;
        }
        .no-data {
          color: #666;
          font-style: italic;
          padding: 15px;
          text-align: center;
        }
        @media print {
          @page { 
            size: A4; 
            margin: 1.5cm;
          }
          body { 
            margin: 0;
            font-size: 12px;
          }
          .no-print { 
            display: none; 
          }
          .section {
            page-break-inside: avoid;
          }
          table {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin-bottom: 5px; color: #2196F3;">PATIENT MEDICAL SUMMARY</h1>
        <div style="color: #666; margin-bottom: 10px;">Generated on: ${formattedDate}</div>
      </div>

      <!-- Patient Information Section -->
      <div class="section">
        <div class="section-title">PATIENT INFORMATION</div>
        <div class="patient-info">
          <div class="info-label">Patient ID:</div>
          <div>${patientId || 'N/A'}</div>
          
          <div class="info-label">Name:</div>
          <div>${patient.patientName || patient.name || 'N/A'}</div>
          
          <div class="info-label">Age/Gender:</div>
          <div>${patient.age || 'N/A'} / ${patient.gender || 'N/A'}</div>
          
          <div class="info-label">Date of Birth:</div>
          <div>${patient.dob ? datePipe.transform(patient.dob, 'mediumDate') : 'N/A'}</div>
          
      
          
          <div class="info-label">Email:</div>
          <div>${patient.email || 'N/A'}</div>
 
        </div>
      </div>

      <!-- Current Medications Section -->
      <div class="section">
        <div class="section-title">CURRENT MEDICATIONS</div>
  `;

  // Add medications table
  const medications =  this.medarray;
  if (medications.length > 0) {
    content += `
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Start Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    medications.forEach((med: any) => {
      const startDate = med.startDate ? new Date(med.startDate) : null;
   
      // Format start date or show N/A
       const startDateStr = startDate ? datePipe.transform(startDate, 'mediumDate') : 'N/A';      
      content += `
        <tr>
          <td>${med.medname || 'N/A'}</td>
          <td>${med.dosage || 'N/A'}</td>
          <td>${med.frequency || 'N/A'}</td>
          <td>${startDateStr}</td>
          <td>${med.ongoing ? 'Ongoing' : 'Completed'}</td>
        </tr>
      `;
    });

    content += `
        </tbody>
      </table>
    `;
  } else {
    content += `<div class="no-data">No medications found.</div>`;
  }

  content += `</div>`;

  // Add Vitals Section
  content += `
    <div class="section">
      <div class="section-title">VITAL SIGNS</div>
  `;

  if (vitals && vitals.length > 0) {
    const processedVitals = vitals.map(v => ({
  ...v,
  // Combine readingDate and readingTime into a single timestamp for sorting
  recordedDate: this.combineDateAndTime(v.readingDate, v.readingTime),
  // Include the original fields for display
  formattedDateTime: this.formatDateTimeForDisplay(v.readingDate, v.readingTime)
}));

    // Sort vitals by date (newest first)
    const sortedVitals = [...vitals].sort((a, b) => 
      new Date(b.recordedDate || b.readingDate).getTime() - new Date(a.recordedDate || a.readingDate).getTime()
    );

    content += `
      <table class="emr-table">
        <thead>
          <tr>
            <th class="emr-th emr-th-serial">Sl.No</th>
            <th class="emr-th emr-th-datetime">Date & Time</th>
            <th class="emr-th emr-th-bp">
              <div class="emr-vital-header">
                <div class="emr-vital-title">Blood Pressure</div>
                <div class="emr-vital-range">
                  <span class="emr-range-label">Sys (90–140)</span> / 
                  <span class="emr-range-label">Dia (60–90)</span> mmHg
                </div>
              </div>
            </th>
            <th class="emr-th emr-th-sugar">
              <div class="emr-vital-header">
                <div class="emr-vital-title">Blood Sugar</div>
                <div class="emr-vital-range">
                  <span class="emr-range-label">Fasting (70–100)</span> / 
                  <span class="emr-range-label">PP (100–140)</span> mg/dL
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedVitals.forEach((vital, index) => {
   const formattedDate = datePipe.transform(vital.readingDateTime, 'yyyy-MM-dd');
const formattedTime = datePipe.transform(vital.readingDateTime, 'hh:mm a');
      
      content += `
        <tr>
          <td class="emr-td emr-td-serial">
            <span class="emr-serial-number">${index + 1}</span>
          </td>
            <td class="emr-td emr-td-datetime">
      ${formattedDate} & ${formattedTime}
    </td>
          <td class="emr-td emr-td-bp">
            <div class="emr-bp-container">
              <span>${vital.systolic || '--'}</span>
              <span class="emr-vital-separator">/</span>
              <span>${vital.diastolic || '--'}</span>
              <span>mmHg</span>
            </div>
          </td>
          <td class="emr-td emr-td-sugar">
            <div class="emr-sugar-container">
              <span>${vital.sugarFasting || '--'}</span>
              <span class="emr-vital-separator">/</span>
              <span>${vital.sugarPP || '--'}</span>
              <span>mg/dL</span>
            </div>
          </td>
        </tr>
      `;
    });

    content += `
        </tbody>
      </table>
    `;
  } else {
    content += `<div class="no-data">No vital signs recorded.</div>`;
  }

  content += `</div>`;

  // Add Allergies Section
  content += `
    <div class="section">
      <div class="section-title">ALLERGIES</div>
  `;

  if (allergies && allergies.length > 0) {
    content += `
      <table>
        <thead>
      <tr>
            <th style="width: 10%;">Sl.No</th>
            <th>Allergy Description</th>
          </tr>
        </thead>
        <tbody>
    `;

    allergies.forEach((allergy, index) => {
      content += `
        <tr>
          <td style="text-align: center; font-weight: 600;">${index + 1}</td>
          <td>${allergy.description || 'N/A'}</td>
        </tr>
      `;
    });

    content += `
        </tbody>
      </table>
    `;
  } else {
    content += `<div class="no-data">No allergies recorded.</div>`;
  }

  content += `
    </div>

    <div class="no-print" style="text-align: center; margin: 30px 0; padding: 20px; border-top: 1px solid #eee;">
      <button onclick="window.print()" style="padding: 10px 25px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-size: 14px;">
        <i class="material-icons" style="vertical-align: middle; font-size: 16px; margin-right: 5px;">print</i> Print
      </button>
      <button onclick="window.close()" style="padding: 10px 25px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
        <i class="material-icons" style="vertical-align: middle; font-size: 16px; margin-right: 5px;">close</i> Close
      </button>
    </div>

    <script>
      // Add Material Icons
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    </script>
  `;

  // Close the HTML
  content += `
    </body>
    </html>
  `;

  return content;
}
private combineDateAndTime(date: Date | string | null, time: string | null): Date {
  if (!date || !time) return new Date(); // Fallback to current date
  
  const dateObj = new Date(date);
  const [hours, minutes] = String(time).split(':').map(Number);
  
  const combined = new Date(dateObj);
  combined.setHours(hours, minutes || 0, 0, 0);
  return combined;
}

/**
 * Formats date and time for display
 */
private formatDateTimeForDisplay(date: Date | string | null, time: string | null): string {
  if (!date) return 'N/A';
  
  const datePipe = new DatePipe('en-US');
  const formattedDate = datePipe.transform(date, 'mediumDate');
  
  if (!time) return formattedDate || 'N/A';
  
  // Format time to 12-hour format with AM/PM
  const [hours, minutes] = String(time).split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${formattedDate} ${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}
// Add this method to open the print window
private openPrintWindowfull(content: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    this.sharedService.Messages('error', 'Error', 'Could not open print window. Please allow popups for this site.', 3000);
    return;
  }

  printWindow.document.write(content);
  printWindow.document.close();

  // Auto-print after content is loaded
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
}
}
