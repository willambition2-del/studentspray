import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { processArabicBidi } from '../utils/arabic-shaper';

export interface PdfReportOptions {
  forumName: string;
  branchName?: string | null;
  reportTitle: string;
  subtitle?: string;
  metadata?: Array<{ label: string; value: string }>;
  tables?: Array<{
    title?: string;
    headers: string[];
    rows: Array<string[]>;
    columnWidths?: number[];
  }>;
  summaryBoxes?: Array<{ label: string; value: string | number }>;
  notes?: string[];
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private fontPath: string;
  private boldFontPath: string;

  constructor() {
    const customFont = process.env.PDF_FONT_PATH;
    const customBoldFont = process.env.PDF_BOLD_FONT_PATH;

    if (customFont && fs.existsSync(customFont)) {
      this.fontPath = customFont;
      this.boldFontPath = customBoldFont && fs.existsSync(customBoldFont) ? customBoldFont : customFont;
    } else {
      this.fontPath = path.join(__dirname, '../../../assets/fonts/arial.ttf');
      this.boldFontPath = path.join(__dirname, '../../../assets/fonts/arialbd.ttf');

      if (!fs.existsSync(this.fontPath)) {
        this.fontPath = path.join(process.cwd(), 'assets/fonts/arial.ttf');
        this.boldFontPath = path.join(process.cwd(), 'assets/fonts/arialbd.ttf');
      }
    }
  }

  async generateDocument(options: PdfReportOptions): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: options.reportTitle,
            Author: options.forumName,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        const hasFont = fs.existsSync(this.fontPath);
        const hasBoldFont = fs.existsSync(this.boldFontPath);

        const regularFont = hasFont ? this.fontPath : 'Helvetica';
        const boldFont = hasBoldFont ? this.boldFontPath : 'Helvetica-Bold';

        doc.font(boldFont);

        // 1. Header (Branding & Forum Identity)
        doc.rect(40, 40, 515, 60).fill('#0F3A2A');

        doc.fillColor('#FFFFFF').fontSize(14).text(
          processArabicBidi(options.forumName),
          50,
          48,
          { width: 495, align: 'right' },
        );

        if (options.branchName) {
          doc.fontSize(10).fillColor('#E2EBE6').text(
            processArabicBidi(`الفرع: ${options.branchName}`),
            50,
            68,
            { width: 495, align: 'right' },
          );
        }

        const dateStr = new Date().toISOString().split('T')[0];
        doc.fontSize(8).fillColor('#A4C2B4').text(
          processArabicBidi(`تاريخ الإصدار: ${dateStr}`),
          50,
          85,
          { width: 495, align: 'left' },
        );

        doc.moveDown(3);

        // 2. Report Title
        doc.font(boldFont).fontSize(16).fillColor('#0F3A2A').text(
          processArabicBidi(options.reportTitle),
          40,
          115,
          { width: 515, align: 'center' },
        );

        if (options.subtitle) {
          doc.font(regularFont).fontSize(11).fillColor('#5A6E65').text(
            processArabicBidi(options.subtitle),
            40,
            135,
            { width: 515, align: 'center' },
          );
        }

        let currentY = options.subtitle ? 160 : 145;

        // 3. Metadata Box
        if (options.metadata && options.metadata.length > 0) {
          doc.roundedRect(40, currentY, 515, 35, 6).fillAndStroke('#F8FAF9', '#E2EBE6');
          doc.font(regularFont).fontSize(9).fillColor('#1A2421');

          const colWidth = 515 / options.metadata.length;
          options.metadata.forEach((m, idx) => {
            const x = 555 - (idx + 1) * colWidth;
            const text = `${m.label}: ${m.value}`;
            doc.text(processArabicBidi(text), x, currentY + 12, {
              width: colWidth - 10,
              align: 'right',
            });
          });

          currentY += 45;
        }

        // 4. Summary KPI Boxes
        if (options.summaryBoxes && options.summaryBoxes.length > 0) {
          const count = options.summaryBoxes.length;
          const boxWidth = (515 - (count - 1) * 8) / count;

          options.summaryBoxes.forEach((box, i) => {
            const x = 40 + i * (boxWidth + 8);
            doc.roundedRect(x, currentY, boxWidth, 42, 6).fillAndStroke('#F0F7F4', '#1E8A5E');

            doc.font(boldFont).fontSize(12).fillColor('#135D3F').text(
              String(box.value),
              x,
              currentY + 6,
              { width: boxWidth, align: 'center' },
            );

            doc.font(regularFont).fontSize(8).fillColor('#5A6E65').text(
              processArabicBidi(box.label),
              x,
              currentY + 24,
              { width: boxWidth, align: 'center' },
            );
          });

          currentY += 55;
        }

        // 5. Tables
        if (options.tables) {
          for (const table of options.tables) {
            if (currentY > 680) {
              doc.addPage();
              currentY = 50;
            }

            if (table.title) {
              doc.font(boldFont).fontSize(11).fillColor('#0F3A2A').text(
                processArabicBidi(table.title),
                40,
                currentY,
                { width: 515, align: 'right' },
              );
              currentY += 18;
            }

            // Table Header
            const colCount = table.headers.length;
            const colWidth = 515 / colCount;

            doc.rect(40, currentY, 515, 20).fill('#135D3F');
            doc.font(boldFont).fontSize(8).fillColor('#FFFFFF');

            // Render headers from right to left
            table.headers.forEach((header, idx) => {
              const x = 555 - (idx + 1) * colWidth;
              doc.text(processArabicBidi(header), x, currentY + 5, {
                width: colWidth - 6,
                align: 'center',
              });
            });

            currentY += 20;

            // Table Rows
            table.rows.forEach((row, rowIdx) => {
              if (currentY > 740) {
                doc.addPage();
                currentY = 50;
              }

              const rowBg = rowIdx % 2 === 0 ? '#FFFFFF' : '#F8FAF9';
              doc.rect(40, currentY, 515, 18).fillAndStroke(rowBg, '#E2EBE6');

              doc.font(regularFont).fontSize(8).fillColor('#1A2421');

              row.forEach((cell, colIdx) => {
                const x = 555 - (colIdx + 1) * colWidth;
                doc.text(processArabicBidi(String(cell)), x, currentY + 4, {
                  width: colWidth - 6,
                  align: 'center',
                });
              });

              currentY += 18;
            });

            currentY += 15;
          }
        }

        // 6. Notes & Official Stamps Footer
        if (options.notes && options.notes.length > 0) {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.font(regularFont).fontSize(8).fillColor('#5A6E65');
          options.notes.forEach((note) => {
            doc.text(processArabicBidi(`• ${note}`), 40, currentY, {
              width: 515,
              align: 'right',
            });
            currentY += 12;
          });
        }

        // Footer on all pages
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.font(regularFont).fontSize(7).fillColor('#8C9E96');
          doc.text(
            processArabicBidi(`مستند رسمي صادر عن نظام الملتقى القرآني — صفحة ${i + 1} من ${pages.count}`),
            40,
            795,
            { width: 515, align: 'center' },
          );
        }

        doc.end();
      } catch (error) {
        this.logger.error('Error generating PDF:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
