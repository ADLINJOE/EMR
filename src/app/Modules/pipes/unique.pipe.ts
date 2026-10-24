import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unique',
  standalone: true
})
export class UniquePipe implements PipeTransform {

  transform<T>(items: T[], key?: keyof T): T[] {
    if (!Array.isArray(items) || items.length === 0) {
      return items;
    }

    if (!key) {
      // Case: primitive array (string[], number[])
      return [...new Set(items)];
    }

    // Case: array of objects (unique by property)
    const seen = new Set();
    return items.filter(item => {
      const val = item[key];
      if (seen.has(val)) {
        return false;
      }
      seen.add(val);
      return true;
    });
  }
}
