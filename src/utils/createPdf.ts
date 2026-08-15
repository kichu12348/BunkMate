import * as Print from "expo-print";
import { shareAsync, isAvailableAsync } from "expo-sharing";
import { parseHtmlContent } from "./htmlParser";
import type { QA } from "../types/assignments";
import { Directory, File, Paths } from "expo-file-system";

export interface AssignmentPdfData {
  assignmentName: string;
  totalScore: number;
  totalMaxMarks: number;
  list: QA[];
  courseCode: string;
}

/**
 * Converts an image URL to a base64 data URI so it embeds correctly
 * inside expo-print's offline renderer.
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) return url;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/** Collects all image URLs in the list and resolves them to base64. */
async function resolveImages(list: QA[]): Promise<Record<string, string>> {
  const allUrls: string[] = [];

  for (const item of list) {
    const html = item.question || item.text || "";
    const nodes = parseHtmlContent(html);
    for (const node of nodes) {
      if (node.type === "image" && !allUrls.includes(node.imgUrl)) {
        allUrls.push(node.imgUrl);
      }
    }
  }

  const entries = await Promise.all(
    allUrls.map(async (url) => [url, await fetchImageAsBase64(url)] as const),
  );

  return Object.fromEntries(entries);
}

/** Renders a single QA item into an HTML string. */
function renderQuestion(
  item: QA,
  index: number,
  imageMap: Record<string, string>,
): string {
  const num = `${index + 1}.`;
  const score = item.score !== null ? Number(item.score) : null;
  const maxMark = item.maximum_mark !== null ? Number(item.maximum_mark) : null;
  const hasScore = score !== null && maxMark !== null;

  const marksText = hasScore
    ? ` (${score}/${maxMark} Marks)`
    : maxMark !== null
      ? ` (${maxMark} Marks)`
      : "";

  const html = item.question || item.text || "";
  const nodes = parseHtmlContent(html);

  let contentHtml = "";
  for (const node of nodes) {
    if (node.type === "text") {
      const escaped = node.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      contentHtml += `<div class="q-text">${escaped}</div>`;
    } else if (node.type === "image") {
      const src = imageMap[node.imgUrl] ?? node.imgUrl;
      contentHtml += `<div><img class="q-img" src="${src}" alt="Question diagram" /></div>`;
    }
  }

  return `
  <div class="question">
    <div class="q-title"><strong>${num}</strong>${marksText}</div>
    ${contentHtml}
  </div>`;
}

/** Builds the complete HTML document string for the PDF. */
function buildHtml(
  data: AssignmentPdfData,
  imageMap: Record<string, string>,
): string {
  const { assignmentName, totalScore, totalMaxMarks, list, courseCode } = data;
  const progress =
    totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

  const questionsHtml = list
    .map((item, i) => renderQuestion(item, i, imageMap))
    .join("\n");

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${assignmentName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Calibri, Arial, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000000;
      background: #ffffff;
      padding: 36px 44px;
    }

    h1 {
      font-size: 16pt;
      font-weight: bold;
      color: #000000;
      margin-bottom: 4px;
    }

    .meta {
      font-size: 10pt;
      color: #333333;
      margin-bottom: 10px;
    }

    hr {
      border: none;
      border-top: 1px solid #000000;
      margin: 10px 0 14px 0;
    }

    .disclaimer {
      font-size: 9.5pt;
      font-style: italic;
      color: #444444;
      margin-bottom: 16px;
    }

    .question {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }

    .q-title {
      font-size: 11pt;
      margin-bottom: 4px;
    }

    .q-text {
      font-size: 11pt;
      margin-bottom: 6px;
      line-height: 1.45;
    }

    .q-img {
      max-width: 100%;
      height: auto;
      margin: 8px 0;
      display: block;
    }
  </style>
</head>
<body>

  <h1>${assignmentName}</h1>
  <div class="meta">
    ${courseCode ? `Course: ${courseCode} &nbsp;|&nbsp; ` : ""}Score: ${totalScore} / ${totalMaxMarks} (${progress}%) &nbsp;|&nbsp; Date: ${today}
  </div>

  <hr />

  <div class="disclaimer">
    Note: These questions may or may not be the actual questions as in the exam paper. Go through at your own risk.
  </div>

  ${
    list.length === 0
      ? `<p style="padding: 16px 0;">No questions available.</p>`
      : questionsHtml
  }

</body>
</html>`;
}

/**
 * Generates a PDF from assignment data and opens the native share sheet.
 *
 * @param data  The assignment title, scores, and question list.
 */
export async function createAndShareAssignmentPdf(
  data: AssignmentPdfData,
): Promise<void> {
  if (await isAvailableAsync()) {
    const imageMap = await resolveImages(data.list);

    const cleanCourse = (data.courseCode || "").trim();
    const cleanName = data.assignmentName.replace(/[/\\?%*:|"<>]/g, "_").trim();
    const fileName = cleanCourse
      ? `${cleanCourse}-${cleanName}.pdf`
      : `${cleanName}.pdf`;

    const html = buildHtml(data, imageMap);

    const { uri } = await Print.printToFileAsync({
      html,
      width: 595, // A4 width in points
      height: 842, // A4 height in points
    });

    const file = new File(uri);
    file.rename(fileName);

    await shareAsync(file.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Share ${fileName}`,
      UTI: ".pdf",
    });

    file.delete();
  }
}
