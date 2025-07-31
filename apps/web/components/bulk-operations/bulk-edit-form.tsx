'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, DollarSign, Package, Tag, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const bulkEditSchema = z.object({
  // Pricing
  updatePrice: z.boolean().default(false),
  priceAction: z.enum(['set', 'increase', 'decrease']).optional(),
  priceValue: z.string().optional(),
  priceType: z.enum(['fixed', 'percentage']).optional(),
  
  // Quantity
  updateQuantity: z.boolean().default(false),
  quantityAction: z.enum(['set', 'increase', 'decrease']).optional(),
  quantityValue: z.string().optional(),
  
  // State
  updateState: z.boolean().default(false),
  state: z.enum(['ACTIVE', 'DRAFT', 'INACTIVE']).optional(),
  
  // Tags
  updateTags: z.boolean().default(false),
  tagsAction: z.enum(['add', 'remove', 'replace']).optional(),
  tags: z.string().optional(),
  
  // Processing Time
  updateProcessingTime: z.boolean().default(false),
  processingMin: z.string().optional(),
  processingMax: z.string().optional(),
  
  // Shipping
  updateShipping: z.boolean().default(false),
  shippingTemplateId: z.string().optional(),
  
  // Materials
  updateMaterials: z.boolean().default(false),
  materials: z.string().optional(),
  
  // Section
  updateSection: z.boolean().default(false),
  sectionId: z.string().optional(),
});

type BulkEditFormData = z.infer<typeof bulkEditSchema>;

interface BulkEditFormProps {
  selectedCount: number;
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

export function BulkEditForm({ selectedCount, onSubmit, disabled }: BulkEditFormProps) {
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());

  const form = useForm<BulkEditFormData>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      updatePrice: false,
      updateQuantity: false,
      updateState: false,
      updateTags: false,
      updateProcessingTime: false,
      updateShipping: false,
      updateMaterials: false,
      updateSection: false,
    },
  });

  const handleSubmit = (data: BulkEditFormData) => {
    const updates: any = {};

    if (data.updatePrice && data.priceAction && data.priceValue) {
      updates.price = {
        action: data.priceAction,
        value: parseFloat(data.priceValue),
        type: data.priceType,
      };
    }

    if (data.updateQuantity && data.quantityAction && data.quantityValue) {
      updates.quantity = {
        action: data.quantityAction,
        value: parseInt(data.quantityValue),
      };
    }

    if (data.updateState && data.state) {
      updates.state = data.state;
    }

    if (data.updateTags && data.tagsAction && data.tags) {
      updates.tags = {
        action: data.tagsAction,
        value: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
    }

    if (data.updateProcessingTime && data.processingMin && data.processingMax) {
      updates.processingTime = {
        min: parseInt(data.processingMin),
        max: parseInt(data.processingMax),
      };
    }

    if (data.updateShipping && data.shippingTemplateId) {
      updates.shippingTemplateId = data.shippingTemplateId;
    }

    if (data.updateMaterials && data.materials) {
      updates.materials = data.materials.split(',').map(m => m.trim()).filter(Boolean);
    }

    if (data.updateSection && data.sectionId) {
      updates.sectionId = data.sectionId;
    }

    onSubmit(updates);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {selectedCount} listings selected. Only the fields you enable will be updated.
          </AlertDescription>
        </Alert>

        {/* Price Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-medium">Price</h3>
            </div>
            <FormField
              control={form.control}
              name="updatePrice"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setActiveFields(prev => new Set(prev).add('price'));
                        } else {
                          setActiveFields(prev => {
                            const next = new Set(prev);
                            next.delete('price');
                            return next;
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {activeFields.has('price') && (
            <div className="grid grid-cols-3 gap-4 pl-6">
              <FormField
                control={form.control}
                name="priceAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="set">Set to</SelectItem>
                        <SelectItem value="increase">Increase by</SelectItem>
                        <SelectItem value="decrease">Decrease by</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Quantity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <h3 className="font-medium">Quantity</h3>
            </div>
            <FormField
              control={form.control}
              name="updateQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setActiveFields(prev => new Set(prev).add('quantity'));
                        } else {
                          setActiveFields(prev => {
                            const next = new Set(prev);
                            next.delete('quantity');
                            return next;
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {activeFields.has('quantity') && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <FormField
                control={form.control}
                name="quantityAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="set">Set to</SelectItem>
                        <SelectItem value="increase">Increase by</SelectItem>
                        <SelectItem value="decrease">Decrease by</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* State Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="font-medium">Listing State</h3>
            </div>
            <FormField
              control={form.control}
              name="updateState"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setActiveFields(prev => new Set(prev).add('state'));
                        } else {
                          setActiveFields(prev => {
                            const next = new Set(prev);
                            next.delete('state');
                            return next;
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {activeFields.has('state') && (
            <div className="pl-6">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Tags Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <h3 className="font-medium">Tags</h3>
            </div>
            <FormField
              control={form.control}
              name="updateTags"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setActiveFields(prev => new Set(prev).add('tags'));
                        } else {
                          setActiveFields(prev => {
                            const next = new Set(prev);
                            next.delete('tags');
                            return next;
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {activeFields.has('tags') && (
            <div className="space-y-4 pl-6">
              <FormField
                control={form.control}
                name="tagsAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="add">Add tags</SelectItem>
                        <SelectItem value="remove">Remove tags</SelectItem>
                        <SelectItem value="replace">Replace all tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="tag1, tag2, tag3" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter tags separated by commas
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={disabled || activeFields.size === 0}>
            Update {selectedCount} Listings
          </Button>
        </div>
      </form>
    </Form>
  );
}