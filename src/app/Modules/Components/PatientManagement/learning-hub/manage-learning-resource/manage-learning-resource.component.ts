import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { LearningServiceService } from '../../../../../Service/learning-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Custom Components
import { TexteditorComponent } from '../../../Shared/texteditor/texteditor.component';

type ResourceType = 'article' | 'topic' | 'video';

@Component({
  selector: 'app-manage-learning-resource',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    TexteditorComponent
  ],
  templateUrl: './manage-learning-resource.component.html',
  styleUrls: ['./manage-learning-resource.component.scss']
})
export class ManageLearningResourceComponent implements OnInit {
  resourceForm!: FormGroup;
  loading = false;
  isEditMode = false;
  
  categories = [
    { value: 'general', viewValue: 'General' },
    { value: 'health', viewValue: 'Health' },
    { value: 'wellness', viewValue: 'Wellness' },
    { value: 'nutrition', viewValue: 'Nutrition' },
    { value: 'fitness', viewValue: 'Fitness' },
    { value: 'lifestyle', viewValue: 'Lifestyle' }
  ];
  
  // For tag management
  separatorKeysCodes: number[] = [13, 188]; // Enter and comma

  constructor(
    private fb: FormBuilder,
    private learningService: LearningServiceService,
    private dialogRef: MatDialogRef<ManageLearningResourceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: 'article' | 'topic' | 'video'; resource?: any },
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.data.resource) {
      this.isEditMode = true;
      this.populateForm(this.data.resource);
    }
  }

  // Initialize the form with appropriate controls based on resource type
  private initForm(): void {
    const formGroup: any = {
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['general', Validators.required],
      isActive: [true]
    };

    // Add type-specific controls
    if (this.data.type === 'article' || this.data.type === 'topic') {
      formGroup.content = ['', Validators.required];
      
      if (this.data.type === 'article') {
        formGroup.author = ['', Validators.required];
      } else if (this.data.type === 'topic') {
        formGroup.tags = [[]];
      }
    } else if (this.data.type === 'video') {
      formGroup.url = [
        '',
        [
          Validators.required,
          Validators.pattern('^(https?://)?(www\.)?(youtube\.com|youtu\.?be)/.+$')
        ]
      ];
      formGroup.duration = ['', [Validators.pattern('^[0-9]+$')]];
    }

    this.resourceForm = this.fb.group(formGroup);
  }

  // Populate form with existing resource data
  private populateForm(resource: any): void {
    const formData: any = {
      title: resource.title || '',
      description: resource.description || '',
      category: resource.category || 'general',
      isActive: resource.isActive !== undefined ? resource.isActive : true
    };

    if (this.data.type === 'article') {
      formData.content = resource.content || '';
      formData.author = resource.author || '';
    } else if (this.data.type === 'topic') {
      formData.content = resource.content || '';
      formData.tags = Array.isArray(resource.tags) ? [...resource.tags] : [];
    } else if (this.data.type === 'video') {
      formData.url = resource.url || '';
      formData.duration = resource.duration || '';
    }

    this.resourceForm.patchValue(formData);
  }

  // Handle tag addition
  addTag(event: any): void {
    const input = event.input;
    const value = (event.value || '').trim();

    if (value) {
      const currentTags = this.resourceForm.get('tags')?.value || [];
      if (!currentTags.includes(value)) {
        this.resourceForm.get('tags')?.setValue([...currentTags, value]);
        this.resourceForm.get('tags')?.updateValueAndValidity();
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  // Handle tag removal
  removeTag(tag: string): void {
    const currentTags = this.resourceForm.get('tags')?.value || [];
    const updatedTags = currentTags.filter((t: string) => t !== tag);
    this.resourceForm.get('tags')?.setValue(updatedTags);
    this.resourceForm.get('tags')?.updateValueAndValidity();
  }

  // Getter for form title
  get formTitle(): string {
    const type = this.data.type.charAt(0).toUpperCase() + this.data.type.slice(1);
    return `${this.isEditMode ? 'Edit' : 'Add New'} ${type}`;
  }

  // Handle content changes from the text editor
  onContentChange(content: string, controlName: string = 'content'): void {
    const control = this.resourceForm.get(controlName);
    if (control) {
      control.setValue(content);
      control.markAsDirty();
    }
  }

  // Handle form submission
  onSubmit(): void {
    if (this.resourceForm.invalid) {
      this.markFormGroupTouched(this.resourceForm);
      return;
    }

    this.loading = true;
    const formValue = this.resourceForm.value;
    
    // Prepare resource data
    const resourceData = {
      ...formValue,
      type: this.data.type,
      // Add any additional fields if needed
    };

    // Clean up tags if this is a topic
    if (this.data.type === 'topic' && Array.isArray(resourceData.tags)) {
      resourceData.tags = resourceData.tags
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag !== '');
    }

    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.dialogRef.close({
        success: true,
        action: this.isEditMode ? 'updated' : 'created',
        data: resourceData
      });
    }, 1000);
  }

  // Handle cancel action
  onCancel(): void {
    if (this.resourceForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.dialogRef.close({ success: false });
      }
    } else {
      this.dialogRef.close({ success: false });
    }
  }

  // Mark all form controls as touched to trigger validation
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Sanitize HTML for safe display
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Track by function for ngFor
  trackByFn(index: number, item: any): any {
    return item?.id || index;
  }
}
