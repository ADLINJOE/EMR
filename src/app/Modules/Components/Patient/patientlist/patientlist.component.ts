import { Component } from '@angular/core';
import { PatientInviteComponent } from "../patient-invite/patient-invite.component";

@Component({
  selector: 'app-patientlist',
  imports: [PatientInviteComponent],
  templateUrl: './patientlist.component.html',
  styleUrl: './patientlist.component.scss'
})
export class PatientlistComponent {

}
