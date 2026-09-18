import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBulkUpload, chunkArray, getChunkSize, UploadResult } from '@/hooks/useBulkUpload';
import { bulkUploadSuggestions } from '@/api/suggestions';
import { exportErrorsCSV } from '@/utils/csv';
import { useToast } from '@/hooks/use-toast';

type SuggestionType = 'skills' | 'job-titles' | 'qualifications' | 'field-of-study';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SuggestionType;
  onSuccess?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'uploading' | 'complete';

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'job-titles',
  onSuccess
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<SuggestionType>(defaultType);
  const [selectedColumn, setSelectedColumn] = useState<number>(0);
  const [markAsVerified, setMarkAsVerified] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [dedupe, setDedupe] = useState(true);
  const [extractedNames, setExtractedNames] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
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
  } = useBulkUpload();

  const { toast } = useToast();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const parsed = await parseFile(selectedFile);
      setSelectedColumn(parsed.detectedColumn);
      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Parse Error',
        description: error instanceof Error ? error.message : 'Failed to parse file',
        variant: 'destructive'
      });
    }
  }, [parseFile, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleExtractAndValidate = useCallback(() => {
    if (!parsedData) return;

    const names = extractNames(parsedData, selectedColumn, {
      trim: trimWhitespace,
      dedupe
    });

    setExtractedNames(names);
    validateNames(names);
    setStep('preview');
  }, [parsedData, selectedColumn, trimWhitespace, dedupe, extractNames, validateNames]);

  const handleUpload = useCallback(async () => {
    if (extractedNames.length === 0) return;

    setIsUploading(true);
    setStep('uploading');
    abortControllerRef.current = new AbortController();

    const chunkSize = getChunkSize(extractedNames.length);
    const chunks = chunkArray(extractedNames, chunkSize);
    
    let totalCreated = 0;
    let totalModified = 0;
    let totalUpserted = 0;
    const allErrors: UploadResult['errors'] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        setUploadProgress({
          total: extractedNames.length,
          processed: i * chunkSize,
          succeeded: totalUpserted,
          failed: allErrors.length,
          currentChunk: i + 1,
          totalChunks: chunks.length
        });

        const result = await bulkUploadSuggestions(
          type,
          chunk,
          markAsVerified,
          abortControllerRef.current.signal
        );

        totalCreated += result.createdCount;
        totalModified += result.modifiedCount;
        totalUpserted += result.upsertedCount;
        allErrors.push(...result.errors);
      }

      const finalResult: UploadResult = {
        createdCount: totalCreated,
        modifiedCount: totalModified,
        upsertedCount: totalUpserted,
        errors: allErrors
      };

      setUploadResult(finalResult);
      setStep('complete');

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${finalResult.upsertedCount} items${
          finalResult.errors.length > 0 ? ` with ${finalResult.errors.length} errors` : ''
        }`
      });

      onSuccess?.();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: 'Upload Cancelled',
          description: 'The upload was cancelled by user'
        });
      } else {
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload data',
          variant: 'destructive'
        });
      }
      setStep('preview');
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [extractedNames, type, markAsVerified, setUploadProgress, setIsUploading, toast, onSuccess]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleClose = useCallback(() => {
    reset();
    setFile(null);
    setStep('upload');
    setExtractedNames([]);
    setUploadResult(null);
    onClose();
  }, [reset, onClose]);

  const handleDownloadErrors = useCallback(() => {
    if (uploadResult?.errors) {
      exportErrorsCSV(uploadResult.errors, `${type}-upload-errors.csv`);
    }
  }, [uploadResult, type]);

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type-select">Suggestion Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as SuggestionType)}>
          <SelectTrigger id="type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="job-titles">Job Titles</SelectItem>
            <SelectItem value="skills">Skills</SelectItem>
            <SelectItem value="qualifications">Qualifications</SelectItem>
            <SelectItem value="field-of-study">Field of Study</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload file"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports .xlsx, .xls, .csv files (max 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
          aria-label="File input"
        />
      </div>

      {file && (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Select the column that contains the names/titles you want to import
        </AlertDescription>
      </Alert>

      {parsedData && (
        <>
          <div className="space-y-2">
            <Label htmlFor="column-select">Select Column</Label>
            <Select
              value={selectedColumn.toString()}
              onValueChange={(value) => setSelectedColumn(parseInt(value))}
            >
              <SelectTrigger id="column-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parsedData.headers.map((header, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {header || `Column ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preview (first 10 rows)</Label>
            <ScrollArea className="h-48 rounded border">
              <div className="p-4">
                {parsedData.rows.slice(0, 10).map((row, index) => (
                  <div key={index} className="py-1 text-sm">
                    {row[selectedColumn]}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trim"
                checked={trimWhitespace}
                onCheckedChange={(checked) => setTrimWhitespace(checked as boolean)}
              />
              <Label htmlFor="trim" className="text-sm font-normal cursor-pointer">
                Trim whitespace
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dedupe"
                checked={dedupe}
                onCheckedChange={(checked) => setDedupe(checked as boolean)}
              />
              <Label htmlFor="dedupe" className="text-sm font-normal cursor-pointer">
                Remove duplicates
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={markAsVerified}
                onCheckedChange={(checked) => setMarkAsVerified(checked as boolean)}
              />
              <Label htmlFor="verified" className="text-sm font-normal cursor-pointer">
                Mark uploaded entries as VERIFIED
              </Label>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={() => setStep('upload')}>
          Back
        </Button>
        <Button onClick={handleExtractAndValidate}>
          Preview & Validate
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {extractedNames.length} items ready to upload
          </p>
          {validationErrors.length > 0 && (
            <p className="text-sm text-destructive">
              {validationErrors.length} validation errors found
            </p>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some rows have validation errors. You can still proceed, but those rows will be skipped.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-64 rounded border">
        <div className="p-4 space-y-2">
          {extractedNames.slice(0, 100).map((name, index) => {
            const error = validationErrors.find(e => e.row === index + 2);
            return (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  error ? 'bg-destructive/10 text-destructive' : 'bg-muted/50'
                }`}
              >
                {name}
                {error && (
                  <span className="ml-2 text-xs">({error.error})</span>
                )}
              </div>
            );
          })}
          {extractedNames.length > 100 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              ... and {extractedNames.length - 100} more items
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={() => setStep('mapping')}>
          Back
        </Button>
        <Button onClick={handleUpload} disabled={extractedNames.length === 0}>
          Upload {extractedNames.length} Items
        </Button>
      </div>
    </div>
  );

  const renderUploadingStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="font-medium">Uploading...</p>
      </div>

      {uploadProgress && (
        <>
          <Progress
            value={(uploadProgress.processed / uploadProgress.total) * 100}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Progress</p>
              <p className="font-medium">
                {uploadProgress.processed} / {uploadProgress.total}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Chunks</p>
              <p className="font-medium">
                {uploadProgress.currentChunk} / {uploadProgress.totalChunks}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Succeeded</p>
              <p className="font-medium text-green-600">{uploadProgress.succeeded}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="font-medium text-destructive">{uploadProgress.failed}</p>
            </div>
          </div>
        </>
      )}

      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={!isUploading}
        className="w-full"
      >
        Cancel Upload
      </Button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-medium text-lg">Upload Complete!</p>
      </div>

      {uploadResult && (
        <>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-green-600">
                {uploadResult.upsertedCount}
              </p>
              <p className="text-xs text-muted-foreground">Uploaded</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-blue-600">
                {uploadResult.createdCount}
              </p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-destructive">
                {uploadResult.errors.length}
              </p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>

          {uploadResult.errors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Error Details</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Download CSV
                  </Button>
                </div>
                <ScrollArea className="h-32 rounded border">
                  <div className="p-3 space-y-1">
                    {uploadResult.errors.slice(0, 20).map((error, index) => (
                      <div key={index} className="text-xs">
                        <span className="text-muted-foreground">Row {error.row}:</span>{' '}
                        {error.value} - <span className="text-destructive">{error.error}</span>
                      </div>
                    ))}
                    {uploadResult.errors.length > 20 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        ... and {uploadResult.errors.length - 20} more errors
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </>
      )}

      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
          <DialogDescription>
            Upload Excel or CSV file to bulk import {type.replace('-', ' ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'uploading' && renderUploadingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
