import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import type { ExtractedJob } from '../extractor/types.js';

const JOBS_DIR = path.join(process.cwd(), 'content', 'jobs');

export async function writeJobsExcel(jobs: ExtractedJob[], dateStr: string): Promise<string> {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Job Aggregation Bot';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Cloud Jobs', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // Header row
  sheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Company', key: 'company', width: 22 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Remote', key: 'remote', width: 8 },
    { header: 'Employment Type', key: 'employmentType', width: 16 },
    { header: 'Experience', key: 'experienceLevel', width: 12 },
    { header: 'Salary', key: 'salary', width: 22 },
    { header: 'Skills', key: 'skills', width: 40 },
    { header: 'Visa', key: 'visaSponsorship', width: 10 },
    { header: 'URL', key: 'url', width: 50 },
    { header: 'Source', key: 'source', width: 20 },
  ];

  // Style the header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Add data rows
  for (const job of jobs) {
    const row = sheet.addRow({
      date: dateStr,
      company: job.company,
      title: job.title,
      location: job.location || 'Remote',
      remote: job.remote ? 'Yes' : 'No',
      employmentType: job.employmentType || '',
      experienceLevel: job.experienceLevel || '',
      salary: job.salary || '',
      skills: job.skills.join(', '),
      visaSponsorship: job.visaSponsorship || '',
      url: job.url,
      source: job.source,
    });

    // Make URL clickable
    const urlCell = row.getCell('url');
    urlCell.value = { text: job.url, hyperlink: job.url } as any;
    urlCell.font = { color: { argb: 'FF2563EB' }, underline: true };

    // Alternate row shading
    if (row.number % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }

    row.alignment = { wrapText: false, vertical: 'middle' };
    row.height = 20;
  }

  // Freeze header
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const filePath = path.join(JOBS_DIR, `jobs-${dateStr}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  console.log(`[Exporter:Excel] Written ${jobs.length} jobs to ${filePath}`);
  return filePath;
}
