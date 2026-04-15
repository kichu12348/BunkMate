export interface DutyLeave {
  id: string;
  date: string;
  reason: string;
  documentUri?: string;
  documentName?: string;
  documentType?: "image" | "pdf";
  hours: number[] | "full_day";
  approved: boolean;
  createdAt: number;
}
