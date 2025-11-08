'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TargetSOHSliderProps {
  initialValue?: number;
  onChange: (value: number) => void;
  onCancel?: () => void;
}

export function TargetSOHSlider({
  initialValue = 6,
  onChange,
  onCancel
}: TargetSOHSliderProps) {
  const [targetSOH, setTargetSOH] = useState<number>(() => {
    if (typeof window === 'undefined') return initialValue;
    const saved = localStorage.getItem('targetSOH');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 4 && parsed <= 16) {
        return parsed;
      }
    }
    return initialValue;
  });

  const handleSave = () => {
    localStorage.setItem('targetSOH', targetSOH.toString());
    onChange(targetSOH);
  };

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Target Stock Level
          </label>
          <span className="text-2xl font-bold text-foreground">
            {targetSOH} weeks
          </span>
        </div>
        <Slider
          value={[targetSOH]}
          onValueChange={(value) => setTargetSOH(value[0])}
          min={4}
          max={16}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>4 weeks</span>
          <span>16 weeks</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Products below {targetSOH} weeks will be marked as critical (red).
        Products between {targetSOH}-16 weeks will be marked as order now (orange).
      </p>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
