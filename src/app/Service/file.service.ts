import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SavedDoc {
  id?: string;
  name: string;
  content: string;
  savedAt: string;
  createdBy?: string;
  userRole?: 'admin' | 'patient';
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private documentsSubject = new BehaviorSubject<SavedDoc[]>([]);
  public documents$ = this.documentsSubject.asObservable();

  constructor() {
    this.loadDocuments();
  }

  /**
   * Download a JSON file with the document data
   */
  downloadDocumentAsJson(doc: SavedDoc, filename?: string): void {
    const fileName = filename || `${doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const dataStr = JSON.stringify(doc, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(link.href);
  }

  /**
   * Save document to local storage (for now) and download as JSON
   */
  saveDocument(doc: SavedDoc): void {
    const documents = this.getDocuments();
    const existingIndex = documents.findIndex(d => d.name === doc.name);

    if (existingIndex >= 0) {
      documents[existingIndex] = { ...doc, savedAt: new Date().toISOString() };
    } else {
      documents.push({ ...doc, id: this.generateId(), savedAt: new Date().toISOString() });
    }

    this.saveDocuments(documents);
    this.downloadDocumentAsJson(doc);
  }

  /**
   * Load documents from local storage
   */
  loadDocuments(): SavedDoc[] {
    try {
      const stored = localStorage.getItem('texteditor-documents');
      if (stored) {
        const documents = JSON.parse(stored);
        this.documentsSubject.next(documents);
        return documents;
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
    return [];
  }

  /**
   * Get all documents
   */
  getDocuments(): SavedDoc[] {
    return this.documentsSubject.value;
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): SavedDoc | undefined {
    return this.documentsSubject.value.find(doc => doc.id === id);
  }

  /**
   * Delete document by ID
   */
  deleteDocument(id: string): void {
    const documents = this.documentsSubject.value.filter(doc => doc.id !== id);
    this.saveDocuments(documents);
  }

  /**
   * Save documents to local storage
   */
  private saveDocuments(documents: SavedDoc[]): void {
    try {
      localStorage.setItem('texteditor-documents', JSON.stringify(documents));
      this.documentsSubject.next(documents);
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    // For now, check if we're in admin mode (this would need to be connected to your auth system)
    return localStorage.getItem('user-role') === 'admin' ||
           window.location.hash.includes('admin') ||
           false; // Default to false for safety
  }

  /**
   * Set user role
   */
  setUserRole(role: 'admin' | 'patient'): void {
    localStorage.setItem('user-role', role);
  }

  /**
   * Get current user role
   */
  getUserRole(): 'admin' | 'patient' {
    return (localStorage.getItem('user-role') as 'admin' | 'patient') || 'patient';
  }
}
