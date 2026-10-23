import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LearningServiceService, Article, Topic } from '../../../../Service/learning-service.service';
import { TexteditorComponent } from "../../Shared/texteditor/texteditor.component";
import { ManageLearningResourceComponent } from '../learning-hub/manage-learning-resource/manage-learning-resource.component';
import { MatDialog } from '@angular/material/dialog';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeployUrl } from '../../../../Service/common.service';
import { forkJoin } from 'rxjs';

// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyAGAzQASofW4o2uOlok8iCcxDCxiuqgkjg'; // Replace with your actual API key
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

type CategoryKey = 'all' | 'bp' | 'sugar' | 'diet' | 'exercise' | 'lifestyle';

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
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
    MatProgressSpinnerModule,
    TexteditorComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './learing-hub.component.html',
  styleUrls: ['./learing-hub.component.scss', '../../../Shared/styles/table-template.scss']
})
export class LearingHubComponent {
  categories = [
    { key: 'all', label: 'All Topics' },
    { key: 'bp', label: 'Blood Pressure' },
    { key: 'sugar', label: 'Sugar / Diabetes' },
    { key: 'diet', label: 'Diet' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'lifestyle', label: 'Lifestyle' }
  ];

  apiUrl: any = DeployUrl.URL;
  selectedCategory: CategoryKey = 'all';
  activeTab: 'articles' | 'videos' | 'topics' | 'documents' = 'articles';

  topics: Topic[] = [];
  articles: Article[] = [];
  videos: YouTubeVideo[] = [];
  documents: any[] = [];
  loadingTopics = false;
  loadingArticles = false;
  loadingVideos = false;
  loadingDocuments = false;
  currentUserName: any;

  // Article editor properties
  selectedArticle: any | null = null;
  isEditMode = false;
  isCreatingNew = false;
  editorContent = '';
  articleTitle = '';
  articleSummary = '';
  isAdmin = false;

  private categoryFilterMap: Record<CategoryKey, string> = {
    all: 'All',
    bp: 'Blood Pressure',
    sugar: 'Diabetes',
    diet: 'Diet',
    exercise: 'Exercise',
    lifestyle: 'Lifestyle'
  };

  // YouTube search queries for each category
  private youtubeSearchQueries: Record<CategoryKey, string> = {
    all: 'health wellness tips medical advice',
    bp: 'blood pressure management health tips',
    sugar: 'diabetes management blood sugar control',
    diet: 'healthy diet nutrition tips',
    exercise: 'exercise fitness workout tips',
    lifestyle: 'healthy lifestyle wellness tips'
  };

  constructor(
    private dialog: MatDialog,
    private learningService: LearningServiceService,
    private sanitizer: DomSanitizer,
    private sharedService: SharedServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadAll();
  }

  checkUserRole(): void {
    const userInfo = this.sharedService.userInfo();
    this.currentUserName = userInfo?.name || 'Unknown User';
    var data = userInfo.userType == "Pharmacist" ? true : false;
    this.isAdmin = userInfo?.email === 'Admin123@gmail.com' ||
                   userInfo?.role === 'admin' ||
                   data;
  }

  loadAll() {
    this.loadArticles();
    this.loadVideos();
    this.loadDocuments();
  }

  loadDocuments() {
    this.loadingDocuments = true;
    this.getDocuments().subscribe({
      next: (res) => {
        this.documents = res || [];
        this.loadingDocuments = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.loadingDocuments = false;
      }
    });
  }

