import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export enum DeployUrl {
  URL = "https://localhost:44308/"
}

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
}
