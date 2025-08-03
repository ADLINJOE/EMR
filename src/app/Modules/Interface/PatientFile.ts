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


