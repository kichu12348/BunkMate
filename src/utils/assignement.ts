import {
  AssignmentData,
  SubjectAssignments,
  Question,
  Answer,
  QA,
  QuestionGroup,
} from "../types/assignments";

export function formatAssignmentData(
  data: SubjectAssignments[],
): Map<string, AssignmentData[]> {
  if (!data || data.length === 0) return new Map<string, AssignmentData[]>();

  const subjectMap = new Map<string, AssignmentData[]>();

  data.forEach((item: SubjectAssignments) => {
    const subjectId = item.course[0].id.toString();
    const {
      id: assignmentId,
      name: assignmentName,
      created_at,
      activity_type,
    } = item;

    const check = subjectMap.get(subjectId) || [];
    check.push({
      assignmentId,
      assignmentName,
      created_at,
      activity_type,
    });
    subjectMap.set(subjectId, check);
  });
  return subjectMap;
}

export function mergeQuestionsAndAnswers(
  questions: Question[],
  answers: Answer[],
  questionGroups: QuestionGroup[],
): {
  list: QA[];
  totalScore: number;
  totalMaxMarks: number;
} {
  const answerMap = new Map(answers.map((a) => [a.examquestion_id, a]));
  const groupMap = new Map(questionGroups.map((g) => [g.id, []]));
  const bestOfMap = new Map(
    questionGroups.map((g) => [g.id, Number(g.best_of_questions)]),
  );

  let totalScore = 0;
  let totalMaxMarks = 0;

  questions.forEach((q) => {
    const a = answerMap.get(q.id);
    const question = q.question?.length > 0 ? q.question[0] : null;

    const data = {
      id: q.id,
      number: q.number,
      question: question?.type === "text" ? question.value : null,
      text: q.text,
      maximum_mark: q.maximum_mark,
      answer: a?.answer ?? null,
      score: a?.score ?? null,
    };

    const group = groupMap.get(q.orquestion_group_id);
    if (group) {
      group.push(data);
      groupMap.set(q.orquestion_group_id!, group);
    } else if (q.orquestion_group_id === null) {
      groupMap.set(q.id, [data]);
      bestOfMap.set(q.id, 1);
    }
  });

  const list: QA[] = [];

  groupMap.forEach((groupQuestions, groupId) => {
    const bestOf = bestOfMap.get(groupId);
    const sortedQuestions = groupQuestions.sort((a, b) => {
      const scoreA = a.score ? Number(a.score) : 0;
      const scoreB = b.score ? Number(b.score) : 0;
      return scoreB - scoreA;
    });
    const selectedQuestions = sortedQuestions.slice(0, bestOf);
    selectedQuestions.forEach((q) => {
      totalScore += q.score ? Number(q.score) : 0;
      totalMaxMarks += Number(q.maximum_mark);
      list.push(q);
    });
  });

  return {
    list,
    totalScore,
    totalMaxMarks,
  };
}
