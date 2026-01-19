export interface AssignmentData {
  assignmentId: string;
  assignmentName: string;
  created_at: string;
  activity_type: string;
}

export interface SubjectAssignments {
  id: string;
  name: string;
  created_at: string;
  activity_type: string;
  course: { id: number }[];
}

export interface QuestionGroup {
  id: number;
  best_of_questions: string;
}

export interface Question {
  id: number;
  number: string;
  question: { type: string; value: string }[];
  text: string | null;
  maximum_mark: string;
  orquestion_group_id: number | null;
  question_note: string | null;
}

export interface Answer {
  examquestion_id: number;
  answer: string | null;
  score: string | null;
}

export interface QA {
  id: number;
  number: string;
  question: string;
  text: string | null;
  maximum_mark: string;
  answer: string | null;
  score: string | null;
}
