'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Package,
  AlertCircle 
} from 'lucide-react';

interface BulkExportProps {
  selectedCount: number;
  totalCount: number;
  onExport: (options: ExportOptions) => void;
  disabled?: boolean;
}

interface ExportOptions {
  format: 'csv' | 'xlsx';
  selectedOnly: boolean;
  fields: string[];
}

const EXPORT_FIELDS = [
  { key: 'id', label: 'Listing ID', group: 'Basic' },
  { key: 'title', label: 'Title', group: 'Basic' },
  { key: 'description', label: 'Description', group: 'Basic' },
  { key: 'price', label: 'Price', group: 'Basic' },
  { key: 'quantity', label: 'Quantity', group: 'Basic' },
  { key: 'sku', label: 'SKU', group: 'Basic' },
  { key: 'state', label: 'State', group: 'Basic' },
  { key: 'url', label: 'URL', group: 'Basic' },
  
  { key: 'tags', label: 'Tags', group: 'Details' },
  { key: 'materials', label: 'Materials', group: 'Details' },
  { key: 'processing_time_min', label: 'Processing Time Min', group: 'Details' },
  { key: 'processing_time_max', label: 'Processing Time Max', group: 'Details' },
  { key: 'category_path', label: 'Category Path', group: 'Details' },
  { key: 'who_made', label: 'Who Made', group: 'Details' },
  { key: 'when_made', label: 'When Made', group: 'Details' },
  { key: 'is_vintage', label: 'Is Vintage', group: 'Details' },
  { key: 'is_supply', label: 'Is Supply', group: 'Details' },
  
  { key: 'views', label: 'Views', group: 'Analytics' },
  { key: 'favorites', label: 'Favorites', group: 'Analytics' },
  { key: 'featured_rank', label: 'Featured Rank', group: 'Analytics' },
  
  { key: 'created_at', label: 'Created Date', group: 'Dates' },
  { key: 'updated_at', label: 'Updated Date', group: 'Dates' },
  { key: 'last_synced_at', label: 'Last Synced', group: 'Dates' },
  
  { key: 'shipping_template_id', label: 'Shipping Template ID', group: 'Shipping' },
  { key: 'shipping_profile_id', label: 'Shipping Profile ID', group: 'Shipping' },
  
  { key: 'images', label: 'Image URLs', group: 'Media' },
  { key: 'image_count', label: 'Image Count', group: 'Media' },
];

const FIELD_GROUPS = ['Basic', 'Details', 'Analytics', 'Dates', 'Shipping', 'Media'];

export function BulkExport({ 
  selectedCount, 
  totalCount, 
  onExport, 
  disabled 
}: BulkExportProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [selectedOnly, setSelectedOnly] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => f.group === 'Basic').map(f => f.key)
  );
  const [fieldGroups, setFieldGroups] = useState<Record<string, boolean>>({
    Basic: true,
    Details: false,
    Analytics: false,
    Dates: false,
    Shipping: false,
    Media: false,
  });

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        return prev.filter(f => f !== fieldKey);
      } else {
        return [...prev, fieldKey];
      }
    });
  };

  const handleGroupToggle = (group: string) => {
    const newGroupState = !fieldGroups[group];
    setFieldGroups(prev => ({
      ...prev,
      [group]: newGroupState,
    }));

    const groupFields = EXPORT_FIELDS.filter(f => f.group === group).map(f => f.key);
    
    if (newGroupState) {
      // Add all fields from this group
      setSelectedFields(prev => {
        const newFields = [...prev];
        groupFields.forEach(field => {
          if (!newFields.includes(field)) {
            newFields.push(field);
          }
        });
        return newFields;
      });
    } else {
      // Remove all fields from this group
      setSelectedFields(prev => prev.filter(f => !groupFields.includes(f)));
    }
  };

  const handleSelectAll = () => {
    const allSelected = selectedFields.length === EXPORT_FIELDS.length;
    if (allSelected) {
      setSelectedFields([]);
      setFieldGroups(Object.fromEntries(FIELD_GROUPS.map(g => [g, false])));
    } else {
      setSelectedFields(EXPORT_FIELDS.map(f => f.key));
      setFieldGroups(Object.fromEntries(FIELD_GROUPS.map(g => [g, true])));
    }
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      return;
    }

    onExport({
      format,
      selectedOnly,
      fields: selectedFields,
    });
  };

  const exportCount = selectedOnly ? selectedCount : totalCount;

  return (
    <div className="space-y-6">
      {/* Export Scope */}
      <div>
        <Label className="text-base font-medium mb-3 block">Export Scope</Label>
        <RadioGroup 
          value={selectedOnly ? 'selected' : 'all'} 
          onValueChange={(value) => setSelectedOnly(value === 'selected')}
        >
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="selected" id="selected" />
            <Label htmlFor="selected" className="font-normal cursor-pointer">
              Export selected listings ({selectedCount} listings)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="font-normal cursor-pointer">
              Export all listings ({totalCount} listings)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Export Format */}
      <div>
        <Label className="text-base font-medium mb-3 block">Export Format</Label>
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-colors ${
              format === 'csv' ? 'border-primary' : ''
            }`}
            onClick={() => setFormat('csv')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-sm text-muted-foreground">
                    Comma-separated values
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors ${
              format === 'xlsx' ? 'border-primary' : ''
            }`}
            onClick={() => setFormat('xlsx')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Excel</p>
                  <p className="text-sm text-muted-foreground">
                    Microsoft Excel format
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Field Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-medium">Fields to Export</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedFields.length === EXPORT_FIELDS.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="space-y-4">
          {FIELD_GROUPS.map(group => {
            const groupFields = EXPORT_FIELDS.filter(f => f.group === group);
            const selectedGroupFields = groupFields.filter(f => 
              selectedFields.includes(f.key)
            );
            const isGroupSelected = selectedGroupFields.length === groupFields.length;
            const isGroupPartial = selectedGroupFields.length > 0 && 
              selectedGroupFields.length < groupFields.length;

            return (
              <div key={group} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isGroupSelected || isGroupPartial}
                    onCheckedChange={() => handleGroupToggle(group)}
                  />
                  <Label className="font-medium cursor-pointer">
                    {group} ({selectedGroupFields.length}/{groupFields.length})
                  </Label>
                </div>
                
                <div className="ml-6 grid grid-cols-2 gap-2">
                  {groupFields.map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <Label 
                        htmlFor={field.key} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Will export <strong>{exportCount}</strong> listings with{' '}
          <strong>{selectedFields.length}</strong> fields in{' '}
          <strong>{format.toUpperCase()}</strong> format
        </AlertDescription>
      </Alert>

      {/* Warnings */}
      {selectedFields.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select at least one field to export
          </AlertDescription>
        </Alert>
      )}

      {exportCount === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No listings to export. Please select listings or choose "Export all"
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          disabled={disabled || selectedFields.length === 0 || exportCount === 0}
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Export {exportCount} Listings
        </Button>
      </div>
    </div>
  );
}