import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Modules/Components/Login/login/login.component';
import { LayoutComponent } from './Modules/Components/MainLayout/layout/layout.component';
import { PatientInviteComponent } from './Modules/Components/Patient/patient-invite/patient-invite.component';
import { PatientlistComponent } from './Modules/Components/Patient/patientlist/patientlist.component';
import { PatientRegistrationlinkComponent } from './Modules/Components/Patient/patient-registrationlink/patient-registrationlink.component';
import { DrugMasterComponent } from './Modules/Components/Medicine/drug-master/drug-master.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',  
    component: LoginComponent,
  },
    {
    path: 'register',
    component: PatientRegistrationlinkComponent,
  },
  {
    path: 'MainLayout',  
    component: LayoutComponent,
    children: [
      {
        path: 'Patientinvite',  
        component: PatientInviteComponent,
      },
      {
        path :'patientlist',
        component : PatientlistComponent
      },
        {
         path :'drug',
          component : DrugMasterComponent
        }
     
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],  
  exports: [RouterModule],
})
export class AppRoutingModule {}
