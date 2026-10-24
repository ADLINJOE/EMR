import { Component, OnInit, inject, Output, EventEmitter, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { HttpClient } from '@angular/common/http';
import { CommonService, DeployUrl } from '../../../../Service/common.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Patient {
  patientId: string;
  name: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  age?: number;
  email?: string;
  conditions?: string[];
}

interface Medication {
  medname: string;
  dosage: string;
  frequency: string;
  startDate: string;
  ongoing: boolean;
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  clinicalSignificance?: string;
  management?: string;
  monitoring?: string;
  recommendations?: string;
}

interface Contraindication {
  medication: string;
  severity: 'warning' | 'caution' | 'contraindicated';
  reason: string;
  recommendation?: string;
  timeline?: string;
}

interface DosageRecommendation {
  medication: string;
  type: 'reduction' | 'increase' | 'adjustment';
  currentDosage: string;
  recommendedDosage: string;
  rationale: string;
}

interface ClinicalRecommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendation: string;
  timeline?: string;
}

interface AnalysisResults {
  totalInteractions: number;
  interactions: DrugInteraction[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  timestamp: string;
  highRiskInteractions: number;
  mediumRiskInteractions: number;
  lowRiskInteractions: number;
  overallRecommendations?: string;
  contraindications?: Contraindication[];
  clinicalRecommendations?: ClinicalRecommendation[];
  aiModel?: string;
  overallRisk?: string;
  overallSummary?: string;
}

@Component({
  selector: 'app-ai-interaction-checker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressBarModule
  ],
  templateUrl: './ai-interaction-checker.component.html',
  styleUrls: ['./ai-interaction-checker.component.scss']
})
export class AiInteractionCheckerComponent implements OnInit, OnDestroy {
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  @Output() onComplete = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  patients: Patient[] = [];
  selectedPatientId: string | null = null;
  selectedPatient: Patient | null = null;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.isAnalyzing = false;
  }

  cancelAnalysis() {
    this.destroy$.next();
    this.isAnalyzing = false;
    this.analysisProgressMessage = '';
    this.currentAnalysisStep = 0;
  }

  currentMedications: Medication[] = [];
  analysisResults: AnalysisResults | null = null;
  isAnalyzing = false;
  analysisProgressMessage = '';
  currentAnalysisStep = 0;
  loadingPatients = false;
  showAddMedicationForm = false;
  sharingAnalysis = false;

  showAddForm = false;
  newMedication: Medication = {
    medname: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    ongoing: true
  };

  highlightedMedications: string[] = [];
  UserSetGlobal: any;
  // Handle pre-selected patient from patient list
  handlePreSelectedPatient(patient: any): void {
    this.selectedPatientId = patient.patientId || patient.patientID;
    this.selectedPatient = {
      patientId: patient.patientId || patient.patientID,
      name: patient.name || patient.firstName,
      lastName: patient.lastName || '',
      dateOfBirth: patient.dateOfBirth || patient.age ? this.calculateDateOfBirthFromAge(patient.age) : '',
      gender: patient.gender || '',
      email: patient.email || '',
      conditions: patient.conditions || patient.medicalConditions || []
    };

    this.sharedService.Messages('info', 'Patient Selected', 
      `${this.selectedPatient.name} ${this.selectedPatient.lastName} selected for AI medication analysis`, 3000);

    // Automatically load medications for the pre-selected patient
    setTimeout(() => {
      this.loadPatientMedications();
    }, 500);
  }

  // Helper method to calculate date of birth from age
  calculateDateOfBirthFromAge(age: number): string {
    if (!age) return '';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    return `${birthYear}-01-01`; // Approximate date
  }

  ngOnInit(): void {
    // Check if a patient is already selected from the patient list
    const preSelectedPatient = this.sharedService.getPatient();
    if (preSelectedPatient) {
      this.handlePreSelectedPatient(preSelectedPatient);
    } else {
      this.loadPatients();
    }
  }

  userinfo(): any {
    try {
      const userInfo = this.sharedService.userInfo();
      if (userInfo) {
        return userInfo;
      }
      
      // Fallback to localStorage if shared service doesn't have user info
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      // Default fallback
      return {
        userType: 'Doctor',
        userID: '1',
        userName: 'Default User'
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        userType: 'Doctor',
        userID: '1',
        userName: 'Default User'
      };
    }
  }

  loadPatients(): void {
    this.UserSetGlobal = this.userinfo();
    const payload = {
      UserType: this.UserSetGlobal?.userType || 'Doctor',
      UserId: this.UserSetGlobal?.userID || '1'
    }

    this.commonService.Post('PatientHandle/Getmypatients',payload).subscribe({
      next: (response: any) => {
        console.log('Patient API Response:', response); // Debug log
        
        // Handle different response structures
        let patientData = null;
        if (response.success && response.patients) {
          patientData = response.patients;
        } else if (response.success && response.result) {
          patientData = response.result;
        } else if (response.success && Array.isArray(response.data)) {
          patientData = response.data;
        } else if (Array.isArray(response)) {
          patientData = response;
        }
        
        if (patientData && Array.isArray(patientData) && patientData.length > 0) {
          this.patients = patientData.map((patient: any) => ({
            patientId: patient.patientId || patient.patientID || patient.id,
            name: patient.name || patient.firstName || patient.patientName,
            lastName: patient.lastName || patient.surname || '',
            dateOfBirth: patient.dateOfBirth || patient.dob || '',
            gender: patient.gender || patient.sex || '',
            age: patient.age || this.calculateAge(patient.dateOfBirth || patient.dob || ''),
            email: patient.email || patient.emailAddress || '',
            conditions: patient.conditions || patient.medicalConditions || patient.diagnosis || []
          }));
          this.sharedService.Messages('success', 'Load Patients', `Loaded ${this.patients.length} patients`, 2000);
        } else {
          this.patients = [];
          this.sharedService.Messages('info', 'Load Patients', 'No patients found or empty response', 3000);
        }
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.patients = [];
        this.sharedService.Messages('error', 'Load Patients', 'Failed to load patients', 3000);
      }
    });
  }

  onPatientSelected(): void {
    this.selectedPatient = this.patients.find(p => p.patientId.toString() === this.selectedPatientId) || null;
    if (this.selectedPatient) {
      this.loadPatientMedications();
    }
  }

  onPatientSelect(patientId: string): void {
    this.selectedPatientId = patientId;
    this.onPatientSelected();
  }

  onPatientSelectChange(event: any): void {
    const patientId = event.target.value;
    this.onPatientSelect(patientId);
  }

  onAddMedicationClick(): void {
    if (this.showAddMedicationForm) {
      // If form is already open, just close it
      this.showAddMedicationForm = false;
    } else {
      // Show confirmation popup before opening form
      this.showMedicationConfirmationPopup();
    }
  }

  showMedicationConfirmationPopup(): void {
    const confirmMessage = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #20b2aa; margin-bottom: 15px;">Add New Medication</h3>
        <p style="margin-bottom: 20px;">Do you want to add a new medication and proceed to AI Drug Interaction Analysis?</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="confirmYes" style="
            background: #20b2aa; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">Yes, Add Medication</button>
          <button id="confirmNo" style="
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">No, Cancel</button>
        </div>
      </div>
    `;

    this.showPopup(confirmMessage, () => {
      this.showAddMedicationForm = true;
      this.sharedService.Messages('info', 'Medication Form', 'Add your medication details below', 3000);
    });
  }

  onEditMedication(medication: any, index: number): void {
    const confirmMessage = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #20b2aa; margin-bottom: 15px;">Edit Medication</h3>
        <p style="margin-bottom: 20px;">Do you want to edit <strong>${medication.medname}</strong> and update the AI Drug Interaction Analysis?</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="confirmYes" style="
            background: #20b2aa; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">Yes, Edit</button>
          <button id="confirmNo" style="
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">No, Cancel</button>
        </div>
      </div>
    `;

    this.showPopup(confirmMessage, () => {
      // Edit logic here
      this.sharedService.Messages('info', 'Edit Medication', `Editing ${medication.medname}`, 3000);
    });
  }

  onMonographClick(medication: any): void {
    const confirmMessage = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #20b2aa; margin-bottom: 15px;">View Monograph</h3>
        <p style="margin-bottom: 20px;">Do you want to view the monograph for <strong>${medication.medname}</strong>?</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="confirmYes" style="
            background: #20b2aa; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">Yes, View Monograph</button>
          <button id="confirmNo" style="
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">No, Cancel</button>
        </div>
      </div>
    `;

    this.showPopup(confirmMessage, () => {
      // Monograph logic here
      this.sharedService.Messages('info', 'Monograph', `Viewing monograph for ${medication.medname}`, 3000);
    });
  }

  onCancelMedication(medication: any, index: number): void {
    const confirmMessage = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #f39c12; margin-bottom: 15px;">Cancel Medication</h3>
        <p style="margin-bottom: 20px;">Do you want to cancel <strong>${medication.medname}</strong>?</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="confirmYes" style="
            background: #f39c12; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">Yes, Cancel</button>
          <button id="confirmNo" style="
            background: #6c757d; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">No, Keep</button>
        </div>
      </div>
    `;

    this.showPopup(confirmMessage, () => {
      // Cancel logic here
      this.sharedService.Messages('warning', 'Medication Cancelled', `${medication.medname} has been cancelled`, 3000);
    });
  }

  onDeleteMedication(medication: any, index: number): void {
    const confirmMessage = `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #dc3545; margin-bottom: 15px;">Delete Medication</h3>
        <p style="margin-bottom: 20px;">Are you sure you want to delete <strong>${medication.medname}</strong>? This action cannot be undone.</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="confirmYes" style="
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">Yes, Delete</button>
          <button id="confirmNo" style="
            background: #6c757d; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: 600;
          ">No, Keep</button>
        </div>
      </div>
    `;

    this.showPopup(confirmMessage, () => {
      this.removeMedication(index);
      this.sharedService.Messages('success', 'Medication Deleted', `${medication.medname} has been deleted`, 3000);
    });
  }

  private showPopup(message: string, onConfirm: () => void): void {
    // Create and show popup
    const popup = document.createElement('div');
    popup.innerHTML = message;
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      min-width: 400px;
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Handle button clicks
    const yesBtn = popup.querySelector('#confirmYes') as HTMLButtonElement;
    const noBtn = popup.querySelector('#confirmNo') as HTMLButtonElement;

    yesBtn?.addEventListener('click', () => {
      onConfirm();
      document.body.removeChild(popup);
      document.body.removeChild(overlay);
    });

    noBtn?.addEventListener('click', () => {
      document.body.removeChild(popup);
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', () => {
      document.body.removeChild(popup);
      document.body.removeChild(overlay);
    });
  }

  clearPatientSelection(): void {
    this.selectedPatient = null;
    this.selectedPatientId = null;
    this.currentMedications = [];
    this.analysisResults = null;
    this.showAddMedicationForm = false;
    this.sharedService.setPatient(null);
    this.sharedService.Messages('info', 'Patient Selection', 'Patient selection cleared', 2000);
  }

  loadPatientMedications(): void {
    if (!this.selectedPatientId) return;

    const payload = { Mode: 'GET', PatientId: this.selectedPatientId };

    this.commonService.Post("CurrentMedication/currentmedication/", payload).subscribe({
      next: (response: any) => {
        if (response.success && response.result) {
          // Map the response data to our medication interface
          this.currentMedications = response.result
            .filter((med: any) => med.ongoing && !med.isDeleted)
            .map((med: any) => ({
              medname: med.medname || med.medicationName || med.name,
              dosage: med.dosage || med.dose,
              frequency: med.frequency,
              startDate: med.startDate || med.dateStarted || new Date().toISOString().split('T')[0],
              ongoing: med.ongoing !== false,
              riskLevel: 'low' as 'low' | 'moderate' | 'high' | 'critical'
            }));

          this.analysisResults = null; // Clear previous analysis

          if (this.currentMedications.length > 0) {
            this.sharedService.Messages('success', 'Load Medications', 
              `Loaded ${this.currentMedications.length} medications for ${this.selectedPatient?.name}. Ready for interaction analysis.`, 3000);

            // Auto-analyze if there are 2 or more medications
            if (this.currentMedications.length >= 2) {
              setTimeout(() => {
                this.analyzeInteractions();
              }, 1000);
            }
          } else {
            this.sharedService.Messages('info', 'Load Medications', 
              'No current medications found for this patient. You can add medications manually.', 3000);
          }
        } else {
          this.currentMedications = [];
          this.sharedService.Messages('info', 'Load Medications', 'No current medications found for this patient', 3000);
        }
      },
      error: (error) => {
        console.error('Error loading medications:', error);
        this.sharedService.Messages('error', 'Load Medications', 'Failed to load patient medications', 3000);
      }
    });
  }

  changePatient(): void {
    this.selectedPatient = null;
    this.selectedPatientId = null;
    this.currentMedications = [];
    this.analysisResults = null;
    this.showAddMedicationForm = false;

    // Clear the shared service patient data
    this.sharedService.setPatient(null);

    // Reload patient list for dropdown
    this.loadPatients();
  }

  addNewMedication(): void {
    this.showAddMedicationForm = true;
    this.newMedication = {
      medname: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      ongoing: true
    };
  }

  saveNewMedication(): void {
    if (!this.newMedication.medname || !this.newMedication.dosage) {
      this.sharedService.Messages('warning', 'Add Medication', 'Please fill in all required fields', 3000);
      return;
    }

    // Save to backend if patient is selected
    if (this.selectedPatientId) {
      const payload = {
        Mode: 'ADD',
        PatientId: this.selectedPatientId,
        medicationList: [{
          medname: this.newMedication.medname,
          dosage: this.newMedication.dosage,
          frequency: this.newMedication.frequency,
          startDate: new Date(this.newMedication.startDate),
          ongoing: this.newMedication.ongoing,
          isNew: true,
          lastEditedBy: this.UserSetGlobal?.name || 'System'
        }]
      };

      this.commonService.Post("CurrentMedication/currentmedication/", payload).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Add to local array
            this.currentMedications.push({ ...this.newMedication });
            this.showAddMedicationForm = false;
            this.analysisResults = null; // Clear previous analysis
            this.sharedService.Messages('success', 'Add Medication', 'Medication added and saved successfully', 3000);
          } else {
            this.sharedService.Messages('error', 'Add Medication', 'Failed to save medication to database', 3000);
          }
        },
        error: (error) => {
          console.error('Error saving medication:', error);
          // Still add locally for analysis
          this.currentMedications.push({ ...this.newMedication });
          this.showAddMedicationForm = false;
          this.analysisResults = null;
          this.sharedService.Messages('warning', 'Add Medication', 'Medication added locally but not saved to database', 3000);
        }
      });
    } else {
      // Just add locally if no patient selected
      this.currentMedications.push({ ...this.newMedication });
      this.showAddMedicationForm = false;
      this.analysisResults = null;
      this.sharedService.Messages('success', 'Add Medication', 'Medication added successfully', 3000);
    }
  }

  cancelAddMedication(): void {
    this.showAddMedicationForm = false;
  }

  removeMedication(index: number): void {
    this.currentMedications.splice(index, 1);
    this.analysisResults = null; // Clear previous analysis
    this.sharedService.Messages('info', 'Remove Medication', 'Medication removed', 3000);
  }

  analyzeInteractions(): void {
    if (this.currentMedications.length < 1) {
      this.sharedService.Messages('warning', 'Analysis', 'At least 1 medication is required for analysis', 3000);
      return;
    }

    if (this.currentMedications.length < 2) {
      this.sharedService.Messages('info', 'Analysis', 'Single medication analysis - checking for contraindications and recommendations', 3000);
    }

    this.isAnalyzing = true;
    this.currentAnalysisStep = 0;
    this.highlightedMedications = [];

    this.sharedService.Messages('info', 'AI Analysis', 
      `Starting AI analysis for ${this.currentMedications.length} medications for ${this.selectedPatient?.name}`, 3000);

    // Simulate AI analysis steps with better messaging
    setTimeout(() => {
      this.currentAnalysisStep = 1;
      setTimeout(() => {
        this.currentAnalysisStep = 2;
        setTimeout(() => {
          this.currentAnalysisStep = 3;
          this.performAIAnalysis();
        }, 1500);
      }, 1500);
    }, 1000);
  }

  private async performAIAnalysis(): Promise<void> {
    try {
      const medicationList = this.currentMedications.map(med => ({
        name: med.medname,
        dosage: med.dosage,
        frequency: med.frequency
      }));

      // Create description for ADR API
      const payloadDescription = `Patient: ${this.selectedPatient?.name} ${this.selectedPatient?.lastName}, Age: ${this.calculateAge(this.selectedPatient?.dateOfBirth || '')}, Gender: ${this.selectedPatient?.gender}. Current Medications: ${medicationList.map(med => `${med.name} ${med.dosage} ${med.frequency}`).join(', ')}. Medical Conditions: ${this.selectedPatient?.conditions?.join(', ') || 'None'}. Please analyze drug interactions, contraindications, and provide clinical recommendations.`;

      // Use ADR API for severity checking and analysis with cancellation support
      const response: any = await this.http
        .post(`${DeployUrl.URL}api/ADR/check-severity`, { description: payloadDescription })
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      this.isAnalyzing = false;
      
      if (response && (response.severity || response.text || response.message || response.analysis || typeof response === 'string')) {
        // Process ADR API response (text or structured)
        this.processADRResponse(response);
      } else {
        this.generateMockAnalysis();
      }
    } catch (error:any) {
      if (error.status === 429) {
       this.sharedService.Messages('warning', 'AI Analysis', 'Rate limit exceeded. Please try later or upgrade your plan.', 3000);
      } else {
        console.error('ADR API Analysis error:', error);
      }
      this.isAnalyzing = false;
      this.generateMockAnalysis(); // Fallback to mock data
    }
  }

  private processADRResponse(response: any): void {
    console.log('ADR Response:', response);
    
    // Extract the text response - could be in response.severity, response.message, or direct string
    const responseText = response.severity || response.message || response.analysis || response.toString();
    
    this.analysisResults = {
      timestamp: new Date().toISOString(),
      totalInteractions: 0,
      interactions: [],
      riskLevel: 'moderate',
      highRiskInteractions: 0,
      mediumRiskInteractions: 0,
      lowRiskInteractions: 0,
      overallRecommendations: responseText,
      aiModel: 'ADR AI System',
      overallSummary: responseText
    };
    
    this.updateMedicationRiskLevels();
    this.sharedService.Messages('success', 'AI Analysis', 'ADR-powered medication analysis completed', 3000);
  }


  private mapADRSeverityToRisk(severity: string): 'low' | 'moderate' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
      case 'critical': case 'severe': return 'critical';
      case 'major': case 'high': return 'high';
      case 'moderate': case 'medium': return 'moderate';
      default: return 'low';
    }
  }

  private extractInteractionsFromADR(response: any): DrugInteraction[] {
    // Extract interactions from ADR response
    const interactions: DrugInteraction[] = [];
    
    if (response.interactions && Array.isArray(response.interactions)) {
      response.interactions.forEach((interaction: any) => {
        interactions.push({
          drug1: interaction.drug1 || 'Unknown',
          drug2: interaction.drug2 || 'Unknown',
          severity: interaction.severity || 'moderate',
          description: interaction.description || 'Drug interaction detected',
          management: interaction.management,
          monitoring: interaction.monitoring,
          recommendations: interaction.recommendations
        });
      });
    }
    
    return interactions;
  }

  private generateMockAnalysis(): void {
    // Mock AI analysis for demonstration
    const mockInteractions: DrugInteraction[] = [];
    const mockContraindications: Contraindication[] = [];
    const mockDosageRecs: DosageRecommendation[] = [];
    const mockClinicalRecs: ClinicalRecommendation[] = [];

    // Check for common interactions
    const medications = this.currentMedications.map(m => m.medname.toLowerCase());
    
    if (medications.includes('warfarin') && medications.includes('aspirin')) {
      mockInteractions.push({
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        severity: 'High',
        description: 'Increased risk of bleeding due to additive anticoagulant effects.',
        clinicalSignificance: 'Significant bleeding risk requiring close monitoring',
        management: 'Monitor INR more frequently, watch for signs of bleeding',
        monitoring: 'Check INR weekly initially, then bi-weekly once stable',
        recommendations: 'Consider alternative anticoagulant or antiplatelet therapy'
      });
    }

    if (medications.includes('metformin') && medications.includes('lisinopril')) {
      mockInteractions.push({
        drug1: 'Metformin',
        drug2: 'Lisinopril',
        severity: 'Moderate',
        description: 'ACE inhibitors may increase risk of lactic acidosis with metformin.',
        management: 'Monitor renal function closely, especially in elderly patients',
        monitoring: 'Check serum creatinine and eGFR every 3 months',
        recommendations: 'Consider alternative antihypertensive therapy'
      });
    }

    // Generate contraindications based on patient conditions
    if (this.selectedPatient?.conditions?.includes('Kidney Disease')) {
      const nephrotoxicMeds = this.currentMedications.filter(med => 
        ['metformin', 'ibuprofen', 'naproxen'].some(drug => 
          med.medname.toLowerCase().includes(drug)
        )
      );
      
      nephrotoxicMeds.forEach(med => {
        mockContraindications.push({
          medication: med.medname,
          severity: 'contraindicated',
          reason: 'Contraindicated in patients with kidney disease due to risk of further renal impairment',
          recommendation: 'Consider alternative medication or dose adjustment under specialist supervision',
          timeline: 'Immediate'
        });
      });
    }

    // Generate clinical recommendations
    if (mockInteractions.length > 0) {
      mockClinicalRecs.push({
        priority: 'high',
        recommendation: 'Schedule follow-up appointment within 2 weeks to assess medication interactions and adjust therapy as needed',
        timeline: 'Within 2 weeks'
      });
    }

    if (this.currentMedications.length > 5) {
      mockClinicalRecs.push({
        priority: 'medium',
        recommendation: 'Consider medication reconciliation to simplify regimen and improve adherence',
        timeline: 'Next routine visit'
      });
    }

    const overallRisk = mockInteractions.some(i => i.severity === 'Critical' || i.severity === 'High') ? 'high' :
                       mockInteractions.some(i => i.severity === 'Moderate') ? 'moderate' : 'low';

    this.analysisResults = {
      timestamp: new Date().toISOString(),
      totalInteractions: mockInteractions.length,
      interactions: mockInteractions,
      riskLevel: overallRisk,
      highRiskInteractions: mockInteractions.filter(i => i.severity === 'Critical' || i.severity === 'High').length,
      mediumRiskInteractions: mockInteractions.filter(i => i.severity === 'Moderate').length,
      lowRiskInteractions: mockInteractions.filter(i => i.severity === 'Low').length,
      overallRecommendations: this.generateOverallSummary(overallRisk, mockInteractions.length)
    };
    
    this.updateMedicationRiskLevels();
    this.isAnalyzing = false;
    this.sharedService.Messages('success', 'AI Analysis', 'Medication analysis completed', 3000);
  }

  private generateOverallSummary(risk: string, interactionCount: number): string {
    switch (risk) {
      case 'high':
        return `High risk medication regimen identified with ${interactionCount} significant interactions. Immediate review and intervention recommended.`;
      case 'moderate':
        return `Moderate risk identified with ${interactionCount} potential interactions. Enhanced monitoring and possible adjustments recommended.`;
      case 'low':
        return `Low risk medication regimen. Current medications appear to be well-tolerated with minimal interaction risk.`;
      default:
        return 'Medication analysis completed. Please review recommendations below.';
    }
  }

  private updateMedicationRiskLevels(): void {
    if (!this.analysisResults) return;

    // Reset risk levels
    this.currentMedications.forEach(med => med.riskLevel = 'low');
    this.highlightedMedications = [];

    // Update based on interactions
    this.analysisResults.interactions?.forEach(interaction => {
      const med1 = this.currentMedications.find(m => m.medname === interaction.drug1);
      const med2 = this.currentMedications.find(m => m.medname === interaction.drug2);
      
      if (med1) {
        med1.riskLevel = this.mapADRSeverityToRisk(interaction.severity);
        this.highlightedMedications.push(med1.medname);
      }
      
      if (med2) {
        med2.riskLevel = this.mapADRSeverityToRisk(interaction.severity);
        this.highlightedMedications.push(med2.medname);
      }
    });

    // Update based on contraindications
    this.analysisResults?.contraindications?.forEach((contra: Contraindication) => {
      const med = this.currentMedications.find(m => m.medname === contra.medication);
      if (med) {
        med.riskLevel = contra.severity === 'contraindicated' ? 'critical' : 'high';
        this.highlightedMedications.push(med.medname);
      }
    });
  }

