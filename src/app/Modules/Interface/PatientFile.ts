export interface PatientDetails {
  patientID: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  email: string;
  mobile: string;
}
export interface MedicationDto {
  id?: number;
  patientId?: number;
  medname?: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
  ongoing?: boolean;
  lastEditedBy?: string;
  isNew?: boolean;
  isEdited?: boolean;
  Deleted?: boolean;  // <-- Add this line
}


export interface MedicationRequestDto {
  mode :string;
  patientId?: number;
  medicationList: MedicationDto[];
}
export interface AllergyDto {
  PatientId?: number;
  AllergyList: AllergyDesCls[];
  Mode?: string;
}

export interface AllergyDesCls {
  Id?: number;
  PatientId?: number;
  Description: string;
  Deleted?: boolean;
  LastEditedBy: string;
}

export interface VitalDto {
  Mode: string;
  PatientId: number;
  VitalList: {
    Id: number | null;
    PatientId: number;
    ReadingDateTime: Date;
    Systolic: number;
    Diastolic: number;
    SugarFasting: number;
    SugarPP: number;
    Deleted: boolean;
    LastEditedBy: string;
  }[];
}


export interface DrugDto {
  id?: number;
  drugName?: string;
  genericName?: string;
  brandName?: string;
  drugCode?: string;
  strength?: string;
  dosageForm?: string;
  medicineType?: string;
  unitPrice?: number;
  status?: string;
  lastEditedBy?: string;
  isNew?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface DrugRequestDto {
  mode: string;
  drugList: DrugDto[];
}
