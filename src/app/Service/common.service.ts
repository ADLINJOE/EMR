import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export const DeployUrl = {
  //URL: window.location.origin // ✅ correct
  //  URL: window.location.origin + "/" + "api/"  // ✅ correct

  //  URL: 'https://app.rxsmart.in/api/',
  //  Front: 'https://app.rxsmart.in/'
   URL: 'https://localhost:44308/',
 Front: 'https://localhost:4200/'

};

@Injectable({
  providedIn: 'root'
})

export class CommonService {

  constructor(private Http: HttpClient) { }

  Post(url: string, value: any,): Observable<any> {
    return this.Http.post<any>(DeployUrl.URL + url, value);
  }
  Get(url: string, value: any,): Observable<any> {

    return this.Http.get<any>(DeployUrl.URL + url);
  }
     private apiUrl = 'https://api.fda.gov/drug/event.json';



  submitADR(payload: any): Observable<any> {
    return this.Http.post(this.apiUrl, payload);
  }
   getADRsByPatient(patientId?: number, email?: string): Observable<any[]> {
    const params: any = {};
    if (patientId) params.patientId = patientId;
    if (email) params.email = email;

    return this.Get('api/ADR/getByPatient', params);
  }
}
