export interface ADRPayload {
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    weight?: number;
    height?: number;
    country?: string;
    contactNumber?: string;
    email?: string;
  };
  drug: {
    drugName: string;
    genericName?: string;
    brandName?: string;
    dosage: string;
    route?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
    manufacturer?: string;
    lotNumber?: string;
  };
  adverseEvent: {
    eventDescription: string;
    eventCode?: string;
    serious?: boolean;
    outcome?: string;
    onsetDate?: string;
    resolutionDate?: string;
    severity?: string;
    actionTaken?: string;
  };
  reporter: {
    reporterType: string;
    reporterName: string;
    contactNumber?: string;
    email?: string;
  };
  optional?: {
    concomitantDrugs?: Array<{
      drugName: string;
      dosage: string;
      route?: string;
      frequency?: string;
    }>;
    labResults?: Array<{
      testName: string;
      result: string;
      date?: string;
    }>;
    attachments?: Array<{
      fileName: string;
      fileType: string;
      base64Data: string;
    }>;
    comments?: string;
  };
}
