import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { LearningServiceService, Article, Topic, Video } from '../../../../Service/learning-service.service';



type CategoryKey = 'bp' | 'sugar' | 'diet' | 'exercise' | 'lifestyle';

// Interfaces are now imported from the service

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
  articles: Article[] = [];
  videos: Video[] = [];
  loadingTopics = false;
  loadingArticles = false;
  loadingVideos = false;

  private categoryFilterMap: Record<CategoryKey, string> = {
    bp: 'Blood Pressure',
    sugar: 'Diabetes',
    diet: 'Diet',
    exercise: 'Exercise',
    lifestyle: 'Lifestyle'
  };

  constructor(private learningService: LearningServiceService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loadTopics();
    this.loadArticles();
    this.loadVideos();
  }

  loadTopics() {
    this.loadingTopics = true;
    const filterValue = this.categoryFilterMap[this.selectedCategory];

    this.learningService.getTopics(filterValue)
      .subscribe({
        next: res => {
          console.log('Topics API Response:', res);
          this.topics = res?.data || [];
          this.loadingTopics = false;
        },
        error: (error) => {
          console.error('Error loading topics:', error);
          this.loadingTopics = false;
        }
      });
  }
  loadArticles() {
    this.loadingArticles = true;
    const filterValue = this.categoryFilterMap[this.selectedCategory];

    this.learningService.getArticles(filterValue)
      .subscribe({
        next: res => {
          console.log('Articles API Response:', res);
          this.articles = res?.data || [];
          this.loadingArticles = false;
        },
        error: (error) => {
          console.error('Error loading articles:', error);
          this.loadingArticles = false;
        }
      });
  }

  viewTopicDetails(topic: Topic) {
    if (topic.Url) {
      window.open(topic.Url, '_blank');
    } else {
      // Fallback: show topic details in a modal or navigate to a details page
      console.log('Topic details:', topic);
      alert(`Topic: ${topic.title}\n\nDescription: ${topic.Teaser}\n\nThis topic contains detailed information about ${topic.title.toLowerCase()}.`);
    }
  }

  viewArticleDetails(article: Article) {
    if (article.url) {
      window.open(article.url, '_blank');
    } else {
      console.log('Article details:', article);
      alert(`Article: ${article.title}\n\nSummary: ${article.summary}\n\nAuthor: ${article.author}`);
    }
  }
  loadVideos() {
    this.loadingVideos = true;
    const filterValue = this.categoryFilterMap[this.selectedCategory];

    this.learningService.getVideos(filterValue)
      .subscribe({
        next: (res) => {
          console.log('Videos API Response:', res);
          this.videos = res?.data || [];
          this.loadingVideos = false;
        },
        error: (error) => {
          console.error('Error loading videos:', error);
          this.loadingVideos = false;
        }
      });
  }

  getVideoUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`
    );
  }
}
