import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-drug-master',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './drug-master.component.html',
  styleUrl: './drug-master.component.scss'
})
export class DrugMasterComponent {

  dataSource = new MatTableDataSource<any>([]);
  columnsToDisplay = [
    'drugName', 'genericName', 'brandName', 'drugCode', 'barcode',
    'strength', 'dosageForm', 'route', 'unitPrice', 'status', 'actions'
  ];

  constructor() {
    // Initial mock data
    this.dataSource.data = [
      {
        drugName: 'Paracetamol',
        genericName: 'Acetaminophen',
        brandName: 'Crocin',
        drugCode: 'DRG001',
        barcode: '8901234567890',
        strength: '500 mg',
        dosageForm: 'Tablet',
        route: 'Oral',
        unitPrice: 1.5,
        status: 'Active'
      },
      {
        drugName: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        drugCode: 'DRG002',
        barcode: '8901234567891',
        strength: '250 mg',
        dosageForm: 'Capsule',
        route: 'Oral',
        unitPrice: 2.0,
        status: 'Active'
      }
    ];
  }

  // ADD new drug (for now, mock form)
  openDrugForm() {
    const newDrug = {
      drugName: 'New Drug',
      genericName: 'Generic',
      brandName: 'Brand',
      drugCode: 'DRG' + (this.dataSource.data.length + 1).toString().padStart(3, '0'),
      barcode: '89012345678' + (10 + this.dataSource.data.length),
      strength: '100 mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unitPrice: 1.0,
      status: 'Active'
    };
    this.dataSource.data = [...this.dataSource.data, newDrug];
  }

  editDrug(row: any) {
    // Replace with dialog/form in real case
    row.drugName = prompt('Edit Drug Name', row.drugName) || row.drugName;
    this.refreshTable();
  }

  deleteDrug(row: any) {
    if (confirm(`Delete ${row.drugName}?`)) {
      this.dataSource.data = this.dataSource.data.filter(d => d !== row);
    }
  }

  // Excel Template Download
  downloadTemplate() {
    const headers = [
      'Drug Name', 'Generic Name', 'Brand Name', 'Drug Code', 'Barcode',
      'Strength', 'Dosage Form', 'Route of Administration', 'Indications',
      'Contraindications', 'Side Effects', 'Manufacturer', 'Supplier',
      'Country of Origin', 'Unit Price', 'Reorder Level', 'Expiry Alert (Months)',
      'Is Narcotic', 'Is Antibiotic', 'Is OTC', 'Schedule Type', 'Remarks', 'Status'
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'DrugMasterTemplate.xlsx');
  }

  // Download current table data as Excel
  downloadExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DrugMaster');
    XLSX.writeFile(wb, 'DrugMasterData.xlsx');
  }

  // Upload Excel
  uploadExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      this.dataSource.data = data as any[];
    };
    reader.readAsBinaryString(file);
  }

  refreshTable() {
    this.dataSource.data = [...this.dataSource.data];
  }
}
