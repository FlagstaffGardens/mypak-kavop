'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface TargetSOHSettingProps {
  onChange?: (value: number) => void;
}

export function TargetSOHSetting({ onChange }: TargetSOHSettingProps) {
  const [targetSOH, setTargetSOH] = useState<number>(() => {
    if (typeof window === 'undefined') return 6;
    const stored = localStorage.getItem('targetSOH');
    if (stored) {
      const value = parseInt(stored);
      if (value >= 4 && value <= 16) {
        return value;
      }
    }
    return 6;
  });

  // Save to localStorage and notify parent
  const handleChange = (value: number[]) => {
    const newValue = value[0];
    setTargetSOH(newValue);
    localStorage.setItem('targetSOH', newValue.toString());
    onChange?.(newValue);
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start gap-4">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Target Stock Level
              </h3>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {targetSOH} weeks
              </span>
            </div>

            {/* Slider */}
            <div className="mb-3">
              <Slider
                value={[targetSOH]}
                onValueChange={handleChange}
                min={4}
                max={16}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <span>4 weeks</span>
                <span>16 weeks</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Maintain <span className="font-semibold text-gray-900 dark:text-gray-100">{targetSOH} weeks</span> of stock on hand.
              Products below this level will be marked as <span className="text-red-600 dark:text-red-500 font-medium">CRITICAL</span>.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
