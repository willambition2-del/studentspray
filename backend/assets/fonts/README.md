# Backend PDF Fonts

## Font Licensing and Deployment Guide

The Quran Forum platform PDF export engine generates high-quality Arabic administrative, educational, attendance, and student reports.

### Custom Font Configuration
To provide custom TrueType fonts for PDF generation in your production deployment:

1. Place your licensed Arabic TrueType font (e.g. `Amiri-Regular.ttf` / `NotoSansArabic-Regular.ttf`) in this directory or a server path.
2. Set the following environment variables in your deployment environment:
   ```env
   PDF_FONT_PATH=/path/to/arabic-font.ttf
   PDF_BOLD_FONT_PATH=/path/to/arabic-bold-font.ttf
   ```

### Default Fallback
If no custom font is provided via environment variables, the PDF generator defaults to standard PDFKit typefaces.
