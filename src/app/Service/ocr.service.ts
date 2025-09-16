import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface OCRResponse {
  extractedText: string;
  confidence: number;
  structuredData?: any;
}

export interface MedicationData {
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
  notes?: string | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private readonly API_BASE_URL = 'https://localhost:44308/api';
  private readonly OCR_SPACE_API_KEY = 'K87899142388957'; // Free OCR.space API key
  private readonly OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

  constructor(private http: HttpClient) {}

  /**
   * Process image using OCR.space free API
   */
  processImageWithOCRSpace(file: File): Observable<OCRResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apikey', this.OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('isTable', 'true');

    return this.http.post<any>(this.OCR_SPACE_URL, formData).pipe(
      map(response => {
        if (response.IsErroredOnProcessing) {
          throw new Error(response.ErrorMessage || 'OCR processing failed');
        }

        const extractedText = response.ParsedResults?.[0]?.ParsedText || '';
        const confidence = this.calculateConfidence(extractedText);

        return {
          extractedText,
          confidence
        };
      }),
      catchError(error => {
        console.error('OCR.space API error:', error);
        return throwError(() => new Error('Failed to process image with OCR'));
      })
    );
  }

  /**
   * Process image using backend OCR service
   */
  processImageWithBackend(file: File): Observable<OCRResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<OCRResponse>(`${this.API_BASE_URL}/ocr/process`, formData).pipe(
      catchError(error => {
        console.error('Backend OCR error:', error);
        // Fallback to OCR.space if backend fails
        return this.processImageWithOCRSpace(file);
      })
    );
  }

  /**
   * Extract structured medication data from raw text using AI
   */
  extractMedicationData(rawText: string): Observable<MedicationData> {
    return this.http.post<any>(`${this.API_BASE_URL}/ocr/extract-medication-data`, {
      text: rawText
    }).pipe(
      map(response => response.structuredData || {}),
      catchError(error => {
        console.error('Medication extraction error:', error);
        // Fallback to local extraction
        return this.extractMedicationDataLocally(rawText);
      })
    );
  }

  /**
   * Local fallback method to extract medication data using regex patterns
   */
  private extractMedicationDataLocally(text: string): Observable<MedicationData> {
    const structuredData: MedicationData = {};

    try {
      // Extract patient information
      structuredData.patientInfo = this.extractPatientInfo(text);
      
      // Extract doctor information
      structuredData.doctorInfo = this.extractDoctorInfo(text);
      
      // Extract medications
      structuredData.medications = this.extractMedications(text);
      
      // Extract notes
      structuredData.notes = this.extractNotes(text);

    } catch (error) {
      console.error('Local extraction error:', error);
    }

    return new Observable(observer => {
      observer.next(structuredData);
      observer.complete();
    });
  }

  private extractPatientInfo(text: string): any {
    const patientInfo: any = {};

    // Extract patient name
    const namePatterns = [
      /patient\s*:?\s*([a-zA-Z\s]+)/i,
      /name\s*:?\s*([a-zA-Z\s]+)/i,
      /mr\.?\s*([a-zA-Z\s]+)/i,
      /mrs\.?\s*([a-zA-Z\s]+)/i,
      /ms\.?\s*([a-zA-Z\s]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        patientInfo.name = match[1].trim();
        break;
      }
    }

    // Extract age
    const agePatterns = [
      /age\s*:?\s*(\d+)/i,
      /(\d+)\s*y(?:ears?)?/i,
      /(\d+)\s*yrs?/i
    ];

    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        patientInfo.age = match[1];
        break;
      }
    }

    // Extract patient ID
    const idPatterns = [
      /patient\s*id\s*:?\s*([a-zA-Z0-9]+)/i,
      /id\s*:?\s*([a-zA-Z0-9]+)/i,
      /reg\.?\s*no\.?\s*:?\s*([a-zA-Z0-9]+)/i
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        patientInfo.id = match[1];
        break;
      }
    }

    // Extract weight
    const weightPatterns = [
      /weight\s*:?\s*(\d+(?:\.\d+)?)\s*kg/i,
      /wt\.?\s*:?\s*(\d+(?:\.\d+)?)\s*kg/i
    ];

    for (const pattern of weightPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        patientInfo.weight = match[1] + ' kg';
        break;
      }
    }

    return Object.keys(patientInfo).length > 0 ? patientInfo : undefined;
  }

  private extractDoctorInfo(text: string): any {
    const doctorInfo: any = {};

    // Extract doctor name
    const doctorPatterns = [
      /dr\.?\s*([a-zA-Z\s]+)/i,
      /doctor\s*:?\s*([a-zA-Z\s]+)/i,
      /physician\s*:?\s*([a-zA-Z\s]+)/i
    ];

    for (const pattern of doctorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        doctorInfo.name = match[1].trim();
        break;
      }
    }

    // Extract license number
    const licensePatterns = [
      /license\s*:?\s*([a-zA-Z0-9]+)/i,
      /reg\.?\s*no\.?\s*:?\s*([a-zA-Z0-9]+)/i,
      /medical\s*license\s*:?\s*([a-zA-Z0-9]+)/i
    ];

    for (const pattern of licensePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        doctorInfo.license = match[1];
        break;
      }
    }

    // Extract clinic/hospital
    const clinicPatterns = [
      /clinic\s*:?\s*([a-zA-Z\s]+)/i,
      /hospital\s*:?\s*([a-zA-Z\s]+)/i,
      /medical\s*center\s*:?\s*([a-zA-Z\s]+)/i
    ];

    for (const pattern of clinicPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        doctorInfo.clinic = match[1].trim();
        break;
      }
    }

    return Object.keys(doctorInfo).length > 0 ? doctorInfo : undefined;
  }

  private extractMedications(text: string): any[] {
    const medications: any[] = [];
    const lines = text.split('\n');

    // Common medication patterns
    const medicationPatterns = [
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*mg/i,
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*ml/i,
      /(\w+(?:\s+\w+)*)\s+tablet/i,
      /(\w+(?:\s+\w+)*)\s+capsule/i
    ];

    // Frequency patterns
    const frequencyPatterns = [
      /(\d+)\s*times?\s*(?:a\s*)?day/i,
      /once\s*(?:a\s*)?day/i,
      /twice\s*(?:a\s*)?day/i,
      /thrice\s*(?:a\s*)?day/i,
      /every\s*(\d+)\s*hours?/i,
      /bid/i, // twice daily
      /tid/i, // three times daily
      /qid/i  // four times daily
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 3) continue;

      for (const pattern of medicationPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const medication: any = {
            name: match[1].trim()
          };

          if (match[2]) {
            medication.dosage = match[2] + (trimmedLine.includes('mg') ? ' mg' : ' ml');
          }

          // Extract frequency from the same line
          for (const freqPattern of frequencyPatterns) {
            const freqMatch = trimmedLine.match(freqPattern);
            if (freqMatch) {
              medication.frequency = freqMatch[0];
              break;
            }
          }

          // Extract duration
          const durationMatch = trimmedLine.match(/for\s*(\d+)\s*days?/i);
          if (durationMatch) {
            medication.duration = durationMatch[1] + ' days';
          }

          medications.push(medication);
          break;
        }
      }
    }

    return medications.length > 0 ? medications : [];
  }

  private extractNotes(text: string): string | undefined {
    const notePatterns = [
      /notes?\s*:?\s*(.+)/i,
      /instructions?\s*:?\s*(.+)/i,
      /remarks?\s*:?\s*(.+)/i
    ];

    for (const pattern of notePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private calculateConfidence(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    let confidence = 50; // Base confidence

    // Increase confidence based on text characteristics
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 10) confidence += 10;
    if (wordCount > 50) confidence += 10;

    // Check for medical terms
    const medicalTerms = [
      'patient', 'doctor', 'prescription', 'medication', 'dosage',
      'tablet', 'capsule', 'mg', 'ml', 'times', 'day', 'daily'
    ];

    const foundTerms = medicalTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );

    confidence += foundTerms.length * 3;

    // Check for structured data patterns
    if (text.includes(':')) confidence += 5;
    if (/\d+/.test(text)) confidence += 5;
    if (/dr\.?/i.test(text)) confidence += 10;

    return Math.min(confidence, 95); // Cap at 95%
  }
}
