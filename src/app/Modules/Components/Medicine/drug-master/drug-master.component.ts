import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
@Component({
  selector: 'app-drug-master',
  imports: [MatInputModule, MatSelectModule, MatCheckboxModule, ReactiveFormsModule, MatTableModule,MatIconModule, CommonModule],
  templateUrl: './drug-master.component.html',
  styleUrl: './drug-master.component.scss'
})
export class DrugMasterComponent {
 dataSource = new MatTableDataSource<any>([]);
  columnsToDisplay = [
    'drugName',
    'genericName',
    'brandName',
    'drugCode',
    'barcode',
    'strength',
    'dosageForm',
    'route',
    'unitPrice',
    'status',
    'actions'
  ];

  openDrugForm() {
    // open dialog or route to new drug form
  }

  downloadTemplate() {
    const headers = [
      'Drug Name', 'Generic Name', 'Brand Name', 'Drug Code', 'Barcode',
      'Strength', 'Dosage Form', 'Route of Administration', 'Indications',
      'Contraindications', 'Side Effects', 'Manufacturer', 'Supplier',
      'Country of Origin', 'Unit Price', 'Reorder Level', 'Expiry Alert (Months)',
      'Is Narcotic', 'Is Antibiotic', 'Is OTC', 'Schedule Type', 'Remarks', 'Status'
    ];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DrugMasterTemplate.csv';
    a.click();
  }

  uploadExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    // use xlsx library to read file and bind to table
  }

  editDrug(row: any) {
    // open drug edit form
  }

  deleteDrug(row: any) {
    // confirmation + delete
  }
}
