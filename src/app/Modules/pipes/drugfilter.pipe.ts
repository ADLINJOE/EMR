import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'drugfilter'
})

export class drugfilter implements PipeTransform {
  transform(drugs: any[], searchText: string): any[] {
    if (!drugs) return [];
    if (!searchText) return drugs;

    searchText = searchText.toLowerCase();

 return drugs.filter(d => {
  const search = searchText.toLowerCase();

  const brandName = d.controls.brandName.value?.toLowerCase() || '';
  const genericName = d.controls.genericName.value?.toLowerCase() || '';
  const drugName = d.controls.drugName.value?.toLowerCase() || '';
  const isDeleted = d.controls.isDeleted.value;

  // Convert boolean to a status string
  const status = isDeleted ? 'inactive' : 'active';

  return (
    brandName.includes(search) ||
    genericName.includes(search) ||
    drugName.includes(search) ||
    status.includes(search)  // allows user to type "active" or "inactive"
  );
});


  }
}
