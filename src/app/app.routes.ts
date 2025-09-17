
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './Modules/Components/MainLayout/layout/layout.component';

export const routes: Routes = [
  // Default path
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login – lazy load
  {
    path: 'login',
    loadComponent: () =>
      import('./Modules/Components/Login/login/login.component')
        .then(m => m.LoginComponent)
  },

  // Register – lazy load
  {
    path: 'register',
    loadComponent: () =>
      import('./Modules/Components/Patient/patient-registrationlink/patient-registrationlink.component')
        .then(m => m.PatientRegistrationlinkComponent)
  },

  // Main layout with children
  {
    path: 'MainLayout',
    component: LayoutComponent,
    children: [
      {
        path: 'Patientinvite',
        loadComponent: () =>
          import('./Modules/Components/Patient/patient-invite/patient-invite.component')
            .then(m => m.PatientInviteComponent)
      },
      {
        path: 'patientlist',
        loadComponent: () =>
          import('./Modules/Components/Patient/patientlist/patientlist.component')
            .then(m => m.PatientlistComponent)
      },
      {
        path: 'drug',
        loadComponent: () =>
          import('./Modules/Components/Medicine/drug-master/drug-master.component')
            .then(m => m.DrugMasterComponent)
      },
      {
        path: 'learning',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/learing-hub/learing-hub.component')
            .then(m => m.LearingHubComponent)
      },

      {
        path: 'currentmedication',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/currentmedication/currentmedication.component')
            .then(m => m.CurrentmedicationComponent)
      },
      {
        path: 'allergy',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/allergy/allergy.component')
            .then(m => m.AllergyComponent)
      },
      {
        path: 'vitals',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/patient-vitals/patient-vitals.component')
            .then(m => m.PatientVitalsComponent)
      },
      {
        path: 'vitalsdashboard',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/vitals-bp-monitor/vitals-bp-monitor.component')
            .then(m => m.VitalsBpMonitorComponent)
      },
      {
        path: 'drugcompare',
        loadComponent: () =>
          import('./Modules/Components/Medicine/drug-price-compare/drug-price-compare.component')
            .then(m => m.DrugPriceCompareComponent)
      },
      {
        path: 'ADR',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/adr/adr.component')
            .then(m => m.ADRComponent)
      },
      {
        path: 'patientmanagement',
        loadComponent: () =>
          import('./Modules/Components/Patient/patient-management/patient-management.component')
            .then(m => m.PatientManagementComponent)
      },
      {
        path: 'medication-print',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/medication-print/medication-print.component')
            .then(m => m.MedicationPrintComponent)
      },
      {
        path: 'ocr-scanner',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/ocr-scanner/ocr-scanner.component')
            .then(m => m.OcrScannerComponent)
      },
      {
        path: 'patient-followups',
        loadComponent: () =>
          import('./Modules/Components/PatientManagement/patient-followups/patient-followups.component')
            .then(m => m.PatientFollowupsComponent)
      }
    ],
  },

  // Wildcard route
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true,onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