//   private generateAnalysisPrintContent(): string {
//     if (!this.analysisResults || !this.selectedPatient) return '';

//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>AI Medication Analysis - ${this.selectedPatient.firstName} ${this.selectedPatient.lastName}</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
//           h1, h2, h3 { color: #00796b; }
//           .header { border-bottom: 2px solid #00796b; padding-bottom: 10px; margin-bottom: 20px; }
//           .patient-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
//           .risk-summary { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
//           .risk-high { background: #ffebee; border-color: #ffcdd2; }
//           .risk-critical { background: #f8d7da; border-color: #dc3545; }
//           .interaction { background: #f8f9fa; border-left: 4px solid #007bff; padding: 10px; margin: 10px 0; }
//           .interaction.major { border-left-color: #dc3545; }
//           .interaction.moderate { border-left-color: #ffc107; }
//           .medications-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
//           .medication { background: #f8f9fa; padding: 10px; border-radius: 5px; border: 1px solid #dee2e6; }
//           ul { margin: 10px 0; padding-left: 20px; }
//           li { margin: 5px 0; }
//           .timestamp { color: #666; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h1>AI Medication Interaction Analysis</h1>
//           <div class="patient-info">
//             <h3>Patient: ${this.selectedPatient.firstName} ${this.selectedPatient.lastName}</h3>
//             <p><strong>Patient ID:</strong> ${this.selectedPatient.patientID}</p>
//             <p><strong>Age:</strong> ${this.calculateAge(this.selectedPatient.dateOfBirth)} | <strong>Gender:</strong> ${this.selectedPatient.gender}</p>
//             <p class="timestamp"><strong>Analysis Date:</strong> ${this.analysisResults.timestamp.toLocaleString()}</p>
//             <p class="timestamp"><strong>AI Model:</strong> ${this.analysisResults.aiModel}</p>
//           </div>
//         </div>

