import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith } from 'rxjs';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/shared-service.service';

interface Drug {
  id: string;
  name: string;
  strength: string;
  manufacturer?: string;
}

interface ConcomitantMedication {
  name: string;
  dosage: string;
  startDate: Date | null;
}

@Component({
  selector: 'app-adr-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatAutocompleteModule
  ],
  templateUrl: './adr-report-generator.component.html',
  styleUrls: ['./adr-report-generator.component.scss']
})
export class AdrReportGeneratorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);

  adrForm!: FormGroup;
  isSubmitting = false;
  reportSubmitted = false;
  submittedReportId = '';
  showPreview = false;
  previewHtml = '';
  causalityScore: number | null = null;

  // Drug autocomplete
  drugs: Drug[] = [];
  filteredDrugs!: Observable<Drug[]>;

  ngOnInit(): void {
    this.initializeForm();
    this.loadDrugs();
    this.setupCausalityCalculation();
  }

  initializeForm(): void {
    this.adrForm = this.fb.group({
      // Patient Information
      patientId: ['', Validators.required],
      patientName: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      gender: ['', Validators.required],
      weight: [''],
      height: [''],

      // Suspected Medication
      suspectedDrug: ['', Validators.required],
      batchNumber: [''],
      dosage: ['', Validators.required],
      route: ['', Validators.required],
      frequency: ['', Validators.required],
      startDate: ['', Validators.required],
      stopDate: [''],
      indication: ['', Validators.required],

      // Adverse Reaction Details
      reactionDescription: ['', Validators.required],
      onsetDate: ['', Validators.required],
      severity: ['', Validators.required],
      outcome: ['', Validators.required],

      // Reaction Categories
      categoryAllergic: [false],
      categoryGI: [false],
      categoryCardiac: [false],
      categoryNeurologic: [false],
      categoryRespiratory: [false],
      categoryDermatologic: [false],
      categoryHematologic: [false],
      categoryHepatic: [false],
      categoryRenal: [false],
      categoryOther: [false],

      // Causality Assessment
      causalityTiming: [''],
      causalityDechallenge: [''],
      causalityRechallenge: [''],
      causalityAlternative: [''],

      // Concomitant Medications
      concomitantMeds: this.fb.array([]),

      // Reporter Information
      reporterName: ['', Validators.required],
      reporterTitle: ['', Validators.required],
      institution: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      reportDate: [new Date(), Validators.required],

      // Additional Information
      additionalComments: [''],
      followUpRequired: [false],
      reportedToAuthority: [false],
      literatureReported: [false]
    });

    // Setup drug autocomplete
    this.filteredDrugs = this.adrForm.get('suspectedDrug')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDrugs(value || ''))
    );
  }

  get concomitantMeds(): FormArray {
    return this.adrForm.get('concomitantMeds') as FormArray;
  }

  loadDrugs(): void {
    this.commonService.Get("DrugMaster/Drugs").subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.drugs = response.data;
        } else {
          // Mock data for demonstration
          this.drugs = [
            { id: '1', name: 'Metformin', strength: '500mg' },
            { id: '2', name: 'Lisinopril', strength: '10mg' },
            { id: '3', name: 'Atorvastatin', strength: '20mg' },
            { id: '4', name: 'Amlodipine', strength: '5mg' },
            { id: '5', name: 'Omeprazole', strength: '20mg' },
            { id: '6', name: 'Aspirin', strength: '81mg' },
            { id: '7', name: 'Warfarin', strength: '5mg' },
            { id: '8', name: 'Insulin', strength: '100 units/mL' }
          ];
        }
      },
      error: (error) => {
        console.error('Error loading drugs:', error);
      }
    });
  }

  private _filterDrugs(value: string): Drug[] {
    if (typeof value !== 'string') return this.drugs;
    const filterValue = value.toLowerCase();
    return this.drugs.filter(drug => 
      drug.name.toLowerCase().includes(filterValue)
    );
  }

  displayDrug(drug: Drug): string {
    return drug ? `${drug.name} (${drug.strength})` : '';
  }

  searchPatient(): void {
    const patientId = this.adrForm.get('patientId')?.value;
    if (!patientId) return;

    this.commonService.Post("PatientManagement/GetPatient", { patientId }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const patient = response.data;
          this.adrForm.patchValue({
            patientName: `${patient.firstName} ${patient.lastName}`,
            age: this.calculateAge(patient.dateOfBirth),
            gender: patient.gender?.toLowerCase()
          });
          this.sharedService.Messages('success', 'Patient Found', 'Patient information loaded', 3000);
        } else {
          this.sharedService.Messages('warning', 'Patient Not Found', 'No patient found with this ID', 3000);
        }
      },
      error: (error) => {
        console.error('Error searching patient:', error);
        this.sharedService.Messages('error', 'Search Error', 'Error searching for patient', 3000);
      }
    });
  }

  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  setupCausalityCalculation(): void {
    // Watch causality assessment fields and calculate score
    const causalityFields = ['causalityTiming', 'causalityDechallenge', 'causalityRechallenge', 'causalityAlternative'];
    
    causalityFields.forEach(field => {
      this.adrForm.get(field)?.valueChanges.subscribe(() => {
        this.calculateCausalityScore();
      });
    });
  }

  calculateCausalityScore(): void {
    let score = 0;
    
    const timing = this.adrForm.get('causalityTiming')?.value;
    const dechallenge = this.adrForm.get('causalityDechallenge')?.value;
    const rechallenge = this.adrForm.get('causalityRechallenge')?.value;
    const alternative = this.adrForm.get('causalityAlternative')?.value;

    // Timing
    if (timing === 'yes') score += 2;
    else if (timing === 'no') score -= 1;

    // Dechallenge
    if (dechallenge === 'yes') score += 1;
    else if (dechallenge === 'no') score -= 1;

    // Rechallenge
    if (rechallenge === 'yes') score += 2;
    else if (rechallenge === 'no') score -= 1;

    // Alternative causes
    if (alternative === 'yes') score -= 1;
    else if (alternative === 'no') score += 2;

    this.causalityScore = score;
  }

  getCausalityClass(): string {
    if (this.causalityScore === null) return '';
    
    if (this.causalityScore >= 6) return 'definite';
    if (this.causalityScore >= 3) return 'probable';
    if (this.causalityScore >= 1) return 'possible';
    return 'unlikely';
  }

  getCausalityInterpretation(): string {
    if (this.causalityScore === null) return '';
    
    if (this.causalityScore >= 6) return 'Definite - The adverse event is clearly related to the drug';
    if (this.causalityScore >= 3) return 'Probable - The adverse event is likely related to the drug';
    if (this.causalityScore >= 1) return 'Possible - The adverse event may be related to the drug';
    return 'Unlikely - The adverse event is probably not related to the drug';
  }

  addConcomitantMed(): void {
    const medGroup = this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      startDate: ['']
    });
    
    this.concomitantMeds.push(medGroup);
  }

  removeConcomitantMed(index: number): void {
    this.concomitantMeds.removeAt(index);
  }

  saveDraft(): void {
    const draftData = {
      ...this.adrForm.value,
      isDraft: true,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('adr_draft', JSON.stringify(draftData));
    this.sharedService.Messages('success', 'Draft Saved', 'Report draft saved locally', 3000);
  }

  previewReport(): void {
    if (!this.adrForm.valid) {
      this.sharedService.Messages('warning', 'Form Invalid', 'Please fill in all required fields', 3000);
      return;
    }

    this.previewHtml = this.generateReportHtml();
    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
  }

  submitReport(): void {
    if (!this.adrForm.valid) {
      this.sharedService.Messages('warning', 'Form Invalid', 'Please fill in all required fields', 3000);
      return;
    }

    this.isSubmitting = true;

    const reportData = {
      ...this.adrForm.value,
      causalityScore: this.causalityScore,
      submittedAt: new Date().toISOString()
    };

    this.commonService.Post("ADR/SubmitReport", reportData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response.success) {
          this.reportSubmitted = true;
          this.submittedReportId = response.reportId || this.generateReportId();
          this.sharedService.Messages('success', 'Report Submitted', 'ADR report submitted successfully', 5000);
          
          // Clear draft
          localStorage.removeItem('adr_draft');
        } else {
          this.sharedService.Messages('error', 'Submission Failed', 'Failed to submit ADR report', 3000);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting ADR report:', error);
        this.sharedService.Messages('error', 'Submission Error', 'Error submitting ADR report', 3000);
      }
    });
  }

  submitFromPreview(): void {
    this.closePreview();
    this.submitReport();
  }

  printReport(): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(this.generatePrintableHtml());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  exportToPDF(): void {
    this.sharedService.Messages('info', 'Export', 'PDF export functionality will be implemented', 3000);
  }

  createNewReport(): void {
    this.reportSubmitted = false;
    this.submittedReportId = '';
    this.adrForm.reset();
    this.initializeForm();
    this.causalityScore = null;
  }

  viewSubmittedReports(): void {
    // Navigate to reports list or implement reports view
    this.sharedService.Messages('info', 'Reports', 'Reports view will be implemented', 3000);
  }

  private generateReportId(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ADR-${timestamp}-${random}`;
  }

  private generateReportHtml(): string {
    const formValue = this.adrForm.value;
    const categories = this.getSelectedCategories();
    
    return `
      <div class="report-preview">
        <h2>Adverse Drug Reaction Report</h2>
        
        <div class="section">
          <h3>Patient Information</h3>
          <p><strong>Patient ID:</strong> ${formValue.patientId}</p>
          <p><strong>Name:</strong> ${formValue.patientName}</p>
          <p><strong>Age:</strong> ${formValue.age} years</p>
          <p><strong>Gender:</strong> ${formValue.gender}</p>
          ${formValue.weight ? `<p><strong>Weight:</strong> ${formValue.weight} kg</p>` : ''}
          ${formValue.height ? `<p><strong>Height:</strong> ${formValue.height} cm</p>` : ''}
        </div>

        <div class="section">
          <h3>Suspected Medication</h3>
          <p><strong>Drug:</strong> ${formValue.suspectedDrug}</p>
          <p><strong>Dosage:</strong> ${formValue.dosage}</p>
          <p><strong>Route:</strong> ${formValue.route}</p>
          <p><strong>Frequency:</strong> ${formValue.frequency}</p>
          <p><strong>Start Date:</strong> ${new Date(formValue.startDate).toLocaleDateString()}</p>
          ${formValue.stopDate ? `<p><strong>Stop Date:</strong> ${new Date(formValue.stopDate).toLocaleDateString()}</p>` : ''}
          <p><strong>Indication:</strong> ${formValue.indication}</p>
          ${formValue.batchNumber ? `<p><strong>Batch Number:</strong> ${formValue.batchNumber}</p>` : ''}
        </div>

        <div class="section">
          <h3>Adverse Reaction</h3>
          <p><strong>Description:</strong> ${formValue.reactionDescription}</p>
          <p><strong>Onset Date:</strong> ${new Date(formValue.onsetDate).toLocaleDateString()}</p>
          <p><strong>Severity:</strong> ${formValue.severity}</p>
          <p><strong>Outcome:</strong> ${formValue.outcome}</p>
          ${categories.length > 0 ? `<p><strong>Categories:</strong> ${categories.join(', ')}</p>` : ''}
        </div>

        ${this.causalityScore !== null ? `
          <div class="section">
            <h3>Causality Assessment</h3>
            <p><strong>Score:</strong> ${this.causalityScore}</p>
            <p><strong>Assessment:</strong> ${this.getCausalityInterpretation()}</p>
          </div>
        ` : ''}

        <div class="section">
          <h3>Reporter Information</h3>
          <p><strong>Name:</strong> ${formValue.reporterName}</p>
          <p><strong>Title:</strong> ${formValue.reporterTitle}</p>
          <p><strong>Institution:</strong> ${formValue.institution}</p>
          <p><strong>Email:</strong> ${formValue.contactEmail}</p>
          <p><strong>Report Date:</strong> ${new Date(formValue.reportDate).toLocaleDateString()}</p>
        </div>

        ${formValue.additionalComments ? `
          <div class="section">
            <h3>Additional Comments</h3>
            <p>${formValue.additionalComments}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  private generatePrintableHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ADR Report - ${this.adrForm.get('patientId')?.value}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1, h2, h3 { color: #00796b; }
          .header { border-bottom: 2px solid #00796b; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; }
          .section h3 { margin-top: 0; color: #00796b; }
          p { margin: 5px 0; }
          strong { color: #333; }
          .causality-score { background: #f0f8ff; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Adverse Drug Reaction Report</h1>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        ${this.generateReportHtml()}
      </body>
      </html>
    `;
  }

  private getSelectedCategories(): string[] {
    const categories: string[] = [];
    const categoryMap = {
      categoryAllergic: 'Allergic/Immunologic',
      categoryGI: 'Gastrointestinal',
      categoryCardiac: 'Cardiac',
      categoryNeurologic: 'Neurologic',
      categoryRespiratory: 'Respiratory',
      categoryDermatologic: 'Dermatologic',
      categoryHematologic: 'Hematologic',
      categoryHepatic: 'Hepatic',
      categoryRenal: 'Renal',
      categoryOther: 'Other'
    };

    Object.entries(categoryMap).forEach(([key, label]) => {
      if (this.adrForm.get(key)?.value) {
        categories.push(label);
      }
    });

    return categories;
  }
}
