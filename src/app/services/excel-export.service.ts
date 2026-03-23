import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  constructor() {}

  /**
   * Export data to Excel file
   * @param data Array of objects to export
   * @param filename Name of the Excel file (without .xlsx extension)
   * @param sheetName Name of the worksheet
   */
  exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns based on content
    const columnWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    const excelFilename = `${filename}_${this.getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, excelFilename);
  }

  /**
   * Export multiple sheets to one Excel file
   * @param sheetsData Array of { sheetName, data } objects
   * @param filename Name of the Excel file (without .xlsx extension)
   */
  exportMultipleSheets(sheetsData: { sheetName: string; data: any[] }[], filename: string): void {
    if (!sheetsData || sheetsData.length === 0) {
      console.warn('No sheets to export');
      return;
    }

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    sheetsData.forEach(({ sheetName, data }) => {
      if (data && data.length > 0) {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const columnWidths = this.calculateColumnWidths(data);
        worksheet['!cols'] = columnWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    const excelFilename = `${filename}_${this.getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, excelFilename);
  }

  /**
   * Calculate column widths based on data content
   * @param data Array of objects
   * @returns Array of column width objects
   */
  private calculateColumnWidths(data: any[]): { wch: number }[] {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths = keys.map(key => {
      // Get the maximum length of the key itself or any value in that column
      const maxLength = Math.max(
        key.length,
        ...data.map(row => {
          const value = row[key];
          return value ? String(value).length : 0;
        })
      );
      // Add some padding
      return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 characters
    });

    return widths;
  }

  /**
   * Get formatted date string for filename
   * @returns Date string in YYYYMMDD_HHMMSS format
   */
  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Transform data before export (optional utility)
   * Useful for formatting dates, numbers, etc.
   * @param data Original data
   * @param transformFn Transformation function
   * @returns Transformed data
   */
  transformData<T>(data: T[], transformFn: (item: T) => any): any[] {
    return data.map(transformFn);
  }
}
