'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Power,
  PowerOff,
  Copy,
  Trash2,
  RefreshCw,
  Package,
  Tag,
  DollarSign,
  AlertCircle,
  Info,
} from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: string, params?: any) => void;
  disabled?: boolean;
}

interface ActionConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  variant: 'default' | 'destructive' | 'secondary';
  requiresConfirmation: boolean;
  params?: any;
}

const QUICK_ACTIONS: ActionConfig[] = [
  {
    id: 'activate',
    label: 'Activate',
    description: 'Set selected listings to active state',
    icon: Power,
    variant: 'default',
    requiresConfirmation: false,
  },
  {
    id: 'deactivate',
    label: 'Deactivate',
    description: 'Set selected listings to inactive state',
    icon: PowerOff,
    variant: 'secondary',
    requiresConfirmation: false,
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    description: 'Create copies of selected listings',
    icon: Copy,
    variant: 'default',
    requiresConfirmation: true,
  },
  {
    id: 'delete',
    label: 'Delete',
    description: 'Permanently delete selected listings',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
  },
  {
    id: 'refresh',
    label: 'Refresh from Etsy',
    description: 'Sync selected listings with Etsy',
    icon: RefreshCw,
    variant: 'default',
    requiresConfirmation: false,
  },
];

export function BulkActions({ selectedCount, onAction, disabled }: BulkActionsProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionConfig | null;
  }>({ open: false, action: null });
  
  const [adjustPriceDialog, setAdjustPriceDialog] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    action: 'increase' as 'increase' | 'decrease',
    value: '',
  });

  const [addTagsDialog, setAddTagsDialog] = useState(false);
  const [tagsToAdd, setTagsToAdd] = useState('');

  const [removeTagsDialog, setRemoveTagsDialog] = useState(false);
  const [tagsToRemove, setTagsToRemove] = useState('');

  const [changeShippingDialog, setChangeShippingDialog] = useState(false);
  const [shippingTemplateId, setShippingTemplateId] = useState('');

  const handleQuickAction = (action: ActionConfig) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({ open: true, action });
    } else {
      onAction(action.id, action.params);
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      onAction(confirmDialog.action.id, confirmDialog.action.params);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleAdjustPrice = () => {
    const value = parseFloat(priceAdjustment.value);
    if (!isNaN(value) && value > 0) {
      onAction('adjust-price', {
        type: priceAdjustment.type,
        action: priceAdjustment.action,
        value,
      });
      setAdjustPriceDialog(false);
      setPriceAdjustment({ type: 'percentage', action: 'increase', value: '' });
    }
  };

  const handleAddTags = () => {
    const tags = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      onAction('add-tags', { tags });
      setAddTagsDialog(false);
      setTagsToAdd('');
    }
  };

  const handleRemoveTags = () => {
    const tags = tagsToRemove.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      onAction('remove-tags', { tags });
      setRemoveTagsDialog(false);
      setTagsToRemove('');
    }
  };

  const handleChangeShipping = () => {
    if (shippingTemplateId) {
      onAction('change-shipping', { shippingTemplateId });
      setChangeShippingDialog(false);
      setShippingTemplateId('');
    }
  };

  if (selectedCount === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Select listings to perform bulk actions
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleQuickAction(action)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Advanced Actions */}
      <div>
        <h3 className="font-medium mb-4">Advanced Actions</h3>
        <div className="space-y-4">
          {/* Adjust Price */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Adjust Prices
              </CardTitle>
              <CardDescription>
                Increase or decrease prices by percentage or fixed amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setAdjustPriceDialog(true)}
                disabled={disabled}
              >
                Configure Price Adjustment
              </Button>
            </CardContent>
          </Card>

          {/* Manage Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Manage Tags
              </CardTitle>
              <CardDescription>
                Add or remove tags from selected listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddTagsDialog(true)}
                  disabled={disabled}
                >
                  Add Tags
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRemoveTagsDialog(true)}
                  disabled={disabled}
                >
                  Remove Tags
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Change Shipping Template
              </CardTitle>
              <CardDescription>
                Apply a different shipping template to selected listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setChangeShippingDialog(true)}
                disabled={disabled}
              >
                Select Shipping Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{selectedCount}</strong> listings selected for bulk actions.
          Some actions may take a few moments to complete.
        </AlertDescription>
      </Alert>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ open, action: confirmDialog.action })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.action?.label.toLowerCase()}{' '}
              {selectedCount} listings?
              {confirmDialog.action?.id === 'delete' && (
                <span className="block mt-2 text-red-600">
                  This action cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, action: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action?.variant}
              onClick={handleConfirmAction}
            >
              {confirmDialog.action?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Price Dialog */}
      <Dialog open={adjustPriceDialog} onOpenChange={setAdjustPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Prices</DialogTitle>
            <DialogDescription>
              Adjust prices for {selectedCount} selected listings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select
                value={priceAdjustment.type}
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setPriceAdjustment(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action</Label>
              <Select
                value={priceAdjustment.action}
                onValueChange={(value: 'increase' | 'decrease') => 
                  setPriceAdjustment(prev => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={priceAdjustment.type === 'percentage' ? '10' : '5.00'}
                value={priceAdjustment.value}
                onChange={(e) => 
                  setPriceAdjustment(prev => ({ ...prev, value: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustPriceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustPrice}>
              Adjust Prices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tags Dialog */}
      <Dialog open={addTagsDialog} onOpenChange={setAddTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedCount} selected listings
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Tags to Add</Label>
            <Textarea
              placeholder="Enter tags separated by commas"
              value={tagsToAdd}
              onChange={(e) => setTagsToAdd(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTagsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags}>
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Tags Dialog */}
      <Dialog open={removeTagsDialog} onOpenChange={setRemoveTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tags</DialogTitle>
            <DialogDescription>
              Remove tags from {selectedCount} selected listings
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Tags to Remove</Label>
            <Textarea
              placeholder="Enter tags separated by commas"
              value={tagsToRemove}
              onChange={(e) => setTagsToRemove(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTagsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveTags}>
              Remove Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Shipping Dialog */}
      <Dialog open={changeShippingDialog} onOpenChange={setChangeShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Shipping Template</DialogTitle>
            <DialogDescription>
              Apply shipping template to {selectedCount} selected listings
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Shipping Template ID</Label>
            <Input
              placeholder="Enter shipping template ID"
              value={shippingTemplateId}
              onChange={(e) => setShippingTemplateId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeShippingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeShipping}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}