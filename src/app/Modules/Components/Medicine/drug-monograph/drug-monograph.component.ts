import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { Subject, takeUntil } from 'rxjs';


interface DrugMonograph {
  genericName: string;
  brandNames?: string[];
  classifications?: string[];
  strength?: string;
  dosageForm?: string;
  routeOfAdministration?: string;
  mechanismOfAction?: string;
  pharmacokinetics?: string;
  indications?: {
    condition: string;
    description?: string;
    type: 'primary' | 'secondary' | 'off-label';
  }[];
  dosageInfo?: {
    population: string;
    indication: string;
    initialDose: string;
    maintenanceDose?: string;
    maxDose?: string;
    frequency: string;
    duration?: string;
    specialInstructions?: string;
  }[];
  sideEffects?: {
    common?: { name: string; frequency?: string; description?: string; }[];
    uncommon?: { name: string; frequency?: string; description?: string; }[];
    rare?: { name: string; frequency?: string; description?: string; }[];
    serious?: { name: string; frequency?: string; description?: string; }[];
  };
  blackBoxWarnings?: {
    title: string;
    description: string;
  }[];
  contraindications?: string[];
  precautions?: string[];
  drugInteractions?: {
    drug: string;
    severity: 'Major' | 'Moderate' | 'Minor';
    description: string;
    management?: string;
  }[];
  monitoring?: {
    laboratory?: {
      parameter: string;
      frequency: string;
      notes?: string;
    }[];
    clinical?: {
      parameter: string;
      frequency: string;
      notes?: string;
    }[];
  };
}

@Component({
  selector: 'app-drug-monograph',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './drug-monograph.component.html',
  styleUrls: ['./drug-monograph.component.scss']
})
export class DrugMonographComponent implements OnInit, OnDestroy {
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
  private destroy$ = new Subject<void>();

  searchTerm = '';
  selectedDrug: DrugMonograph | null = null;
  isLoading = false;
  searchPerformed = false;
  selectedTabIndex = 0;
  recentDrugs: string[] = [];

  ngOnInit(): void {
    this.loadRecentSearches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    // Optional: Implement autocomplete or real-time search suggestions
  }

