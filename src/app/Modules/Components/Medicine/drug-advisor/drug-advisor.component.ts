import { Component, inject, OnInit } from '@angular/core';
import { ChatServiceService } from '../chat-service.service';
import { DrugEvalResult } from '../Model';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonService } from '../../../../Service/common.service';

interface Drug {
  drugId?: number;
  drugName: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  unitPrice?: number;
  pack?: number;
  status?: string;
}

interface DosageOption {
  value: number;
  label: string;
  description: string;
}

interface CostCalculation {
  unitPrice: number;
  packSize: number;
  costPerItem: number;
  dosagePerDay: number;
  dailyCost: number;
  annualCost: number;
}

@Component({
  selector: 'app-drug-advisor',
  standalone: true,
  templateUrl: './drug-advisor.component.html',
  styleUrls: ['./drug-advisor.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ]
})
export class DrugAdvisorComponent implements OnInit {
  // Form Controls
  drugAControl = new FormControl<string | Drug>('');
  drugBControl = new FormControl<string | Drug>('');
  conditionControl = new FormControl('');
  private commonService = inject(CommonService);
  
  // Drug Lists
  allDrugs: Drug[] = [];
  filteredDrugsA!: Observable<Drug[]>;
  filteredDrugsB!: Observable<Drug[]>;

  // Selected Drugs
  selectedDrugA?: Drug;
  selectedDrugB?: Drug;

  // Dosage Options
  dosageOptionsA: DosageOption[] = [];
  dosageOptionsB: DosageOption[] = [];
  selectedDosageA?: number;
  selectedDosageB?: number;

  // Cost Calculations
  drugACalculation?: CostCalculation;
  drugBCalculation?: CostCalculation;

  // Results
  result?: any;
  loading = false;
  calculationMethod: 'api' | 'ai' | null = null;
  hintMessage = '';

  // Common dosage options (times per day)
  commonDosages: DosageOption[] = [
    { value: 1, label: 'Once daily (OD)', description: '1 time per day' },
    { value: 2, label: 'Twice daily (BD)', description: '2 times per day' },
    { value: 3, label: 'Three times daily (TDS)', description: '3 times per day' },
    { value: 4, label: 'Four times daily (QID)', description: '4 times per day' }
  ];

  constructor(private chatService: ChatServiceService) {}

  ngOnInit() {
    this.loadDrugsFromAPI();
    this.setupAutocomplete();
  }

  // Setup autocomplete after data is loaded
  setupAutocomplete() {
    this.filteredDrugsA = this.drugAControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const filterValue = this._normalizeValue(value);
        return filterValue ? this._filterDrugs(filterValue) : this.allDrugs.slice(0, 50);
      })
    );

    this.filteredDrugsB = this.drugBControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const filterValue = this._normalizeValue(value);
        return filterValue ? this._filterDrugs(filterValue) : this.allDrugs.slice(0, 50);
      })
    );
  }

  // Normalize the value to string for filtering
  private _normalizeValue(value: string | Drug | null): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.drugName || '';
  }

  // Filter drugs for autocomplete
  private _filterDrugs(searchText: string): Drug[] {
    if (!searchText || searchText.trim().length === 0) {
      return this.allDrugs.slice(0, 50);
    }

    const filterValue = searchText.toLowerCase().trim();
    
    const filtered = this.allDrugs.filter(drug => {
      const drugName = (drug.drugName || '').toLowerCase();
      const genericName = (drug.genericName || '').toLowerCase();
      const brandName = (drug.brandName || '').toLowerCase();
      const strength = (drug.strength || '').toLowerCase();

      return drugName.includes(filterValue) ||
             genericName.includes(filterValue) ||
             brandName.includes(filterValue) ||
             strength.includes(filterValue);
    });

    return filtered.slice(0, 50);
  }

  // Load drugs from your existing API
  loadDrugsFromAPI() {
    const payload = { Mode: 'GET' };

    this.commonService.Post('Drug/DrugMaster', payload).subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.result)) {
          this.allDrugs = res.result
            .filter((drug: any) => drug.status === 'Active')
            .map((drug: any) => ({
              drugId: drug.drugId || drug.DrugId,
              drugName: drug.drugName || drug.DrugName || '',
              genericName: drug.genericName || drug.GenericName || '',
              brandName: drug.brandName || drug.BrandName || '',
              strength: drug.strength || drug.Strength || '',
              dosageForm: drug.dosageForm || drug.DosageForm || '',
              unitPrice: drug.unitPrice || drug.UnitPrice || 0,
              pack: drug.pack || drug.Pack || 1,
              status: drug.status || drug.Status || 'Active'
            }));

          console.log('Loaded drugs:', this.allDrugs.length);
          this.setupAutocomplete();
        }
      },
      error: (err: any) => {
        console.error('Error loading drugs:', err);
        this.allDrugs = [];
      }
    });
  }

  // Display function for autocomplete
  displayDrug(drug: Drug | string | null): string {
    if (!drug) return '';
    if (typeof drug === 'string') return drug;
    
    let display = drug.drugName;
    if (drug.strength) {
      display += ` - ${drug.strength}`;
    }
    return display;
  }

  // Calculate cost per item for a drug
  getCostPerItem(drug: Drug): string {
    if (!drug || !drug.unitPrice) return '0.00';
    const packSize = drug.pack || 1;
    const costPerItem = drug.unitPrice / packSize;
    return costPerItem.toFixed(2);
  }

  // Calculate daily cost for a drug with dosage
  getDailyCost(drug: Drug, dosage: number): string {
    if (!drug || !drug.unitPrice || !dosage) return '0.00';
    const packSize = drug.pack || 1;
    const costPerItem = drug.unitPrice / packSize;
    const dailyCost = costPerItem * dosage;
    return dailyCost.toFixed(2);
  }

  // Perform full cost calculation for a drug
  calculateDrugCost(drug: Drug, dosage: number): CostCalculation {
    const packSize = drug.pack || 1;
    const unitPrice = drug.unitPrice || 0;
    const costPerItem = unitPrice / packSize;
    const dailyCost = costPerItem * dosage;
    const annualCost = dailyCost * 365;

    return {
      unitPrice,
      packSize,
      costPerItem,
      dosagePerDay: dosage,
      dailyCost,
      annualCost
    };
  }

  // When Drug A is selected from dropdown
  onDrugASelected(drug: Drug) {
    console.log('Drug A selected:', drug);
    this.selectedDrugA = drug;
    this.dosageOptionsA = [...this.commonDosages];
    this.selectedDosageA = undefined;
    this.drugACalculation = undefined;
    this.updateCalculationMethod();
  }

  // When Drug B is selected from dropdown
  onDrugBSelected(drug: Drug) {
    console.log('Drug B selected:', drug);
    this.selectedDrugB = drug;
    this.dosageOptionsB = [...this.commonDosages];
    this.selectedDosageB = undefined;
    this.drugBCalculation = undefined;
    this.updateCalculationMethod();
  }

  // Update calculation method based on selections
  updateCalculationMethod() {
    const drugAValue = this.drugAControl.value;
    const drugBValue = this.drugBControl.value;

    const isDrugAFromAPI = this.selectedDrugA && typeof drugAValue === 'object';
    const isDrugBFromAPI = this.selectedDrugB && typeof drugBValue === 'object';

    // Calculate costs if drugs and dosages are selected
    if (this.selectedDrugA && this.selectedDosageA) {
      this.drugACalculation = this.calculateDrugCost(this.selectedDrugA, this.selectedDosageA);
    }

    if (this.selectedDrugB && this.selectedDosageB) {
      this.drugBCalculation = this.calculateDrugCost(this.selectedDrugB, this.selectedDosageB);
    }

    if (isDrugAFromAPI && isDrugBFromAPI && this.selectedDosageA && this.selectedDosageB) {
      this.calculationMethod = 'api';
      this.hintMessage = '✅ Using our database for accurate per-item cost calculation';
    } else if (drugAValue && drugBValue && !isDrugAFromAPI && !isDrugBFromAPI) {
      this.calculationMethod = 'ai';
      this.hintMessage = '🤖 Using AI for pharmacoeconomic analysis';
    } else {
      this.calculationMethod = null;
      this.hintMessage = '⚠️ Please select both drugs from our database or enter both manually for AI analysis';
    }
  }

  // Calculate cost-benefit using local API data (per item basis)
  calculateLocalCostBenefit(): any {
    if (!this.selectedDrugA || !this.selectedDrugB || 
        !this.selectedDosageA || !this.selectedDosageB) {
      return null;
    }

    // Calculate costs using per-item basis
    const calcA = this.calculateDrugCost(this.selectedDrugA, this.selectedDosageA);
    const calcB = this.calculateDrugCost(this.selectedDrugB, this.selectedDosageB);

    // Store calculations for UI display
    this.drugACalculation = calcA;
    this.drugBCalculation = calcB;

    // Calculate difference and percentage
    const costDifference = Math.abs(calcA.annualCost - calcB.annualCost);
    const percentageDiff = calcA.annualCost > 0 || calcB.annualCost > 0 
      ? ((costDifference / Math.max(calcA.annualCost, calcB.annualCost)) * 100).toFixed(2)
      : '0.00';

    // Determine recommendation
    let recommendation = '';
    
    if (calcA.annualCost < calcB.annualCost) {
      recommendation = `${this.selectedDrugA.drugName} is more cost-effective, saving ₹${costDifference.toFixed(2)} annually (${percentageDiff}% cheaper). `;
      recommendation += `At ₹${calcA.costPerItem.toFixed(2)} per item, it costs only ₹${calcA.dailyCost.toFixed(2)} per day.`;
    } else if (calcB.annualCost < calcA.annualCost) {
      recommendation = `${this.selectedDrugB.drugName} is more cost-effective, saving ₹${costDifference.toFixed(2)} annually (${percentageDiff}% cheaper). `;
      recommendation += `At ₹${calcB.costPerItem.toFixed(2)} per item, it costs only ₹${calcB.dailyCost.toFixed(2)} per day.`;
    } else {
      recommendation = `Both medications have similar annual costs at ₹${calcA.annualCost.toFixed(2)}. Consider other clinical factors for selection.`;
    }

    return {
      summary: `Cost comparison between ${this.selectedDrugA.drugName} (${this.selectedDosageA}x daily) and ${this.selectedDrugB.drugName} (${this.selectedDosageB}x daily) for ${this.conditionControl.value || 'treatment'}.`,
      drugACalc: calcA,
      drugBCalc: calcB,
      costDifference: costDifference,
      percentageDiff: percentageDiff,
      annualCostsA: `₹${calcA.annualCost.toFixed(2)} per year`,
      annualCostsB: `₹${calcB.annualCost.toFixed(2)} per year`,
      icer: `Cost difference: ₹${costDifference.toFixed(2)} per year (${percentageDiff}% difference). Daily difference: ₹${(costDifference / 365).toFixed(2)}.`,
      recommendation: recommendation,
      calculationSource: 'Local Database (Per-Item Calculation)'
    };
  }

  /**
   * Get display name for Drug A (handles both database and manual entry)
   */
  getDrugADisplayName(): string {
    const drugAValue = this.drugAControl.value;
    
    // If drug is from database
    if (this.selectedDrugA && typeof drugAValue === 'object') {
      return this.selectedDrugA.drugName + (this.selectedDrugA.strength ? ` - ${this.selectedDrugA.strength}` : '');
    }
    
    // If drug is manually typed
    if (typeof drugAValue === 'string') {
      return drugAValue;
    }
    
    // If it's an object but not in our database (edge case)
    if (drugAValue && typeof drugAValue === 'object') {
      return this.displayDrug(drugAValue);
    }
    
    return 'Drug A';
  }

  /**
   * Get display name for Drug B (handles both database and manual entry)
   */
  getDrugBDisplayName(): string {
    const drugBValue = this.drugBControl.value;
    
    // If drug is from database
    if (this.selectedDrugB && typeof drugBValue === 'object') {
      return this.selectedDrugB.drugName + (this.selectedDrugB.strength ? ` - ${this.selectedDrugB.strength}` : '');
    }
    
    // If drug is manually typed
    if (typeof drugBValue === 'string') {
      return drugBValue;
    }
    
    // If it's an object but not in our database (edge case)
    if (drugBValue && typeof drugBValue === 'object') {
      return this.displayDrug(drugBValue);
    }
    
    return 'Drug B';
  }

  // Main evaluation function
  evaluate() {
    const drugAValue = this.drugAControl.value;
    const drugBValue = this.drugBControl.value;
    const condition = this.conditionControl.value;

    if (!drugAValue || !drugBValue) {
      alert('Please enter both Drug A and Drug B');
      return;
    }

    this.loading = true;
    this.result = null;

    // Check if both drugs are from API with dosages selected
    if (this.selectedDrugA && this.selectedDrugB && 
        this.selectedDosageA && this.selectedDosageB) {
      // Use local per-item calculation
      setTimeout(() => {
        this.result = this.calculateLocalCostBenefit();
        this.loading = false;
      }, 500);
    } else {
      // Use AI analysis - properly extract drug names
      let drugADisplay = '';
      let drugBDisplay = '';

      // Get Drug A name
      if (typeof drugAValue === 'object' && drugAValue) {
        drugADisplay = this.displayDrug(drugAValue);
      } else if (typeof drugAValue === 'string') {
        drugADisplay = drugAValue;
      }

      // Get Drug B name
      if (typeof drugBValue === 'object' && drugBValue) {
        drugBDisplay = this.displayDrug(drugBValue);
      } else if (typeof drugBValue === 'string') {
        drugBDisplay = drugBValue;
      }

      // Validate that we have drug names
      if (!drugADisplay || !drugBDisplay) {
        this.loading = false;
        alert('Please ensure both drug names are properly entered');
        return;
      }

      const payload = {
        drugA: drugADisplay,
        drugB: drugBDisplay,
        condition: condition || 'general treatment'
      };

      console.log('AI Analysis Payload:', payload);

      this.chatService.evaluateDrug(payload).subscribe({
        next: (res) => {
          this.result = {
            ...res,
            calculationSource: 'AI Analysis'
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('AI Analysis Error:', err);
          this.loading = false;
          alert('Error getting AI analysis. Please try again.');
        }
      });
    }
  }

  // Reset form
  reset() {
    this.drugAControl.reset('');
    this.drugBControl.reset('');
    this.conditionControl.reset('');
    this.selectedDrugA = undefined;
    this.selectedDrugB = undefined;
    this.selectedDosageA = undefined;
    this.selectedDosageB = undefined;
    this.dosageOptionsA = [];
    this.dosageOptionsB = [];
    this.drugACalculation = undefined;
    this.drugBCalculation = undefined;
    this.result = null;
    this.calculationMethod = null;
    this.hintMessage = '';
  }
}