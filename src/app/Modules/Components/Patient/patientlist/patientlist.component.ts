import { Component, computed, ViewChild } from '@angular/core';
import { PatientInviteComponent } from "../patient-invite/patient-invite.component";
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ADRComponent } from "../../PatientManagement/adr/adr.component";
import { AddPatientDialogComponent } from '../add-patient-dialog/add-patient-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PatientFilterPipe } from "../../../pipes/patient-filter.pipe";
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-patientlist',
  imports: [PatientInviteComponent, CommonModule, ReactiveFormsModule, FormsModule, ADRComponent, PatientFilterPipe],
  templateUrl: './patientlist.component.html',
  styleUrl: './patientlist.component.scss'
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
          Name: result.name,
          Gender: result.gender,
          Age: result.age,
          Email: result.email,
          Address: result.address,
          CreatedBy: this.UserSetGlobal.name ?? 'Admin',
          CreatedTime: new Date().toISOString(),
          CreateUserId: this.UserSetGlobal.userID,
          CreateUserType: this.UserSetGlobal.userType,
          IsDeleted: false,
          SendInvite: false,
          InviteDateTime: null
        };

        this.Http.Post('PatientHandle/Addpatient', payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              // this.patients.push(res.patient);
              this.ngOnInit();
            }
          },
          error: (err) => console.error('Error saving patient', err)
        });
      }
    });
  }

  openPatientDetails(patient: any) {
      this.sharedService.setPatient(patient);
  this.router.navigate(['/MainLayout/patientmanagement']);
}

}
