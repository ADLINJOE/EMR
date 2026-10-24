import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-medication-print',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
    HttpClientModule
  ],
  templateUrl: './medication-print.component.html',
  styleUrls: ['./medication-print.component.scss', '../../../Shared/styles/table-template.scss']
})
export class MedicationPrintComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  medicationForm: FormGroup;
  currentDate = new Date();

  constructor() {
    this.medicationForm = this.fb.group({
      // Patient Information
      patientName: ['', Validators.required],
      patientId: [''],
      dateOfBirth: [''],
      age: [''],
      weight: [''],
      allergies: [''],
      
      // Doctor Information
      doctorName: ['', Validators.required],
      licenseNumber: [''],
      clinic: [''],
      contactNumber: [''],
      
      // Medications
      medications: this.fb.array([]),
      
      // Additional Notes
      notes: ['']
    });

    // Add initial medication row
    this.addMedication();
  }

  ngOnInit() {
    // Check for OCR data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['ocrData']) {
      this.populateFromOcrResults(navigation.extras.state['ocrData']);
    }
  }

  get medications(): FormArray {
    return this.medicationForm.get('medications') as FormArray;
  }

  createMedication(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      dosage: [''],
      frequency: [''],
      duration: [''],
      instructions: ['']
    });
  }

  addMedication() {
    this.medications.push(this.createMedication());
  }

  removeMedication(index: number) {
    if (this.medications.length > 1) {
      this.medications.removeAt(index);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  savePrescription() {
    if (this.medicationForm.valid) {
      const prescriptionData = {
        ...this.medicationForm.value,
        prescriptionDate: new Date(),
        prescriptionId: this.generatePrescriptionId()
      };

      this.http.post('/api/prescription/save', prescriptionData).subscribe({
        next: (res) => {
          console.log('Prescription saved successfully', res);
          // Show success message
        },
        error: (err) => {
          console.error('Save failed', err);
          // Show error message
        }
      });
    } else {
      this.medicationForm.markAllAsTouched();
    }
  }

  printForm() {
    // Hide main content and show only print template
    const printContent = document.getElementById('printTemplate');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Medical Prescription</title>
              <style>
                ${this.getPrintStyles()}
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  }

  previewForm() {
    // Show print template in a modal or new tab
    const printContent = document.getElementById('printTemplate');
    if (printContent) {
      printContent.style.display = 'block';
      // You can implement a modal here or navigate to a preview page
      setTimeout(() => {
        printContent.style.display = 'none';
      }, 5000);
    }
  }

  resetForm() {
    this.medicationForm.reset();
    // Clear medications array and add one empty medication
    while (this.medications.length !== 0) {
      this.medications.removeAt(0);
    }
    this.addMedication();
  }

  openOcrScanner() {
    // Navigate to OCR scanner component
    this.router.navigate(['/ocr-scanner'], { 
      queryParams: { returnUrl: '/medication-print' } 
    });
  }

  private generatePrescriptionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RX${timestamp}${random}`;
  }

  private getPrintStyles(): string {
    return `
      @media print {
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4;
          margin: 0;
          padding: 20px;
        }
        
        .print-template {
          display: block !important;
          width: 100%;
          max-width: none;
        }
        
        .print-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .print-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .print-date {
          margin-top: 5px;
          font-size: 14px;
        }
        
        .print-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .print-section h3 {
          background-color: #f0f0f0;
          padding: 5px 10px;
          margin: 0 0 10px 0;
          border: 1px solid #ccc;
          font-size: 14px;
          font-weight: bold;
        }
        
        .print-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .print-grid div {
          padding: 5px;
          border-bottom: 1px dotted #ccc;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .print-footer {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        
        .signature-line {
          text-align: center;
        }
        
        .signature-box {
          border-bottom: 1px solid #000;
          width: 200px;
          height: 50px;
          margin-top: 10px;
        }
        
        @page {
          margin: 1in;
          size: A4;
        }
      }
      
      .print-template {
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: #000;
      }
    `;
  }

  // Method to populate form from OCR results
  populateFromOcrResults(ocrData: any) {
    if (ocrData) {
      // Update patient information if available
      if (ocrData.patientInfo) {
        this.medicationForm.patchValue({
          patientName: ocrData.patientInfo.name || '',
          patientId: ocrData.patientInfo.id || '',
          age: ocrData.patientInfo.age || '',
          weight: ocrData.patientInfo.weight || ''
        });
      }

      // Update doctor information if available
      if (ocrData.doctorInfo) {
        this.medicationForm.patchValue({
          doctorName: ocrData.doctorInfo.name || '',
          licenseNumber: ocrData.doctorInfo.license || '',
          clinic: ocrData.doctorInfo.clinic || ''
        });
      }

      // Update medications if available
      if (ocrData.medications && ocrData.medications.length > 0) {
        // Clear existing medications
        while (this.medications.length !== 0) {
          this.medications.removeAt(0);
        }

        // Add medications from OCR
        ocrData.medications.forEach((med: any) => {
          const medicationGroup = this.fb.group({
            name: [med.name || '', Validators.required],
            dosage: [med.dosage || ''],
            frequency: [med.frequency || ''],
            duration: [med.duration || ''],
            instructions: [med.instructions || '']
          });
          this.medications.push(medicationGroup);
        });
      }

      // Update notes if available
      if (ocrData.notes) {
        this.medicationForm.patchValue({
          notes: ocrData.notes
        });
      }
    }
  }
}
