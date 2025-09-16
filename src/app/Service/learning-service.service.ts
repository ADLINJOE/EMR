import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface LearningResource {
  id: number;
  title: string;
  type: string;
  category: string;
  content: string;
  createdAt: string;
}


@Injectable({
  providedIn: 'root'
})
export class LearningServiceService {


  private apiUrl = 'https://localhost:5001/api/LearningResources';

  constructor(private http: HttpClient) {}

  getResources(type?: string, category?: string): Observable<LearningResource[]> {
    let url = this.apiUrl;
    if (type || category) {
      const params = [];
      if (type) params.push(`type=${type}`);
      if (category) params.push(`category=${category}`);
      url += `?${params.join('&')}`;
    }
    return this.http.get<LearningResource[]>(url);
  }
}
