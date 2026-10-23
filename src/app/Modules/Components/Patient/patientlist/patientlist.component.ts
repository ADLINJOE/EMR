import { Component, computed, ViewChild } from '@angular/core';
import { PatientInviteComponent } from "../patient-invite/patient-invite.component";
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ADRComponent } from "../../PatientManagement/adr/adr.component";
import { AddPatientDialogComponent } from '../add-patient-dialog/add-patient-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../Shared/confirm-dialog/confirm-dialog.component';
import { PatientFilterPipe } from "../../../pipes/patient-filter.pipe";
import { Route, Router } from '@angular/router';
import { DrugAdvisorComponent } from "../../Medicine/drug-advisor/drug-advisor.component";
import { PatientCoachComponent } from "../../Medicine/patient-coach/patient-coach.component";

@Component({
  selector: 'app-patientlist',
  standalone: true,
  imports: [
    PatientInviteComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PatientFilterPipe,
    MatDialogModule,
    DrugAdvisorComponent,
    PatientCoachComponent
],
  templateUrl: './patientlist.component.html',
  styleUrls: ['./patientlist.component.scss']
})
export class PatientlistComponent {
  patients: any[] = [];
  loading = true;
  UserSetGlobal: any;
  patientsinvite: any
  @ViewChild(PatientInviteComponent, { static: false })
  patientInviteComp!: PatientInviteComponent;
    searchText: string = '';

  constructor(private Http: CommonService, private sharedService: SharedServiceService,
     private dialog: MatDialog,private router:Router) { }
  userinfo = computed(() => this.sharedService.userInfo());

  ngOnInit(): void {
    this.UserSetGlobal = this.userinfo();
    const payload = {
      UserType: this.UserSetGlobal.userType,
      UserId: this.UserSetGlobal.userID
    }
    this.Http.Post('PatientHandle/Getmypatients', payload).subscribe({
      next: (res) => {

        if (res.success) {
          this.patients = res.patients;
        }

      },
      error: () => (this.loading = false)
    });
  }

  onInviteCompleted(val: any) {
    if (val) {
      this.ngOnInit();
    }

  }
  sendInvite(patient: any) {
    this.patientsinvite = patient;

    setTimeout(() => {
      this.callChildMethod();
    });
  }

  callChildMethod() {
    if (this.patientInviteComp) {
      this.patientInviteComp.sendInvite();
    } else {
      console.error('Child not initialized');
    }
  }
  openAddPatientDialog() {
    const dialogRef = this.dialog.open(AddPatientDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // enrich with backend-required fields
        let user = this.userinfo();
        const payload = {
          // Name: result.name,
          // Gender: result.gender,
          // Age: result.age,
          Email: result.email,
          // Address: result.address,
          CreatedBy: this.UserSetGlobal.name ?? 'Admin',
          CreatedTime: new Date().toISOString(),
          CreateUserId: this.UserSetGlobal.userID || 0,
          CreateUserType: this.UserSetGlobal.userType || 'Admin',
          IsDeleted: false,
          SendInvite: false,
          InviteDateTime: null
        };

  this.Reload(payload);
      }
    
    });
  }
Reload(payload:any){
        this.Http.Post('PatientHandle/Addpatient', payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              // this.patients.push(res.patient);
            //  this.sendInvite(result.email)
              this.ngOnInit();
            }
          },
          error: (err) => console.error('Error saving patient', err)
        });
}
  openPatientDetails(patient: any) {
    this.sharedService.setPatient(patient);
    this.router.navigate(['/MainLayout/patientmanagement']);
  }

  deletePatient(patientId: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Patient',
        message: 'Are you sure you want to delete this unregistered patient?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        const payload = {
          PatientId: patientId,

        };

        this.Http.Post('PatientHandle/DeletePatient', payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.sharedService.Messages('success', 'Success', 'Patient deleted successfully', 3000);
              // Refresh the patient list
              this.ngOnInit();
            } else {
              this.sharedService.Messages('error', 'Error', res.message || 'Failed to delete patient', 3000);
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('Error deleting patient:', error);
            this.sharedService.Messages('error', 'Error', 'Failed to delete patient. Please try again.', 3000);
            this.loading = false;
          }
        });
      }
    });
  }
}
