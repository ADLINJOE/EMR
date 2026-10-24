import { Component, ElementRef, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { DeployUrl, CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { MatSelectModule } from "@angular/material/select";
import { MatAutocomplete, MatAutocompleteModule } from "@angular/material/autocomplete";
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

interface OCRResult {
  rawText: string;
  confidence: number;
  structuredData?: any;
}

interface StructuredMedicationData {
  patientInfo?: {
    name?: string;
    age?: string;
    id?: string;
    weight?: string;
  };
  doctorInfo?: {
    name?: string;
    license?: string;
    clinic?: string;
    contact?: string;
  };
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  notes?: string;
}

@Component({
  selector: 'app-ocr-scanner',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    FormsModule,
       CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatAutocomplete,
    MatSelectModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    FormsModule,

],
  templateUrl: './ocr-scanner.component.html',
  styleUrls: ['./ocr-scanner.component.scss', '../../../Shared/styles/table-template.scss']
})
export class OcrScannerComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
  searchPatientControl = new FormControl();
  patientDetails = computed(() => this.sharedService.patientDetails());
  patientGlobal = computed(() => this.sharedService.patient());
filteredPatients: Observable<any[]> | undefined;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isDragOver = false;
  showCamera = false;
  isProcessing = false;
  ocrResults: OCRResult | null = null;
  structuredData: StructuredMedicationData | null = null;
  errorMessage: string | null = null;
  mediaStream: MediaStream | null = null;
  returnUrl: string = '/medication-print';
  patients: any[] = [];


   userinfo = computed(() => this.sharedService.userInfo());
  UserSetGlobal: any;
  ngOnInit(): void {
    this.UserSetGlobal = this.userinfo();
    const payload = {
      UserType: this.UserSetGlobal.userType,
      UserId: this.UserSetGlobal.userID
    }
    this.commonService.Post('PatientHandle/Getmypatients', payload).subscribe({
      next: (res) => {

        if (res.success) {
          this.patients = res.patients.filter((x: any) => x.isRegistered === true);
          this.setupPatientFilter();
        }

      },

    });
  }

  ngOnDestroy() {
    this.closeCamera();
  }

  // File Upload Methods
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
 private _filterPatients(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.patients.filter(p =>
      p.name?.toLowerCase().includes(filterValue) 
      // ||
      // p.patientId?.toLowerCase().includes(filterValue) ||
      // p.email?.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
 private setupPatientFilter() {
    this.filteredPatients = this.searchPatientControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value || ''))
    );
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }
 displayPatient(patient: any): string {
  return patient ? patient.name : '';
}
  private handleFile(file: File) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showError('Please select a valid image file (JPG, PNG) or PDF.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.showError('File size must be less than 10MB.');
      return;
    }

    this.selectedFile = file;
    this.clearError();

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreview = null;
    }
  }
  selectedPatient: any = null;
patientselect(patid: number) {
this.selectedPatient = this.patients.find(p => p.patientId === patid) || null;
  const payload = {
    patID: patid,
    email: this.selectedPatient.email  // optional if you don’t want to filter by email
  };

  this.sharedService.setPatient(this.selectedPatient)

}
  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.imagePreview = null;
    this.ocrResults = null;
    this.structuredData = null;
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Camera Methods
  async captureFromCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      this.showCamera = true;
      
      // Wait for video element to be available
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showError('Unable to access camera. Please check permissions.');
    }
  }

  capturePhoto() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        this.handleFile(file);
        this.closeCamera();
      }
    }, 'image/jpeg', 0.8);
  }

  closeCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.showCamera = false;
  }

  // OCR Processing Methods
  async processOCR() {
    if (!this.selectedFile) {
      this.showError('Please select a file first.');
      return;
    }

    this.isProcessing = true;
    this.clearError();

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      // Call backend OCR API
      const response = await this.http.post<any>(`${DeployUrl.URL}api/ocr/process`, formData).toPromise();

      this.ocrResults = {
        rawText: response.extractedText || '',
        confidence: response.confidence || 0
      };

      // Process structured data
      await this.extractStructuredData(this.ocrResults.rawText);

    } catch (error) {
      console.error('OCR processing failed:', error);
      this.showError('Failed to process image. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  private async extractStructuredData(rawText: string) {
    try {
      // Call AI service to extract structured medication data
      const response = await this.commonService.Post('api/ocr/extract-medication-data', {
        text: rawText
      }).toPromise();

      this.structuredData = response.structuredData || null;
    } catch (error) {
      console.error('Failed to extract structured data:', error);
      // Continue without structured data
    }
  }

  reprocessOCR() {
    if (this.selectedFile) {
      this.processOCR();
    }
  }

  // Navigation and Data Application Methods
  goBack() {
    this.router.navigate([this.returnUrl]);
  }

  applyToForm() {
    if (this.structuredData && this.structuredData.medications) {
      this.saveMedicationsToPatient();
    }
  }

  // Save OCR extracted medications to patient record
  private saveMedicationsToPatient() {
    const patientDetails = this.patientDetails();
    const patientGlobal = this.patientGlobal();
    const patient = this.selectedPatient || patientGlobal;

    if (!patient || !this.structuredData?.medications) {
      this.sharedService.Messages('error', 'OCR', 'Patient details or medication data not available', 3000);
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const medicationsToSave = this.structuredData.medications.map(med => ({
      patientId: patient.patientID || patient.patientId,
      medname: med.name,
      dosage: med.dosage || '',
      frequency: this.mapFrequency(med.frequency || ''),
      startDate: currentDate,
      ongoing: true,
      isNew: true,
      isEditable: false,
      isDeleted: false,
      lastEditedBy: patient.email || 'OCR_SYSTEM'
    }));

    // Save medications via API
    const payload = {
      Mode: 'SAVE',
      PatientId: patient.patientID || patient.patientId,
      MedicationList: medicationsToSave
    };

    this.commonService.Post("CurrentMedication/currentmedication/", payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sharedService.Messages('success', 'OCR', `${medicationsToSave.length} medications added successfully`, 3000);
          this.router.navigate(['/MainLayout/currentmedication']);
        } else {
          this.sharedService.Messages('error', 'OCR', 'Failed to save medications', 3000);
        }
      },
      error: (error) => {
        console.error('Error saving medications:', error);
        this.sharedService.Messages('error', 'OCR', 'Error saving medications to patient record', 3000);
      }
    });
  }

  private mapFrequency(frequency: string): string {
    const freq = frequency.toLowerCase();
    if (freq.includes('once') || freq.includes('daily') || freq.includes('1')) return 'daily';
    if (freq.includes('twice') || freq.includes('bid') || freq.includes('2')) return 'twice_daily';
    if (freq.includes('three') || freq.includes('tid') || freq.includes('3')) return 'three_times_daily';
    if (freq.includes('four') || freq.includes('qid') || freq.includes('4')) return 'four_times_daily';
    if (freq.includes('weekly')) return 'weekly';
    return 'daily'; // default
  }

  editStructuredData() {
  
  }

  // Error Handling
  private showError(message: string) {
    this.errorMessage = message;
  }

  clearError() {
    this.errorMessage = null;
  }
}
