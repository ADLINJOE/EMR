import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeployUrl } from './common.service';

export interface Article {
  Id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  publishedDate: string;
  category: string;
  author: string;
  tags: string[];
}

export interface Topic {
  Id: string;
  title: string;
  Teaser: string;
  Url: string;
  category: string;
  createdDate: string;
  subTopics: string[];
}

export interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: any;
  };
  category: string;
}

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

  constructor(private http: HttpClient) {}

  // Articles API methods
getArticles(
  category?: string,
  page: number = 1,
  pageSize: number = 10
): Observable<{ data: Article[], success: boolean }> {
  let url = `${DeployUrl.URL}api/learninghub?category=${category}&page=${page}&pageSize=${pageSize}`;

  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }

  return this.http.get<{ data: Article[], success: boolean }>(url);
}



  getArticleById(id: string): Observable<{ data: Article, success: boolean }> {
    return this.http.get<{ data: Article, success: boolean }>(`${DeployUrl.URL}api/learninghub/articles/${id}`);
  }

  createArticle(article: Article): Observable<{ data: Article, success: boolean }> {
    return this.http.post<{ data: Article, success: boolean }>(`${DeployUrl.URL}api/learninghub/articles`, article);
  }

  updateArticle(id: string, article: Article): Observable<{ data: Article, success: boolean }> {
    return this.http.put<{ data: Article, success: boolean }>(`${DeployUrl.URL}api/learninghub/articles/${id}`, article);
  }

 deleteArticle(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
        `${DeployUrl.URL}api/learninghub/articles/${id}`,
        {} // empty body required for POST
    );
}


  // Topics API methods
  getTopics(category?: string): Observable<{ data: Topic[], success: boolean }> {
    let url = `${DeployUrl.URL}api/learninghub/topics`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.http.get<{ data: Topic[], success: boolean }>(url);
  }

  getTopicById(id: string): Observable<{ data: Topic, success: boolean }> {
    return this.http.get<{ data: Topic, success: boolean }>(`${DeployUrl.URL}api/learninghub/topics/${id}`);
  }

  // Videos API methods
  getVideos(category?: string): Observable<{ data: Video[], success: boolean }> {
    let url = `${DeployUrl.URL}api/learninghub/videos`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.http.get<{ data: Video[], success: boolean }>(url);
  }

  // Legacy method for backward compatibility
  getResources(type?: string, category?: string): Observable<LearningResource[]> {
    const apiUrl = 'https://app.rxsmart.in/api/LearningResources';
    let url = apiUrl;
    if (type || category) {
      const params = [];
      if (type) params.push(`type=${type}`);
      if (category) params.push(`category=${category}`);
      url += `?${params.join('&')}`;
    }
    return this.http.get<LearningResource[]>(url);
  }

 getDocuments() {
    return this.http.get<any[]>(`${DeployUrl.URL}/list`);
  }

uploadDocument(file: File, title: string, uploadedBy: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("uploadedBy", uploadedBy);

  return this.http.post(`${DeployUrl.URL}api/Documents/upload`, formData);
}



  deleteDocument(id: number) {
    return this.http.get(`${DeployUrl.URL}api/Documents/${id}`);
  }






   
}
