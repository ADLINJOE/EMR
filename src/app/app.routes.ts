import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Modules/Components/Login/login/login.component';
import { LayoutComponent } from './Modules/Components/MainLayout/layout/layout.component';
import { PatientInviteComponent } from './Modules/Components/Patient/patient-invite/patient-invite.component';
import { PatientlistComponent } from './Modules/Components/Patient/patientlist/patientlist.component';
import { PatientRegistrationlinkComponent } from './Modules/Components/Patient/patient-registrationlink/patient-registrationlink.component';
import { DrugMasterComponent } from './Modules/Components/Medicine/drug-master/drug-master.component';
import { CurrentmedicationComponent } from './Modules/Components/PatientManagement/currentmedication/currentmedication.component';
import { AllergyComponent } from './Modules/Components/PatientManagement/allergy/allergy.component';
import { PatientVitalsComponent } from './Modules/Components/PatientManagement/patient-vitals/patient-vitals.component';
import { VitalsdashboardComponent } from './Modules/Components/PatientManagement/vitalsdashboard/vitalsdashboard.component';
import { VitalsBpMonitorComponent } from './Modules/Components/PatientManagement/vitals-bp-monitor/vitals-bp-monitor.component';
import { DrugPriceCompareComponent } from './Modules/Components/Medicine/drug-price-compare/drug-price-compare.component';

export const routes: Routes = [
  // Default path redirects to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login screen
  { path: 'login', component: LoginComponent },

  // Register screen – should stay on reload
  { path: 'register', component: PatientRegistrationlinkComponent },

  // Main layout with children
  {
    path: 'MainLayout',
    component: LayoutComponent,
    children: [
      { path: 'Patientinvite', component: PatientInviteComponent },
      { path: 'patientlist', component: PatientlistComponent },
      { path: 'drug', component: DrugMasterComponent },
      { path: 'currentmedication', component: CurrentmedicationComponent },
      { path: 'allergy', component: AllergyComponent },
      {path: 'vitals',component: PatientVitalsComponent},
      {path:'vitalsdashboard',component:VitalsBpMonitorComponent},
      {path:'drugcompare',component:DrugPriceCompareComponent}
    ],
  },

  // Wildcard path for unknown routes — do NOT match valid paths like /register
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],  
  exports: [RouterModule],
})
export class AppRoutingModule {}