  searchDrug(): void {
    if (!this.searchTerm.trim()) {
      this.sharedService.Messages('warning', 'Search', 'Please enter a drug name to search', 3000);
      return;
    }

    this.isLoading = true;
    this.searchPerformed = true;
    this.selectedDrug = null;

    // First try to get from API
    this.commonService.Post("api/ADR/checkmono", { description: this.searchTerm.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if ( response.severity) {
            this.selectedDrug = response.severity;
            this.addToRecentSearches(this.searchTerm.trim());
            this.selectedTabIndex = 0; // Reset to first tab
          } else {
            // If API doesn't have data, use mock data for demonstration
            this.loadMockData();
          }
        },
        error: (error) => {
          console.error('Error searching drug monograph:', error);
          this.isLoading = false;
          // Fallback to mock data for demonstration
          this.loadMockData();
        }
      });
  }

  private loadMockData(): void {
    // Mock data for demonstration - replace with actual API data
    const mockDrugs: { [key: string]: DrugMonograph } = {
      'metformin': {
        genericName: 'Metformin',
        brandNames: ['Glucophage', 'Fortamet', 'Glumetza'],
        classifications: ['Antidiabetic', 'Biguanide'],
        strength: '500mg, 850mg, 1000mg',
        dosageForm: 'Tablet, Extended-release tablet',
        routeOfAdministration: 'Oral',
        mechanismOfAction: 'Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.',
        pharmacokinetics: 'Bioavailability: 50-60%. Peak plasma concentration: 2.5 hours. Half-life: 6.2 hours. Eliminated unchanged in urine.',
        indications: [
          {
            condition: 'Type 2 Diabetes Mellitus',
            description: 'First-line therapy for type 2 diabetes as monotherapy or in combination with other antidiabetic agents',
            type: 'primary'
          },
          {
            condition: 'Polycystic Ovary Syndrome (PCOS)',
            description: 'Used to improve insulin sensitivity and regulate menstrual cycles',
            type: 'off-label'
          }
        ],
        dosageInfo: [
          {
            population: 'Adults',
            indication: 'Type 2 Diabetes',
            initialDose: '500mg twice daily or 850mg once daily',
            maintenanceDose: '1000mg twice daily',
            maxDose: '2550mg daily',
            frequency: 'Twice daily with meals',
            duration: 'Long-term therapy',
            specialInstructions: 'Take with food to reduce GI side effects. Increase dose gradually every 1-2 weeks.'
          }
        ],
        sideEffects: {
          common: [
            { name: 'Nausea', frequency: '25-30%', description: 'Usually transient, improves with continued use' },
            { name: 'Diarrhea', frequency: '20-25%', description: 'Most common GI side effect' },
            { name: 'Abdominal pain', frequency: '15-20%' },
            { name: 'Metallic taste', frequency: '10-15%' }
          ],
          uncommon: [
            { name: 'Vitamin B12 deficiency', frequency: '5-10%', description: 'Long-term use may decrease B12 absorption' },
            { name: 'Headache', frequency: '5-8%' }
          ],
          rare: [
            { name: 'Lactic acidosis', frequency: '<0.1%', description: 'Rare but serious complication' }
          ]
        },
        blackBoxWarnings: [
          {
            title: 'Lactic Acidosis',
            description: 'Metformin can cause a rare but serious condition called lactic acidosis that can be fatal. Risk factors include kidney disease, liver disease, heart failure, and conditions that can cause low oxygen levels.'
          }
        ],
        contraindications: [
          'Severe renal impairment (eGFR <30 mL/min/1.73m²)',
          'Acute or chronic metabolic acidosis',
          'Diabetic ketoacidosis',
          'Hypersensitivity to metformin'
        ],
        precautions: [
          'Monitor renal function before and during treatment',
          'Discontinue before iodinated contrast procedures',
          'Use caution in elderly patients',
          'Monitor for signs of lactic acidosis'
        ],
        drugInteractions: [
          {
            drug: 'Iodinated contrast agents',
            severity: 'Major',
            description: 'Increased risk of lactic acidosis due to potential acute renal failure',
            management: 'Discontinue metformin 48 hours before and after contrast procedure'
          },
          {
            drug: 'Alcohol',
            severity: 'Moderate',
            description: 'Increased risk of lactic acidosis',
            management: 'Limit alcohol consumption'
          }
        ],
        monitoring: {
          laboratory: [
            { parameter: 'Renal function (serum creatinine/eGFR)', frequency: 'Every 3-6 months', notes: 'More frequent if risk factors present' },
            { parameter: 'HbA1c', frequency: 'Every 3 months initially, then every 6 months', notes: 'Target <7% for most patients' },
            { parameter: 'Vitamin B12', frequency: 'Annually', notes: 'Long-term monitoring recommended' }
          ],
          clinical: [
            { parameter: 'Blood glucose', frequency: 'As clinically indicated', notes: 'Patient self-monitoring' },
            { parameter: 'Signs of lactic acidosis', frequency: 'Each visit', notes: 'Muscle pain, difficulty breathing, stomach pain' }
          ]
        }
      },
      'lisinopril': {
        genericName: 'Lisinopril',
        brandNames: ['Prinivil', 'Zestril'],
        classifications: ['ACE Inhibitor', 'Antihypertensive'],
        strength: '2.5mg, 5mg, 10mg, 20mg, 40mg',
        dosageForm: 'Tablet',
        routeOfAdministration: 'Oral',
        mechanismOfAction: 'Inhibits angiotensin-converting enzyme (ACE), preventing conversion of angiotensin I to angiotensin II, resulting in decreased vasoconstriction and aldosterone secretion.',
        indications: [
          {
            condition: 'Hypertension',
            description: 'First-line therapy for high blood pressure',
            type: 'primary'
          },
          {
            condition: 'Heart Failure',
            description: 'Reduces mortality and hospitalizations in heart failure patients',
            type: 'primary'
          }
        ],
        sideEffects: {
          common: [
            { name: 'Dry cough', frequency: '10-15%', description: 'Most common side effect, usually persistent' },
            { name: 'Dizziness', frequency: '5-10%' },
            { name: 'Headache', frequency: '5-8%' }
          ],
          uncommon: [
            { name: 'Hyperkalemia', frequency: '2-5%', description: 'Monitor potassium levels' },
            { name: 'Renal impairment', frequency: '1-3%' }
          ],
          rare: [
            { name: 'Angioedema', frequency: '<1%', description: 'Serious allergic reaction affecting face, lips, tongue' }
          ]
        }
      }
    };

    const drugKey = this.searchTerm.toLowerCase().trim();
    if (mockDrugs[drugKey]) {
      this.selectedDrug = mockDrugs[drugKey];
      this.addToRecentSearches(this.searchTerm.trim());
      this.selectedTabIndex = 0;
    }
    
    this.isLoading = false;
  }

  loadDrugMonograph(drugName: string): void {
    this.searchTerm = drugName;
    this.searchDrug();
  }

  clearSearch(): void {
    this.cancelCurrentSearch();
    this.searchTerm = '';
    this.selectedDrug = null;
    this.searchPerformed = false;
    this.selectedTabIndex = 0;
  }

  cancelCurrentSearch(): void {
    if (this.isLoading) {
      this.destroy$.next();
      this.isLoading = false;
    }
  }

  printMonograph(): void {
    if (!this.selectedDrug) return;

    const printContent = this.generateMonographPrintContent();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  exportToPDF(): void {
    // Implementation for PDF export would go here
    // Could use libraries like jsPDF or html2pdf
    this.sharedService.Messages('info', 'Export', 'PDF export functionality will be implemented', 3000);
  }

  showCurrentMedications(): void {
    const patientDetails = this.sharedService.patientDetails();
    const patientGlobal = this.sharedService.patient();
    const patient = patientDetails || patientGlobal;

    if (!patient) {
      this.sharedService.Messages('warning', 'Patient Required', 'Please select a patient to view current medications', 3000);
      return;
    }

    // Navigate to current medications component or show modal
    this.sharedService.Messages('info', 'Current Medications', `Showing medications for ${patient.patientName || patient.name}`, 3000);
    
    // You can implement navigation logic here
    // For example: this.router.navigate(['/current-medications']);
  }

  private generateMonographPrintContent(): string {
    if (!this.selectedDrug) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Drug Monograph - ${this.selectedDrug.genericName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2, h3 { color: #00796b; }
          .header { border-bottom: 2px solid #00796b; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; }
          .black-box { background-color: #f8d7da; border: 2px solid #dc3545; padding: 15px; margin: 15px 0; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 5px 0; }
          .no-break { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Drug Monograph: ${this.selectedDrug.genericName}</h1>
          <p><strong>Brand Names:</strong> ${this.selectedDrug.brandNames?.join(', ') || 'N/A'}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        ${this.selectedDrug.blackBoxWarnings?.length ? `
          <div class="section no-break">
            <h2>⚠️ BLACK BOX WARNINGS</h2>
            ${this.selectedDrug.blackBoxWarnings.map(warning => `
              <div class="black-box">
                <h3>${warning.title}</h3>
                <p>${warning.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section">
          <h2>General Information</h2>
          <p><strong>Generic Name:</strong> ${this.selectedDrug.genericName}</p>
          <p><strong>Classifications:</strong> ${this.selectedDrug.classifications?.join(', ') || 'N/A'}</p>
          <p><strong>Strength:</strong> ${this.selectedDrug.strength || 'N/A'}</p>
          <p><strong>Dosage Form:</strong> ${this.selectedDrug.dosageForm || 'N/A'}</p>
        </div>

        ${this.selectedDrug.indications?.length ? `
          <div class="section">
            <h2>Indications</h2>
            <ul>
              ${this.selectedDrug.indications.map(ind => `
                <li><strong>${ind.condition}</strong> (${ind.type})
                  ${ind.description ? `<br>${ind.description}` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="section">
          <h2>Important Safety Information</h2>
          ${this.selectedDrug.contraindications?.length ? `
            <h3>Contraindications</h3>
            <ul>
              ${this.selectedDrug.contraindications.map(contra => `<li>${contra}</li>`).join('')}
            </ul>
          ` : ''}
          
          ${this.selectedDrug.precautions?.length ? `
            <h3>Precautions</h3>
            <ul>
              ${this.selectedDrug.precautions.map(precaution => `<li>${precaution}</li>`).join('')}
            </ul>
          ` : ''}
        </div>

        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          This monograph is for informational purposes only. Always consult current prescribing information and clinical guidelines.
        </p>
      </body>
      </html>
    `;
  }

  private addToRecentSearches(drugName: string): void {
    const recent = this.recentDrugs.filter(drug => drug.toLowerCase() !== drugName.toLowerCase());
    recent.unshift(drugName);
    this.recentDrugs = recent.slice(0, 5); // Keep only last 5 searches
    
    // Save to localStorage
    localStorage.setItem('recentDrugSearches', JSON.stringify(this.recentDrugs));
  }

  private loadRecentSearches(): void {
    const saved = localStorage.getItem('recentDrugSearches');
    if (saved) {
      try {
        this.recentDrugs = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading recent searches:', error);
        this.recentDrugs = [];
      }
    }
  }
}
