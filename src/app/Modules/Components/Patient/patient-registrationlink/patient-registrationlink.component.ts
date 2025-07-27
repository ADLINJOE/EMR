import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-patient-registrationlink',
  imports: [],
  templateUrl: './patient-registrationlink.component.html',
  styleUrl: './patient-registrationlink.component.scss'
})
export class PatientRegistrationlinkComponent {
email: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get('email');
      console.log('Received email:', this.email);
    });
  }
}
