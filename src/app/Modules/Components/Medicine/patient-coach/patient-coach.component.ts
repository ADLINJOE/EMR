import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatServiceService } from '../chat-service.service';
import { CoachResponse, PatientRequest } from '../Model';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonService } from '../../../../Service/common.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-patient-coach',
  standalone: true,
  templateUrl: './patient-coach.component.html',
  styleUrls: ['./patient-coach.component.scss'],
  imports: [FormsModule]
})
export class PatientCoachComponent implements OnInit {
  age = 0;
  gender = 'Male';
  bpStr = '';
  glucoseStr = '';
  meds = '';
  result?: CoachResponse;
  error = '';
  loading = false;

  private sharedService = inject(SharedServiceService);
  private commonService = inject(CommonService);

  patientDetails = computed(() => this.sharedService.patientDetails());
  patientglobal = computed(() => this.sharedService.patient());

  constructor(private chatService: ChatServiceService) {}

  ngOnInit(): void {
    const ptDetails = this.patientglobal();
    const patDetails = this.patientDetails();
    const maindata = ptDetails ? ptDetails : patDetails;

    this.age = maindata.age ? maindata.age : 0;
    this.gender = maindata.gender ? maindata.gender : 'Male';

    this.loadAllData();
  }

  /**
   * 🔄 Load both vitals and medications together and stop loader once both finish
   */
  loadAllData() {
    this.loading = true;

    const details = this.patientDetails();
    const ptDetails = this.patientglobal();
    const patientId = details?.patientID ?? ptDetails?.patientId;

    const vitalsPayload = { mode: 'GET', patientId };
    const medsPayload = { Mode: 'GET', PatientId: patientId };

    const vitals$ = this.commonService.Post("CurrentMedication/Vitals", vitalsPayload);
    const meds$ = this.commonService.Post("CurrentMedication/currentmedication/", medsPayload);

    forkJoin([vitals$, meds$]).subscribe({
      next: ([vitalsRes, medsRes]: any) => {
        // ---------- Handle VITALS ----------
        if (vitalsRes?.success && Array.isArray(vitalsRes.result)) {
          const sortedVitals = vitalsRes.result.sort(
            (a: any, b: any) => new Date(b.readingDateTime).getTime() - new Date(a.readingDateTime).getTime()
          );

          const bpValues: string[] = [];
          const sugarValues: string[] = [];

          for (const item of sortedVitals) {
            const bp = `${item.systolic}-${item.diastolic}`;
            const sugar = `${item.sugarFasting}-${item.sugarPP}`;
            bpValues.push(bp);
            sugarValues.push(sugar);
          }

          this.bpStr = bpValues.join(', ');
          this.glucoseStr = sugarValues.join(', ');
        }

        // ---------- Handle MEDICATIONS ----------
        if (medsRes?.success && Array.isArray(medsRes.result)) {
          const sortedMeds = medsRes.result.sort(
            (a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );

          const Medications = sortedMeds.map((item: any) => item.medname);
          this.meds = Medications.join(', ');
        }
      },
      error: (err) => {
        console.error('Data loading error:', err);
        this.error = 'Unable to load data';
      },
      complete: () => {
        // ✅ Loader stops only after both API calls complete
        this.loading = false;
      }
    });
  }

  analyze() {
    this.error = '';
    const req: PatientRequest = {
      age: this.age,
      gender: this.gender,
      bpReadings: this.bpStr.split(',').map(x => Number(x.trim())).filter(x => !isNaN(x)),
      glucoseReadings: this.glucoseStr.split(',').map(x => Number(x.trim())).filter(x => !isNaN(x)),
      medications: this.meds.split(',').map(x => x.trim()).filter(x => x.length > 0)
    };

    this.loading = true;
    this.result = undefined;

    this.chatService.analyzePatient(req).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Unable to analyze data. Please try again later.';
        this.loading = false;
      }
    });
  }
}
