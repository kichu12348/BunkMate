interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "none";
  sessions: number;
}

interface AttendanceEntry {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number;
  is_entered_by_student?: number;
  final_attendance?: string;
  teacher_attendance?: string;
  user_attendance?: string;
  is_conflict?: number;
}

interface Data {
  day: AttendanceDay;
  entries: AttendanceEntry[];
}

interface AttendanceDayViewProps {
  data?: Data | null;
  isVisible: boolean;
  onClose: () => void;
  subjectId?: string;
  subjectName?: string;
  onUpdate?: () => void;
}


interface EditModalDataProps {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number;
  is_entered_by_student?: number;
  month?: number;
  day?: number;
  year?: number;
  is_conflict?: number;
  teacher_attendance?: string;
  user_attendance?: string;
  final_attendance?: string;
}

export type {
  AttendanceDay,
  AttendanceEntry,
  Data,
  AttendanceDayViewProps,
  EditModalDataProps,
};