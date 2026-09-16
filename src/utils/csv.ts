/**
 * CSV utility functions for bulk upload error reporting
 */

export interface CsvRow {
  [key: string]: string | number;
}

/**
 * Convert array of objects to CSV string
 */
export const convertToCSV = (data: CsvRow[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header]?.toString() || '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
};

/**
 * Download CSV file to user's device
 */
export const downloadCSV = (filename: string, csvContent: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Export bulk upload errors to CSV
 */
export const exportErrorsCSV = (
  errors: Array<{ row: number; value: string; error: string }>,
  filename = 'bulk-upload-errors.csv'
): void => {
  const csvData = errors.map(err => ({
    Row: err.row,
    Value: err.value,
    Error: err.error
  }));

  const csvContent = convertToCSV(csvData);
  downloadCSV(filename, csvContent);
};
