import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-add-patient-dialog',
   standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './add-patient-dialog.component.html',
  styleUrl: './add-patient-dialog.component.scss'
})
export class AddPatientDialogComponent {
 patient: any = {
    name: '',
    gender: '',
    age: null,
    email: '',
    sendInvite: false
  };
}
