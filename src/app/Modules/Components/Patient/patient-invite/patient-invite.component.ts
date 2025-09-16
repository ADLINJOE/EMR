import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService, DeployUrl } from '../../../../Service/common.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';

@Component({
  selector: 'app-patient-invite',
  imports: [ReactiveFormsModule, MatInputModule,
    MatFormFieldModule, CommonModule,
    MatButtonModule,],
  templateUrl: './patient-invite.component.html',
  styleUrl: './patient-invite.component.scss'
})
export class PatientInviteComponent {
  
  email = new FormControl('', [Validators.required, Validators.email]);
  statusMessage = '';
    UserSetGlobal: any;
 @Input() Email: any[] = []; 
   @Output() inviteCompleted = new EventEmitter<any>();
  constructor(private inviteService: CommonService, private Sharedservice: SharedServiceService) { }
    userinfo = computed(() => this.Sharedservice.userInfo());
  sendInvite() {
     if (this.Email) {
    // If Email is an array, take the first element, otherwise just use it directly
    const emailValue = Array.isArray(this.Email) ? this.Email[0] : this.Email;

    // Set value into FormControl
    this.email.setValue(emailValue);
  }
    if (this.email.valid ) {
   const registrationLink = `${DeployUrl.Front}register?email=${encodeURIComponent(this.email.value ?? '')}`;

    this.UserSetGlobal = this.userinfo();
const emailPayload = {

  Sentby:this.UserSetGlobal.name,
  SentUSerId: this.UserSetGlobal?.userID?.toString() ?? '',
  SentbyRole:this.UserSetGlobal.userType,
  ToEmail : this.email.value,
  Subject : 'Patient Registration Invitation',
  Body : `
    <p>Dear Patient,</p>
    <p>Welcome to the RxSmart family!</p>
    <p>You're just one step away from completing your registration.</p>
    <p>Please click the link below to get started:</p>
    <p><a href="${registrationLink}" target="_blank">Complete Your Registration</a></p>
    <p>If you have any questions, feel free to reach out to us at rxsmart789@gmail.com.</p>
    <p>Best regards,<br/>The RxSmart Team</p>
  `
};

      this.inviteService.Post("PatientHandle/PTinvite", emailPayload).subscribe(val => {
        if (val.success) {
          this.Sharedservice.Messages('success', 'Patient Invite', val.message, 3000);
           this.inviteCompleted.emit(true);

        }else{
           this.Sharedservice.Messages('warning', 'Patient Invite', val.message, 3000);
        }
      });
    }else {
       this.Sharedservice.Messages('warning', 'Patient Invite', 'Not a Valid Mail Address', 3000)
    }
  }
}
