export interface PatientRequest {
  age: number;
  gender: string;
  bpReadings: number[]; // e.g. [146, 142, 138]
  glucoseReadings: number[]; // e.g. [145, 210]
  medications: string[];
}

export interface CoachResponse {
  interpretation: string;
  dietPlan: string[];
  exercisePlan: string[];
  lifestyleTips: string[];
  alerts: string[];
}
export interface DrugEvalResult {
  summary: string;
  annualCostsA: string;
  annualCostsB: string;
  icer: string;
  recommendation: string;
}

export interface  payloadDrug
 {
       drugA : string;
       drugB : string;
       condition : string;
 }
