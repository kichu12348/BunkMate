import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { File } from "expo-file-system";
import { format } from "date-fns";
import type { DateReport } from "./absentee";

export interface AbsenteePdfData {
  reportData: DateReport[];
  studentName?: string | null;
}

/** Builds the complete HTML document string for the Absentee Report PDF. */
function buildHtml(data: AbsenteePdfData): string {
  const { reportData, studentName } = data;

  const today = format(new Date(), "dd MMM yyyy");

  // Calculate total missed hours and aggregate per subject
  let totalMissedHours = 0;
  const subjectSummaryMap = new Map<
    string,
    { subjectName: string; subjectCode: string; totalHours: number }
  >();

  reportData.forEach((dateReport) => {
    dateReport.subjects.forEach((subj) => {
      const hoursCount = subj.absentHours.length;
      totalMissedHours += hoursCount;

      const existing = subjectSummaryMap.get(subj.subjectId);
      if (existing) {
        existing.totalHours += hoursCount;
      } else {
        subjectSummaryMap.set(subj.subjectId, {
          subjectName: subj.subjectName,
          subjectCode: subj.subjectCode,
          totalHours: hoursCount,
        });
      }
    });
  });

  const subjectSummaries = Array.from(subjectSummaryMap.values());

  // Date sections HTML
  const dateSectionsHtml = reportData
    .map((dateReport, dateIndex) => {
      const dateTitle = format(dateReport.date, "EEEE, do MMMM yyyy");
      const ndateTitle = format(dateReport.date, "dd-MM-yyyy");

      if (dateReport.subjects.length === 0) {
        return `
        <div class="date-section">
          <div class="date-title">${ndateTitle}</div>
          <p class="no-absence">No absences recorded on this date.</p>
        </div>`;
      }

      const rowsHtml = dateReport.subjects
        .map((subj, idx) => {
          const hoursList = subj.absentHours
            .map((h) => h.toString())
            .join(", ");
          return `
          <tr>
            <td style="text-align: center; width: 35px;">${idx + 1}</td>
            <td style="width: 110px;">${subj.subjectCode}</td>
            <td>${subj.subjectName}</td>
            <td>${hoursList}</td>
            <td style="text-align: center; width: 65px;">${subj.absentHours.length}</td>
          </tr>`;
        })
        .join("\n");

      return `
      <div class="date-section">
        <div class="date-title">${dateIndex + 1}. ${dateTitle}   (${ndateTitle})</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th style="width: 110px;">Subject Code</th>
              <th>Subject Name</th>
              <th>Missed Hour(s)</th>
              <th style="text-align: center; width: 65px;">Hours</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;
    })
    .join("\n");

  // Summary Table HTML (if multiple dates or multiple subjects)
  let summarySectionHtml = "";
  if (subjectSummaries.length > 0 && reportData.length > 1) {
    const summaryRows = subjectSummaries
      .map(
        (subj, idx) => `
        <tr>
          <td style="text-align: center; width: 35px;">${idx + 1}</td>
          <td style="width: 110px;">${subj.subjectCode}</td>
          <td>${subj.subjectName}</td>
          <td style="text-align: center; width: 90px;">${subj.totalHours}</td>
        </tr>`,
      )
      .join("\n");

    summarySectionHtml = `
    <div class="section-heading">Subject-Wise Absence Summary</div>
    <table class="report-table" style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th style="text-align: center; width: 35px;">#</th>
          <th style="width: 110px;">Subject Code</th>
          <th>Subject Name</th>
          <th style="text-align: center; width: 90px;">Total Hours</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
        <tr style="font-weight: bold; background-color: #f9f9f9;">
          <td colspan="3" style="text-align: right; padding-right: 12px;">Total Missed Hours:</td>
          <td style="text-align: center;">${totalMissedHours}</td>
        </tr>
      </tbody>
    </table>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Absentee Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      background: #ffffff;
      color: #000000;
      font-size: 13px;
      line-height: 1.5;
      padding: 40px 48px;
    }

    /* ── Document Title ── */
    .doc-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-subtitle {
      font-size: 12px;
      text-align: center;
      color: #333333;
      margin-bottom: 16px;
    }

    .divider {
      border-bottom: 1px solid #000000;
      margin-bottom: 16px;
    }

    /* ── Meta Info Table ── */
    .meta-table {
      width: 100%;
      margin-bottom: 16px;
      font-size: 13px;
      border-collapse: collapse;
    }

    .meta-table td {
      padding: 3px 0;
      vertical-align: top;
    }

    .meta-label {
      font-weight: bold;
      width: 140px;
    }

    .section-heading {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 18px;
      margin-bottom: 8px;
      border-bottom: 1px solid #333333;
      padding-bottom: 3px;
    }

    /* ── Date Sections ── */
    .date-section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }

    .date-title {
      font-size: 13.5px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .no-absence {
      font-style: italic;
      font-size: 12.5px;
      color: #555555;
      padding-left: 12px;
      margin-bottom: 8px;
    }

    /* ── Tables ── */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 12.5px;
    }

    .report-table th,
    .report-table td {
      border: 1px solid #333333;
      padding: 5px 8px;
      text-align: left;
    }

    .report-table th {
      font-weight: bold;
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>

  <div class="doc-title">Absentee Report</div>
  <div class="doc-subtitle">Generated on ${today}</div>
  <div class="divider"></div>

  <table class="meta-table">
    ${
      studentName
        ? `<tr>
            <td class="meta-label">Student Name:</td>
            <td>${studentName}</td>
          </tr>`
        : ""
    }
    <tr>
      <td class="meta-label">Total Days:</td>
      <td>${reportData.length} date${reportData.length > 1 ? "s" : ""} selected</td>
    </tr>
    <tr>
      <td class="meta-label">Total Missed Hours:</td>
      <td><strong>${totalMissedHours}</strong> hour${totalMissedHours === 1 ? "" : "s"}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div class="section-heading">Detailed Attendance Breakdown</div>

  ${
    reportData.length === 0
      ? `<p style="text-align:center; padding: 20px 0;">No date selected.</p>`
      : dateSectionsHtml
  }

  ${summarySectionHtml}

</body>
</html>`;
}

/**
 * Generates an Absentee Report PDF and opens the native share sheet.
 *
 * @param data The absentee report dates, student name, and username.
 */
export async function createAndShareAbsenteePdf(
  data: AbsenteePdfData,
): Promise<void> {
  const { reportData } = data;

  let fileName = "Absentee-Report.pdf";
  if (reportData.length === 1) {
    fileName = `Absentee-Report-${format(reportData[0].date, "dd-MMM-yyyy")}.pdf`;
  } else if (reportData.length > 1) {
    const startStr = format(reportData[0].date, "dd-MMM");
    const endStr = format(
      reportData[reportData.length - 1].date,
      "dd-MMM-yyyy",
    );
    fileName = `Absentee-Report-${startStr}-to-${endStr}.pdf`;
  }

  const html = buildHtml(data);

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
