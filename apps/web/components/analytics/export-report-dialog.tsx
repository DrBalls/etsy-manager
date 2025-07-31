'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ExportReportDialog({
  open,
  onOpenChange,
  shopId,
  dateRange,
}: ExportReportDialogProps) {
  const [format, setFormat] = useState('pdf');
  const [sections, setSections] = useState({
    overview: true,
    revenue: true,
    products: true,
    customers: true,
    traffic: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          dateRange,
          format,
          sections,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Report</DialogTitle>
          <DialogDescription>
            Choose the format and sections to include in your report
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="xlsx">Excel Workbook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Include Sections</Label>
            <div className="space-y-2">
              {Object.entries({
                overview: 'Overview & Key Metrics',
                revenue: 'Revenue Analysis',
                products: 'Product Performance',
                customers: 'Customer Insights',
                traffic: 'Traffic Sources',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={sections[key as keyof typeof sections]}
                    onCheckedChange={(checked) =>
                      setSections((prev) => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Date Range: {dateRange.from.toLocaleDateString()} -{' '}
              {dateRange.to.toLocaleDateString()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}