import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../Service/common.service';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { UniquePipe } from "../../../pipes/unique.pipe";
import { DrugAdvisorComponent } from "../drug-advisor/drug-advisor.component";
import { MatIcon } from "@angular/material/icon";
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-drug-price-compare',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    UniquePipe,
    DrugAdvisorComponent,
    MatIcon
],
  templateUrl: './drug-price-compare.component.html',
  styleUrls: ['./drug-price-compare.component.scss']
})
export class DrugPriceCompareComponent implements OnInit {
  form!: FormGroup;
  results: any[] = [];
  loading = false;
  drugList: any[] = [];
  selectedDrug: any[] = [];
  packSizes: string[] = [];
  strengths: string[] = [];
    filteredDrugs!: Observable<any[]>; // Add this

  private cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder, private http: CommonService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      medname: [''],
      strength: [''],
      Packsize: ['']
    });

    this.loadDrugs();

    // When strength or pack size changes, filter results
    this.form.get('strength')?.valueChanges.subscribe(() => {
    setTimeout(() => this.filterResults(), 0);
  });
  
  this.form.get('Packsize')?.valueChanges.subscribe(() => {
    setTimeout(() => this.filterResults(), 0);
  });
   this.filteredDrugs = this.form.get('medname')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDrugs(value || ''))
    );
    // Reset everything when medname changes manually
    this.form.get('medname')?.valueChanges.subscribe((value) => {
      if (!this.selectedDrug.length || value !== this.selectedDrug[0]?.drugName) {
        this.form.patchValue({ strength: '', Packsize: '' }, { emitEvent: false });
        this.selectedDrug = [];
        this.packSizes = [];
        this.results = [];
        this.cdr.detectChanges();
      }
    });
  }

   private _filterDrugs(value: string): any[] {
    const filterValue = value.toLowerCase();
    
    // Get unique drugs
    const uniqueDrugs = this.drugList.filter((drug, index, self) =>
      index === self.findIndex(d => d.drugName === drug.drugName)
    );

    // Filter based on search term
    return uniqueDrugs.filter(drug =>
      drug.drugName.toLowerCase().includes(filterValue) ||
      drug.genericName.toLowerCase().includes(filterValue)
    );
  }
displayFn(value: string): string {
  return value || '';
}
  loadDrugs() {
    this.http.Post('Drug/DrugMaster', { Mode: 'GET' }).subscribe({
      next: (res: any) => {
        this.drugList = Array.isArray(res.result) ? res.result : [];
      },
      error: (err) => {
        console.error('Error loading drug list', err);
        this.drugList = [];
      }
    });
  }
showCoach = false;
  closeCoach() {
    this.showCoach = false;
  }
  onDrugSelected(event: any) {

    const selectedDrugName = event.option.value;

    // Filter selected drug from drugList
    this.selectedDrug = this.drugList.filter(d => d.drugName === selectedDrugName);

    // Extract unique strengths and pack sizes
    this.strengths = [...new Set(this.selectedDrug.map(d => d.strength))];
    this.packSizes = this.extractPackSizes(this.selectedDrug);

    // Reset form fields and results
    this.form.patchValue({ strength: '', Packsize: '' }, { emitEvent: false });
    this.results = [];
    this.cdr.detectChanges();
  }

  extractPackSizes(drugList: any[]): string[] {
    return drugList
      .map(d => {
        const parts = d.brandName.trim().split(' ');
        return parts[parts.length - 1];
      })
      .filter((v, i, self) => self.indexOf(v) === i);
  }

  searchMedicine() {
    const query = this.form.value.medname?.trim();
    const strength = this.form.value.strength?.trim();
    const packsize = this.form.value.Packsize?.trim();

    if (!query) return;

    // Filter results locally based on selections
    this.results = this.selectedDrug.filter(drug => {
      const matchStrength = !strength || drug.strength === strength;
      const matchPack = !packsize || drug.brandName.endsWith(packsize);
      return matchStrength && matchPack;
    });

    this.cdr.detectChanges();
  }

  /** Automatically filter results when strength or pack size changes */
// ngOnInit(): void {
//   this.form = this.fb.group({
//     medname: [''],
//     strength: [''],
//     Packsize: ['']
//   });

//   this.loadDrugs();

//   // When strength or pack size changes, filter results with a slight delay
//   this.form.get('strength')?.valueChanges.subscribe(() => {
//     setTimeout(() => this.filterResults(), 0);
//   });
  
//   this.form.get('Packsize')?.valueChanges.subscribe(() => {
//     setTimeout(() => this.filterResults(), 0);
//   });

//   // Reset everything when medname changes manually
//   this.form.get('medname')?.valueChanges.subscribe((value) => {
//     if (!this.selectedDrug.length || value !== this.selectedDrug[0]?.drugName) {
//       this.form.patchValue({ strength: '', Packsize: '' }, { emitEvent: false });
//       this.selectedDrug = [];
//       this.packSizes = [];
//       this.results = [];
//       this.cdr.detectChanges();
//     }
//   });
// }

/** Automatically filter results when strength or pack size changes */
filterResults() {
  if (this.selectedDrug.length === 0) {
    this.results = [];
    return;
  }

  const strength = this.form.value.strength?.trim();
  const packsize = this.form.value.Packsize?.trim();

  this.results = this.selectedDrug.filter(drug => {
    const matchStrength = !strength || drug.strength === strength;
    const matchPack = !packsize || drug.brandName.endsWith(packsize);
    return matchStrength && matchPack;
  });

  this.cdr.detectChanges();
}

  cancel() {
    this.form.reset();
    this.selectedDrug = [];
    this.packSizes = [];
    this.results = [];
    this.loadDrugs();
  }
}
