import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// Define or import the SavedDoc interface
export interface SavedDoc {
  // Add appropriate fields here, for example:
  id?: number;
  name?: string;
  // Add other properties as needed
}


export const DeployUrl = {
  //URL: window.location.origin // ✅ correct
  //  URL: window.location.origin + "/" + "api/"  // ✅ correct

    URL: 'http://app.rxsmart.in/api/',
    Front: 'https://app.rxsmart.in/'
//   URL: 'https://localhost:44308/',
//  Front: 'https://localhost:4200/'

};

@Injectable({
  providedIn: 'root'
})

export class CommonService {

  constructor(private http: HttpClient) { }

  Post(url: string, value: any,): Observable<any> {
    return this.http.post<any>(DeployUrl.URL + url, value);
  }
  Get(url: string, value: any,): Observable<any> {

    return this.http.get<any>(DeployUrl.URL + url);
  }
     private apiUrl = 'https://api.fda.gov/drug/event.json';



  submitADR(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
    save(doc: SavedDoc) {
    return this.http.post(`${DeployUrl.URL}/save`, doc);
  }

  getAll() {
    return this.http.get<SavedDoc[]>(`${DeployUrl.URL}/all`);
  }

  delete(id: number) {
    return this.http.delete(`${DeployUrl.URL}/${id}`);
  }

  get(id: number) {
    return this.http.get<SavedDoc>(`${DeployUrl.URL}/${id}`);
  }
   getADRsByPatient(patientId?: number, email?: string): Observable<any[]> {
    const params: any = {};
    if (patientId) params.patientId = patientId;
    if (email) params.email = email;

    return this.Get('api/ADR/getByPatient', params);
  }
}
