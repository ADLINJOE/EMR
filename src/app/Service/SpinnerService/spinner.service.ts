import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  private requestCount = 0;

  show() {
    this.requestCount++;
    this.loading.next(true);
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.loading.next(false);
      this.requestCount = 0;
    }
  }
}
