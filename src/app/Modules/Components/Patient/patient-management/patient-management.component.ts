import { Component, computed, effect } from '@angular/core';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CurrentmedicationComponent } from "../../PatientManagement/currentmedication/currentmedication.component";
import { AllergyComponent } from "../../PatientManagement/allergy/allergy.component";

@Component({
  selector: 'app-patient-management',
  imports: [CurrentmedicationComponent, AllergyComponent],
  templateUrl: './patient-management.component.html',
  styleUrl: './patient-management.component.scss'
})
export class PatientManagementComponent {


  constructor(private patientDataService: SharedServiceService) {}
 
   patient =  computed(() => this.patientDataService.patient());
  ngOnInit() {
    let data = this.patient();
 

   
  }
}
