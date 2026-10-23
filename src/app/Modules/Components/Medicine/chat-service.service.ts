import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CoachResponse, DrugEvalResult, PatientRequest, payloadDrug } from './Model';
import { DeployUrl } from '../../../Service/common.service';


@Injectable({ providedIn: 'root' })
export class ChatServiceService {
  private apiUrl = DeployUrl.URL; // update if needed

  constructor(private http: HttpClient) {}

  analyzePatient(request: PatientRequest): Observable<CoachResponse> {
    return this.http.post<CoachResponse>(`${this.apiUrl}api/Coach/AnalyzePatient`, request);
  }

  evaluateDrug(drugA:payloadDrug): Observable<DrugEvalResult> {
    return this.http.post<DrugEvalResult>(`${this.apiUrl}api/Coach/EvaluateDrug?`,drugA);
  }
}
