import { Component, computed } from '@angular/core';
import { PatientInviteComponent } from "../patient-invite/patient-invite.component";
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-patientlist',
  imports: [PatientInviteComponent,CommonModule,ReactiveFormsModule],
  templateUrl: './patientlist.component.html',
  styleUrl: './patientlist.component.scss'
})
export class PatientlistComponent {
 patients: any [] = [];
  loading = true;

  constructor(private Http: CommonService,private sharedService: SharedServiceService) {}
  userinfo = computed(() => this.sharedService.userInfo());
 
  ngOnInit(): void {
    let data = this.userinfo();
    const payload = {
      UserType: data.userType,
      UserId: data.userID
    }
    this.Http.Post('PatientHandle/Getmypatients', payload).subscribe({
      next: (res) => {

        if(res.success){
        this.patients = res.patients;
        }

      },
      error: () => (this.loading = false)
    });
  }
}
