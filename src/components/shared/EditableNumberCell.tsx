'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ValidationResult } from '@/lib/validation';

interface EditableNumberCellProps {
  value: number;
  onChange: (value: number) => void;
  validation: ValidationResult;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  allowDecimals?: boolean; // Allow decimal input (default: false)
  maxDecimals?: number;    // Maximum decimal places (default: 1)
}

export function EditableNumberCell({
  value,
  onChange,
  validation,
  onKeyDown,
  autoFocus,
  allowDecimals = false,
  maxDecimals = 1,
}: EditableNumberCellProps) {
  const [editValue, setEditValue] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when autoFocus prop changes to true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // When focused, use editValue; when not focused, format based on allowDecimals
  const displayValue = isFocused && editValue !== null
    ? editValue
    : allowDecimals
      ? value.toString() // Show decimals as-is (e.g., "63.5")
      : value.toLocaleString(); // Show with comma separators for whole numbers

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number without commas when focused
    setEditValue(value.toString());
    // Select all text for easy replacement
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    // Parse and validate the input
    const currentEdit = editValue || value.toString();
    const numericValue = parseFloat(currentEdit.replace(/,/g, ''));
    if (!isNaN(numericValue) && numericValue >= 0) {
      onChange(numericValue);
    } else {
      // Invalid input - revert to original value
      onChange(value);
    }
    // Clear edit state and unfocus
    setEditValue(null);
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowDecimals) {
      // Whole numbers only: allow digits and commas
      const input = e.target.value.replace(/[^0-9,]/g, '');
      setEditValue(input);
      return;
    }

    // Allow decimals: digits, one decimal point
    let input = e.target.value.replace(/[^0-9.]/g, '');

    // Only one decimal point allowed
    const parts = input.split('.');
    if (parts.length > 2) {
      input = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to maxDecimals places after decimal
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      input = parts[0] + '.' + parts[1].substring(0, maxDecimals);
    }

    // Strip leading zeros (except "0" or "0.x")
    if (input.length > 1 && input.startsWith('0') && input[1] !== '.') {
      input = input.replace(/^0+/, '') || '0'; // Preserve at least one zero
    }

    setEditValue(input);
  };

  const getValidationIcon = () => {
    if (validation.state === 'valid') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (validation.state === 'warning') {
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getBorderColor = () => {
    if (!isFocused) return 'border-border';
    if (validation.state === 'error') return 'border-red-500';
    if (validation.state === 'warning') return 'border-amber-500';
    return 'border-blue-500';
  };

  return (
    <div className="relative group">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        className={`font-mono text-base h-10 pr-8 cursor-pointer ${getBorderColor()}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {getValidationIcon()}
      </div>
      {validation.message && (
        <div className="absolute z-10 hidden group-hover:block left-0 top-full mt-1 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border border-border whitespace-nowrap">
          {validation.message}
        </div>
      )}
    </div>
  );
}
