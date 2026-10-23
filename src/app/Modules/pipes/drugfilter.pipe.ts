import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'drugfilter',
   pure: true
})

export class drugfilter implements PipeTransform {
transform(drugs: any[], searchText: string): any[] {
    if (!drugs) return [];
    if (!searchText) return drugs;

    const search = searchText.trim().toLowerCase();

    return drugs.filter(d => {
      if (!d || !d.value) return false;

      const drugName = d.value.drugName?.toLowerCase() || '';
      // const genericName = d.value.genericName?.toLowerCase() || '';
      // const status = d.value.isDeleted ? 'inactive' : 'active';

      return (
        drugName.includes(search) 
        // genericName.includes(search) ||
        // status.includes(search)
      );
    });
  }
}