  loadArticles() {
    this.loadingArticles = true;

    if (this.selectedCategory === 'all') {
      // Load articles from all categories
      const allCategories = ['Blood Pressure', 'Diabetes', 'Diet', 'Exercise', 'Lifestyle'];
      const requests = allCategories.map(category => 
        this.learningService.getArticles(category)
      );

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          console.log('All Articles API Responses:', responses);
          // Combine all articles from all categories
          this.articles = responses.reduce((acc, res) => {
            return acc.concat(res?.data || []);
          }, []);
          
          // Sort by published date (newest first)
          this.articles.sort((a, b) => {
            return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
          });
          
          this.loadingArticles = false;
        },
        error: (error) => {
          console.error('Error loading articles:', error);
          this.articles = [];
          this.loadingArticles = false;
        }
      });
    } else {
      // Load articles for specific category
      const filterValue = this.categoryFilterMap[this.selectedCategory];
      this.learningService.getArticles(filterValue).subscribe({
        next: res => {
          console.log('Articles API Response:', res);
          this.articles = res?.data || [];
          this.loadingArticles = false;
        },
        error: (error) => {
          console.error('Error loading articles:', error);
          this.articles = [];
          this.loadingArticles = false;
        }
      });
    }
  }

  viewTopicDetails(topic: Topic) {
    if (topic.Url) {
      window.open(topic.Url, '_blank');
    } else {
      console.log('Topic details:', topic);
      alert(`Topic: ${topic.title}\n\nDescription: ${topic.Teaser}\n\nThis topic contains detailed information about ${topic.title.toLowerCase()}.`);
    }
  }

  viewArticle(article: Article): void {
    this.selectedArticle = article;
    this.articleTitle = article.title;
    this.articleSummary = article.summary;
    this.editorContent = article.content || '';
    this.isEditMode = false;
    this.isCreatingNew = false;
  }

  editArticle(article: Article): void {
    if (!this.isAdmin) {
      this.sharedService.Messages('error', 'Access Denied', 'Only administrators can edit articles');
      return;
    }
    this.selectedArticle = article;
    this.articleTitle = article.title;
    this.articleSummary = article.summary;
    this.editorContent = article.content || '';
    this.isEditMode = true;
    this.isCreatingNew = false;
  }

  createNewArticle(): void {
    if (!this.isAdmin) {
      this.sharedService.Messages('error', 'Access Denied', 'Only administrators can create articles');
      return;
    }
    this.selectedArticle = null;
    this.articleTitle = '';
    this.articleSummary = '';
    this.editorContent = '<p>Start writing your article here...</p>';
    this.isEditMode = true;
    this.isCreatingNew = true;
  }

  saveArticle(): void {
    if (!this.isAdmin) {
      this.sharedService.Messages('error', 'Access Denied', 'Only administrators can save articles');
      return;
    }

    if (!this.articleTitle || !this.articleSummary) {
      this.sharedService.Messages('warning', 'Validation Error', 'Please provide both title and summary');
      return;
    }

    const articleData: Article = {
      Id: this.selectedArticle?.id || '',
      title: this.articleTitle,
      summary: this.articleSummary,
      content: this.editorContent,
      category: this.categoryFilterMap[this.selectedCategory === 'all' ? 'bp' : this.selectedCategory],
      publishedDate: new Date().toISOString(),
      url: '',
      author: this.sharedService.userInfo()?.email || 'Unknown',
      tags: []
    };

    if (this.isCreatingNew) {
      this.learningService.createArticle(articleData).subscribe({
        next: (response) => {
          this.sharedService.Messages('success', 'Success', 'Article created successfully');
          this.loadArticles();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error creating article:', error);
          this.sharedService.Messages('error', 'Error', 'Failed to create article');
        }
      });
    } else {
      this.learningService.updateArticle(articleData.Id, articleData).subscribe({
        next: (response) => {
          this.sharedService.Messages('success', 'Success', 'Article updated successfully');
          this.loadArticles();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating article:', error);
          this.sharedService.Messages('error', 'Error', 'Failed to update article');
        }
      });
    }
  }

  deleteArticle(article: any): void {
    if (!this.isAdmin) {
      this.sharedService.Messages('error', 'Access Denied', 'Only administrators can delete articles');
      return;
    }

    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      this.learningService.deleteArticle(article.id).subscribe({
        next: () => {
          this.sharedService.Messages('success', 'Success', 'Article deleted successfully');
          this.loadArticles();
          if (this.selectedArticle?.id === article.id) {
            this.cancelEdit();
          }
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          this.sharedService.Messages('error', 'Error', 'Failed to delete article');
        }
      });
    }
  }

  cancelEdit(): void {
    this.selectedArticle = null;
    this.isEditMode = false;
    this.isCreatingNew = false;
    this.articleTitle = '';
    this.articleSummary = '';
    this.editorContent = '';
  }

  onEditorContentChange(content: string): void {
    this.editorContent = content;
  }

  openAddResourceDialog(type: 'article' | 'topic' | 'video'): void {
    const dialogRef = this.dialog.open(ManageLearningResourceComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log(`${result.action} ${type}:`, result.data);
      }
    });
  }

  openEditResourceDialog(resource: any, type: 'article' | 'topic' | 'video'): void {
    const dialogRef = this.dialog.open(ManageLearningResourceComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { type, resource }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        console.log(`${result.action} ${type}:`, result.data);
      }
    });
  }

  // YouTube API Integration - Fetch videos directly from YouTube
  loadVideos() {
    this.loadingVideos = true;

    if (this.selectedCategory === 'all') {
      // Load videos from all categories
      const allSearchQueries = [
        'blood pressure management health tips',
        'diabetes management blood sugar control',
        'healthy diet nutrition tips',
        'exercise fitness workout tips',
        'healthy lifestyle wellness tips'
      ];

      const requests = allSearchQueries.map(query => {
        const params = {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: '6', // 6 videos per category, total 30
          key: YOUTUBE_API_KEY,
          relevanceLanguage: 'en',
          videoEmbeddable: 'true',
          videoSyndicated: 'true'
        };
        return this.http.get<{ items: YouTubeVideo[] }>(YOUTUBE_API_URL, { params });
      });

      forkJoin(requests).subscribe({
        next: (responses) => {
          console.log('All YouTube API Responses:', responses);
          // Combine all videos from all categories
          this.videos = responses.reduce((acc, response) => {
            return acc.concat(response.items || []);
          }, [] as YouTubeVideo[]);
          
          // Remove duplicates based on videoId
          const uniqueVideos = this.videos.filter((video, index, self) =>
            index === self.findIndex((v) => v.id.videoId === video.id.videoId)
          );
          
          this.videos = uniqueVideos;
          this.loadingVideos = false;
        },
        error: (error) => {
          console.error('Error loading videos from YouTube:', error);
          this.sharedService.Messages('error', 'Error', 'Failed to load videos from YouTube. Please check your API key.');
          this.videos = [];
          this.loadingVideos = false;
        }
      });
    } else {
      // Load videos for specific category
      const searchQuery = this.youtubeSearchQueries[this.selectedCategory];
      const params = {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: '12',
        key: YOUTUBE_API_KEY,
        relevanceLanguage: 'en',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      };

      this.http.get<{ items: YouTubeVideo[] }>(YOUTUBE_API_URL, { params })
        .subscribe({
          next: (response) => {
            console.log('YouTube API Response:', response);
            this.videos = response.items || [];
            this.loadingVideos = false;
          },
          error: (error) => {
            console.error('Error loading videos from YouTube:', error);
            this.sharedService.Messages('error', 'Error', 'Failed to load videos from YouTube. Please check your API key.');
            this.videos = [];
            this.loadingVideos = false;
          }
        });
    }
  }

  getVideoUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`
    );
  }

  getDocuments() {
    return this.http.get<any[]>(`${DeployUrl.URL}api/Documents/list`);
  }

  newDocTitle: string = "";
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadDocument(fileInput: HTMLInputElement) {
    if (!this.selectedFile || !this.newDocTitle) {
      alert("Please select a file and enter a title.");
      return;
    }

    this.learningService.uploadDocument(this.selectedFile, this.newDocTitle, this.currentUserName)
      .subscribe({
        next: () => {
          alert("Document uploaded successfully!");
          this.newDocTitle = "";
          this.loadDocuments();
          this.selectedFile = null;
          fileInput.value = '';
          this.newDocTitle = '';
        },
        error: (err) => {
          console.error(err);
          alert("Failed to upload document.");
        }
      });
  }

  deleteDocumentsService(id: number) {
    return this.http.post<{ success: boolean }>(
      `${DeployUrl.URL}api/Documents/${id}`,
      {}
    );
  }

  deleteDocument(id: any) {
    if (confirm("Are you sure you want to delete this document?")) {
      this.deleteDocumentsService(id).subscribe({
        next: () => {
          alert("Document deleted successfully!");
          this.loadDocuments();
        },
        error: (err) => {
          console.error(err);
          alert("Failed to delete document.");
        }
      });
    }
  }
}