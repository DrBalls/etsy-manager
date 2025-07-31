'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileUp,
  Upload,
  X,
  Check,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BulkImportProps {
  onImport: (file: File, mapping: FieldMapping) => void;
  disabled?: boolean;
}

interface FieldMapping {
  [etsyField: string]: string | null;
}

const ETSY_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'price', label: 'Price', required: true },
  { key: 'quantity', label: 'Quantity', required: true },
  { key: 'sku', label: 'SKU', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'materials', label: 'Materials', required: false },
  { key: 'processing_time_min', label: 'Processing Time Min', required: false },
  { key: 'processing_time_max', label: 'Processing Time Max', required: false },
  { key: 'category_id', label: 'Category ID', required: false },
  { key: 'who_made', label: 'Who Made', required: false },
  { key: 'when_made', label: 'When Made', required: false },
  { key: 'is_vintage', label: 'Is Vintage', required: false },
  { key: 'is_supply', label: 'Is Supply', required: false },
];

export function BulkImport({ onImport, disabled }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processingFile, setProcessingFile] = useState(false);

  const processFile = async (acceptedFile: File) => {
    setProcessingFile(true);
    setValidationErrors([]);
    
    try {
      const extension = acceptedFile.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        // Process CSV
        const text = await acceptedFile.text();
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const data = results.data.slice(0, 5); // Preview first 5 rows
            
            setHeaders(headers);
            setPreview(data);
            
            // Auto-map fields based on header names
            const autoMapping: FieldMapping = {};
            ETSY_FIELDS.forEach(field => {
              const matchingHeader = headers.find(h => 
                h.toLowerCase().includes(field.key.toLowerCase()) ||
                h.toLowerCase().includes(field.label.toLowerCase())
              );
              if (matchingHeader) {
                autoMapping[field.key] = matchingHeader;
              }
            });
            setMapping(autoMapping);
          },
          error: (error) => {
            setValidationErrors([`CSV parsing error: ${error.message}`]);
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Process Excel
        const buffer = await acceptedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (data.length > 0) {
          const headers = data[0] as string[];
          const rows = data.slice(1, 6).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          setHeaders(headers);
          setPreview(rows);
          
          // Auto-map fields
          const autoMapping: FieldMapping = {};
          ETSY_FIELDS.forEach(field => {
            const matchingHeader = headers.find(h => 
              h.toLowerCase().includes(field.key.toLowerCase()) ||
              h.toLowerCase().includes(field.label.toLowerCase())
            );
            if (matchingHeader) {
              autoMapping[field.key] = matchingHeader;
            }
          });
          setMapping(autoMapping);
        }
      } else {
        setValidationErrors(['Unsupported file format. Please use CSV or Excel files.']);
      }
      
      setFile(acceptedFile);
    } catch (error) {
      setValidationErrors([`Error processing file: ${error.message}`]);
    } finally {
      setProcessingFile(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: disabled || processingFile,
  });

  const handleMappingChange = (etsyField: string, fileHeader: string | null) => {
    setMapping(prev => ({
      ...prev,
      [etsyField]: fileHeader,
    }));
  };

  const validateMapping = () => {
    const errors: string[] = [];
    
    // Check required fields
    ETSY_FIELDS.filter(f => f.required).forEach(field => {
      if (!mapping[field.key]) {
        errors.push(`Required field "${field.label}" is not mapped`);
      }
    });
    
    // Check for duplicate mappings
    const mappedHeaders = Object.values(mapping).filter(Boolean);
    const duplicates = mappedHeaders.filter((item, index) => 
      mappedHeaders.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`Duplicate mappings found: ${duplicates.join(', ')}`);
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleImport = () => {
    if (!file) {
      setValidationErrors(['No file selected']);
      return;
    }
    
    if (validateMapping()) {
      onImport(file, mapping);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ETSY_FIELDS.map(f => f.label);
    const sampleData = [
      headers,
      [
        'Sample Product Title',
        'This is a sample product description',
        '29.99',
        '10',
        'SKU001',
        'handmade, gift, unique',
        'wood, fabric',
        '3',
        '5',
        '1',
        'i_did',
        'made_to_order',
        'false',
        'false',
      ],
    ];
    
    const csv = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etsy-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      {!file && (
        <div>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
              ${processingFile ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
            `}
          >
            <input {...getInputProps()} />
            <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV and Excel files (.csv, .xls, .xlsx)
            </p>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>
      )}

      {/* File Info */}
      {file && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB • {headers.length} columns
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setHeaders([]);
                  setPreview([]);
                  setMapping({});
                  setValidationErrors([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Mapping */}
      {headers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Field Mapping</h3>
            <p className="text-sm text-muted-foreground">
              Map your file columns to Etsy listing fields
            </p>
          </div>

          <div className="grid gap-4">
            {ETSY_FIELDS.map(field => (
              <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {mapping[field.key] && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Select
                  value={mapping[field.key] || ''}
                  onValueChange={(value) => 
                    handleMappingChange(field.key, value || null)
                  }
                >
                  <SelectTrigger id={field.key}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Preview</h3>
          <div className="border rounded-lg">
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map(header => (
                      <TableHead key={header} className="whitespace-nowrap">
                        {header}
                        {Object.entries(mapping).find(([_, v]) => v === header) && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {ETSY_FIELDS.find(f => 
                              mapping[f.key] === header
                            )?.label}
                          </Badge>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={index}>
                      {headers.map(header => (
                        <TableCell key={header} className="whitespace-nowrap">
                          {row[header] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      {file && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setHeaders([]);
              setPreview([]);
              setMapping({});
              setValidationErrors([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={disabled || validationErrors.length > 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Listings
          </Button>
        </div>
      )}
    </div>
  );
}