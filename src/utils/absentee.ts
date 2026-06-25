import LZstring from "lz-string";
import { Linking } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_OVERVIEW_URL!;

export interface DateReport {
  date: Date;
  dateKey: string;
  subjects: AbsentSubject[];
}

export interface AbsentSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  absentHours: number[];
}

export async function openPdf(reportData: DateReport[]) {
  const rep = {};
  reportData.forEach((dateReport) => {
    if (dateReport.subjects.length > 0) {
      const date = dateReport.dateKey;
      rep[date] = {};
      dateReport.subjects.forEach((subject) => {
        rep[date][subject.subjectName] = subject.absentHours;
      });
    }
  });
  const compressed = LZstring.compressToBase64(JSON.stringify(rep));
  const url = `${API_BASE_URL}/pdf?d=${compressed}`;
  await Linking.openURL(url);
}
