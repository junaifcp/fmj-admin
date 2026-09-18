import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: string[][];
  detectedColumn: number;
}

export interface ValidationError {
  row: number;
  value: string;
  error: string;
}

export interface UploadProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentChunk: number;
  totalChunks: number;
}

export interface UploadResult {
  createdCount: number;
  modifiedCount: number;
  upsertedCount: number;
  errors: ValidationError[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CHUNK_SIZE = 500;

/**
 * Hook for handling bulk upload parsing and validation
 */
export const useBulkUpload = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Parse Excel/CSV file
   */
  const parseFile = useCallback(async (file: File): Promise<ParsedData> => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }

          const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell));

          // Auto-detect column containing names
          const nameColumnIndex = detectNameColumn(headers);

          const parsed: ParsedData = {
            headers: jsonData[0].map(h => String(h)),
            rows,
            detectedColumn: nameColumnIndex
          };

          setParsedData(parsed);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse file. Please ensure it\'s a valid Excel or CSV file.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }, []);

  /**
   * Auto-detect column that likely contains names
   */
  const detectNameColumn = (headers: string[]): number => {
    const namePatterns = ['name', 'title', 'job title', 'skill', 'qualification', 'field'];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (namePatterns.some(pattern => header.includes(pattern))) {
        return i;
      }
    }

    return 0; // Default to first column
  };

  /**
   * Extract names from parsed data
   */
  const extractNames = useCallback((
    data: ParsedData,
    columnIndex: number,
    options: { trim?: boolean; dedupe?: boolean } = {}
  ): string[] => {
    const { trim = true, dedupe = true } = options;

    let names = data.rows
      .map(row => String(row[columnIndex] || ''))
      .filter(name => name.length > 0);

    if (trim) {
      names = names.map(name => name.trim());
    }

    if (dedupe) {
      names = Array.from(new Set(names));
    }

    return names;
  }, []);

  /**
   * Validate extracted names
   */
  const validateNames = useCallback((names: string[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const seen = new Set<string>();

    names.forEach((name, index) => {
      const row = index + 2; // +2 because of header row and 1-indexed

      if (!name || name.trim().length === 0) {
        errors.push({ row, value: name, error: 'Empty value' });
        return;
      }

      if (name.length > 200) {
        errors.push({ row, value: name, error: 'Value too long (max 200 characters)' });
        return;
      }

      // Check for invalid characters
      if (/[<>{}[\]\\]/.test(name)) {
        errors.push({ row, value: name, error: 'Contains invalid characters' });
        return;
      }

      // Check duplicates in this batch
      const normalized = name.toLowerCase();
      if (seen.has(normalized)) {
        errors.push({ row, value: name, error: 'Duplicate in file' });
      } else {
        seen.add(normalized);
      }
    });

    setValidationErrors(errors);
    return errors;
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setParsedData(null);
    setValidationErrors([]);
    setUploadProgress(null);
    setIsUploading(false);
  }, []);

  return {
    parsedData,
    validationErrors,
    uploadProgress,
    isUploading,
    parseFile,
    extractNames,
    validateNames,
    setUploadProgress,
    setIsUploading,
    reset
  };
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get chunk size based on total items
 */
export const getChunkSize = (totalItems: number): number => {
  if (totalItems < 100) return totalItems;
  if (totalItems < 1000) return 500;
  return 1000;
};
