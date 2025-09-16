import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

interface FollowUp {
  id: number;
  patientId: string;
  followUpDate: Date;
  notes: string;
  emailReminder: boolean;
  reminderDaysBefore: number;
  createdBy: string;
  createdDate: Date;
  status: string;
}

interface Patient {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-patient-followups',
  templateUrl: './patient-followups.component.html',
  styleUrls: ['./patient-followups.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule
  ]
})
export class PatientFollowupsComponent implements OnInit {
  @Input() selectedPatient: Patient | null = null;

  followUpForm: FormGroup;
  followUps: FollowUp[] = [];
  upcomingFollowUps: FollowUp[] = [];
  isLoading = false;
  showForm = false;
  editingFollowUp: FollowUp | null = null;

  displayedColumns: string[] = ['followUpDate', 'notes', 'emailReminder', 'status', 'actions'];

  private apiUrl = 'https://localhost:7071/api/PatientManagement';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private sharedService: SharedServiceService
  ) {
    this.followUpForm = this.fb.group({
      patientId: ['', Validators.required],
      followUpDate: ['', Validators.required],
      notes: [''],
      emailReminder: [true],
      reminderDaysBefore: [1, [Validators.required, Validators.min(1)]],
      createdBy: ['SYSTEM']
    });
  }

  ngOnInit(): void {
    // Check for pre-selected patient from shared service
    if (!this.selectedPatient) {
      this.selectedPatient = this.sharedService.getPatient();
    }

    if (this.selectedPatient) {
      this.followUpForm.patchValue({
        patientId: this.selectedPatient.patientId
      });
      this.loadPatientFollowUps();
    }

    this.loadUpcomingFollowUps();
  }

  loadPatientFollowUps(): void {
    if (!this.selectedPatient) return;

    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/FollowUp/${this.selectedPatient.patientId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.followUps = response.data.map((item: any) => ({
              ...item,
              followUpDate: new Date(item.followUpDate),
              createdDate: new Date(item.createdDate)
            }));
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading follow-ups:', error);
          this.showMessage('Failed to load follow-ups');
          this.isLoading = false;
        }
      });
  }

  loadUpcomingFollowUps(): void {
    this.http.get<any>(`${this.apiUrl}/FollowUp/Upcoming?days=30`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.upcomingFollowUps = response.data.map((item: any) => ({
              ...item,
              followUpDate: new Date(item.followUpDate),
              createdDate: new Date(item.createdDate)
            }));
          }
        },
        error: (error) => {
          console.error('Error loading upcoming follow-ups:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.followUpForm.valid) {
      this.isLoading = true;
      const formData = {
        ...this.followUpForm.value,
        createdDate: new Date().toISOString()
      };

      if (this.editingFollowUp) {
        this.updateFollowUp(formData);
      } else {
        this.createFollowUp(formData);
      }
    }
  }

  createFollowUp(formData: any): void {
    this.http.post<any>(`${this.apiUrl}/FollowUp`, formData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showMessage('Follow-up created successfully');
            this.resetForm();
            this.loadPatientFollowUps();
            this.loadUpcomingFollowUps();
            
            // Auto-schedule email reminder if enabled
            if (formData.emailReminder && this.selectedPatient?.email) {
              this.scheduleEmailReminder(response.followUpId, this.selectedPatient.email);
            }
          } else {
            this.showMessage('Failed to create follow-up');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating follow-up:', error);
          this.showMessage('Error creating follow-up');
          this.isLoading = false;
        }
      });
  }

  updateFollowUp(formData: any): void {
    if (!this.editingFollowUp) return;

    this.http.put<any>(`${this.apiUrl}/FollowUp/${this.editingFollowUp.id}`, {
      status: formData.status || 'Active'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Follow-up updated successfully');
          this.resetForm();
          this.loadPatientFollowUps();
          this.loadUpcomingFollowUps();
        } else {
          this.showMessage('Failed to update follow-up');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating follow-up:', error);
        this.showMessage('Error updating follow-up');
        this.isLoading = false;
      }
    });
  }

  scheduleEmailReminder(followUpId: number, email: string): void {
    this.http.post<any>(`${this.apiUrl}/FollowUp/${followUpId}/ScheduleReminder`, {
      recipientEmail: email
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Email reminder scheduled for ${new Date(response.reminderDate).toLocaleDateString()}`);
        }
      },
      error: (error) => {
        console.error('Error scheduling reminder:', error);
        this.showMessage('Follow-up created but failed to schedule email reminder');
      }
    });
  }

  editFollowUp(followUp: FollowUp): void {
    this.editingFollowUp = followUp;
    this.showForm = true;
    this.followUpForm.patchValue({
      patientId: followUp.patientId,
      followUpDate: followUp.followUpDate,
      notes: followUp.notes,
      emailReminder: followUp.emailReminder,
      reminderDaysBefore: followUp.reminderDaysBefore,
      createdBy: followUp.createdBy
    });
  }

  completeFollowUp(followUp: FollowUp): void {
    this.http.put<any>(`${this.apiUrl}/FollowUp/${followUp.id}`, {
      status: 'Completed'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Follow-up marked as completed');
          this.loadPatientFollowUps();
          this.loadUpcomingFollowUps();
        } else {
          this.showMessage('Failed to update follow-up');
        }
      },
      error: (error) => {
        console.error('Error completing follow-up:', error);
        this.showMessage('Error updating follow-up');
      }
    });
  }

  cancelFollowUp(followUp: FollowUp): void {
    if (confirm('Are you sure you want to cancel this follow-up?')) {
      this.http.delete<any>(`${this.apiUrl}/FollowUp/${followUp.id}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showMessage('Follow-up cancelled successfully');
              this.loadPatientFollowUps();
              this.loadUpcomingFollowUps();
            } else {
              this.showMessage('Failed to cancel follow-up');
            }
          },
          error: (error) => {
            console.error('Error cancelling follow-up:', error);
            this.showMessage('Error cancelling follow-up');
          }
        });
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.editingFollowUp = null;
    this.followUpForm.reset();
    if (this.selectedPatient) {
      this.followUpForm.patchValue({
        patientId: this.selectedPatient.patientId,
        emailReminder: true,
        reminderDaysBefore: 1,
        createdBy: 'SYSTEM'
      });
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'accent';
      case 'Cancelled': return 'warn';
      default: return 'primary';
    }
  }

  isOverdue(followUpDate: Date): boolean {
    return new Date(followUpDate) < new Date() && new Date(followUpDate).toDateString() !== new Date().toDateString();
  }

  isToday(followUpDate: Date): boolean {
    return new Date(followUpDate).toDateString() === new Date().toDateString();
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
