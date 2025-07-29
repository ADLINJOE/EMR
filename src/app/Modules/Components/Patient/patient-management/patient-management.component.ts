import { Component } from '@angular/core';

@Component({
  selector: 'app-patient-management',
  imports: [],
  templateUrl: './patient-management.component.html',
  styleUrl: './patient-management.component.scss'
})
export class PatientManagementComponent {
 selectedTab = 0;

  medicationSearch = '';
  statusFilter = '';
  medicationStatuses = ['Active', 'Discontinued', 'Completed'];

  allergySearch = '';
  severityFilter = '';
  allergySeverities = ['Mild', 'Moderate', 'Severe'];

  medications: Medication[] = [/* ...same data as before... */];
  allergies: Allergy[] = [/* ...same data as before... */];

  filteredMedications = [...this.medications];
  filteredAllergies = [...this.allergies];

  medicationColumns = ['name', 'frequency', 'prescribedBy', 'startDate', 'status', 'actions'];
  allergyColumns = ['allergen', 'severity', 'reaction', 'diagnosedDate', 'diagnosedBy', 'actions'];

  filterMedications() {
    this.filteredMedications = this.medications.filter(m =>
      (!this.statusFilter || m.status === this.statusFilter) &&
      (m.name.toLowerCase().includes(this.medicationSearch.toLowerCase()) ||
       m.prescribedBy.toLowerCase().includes(this.medicationSearch.toLowerCase()))
    );
  }

  filterAllergies() {
    this.filteredAllergies = this.allergies.filter(a =>
      (!this.severityFilter || a.severity === this.severityFilter) &&
      (a.allergen.toLowerCase().includes(this.allergySearch.toLowerCase()) ||
       a.reaction.toLowerCase().includes(this.allergySearch.toLowerCase()))
    );
  }
}