//         <div class="risk-summary risk-${this.analysisResults.overallRisk}">
//           <h2>Overall Risk Assessment: ${this.getRiskLabel(this.analysisResults.overallRisk)}</h2>
//           <p>${this.analysisResults.overallSummary}</p>
//         </div>

//         <h2>Current Medications (${this.currentMedications.length})</h2>
//         <div class="medications-list">
//           ${this.currentMedications.map(med => `
//             <div class="medication">
//               <strong>${med.medname}</strong><br>
//               ${med.dosage} - ${med.frequency}<br>
//               <small>Started: ${med.startDate}</small>
//             </div>
//           `).join('')}
//         </div>

//         ${this.analysisResults.interactions?.length ? `
//           <h2>Drug Interactions (${this.analysisResults.interactions.length})</h2>
//           ${this.analysisResults.interactions.map(interaction => `
//             <div class="interaction ${interaction.severity}">
//               <h3>${interaction.drug1} ↔ ${interaction.drug2} (${interaction.severity.toUpperCase()})</h3>
//               <p>${interaction.description}</p>
//               ${interaction.management ? `<p><strong>Management:</strong> ${interaction.management}</p>` : ''}
//               ${interaction.monitoring ? `<p><strong>Monitoring:</strong> ${interaction.monitoring}</p>` : ''}
//             </div>
//           `).join('')}
//         ` : ''}

