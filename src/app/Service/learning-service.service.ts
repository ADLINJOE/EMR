import { HttpClient } from '@angular/common/http';
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
  getArticles(category?: string): Observable<{ data: Article[], success: boolean }> {
    let url = `${DeployUrl.URL}api/learninghub/articles`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.http.get<{ data: Article[], success: boolean }>(url);
  }

  getArticleById(id: string): Observable<{ data: Article, success: boolean }> {
    return this.http.get<{ data: Article, success: boolean }>(`${DeployUrl.URL}api/learninghub/articles/${id}`);
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
    const apiUrl = 'https://localhost:5001/api/LearningResources';
    let url = apiUrl;
    if (type || category) {
      const params = [];
      if (type) params.push(`type=${type}`);
      if (category) params.push(`category=${category}`);
      url += `?${params.join('&')}`;
    }
    return this.http.get<LearningResource[]>(url);
  }
}
