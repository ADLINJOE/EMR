import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Modules/Components/Login/login/login.component';
import { LayoutComponent } from './Modules/Components/MainLayout/layout/layout.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',  
    component: LoginComponent,
  },
  {
    path: '',  
    component: LayoutComponent,
    children: [
    //   {
    //     path: 'appointment',  
    //     component: AdminDashboardComponent,
    //   },
    //   {
    //     path :'patientlist',
    //     component : PatientListComponent
    //   }
     
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],  
  exports: [RouterModule],
})
export class AppRoutingModule {}
