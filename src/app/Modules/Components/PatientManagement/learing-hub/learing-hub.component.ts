import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { DeployUrl } from '../../../../Service/common.service';



type CategoryKey = 'bp' | 'sugar' | 'diet' | 'exercise' | 'lifestyle';

interface Topic {
  Id: string;
  title: string;
  Teaser: string;
  Url: string;
}

@Component({
  selector: 'app-learing-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTabsModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './learing-hub.component.html',
  styleUrls: ['./learing-hub.component.scss', '../../../Shared/styles/table-template.scss']
})
export class LearingHubComponent {
  categories = [
    { key: 'bp', label: 'Blood Pressure' },
    { key: 'sugar', label: 'Sugar / Diabetes' },
    { key: 'diet', label: 'Diet' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'lifestyle', label: 'Lifestyle' }
  ];

  selectedCategory: CategoryKey = 'bp';
  activeTab: 'articles' | 'videos' | 'topics' = 'articles';

  topics: Topic[] = [];
  videos: any[] = [];
  loadingTopics = false;
  loadingVideos = false;

  private categoryFilterMap: Record<CategoryKey, string> = {
    bp: 'Blood Pressure',
    sugar: 'Diabetes',
    diet: 'Diet',
    exercise: 'Exercise',
    lifestyle: 'Lifestyle'
  };

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loadTopics();
    this.loadVideos();
  }

  loadTopics() {
    this.loadingTopics = true;

    const filterValue = this.categoryFilterMap[this.selectedCategory];

    this.http
      .get<any>(`${DeployUrl.URL}api/learninghub/topics?filter=${encodeURIComponent(filterValue)}`)
      .subscribe({
        next: res => {
          this.topics = res?.result?.items?.item || [];
          this.loadingTopics = false;
        },
        error: () => (this.loadingTopics = false)
      });
  }

  loadVideos() {
    this.loadingVideos = true;
    this.http
      .get(`${DeployUrl.URL}api/learninghub/videos/daily?category=${this.selectedCategory}`)
      .subscribe({
        next: (res: any) => {
          this.videos = res?.items || [];
          this.loadingVideos = false;
        },
        error: () => (this.loadingVideos = false)
      });
  }

  getVideoUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`
    );
  }
}
