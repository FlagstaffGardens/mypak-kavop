'use client';

import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ValidationResult } from '@/lib/validation';

interface EditableNumberCellProps {
  value: number;
  onChange: (value: number) => void;
  validation: ValidationResult;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export function EditableNumberCell({
  value,
  onChange,
  validation,
  onKeyDown,
  autoFocus,
}: EditableNumberCellProps) {
  const [editValue, setEditValue] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When focused, use editValue; when not focused, derive from value prop
  const displayValue = isFocused && editValue !== null ? editValue : value.toLocaleString();

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
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
    // Clear edit state and unfocus
    setEditValue(null);
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and commas while typing
    const input = e.target.value.replace(/[^0-9,]/g, '');
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
