import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService } from '../../../../Service/common.service';
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
   URL = "https://localhost:44308/"
  email = new FormControl('', [Validators.required, Validators.email]);
  statusMessage = '';

  constructor(private inviteService: CommonService, private Sharedservice: SharedServiceService) { }
  sendInvite() {
    if (this.email.valid) {
   const registrationLink = `http://localhost:4200/register?email=${encodeURIComponent(this.email.value ?? '')}`;


const emailPayload = {
  ToEmail : this.email.value,
  Subject : 'Patient Registration Invitation',
  Body : `
    <p>Dear Patient,</p>
    <p>Welcome to the [Pharmacy Name] family!</p>
    <p>You're just one step away from completing your registration.</p>
    <p>Please click the link below to get started:</p>
    <p><a href="${registrationLink}" target="_blank">Complete Your Registration</a></p>
    <p>If you have any questions, feel free to reach out to us at [Pharmacy Email].</p>
    <p>Best regards,<br/>The [Pharmacy Name] Team</p>
  `
};

      this.inviteService.Post("PatientHandle/PTinvite", emailPayload).subscribe(val => {
        if (val.success) {
          this.Sharedservice.Messages('success', 'Patient Invite Successfully', val.message, 3000);
          // token

        }
      });
    }
  }
}
