import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService } from '../../../../Service/common.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { ADRPayload } from '../../../Interface/Adr';

// export interface Adr {
//   id: number;
//   title: string;
//   description: string;
//   decisionDate: string;
//   status: string;
// }

interface ADRReport {
  patient?: {
    patientonsetage?: string;
    patientsex?: string;
    patientweight?: string;
  };
  patientdrug?: { medicinalproduct: string; drugadministrationroute?: string }[];
  patientreaction?: { reactionmeddrapt: string }[];
  serious?: string;
  seriousnessdeath?: string;
  receiptdate?: string;
}
@Component({
  selector: 'app-adr',
   imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule,MatTableModule],
  templateUrl: './adr.component.html',
  styleUrl: './adr.component.scss'
})
export class ADRComponent {

  payload: ADRPayload = {
    patient: {
      patientId: '',
      firstName: '',
      lastName: '',
      age: 0,
      gender: ''
    },
    drug: {
      drugName: '',
      dosage: ''
    },
    adverseEvent: {
      eventDescription: ''
    },
    reporter: {
      reporterType: '',
      reporterName: ''
    },
    optional: {
      concomitantDrugs: [],
      labResults: [],
      attachments: [],
      comments: ''
    }
  };
//   private fb = inject(FormBuilder);

//   adrForm!: FormGroup;
//   adrs: any[] = [];
//   isEditing = false;
//   editId: number | null = null;

//   ngOnInit(): void {
//     this.adrForm = this.fb.group({
//       patientName: ['', Validators.required],
//       drugName: ['', Validators.required],
//       reaction: ['', Validators.required],
//       severity: ['', Validators.required],
//       isSerious: [false]
//     });

//     this.loadAdrs();
//   }

//   loadAdrs() {
//     // this.http.get<any[]>('https://localhost:5001/api/adrs')
//     //   .subscribe(res => this.adrs = res);
//   }

//   submit() {
//     if (this.adrForm.invalid) return;

//     if (this.isEditing && this.editId !== null) {
//       // this.http.put(`https://localhost:5001/api/adrs/${this.editId}`, this.adrForm.value)
//       //   .subscribe(() => {
//       //     this.loadAdrs();
//       //     this.resetForm();
//       //   });
//     } else {
//       // this.http.post('https://localhost:5001/api/adrs', this.adrForm.value)
//       //   .subscribe(() => {
//       //     this.loadAdrs();
//       //     this.resetForm();
//       //   });
//     }
//   }

//   edit(adr: any) {
//     this.adrForm.patchValue(adr);
//     this.isEditing = true;
//     this.editId = adr.id;
//   }

//   delete(id: number) {
//     // this.http.delete(`https://localhost:5001/api/adrs/${id}`)
//     //   .subscribe(() => this.loadAdrs());
//   }

//   resetForm() {
//     this.adrForm.reset();
//     this.isEditing = false;
//     this.editId = null;
//   }


 reports: ADRReport[] = [];
  columns = ['patient', 'drugs', 'reactions', 'outcome'];

  constructor(private http: HttpClient, private adrService :CommonService) {}

  ngOnInit(): void {
    // Example query: ADRs involving "paracetamol"
    this.http
      .get<any>('https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:paracetamol&limit=5')
      .subscribe({
        next: (res) => (this.reports = res.results),
        error: (err) => console.error('API error', err),
      });
  }

  mapSex(sex?: string): string {
    if (sex === '1') return 'Male';
    if (sex === '2') return 'Female';
    return 'Unknown';
  }

  


  addConcomitantDrug() {
    this.payload.optional?.concomitantDrugs?.push({
      drugName: '',
      dosage: ''
    });
  }

  addLabResult() {
    this.payload.optional?.labResults?.push({
      testName: '',
      result: ''
    });
  }

  addAttachment(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.payload.optional?.attachments?.push({
        fileName: file.name,
        fileType: file.type,
        base64Data: (reader.result as string).split(',')[1] // Remove data:image prefix
      });
    };
    reader.readAsDataURL(file);
  }
adrPayload = {
    safetyreportid: '12345678-9',
    receivedate: '2025-08-22',
    patient: {
      age: 45,
      ageunit: 'YEARS',
      sex: 'M',
      weight: 70,
      weightunit: 'KG',
    },
    reaction: [
      {
        reactionmeddrapt: 'Headache',
        reactionmeddraversionpt: '10000001',
        reactionoutcome: '1',
      },
    ],
    drug: [
      {
        openfda: {
          brand_name: ['Paracetamol'],
          generic_name: ['Paracetamol'],
          manufacturer_name: ['Acme Pharmaceuticals'],
        },
        drugindication: 'Pain relief',
        drugdosageform: 'Tablet',
        drugroute: 'Oral',
        doseage: '500 mg',
        doseageunit: 'MG',
        drugstartdate: '2025-08-20',
        drugenddate: '2025-08-22',
      },
    ],
  };
  submitADR() {
    this.adrService.submitADR(this.adrPayload).subscribe({
      next: (res) => {
        console.log('ADR submitted successfully', res);
      },
      error: (err) => {
        console.error('Error submitting ADR', err);
      }
    });
  }
 }
