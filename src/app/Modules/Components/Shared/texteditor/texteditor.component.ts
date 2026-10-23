import { Component, computed, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';

interface SavedDoc { name: string; content: string; savedAt: string }

@Component({
  selector: 'app-texteditor',
  imports: [CommonModule],
  template: `
  <div class="editor-wrap">
    <div class="toolbar" style="overflow: auto;">
      <select (change)="onFormatBlockChange($event)" title="Heading/Paragraph">
        <option value="P">Paragraph</option>
        <option value="H1">Heading 1</option>
        <option value="H2">Heading 2</option>
        <option value="H3">Heading 3</option>
      </select>

      <button (click)="exec('bold')" title="Bold"><b>B</b></button>
      <button (click)="exec('italic')" title="Italic"><i>I</i></button>
      <button (click)="exec('underline')" title="Underline"><u>U</u></button>
      <button (click)="exec('strikeThrough')" title="Strike">S</button>

      <button (click)="exec('insertUnorderedList')" title="Bullets">• List</button>
      <button (click)="exec('insertOrderedList')" title="Numbered">1. List</button>

      <button (click)="exec('justifyLeft')" title="Align left">Left</button>
      <button (click)="exec('justifyCenter')" title="Center">Center</button>
      <button (click)="exec('justifyRight')" title="Right">Right</button>

      <button (click)="insertLink()" title="Insert link">Link</button>
      <button (click)="insertImage()" title="Insert image">Image</button>

      <select (change)="onFontSizeChange($event)" title="Font size">
        <option value="3">Normal</option>
        <option value="4">Large</option>
        <option value="5">Larger</option>
        <option value="6">Huge</option>
      </select>

      <span class="spacer"></span>

      @if (showDocumentButtons) {
        <button (click)="newDoc()" title="New">New</button>
        <button (click)="save()" title="Save">Save</button>
        <button (click)="saveAs()" title="Save As">Save As</button>
      }
      <button (click)="togglePreview()" title="Preview">{{ isPreview ? 'Edit' : 'Preview' }}</button>
    </div>

    <div class="content-area">
      @if (!isPreview) {
        <div style="overflow: auto;" class="editor" contenteditable="true" tabindex="0" #editor
             [innerHTML]="currentContent" (input)="onInput($event)"></div>
      }

      @if (isPreview) {
        <div class="preview" [innerHTML]="currentContent"></div>
      }

      @if (showSidebar) {
        <aside class="sidebar">
          <h4>Saved Documents</h4>
          <ul>
            @for (d of savedDocs; track d.name; let i = $index) {
              <li>
                <a href="#" (click)="loadDoc(i); $event.preventDefault()">{{ d.name }}</a>
                <small>{{ d.savedAt }}</small>
                <button (click)="deleteDoc(i)" title="Delete">✕</button>
              </li>
            }
          </ul>
        </aside>
      }
    </div>
  </div>
  `,
  styles: [`
    .editor-wrap{font-family: Arial, Helvetica, sans-serif; border:1px solid #ddd; border-radius:6px; overflow:hidden}
    .toolbar{display:flex; gap:6px; align-items:center; padding:8px; background:#f7f7f7; border-bottom:1px solid #e3e3e3}
    .toolbar select, .toolbar button{padding:6px 8px; border:1px solid #ccc; background:white; border-radius:4px}
    .toolbar button{cursor:pointer}
    .spacer{flex:1}
    .content-area{display:flex; gap:12px}
    .editor{min-height:300px; padding:12px; flex:1; outline:none}
    .preview{min-height:300px; padding:12px; flex:1; background:#fff}
    .sidebar{width:240px; border-left:1px solid #eee; padding:12px; background:#fafafa}
    .sidebar ul{list-style:none; padding:0; margin:0}
    .sidebar li{display:flex; gap:6px; align-items:center; justify-content:space-between; padding:6px 0}
    .sidebar a{flex:1}
    .sidebar button{background:transparent; border:none; color:#900; cursor:pointer}
    @media(max-width:800px){.content-area{flex-direction:column}.sidebar{width:100%; border-left:none; border-top:1px solid #eee}}
  `]
})
export class TexteditorComponent implements OnInit {
    private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
    patientDetails = computed(() => this.sharedService.patientDetails());
  patientglobal =  computed(() => this.sharedService.patient());
  currentContent = '<p>Start typing here...</p>';
  isPreview = false;
  savedDocs: SavedDoc[] = [];
  storageKey = 'rich-editor-docs';
  @Input() showSidebar = true;
  @Input() showDocumentButtons = true;
  @Input() set content(value: string) {
    if (value !== this.currentContent) {
      this.currentContent = value || '<p>Start typing here...</p>';
    }
  }
  @Output() contentChange = new EventEmitter<string>();

  ngOnInit() {
    this.loadSavedDocs();
    // Initialize with content if provided
    if (this.content) {
      this.currentContent = this.content;
    }
  }

  exec(command: string, value: any = null) {
    document.execCommand(command, false, value);
  }

  onFontSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      this.exec('fontSize', target.value);
    }
  }

  onFormatBlockChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (target && target.value) {
      this.exec('formatBlock', target.value);
    }
  }

  insertLink() {
    const url = prompt('Enter URL', 'https://');
    if (url) this.exec('createLink', url);
  }

  insertImage() {
    const url = prompt('Enter image URL', 'https://');
    if (url) this.exec('insertImage', url);
  }

  onInput(event: any) {
    const newContent = event.target.innerHTML;
    if (newContent !== this.currentContent) {
      this.currentContent = newContent;
      this.contentChange.emit(this.currentContent);
    }
  }

  togglePreview() {
    this.isPreview = !this.isPreview;
  }

  newDoc() {
    if (confirm('Discard current content and start new document?')) {
      this.currentContent = '<p></p>';
      this.isPreview = false;
      localStorage.removeItem('rich-editor-current-name');
    }
  }

  save() {
    const lastName = localStorage.getItem('rich-editor-current-name');
    if (lastName) {
      this.saveToStorage(lastName, this.currentContent);
      alert('Saved to "' + lastName + '"');
      this.loadSavedDocs();
    } else {
      this.saveAs();
    }
  }

  saveAs() {
    const name = prompt('Save as (give this document a name)', 'Untitled');
    if (!name) return;
    this.saveToStorage(name, this.currentContent);
    localStorage.setItem('rich-editor-current-name', name);
    this.download(name + '.html', this.wrapHtml(name, this.currentContent));
    this.loadSavedDocs();
    alert('Saved locally as "' + name + '" and downloaded.');
  }

  saveToStorage(name: string, content: string) {
    const docs = this.getDocsFromStorage();
    const now = new Date().toLocaleString();
    const existingIndex = docs.findIndex(d => d.name === name);
    if (existingIndex >= 0) {
      docs[existingIndex].content = content;
      docs[existingIndex].savedAt = now;
    } else {
      docs.unshift({ name, content, savedAt: now });
    }
    localStorage.setItem(this.storageKey, JSON.stringify(docs));
  }

  getDocsFromStorage(): SavedDoc[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  loadSavedDocs() {
    this.savedDocs = this.getDocsFromStorage();
  }

  loadDoc(index: number) {
    const doc = this.savedDocs[index];
    if (!doc) return;
    if (confirm('Load "' + doc.name + '"? Unsaved changes will be lost.')) {
      this.currentContent = doc.content;
      localStorage.setItem('rich-editor-current-name', doc.name);
      this.isPreview = false;
    }
  }

  deleteDoc(index: number) {
    if (!confirm('Delete this saved document?')) return;
    this.savedDocs.splice(index, 1);
    localStorage.setItem(this.storageKey, JSON.stringify(this.savedDocs));
    this.loadSavedDocs();
  }

  download(filename: string, contents: string) {
    const blob = new Blob([contents], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  wrapHtml(title: string, bodyHtml: string) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${this.escapeHtml(title)}</title></head><body>${bodyHtml}</body></html>`;
  }

  escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
  }
}
