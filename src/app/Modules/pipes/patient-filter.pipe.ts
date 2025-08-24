import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientFilter'
})
export class PatientFilterPipe implements PipeTransform {
  transform(patients: any[], searchText: string): any[] {
    if (!patients) return [];
    if (!searchText) return patients;

    searchText = searchText.toLowerCase();

    return patients.filter(p =>
      (p.name && p.name.toLowerCase().includes(searchText)) ||
      (p.gender && p.gender.toLowerCase().includes(searchText)) ||
      (p.email && p.email.toLowerCase().includes(searchText))
    );
  }
}