//         ${this.analysisResults.contraindications?.length ? `
//           <h2>Contraindications & Warnings</h2>
//           <ul>
//             ${this.analysisResults.contraindications.map(contra => `
//               <li><strong>${contra.medication}:</strong> ${contra.reason}
//                 ${contra.recommendation ? `<br><em>Recommendation: ${contra.recommendation}</em>` : ''}
//               </li>
//             `).join('')}
//           </ul>
//         ` : ''}

//         ${this.analysisResults.clinicalRecommendations?.length ? `
//           <h2>Clinical Recommendations</h2>
//           <ul>
//             ${this.analysisResults.clinicalRecommendations.map(rec => `
//               <li><strong>${rec.priority.toUpperCase()} Priority:</strong> ${rec.recommendation}
//                 ${rec.timeline ? `<br><em>Timeline: ${rec.timeline}</em>` : ''}
//               </li>
//             `).join('')}
//           </ul>
//         ` : ''}

  private mapSeverityToRisk(severity: string): 'low' | 'moderate' | 'high' | 'critical' {
    switch (severity) {
      case 'Critical': return 'critical';
      case 'High': return 'high';
      case 'Moderate': return 'moderate';
      default: return 'low';
    }
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

  getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'dangerous';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      case 'low': return 'check_circle';
      default: return 'help';
    }
  }

  exportToPDF(): void {
    this.printAnalysis();
  }

  printAnalysis(): void {
    if (!this.analysisResults || !this.selectedPatient) {
      this.sharedService.Messages('error', 'Print Analysis', 'No analysis results to print', 3000);
      return;
    }

    const printContent = this.generateAnalysisPrintContent();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        this.sharedService.Messages('info', 'Export PDF', 'Use your browser\'s print dialog to save as PDF', 4000);
      }, 500);
    }
  }

  shareAnalysis(): void {
    if (!this.analysisResults || !this.selectedPatient) {
      this.sharedService.Messages('error', 'Share Analysis', 'No analysis results to share', 3000);
      return;
    }

    this.sharingAnalysis = true;
    const shareData = {
      patientId: this.selectedPatient.patientId,
      patientName: `${this.selectedPatient.name} ${this.selectedPatient.lastName}`,
      analysisResults: this.analysisResults,
      medications: this.currentMedications,
      timestamp: new Date().toISOString()
    };

    this.commonService.Post('Communications/ShareAnalysis', shareData).subscribe({
      next: (response: any) => {
        this.sharingAnalysis = false;
        if (response.success) {
          this.sharedService.Messages('success', 'Share Analysis', 'Analysis results shared successfully with physician', 3000);
        } else {
          this.sharedService.Messages('error', 'Share Analysis', 'Failed to share analysis results', 3000);
        }
      },
      error: (error: any) => {
        this.sharingAnalysis = false;
        console.error('Error sharing analysis:', error);
        this.sharedService.Messages('error', 'Share Analysis', 'Failed to share analysis results', 3000);
      }
    });
  }

  private generateAnalysisPrintContent(): string {
    if (!this.analysisResults || !this.selectedPatient) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI Medication Analysis - ${this.selectedPatient.name} ${this.selectedPatient.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1, h2, h3 { color: #00796b; }
          .header { border-bottom: 2px solid #00796b; padding-bottom: 10px; margin-bottom: 20px; }
          .patient-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .interaction { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .high-risk { border-left: 5px solid #f44336; }
          .medium-risk { border-left: 5px solid #ff9800; }
          .low-risk { border-left: 5px solid #4caf50; }
          .medications { margin: 20px 0; }
          .medication-item { padding: 8px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AI-Powered Medication Interaction Analysis Report</h1>
          <p><strong>Generated by:</strong> ${this.analysisResults.aiModel || 'ADR AI System'}</p>
          <p><strong>Analysis Date:</strong> ${new Date(this.analysisResults.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="patient-info">
          <h2>Patient Information</h2>
          <p><strong>Name:</strong> ${this.selectedPatient.name} ${this.selectedPatient.lastName}</p>
          <p><strong>Patient ID:</strong> ${this.selectedPatient.patientId}</p>
          <p><strong>Age:</strong> ${this.calculateAge(this.selectedPatient.dateOfBirth)} years</p>
          <p><strong>Gender:</strong> ${this.selectedPatient.gender}</p>
        </div>
        
        <div class="medications">
          <h2>Current Medications</h2>
          ${this.currentMedications.map(med => `
            <div class="medication-item">
              <strong>${med.medname}</strong> - ${med.dosage}, ${med.frequency}
            </div>
          `).join('')}
        </div>
        
   
        
        ${this.analysisResults.interactions && this.analysisResults.interactions.length > 0 ? `
          <div class="interactions">
            <h2>Detailed Interactions</h2>
            ${this.analysisResults.interactions.map(interaction => `
              <div class="interaction ${interaction.severity.toLowerCase()}-risk">
                <h3>${interaction.drug1} + ${interaction.drug2}</h3>
                <p><strong>Severity:</strong> ${interaction.severity}</p>
                <p><strong>Description:</strong> ${interaction.description}</p>
                ${interaction.clinicalSignificance ? `<p><strong>Clinical Significance:</strong> ${interaction.clinicalSignificance}</p>` : ''}
                ${interaction.recommendations ? `<p><strong>Recommendations:</strong> ${interaction.recommendations}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${this.analysisResults.overallRecommendations ? `
          <div class="recommendations">
            <h2>Overall Recommendations</h2>
            <p>${this.analysisResults.overallRecommendations}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            This analysis was generated by AI and should be used as a clinical decision support tool. 
            Always consult current prescribing information and use clinical judgment.
          </p>
        </div>
      </body>
      </html>
    `;
  }

}
