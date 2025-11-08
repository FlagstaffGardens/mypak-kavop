import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ShippingDetails, ShippingMethod, ShippingTerm } from '@/lib/types';

interface ShippingDetailsFormProps {
  values: ShippingDetails;
  onChange: (values: Partial<ShippingDetails>) => void;
  errors: Record<string, string>;
}

export function ShippingDetailsForm({ values, onChange, errors }: ShippingDetailsFormProps) {
  const commentsLength = values.comments?.length || 0;
  const [minDate] = useState(() => new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">Shipping Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Arrival Preference */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Preferred Container Arrive Time</Label>
          <RadioGroup
            value={values.arrivalPreference}
            onValueChange={(value) => onChange({ arrivalPreference: value as ShippingMethod })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standard" id="standard" />
              <Label htmlFor="standard" className="font-normal cursor-pointer">
                <span className="font-semibold">Standard</span> (approx. 6 weeks)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="urgent" id="urgent" />
              <Label htmlFor="urgent" className="font-normal cursor-pointer">
                <span className="font-semibold">Urgent</span> (extra charges apply)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific" className="font-normal cursor-pointer">
                <span className="font-semibold">Specific Date:</span>
              </Label>
              {values.arrivalPreference === 'specific' && (
                <Input
                  type="date"
                  value={values.specificDate || ''}
                  onChange={(e) => onChange({ specificDate: e.target.value })}
                  className="w-48 ml-2"
                  min={minDate}
                />
              )}
            </div>
            {errors.specificDate && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.specificDate}</p>
            )}
          </RadioGroup>
        </div>

        {/* Shipping Term */}
        <div>
          <Label htmlFor="shipping-term" className="text-sm font-medium mb-2 block">
            Shipping Term <span className="text-red-600">*</span>
          </Label>
          <Select
            value={values.shippingTerm || ''}
            onValueChange={(value) => onChange({ shippingTerm: value as ShippingTerm })}
          >
            <SelectTrigger
              id="shipping-term"
              className={errors.shippingTerm ? 'border-red-600' : ''}
            >
              <SelectValue placeholder="Select shipping term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
              <SelectItem value="FOB">FOB - Free On Board</SelectItem>
              <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
            </SelectContent>
          </Select>
          {errors.shippingTerm && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.shippingTerm}</p>
          )}
        </div>

        {/* Customer Order Number */}
        <div>
          <Label htmlFor="customer-order-number" className="text-sm font-medium mb-2 block">
            Customer Order Number <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="customer-order-number"
            type="text"
            value={values.customerOrderNumber || ''}
            onChange={(e) => onChange({ customerOrderNumber: e.target.value })}
            placeholder="e.g., PO-2025-FEB-EGGS"
            maxLength={50}
          />
        </div>

        {/* Comments */}
        <div>
          <Label htmlFor="comments" className="text-sm font-medium mb-2 block">
            Comments <span className="text-muted-foreground">(optional, max 230 characters)</span>
          </Label>
          <Textarea
            id="comments"
            value={values.comments || ''}
            onChange={(e) => onChange({ comments: e.target.value })}
            placeholder="Add any special instructions..."
            maxLength={230}
            rows={3}
            className={errors.comments ? 'border-red-600' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {errors.comments && <span className="text-red-600 dark:text-red-400">{errors.comments}</span>}
            </span>
            <span className="text-xs text-muted-foreground">
              {commentsLength}/230
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
