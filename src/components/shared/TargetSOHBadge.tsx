'use client';

import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface TargetSOHBadgeProps {
  onChange?: (value: number) => void;
}

export function TargetSOHBadge({ onChange }: TargetSOHBadgeProps) {
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

  const [showFirstTimeHint, setShowFirstTimeHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasSeenHint = localStorage.getItem('hasSeenTargetSOHHint');
    if (!hasSeenHint) {
      localStorage.setItem('hasSeenTargetSOHHint', 'true');
      return true;
    }
    return false;
  });

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasSeenHint = localStorage.getItem('hasSeenTargetSOHHint');
    return !hasSeenHint;
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
        setShowFirstTimeHint(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Close on ESC
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setShowFirstTimeHint(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  const handleChange = (value: number[]) => {
    const newValue = value[0];
    setTargetSOH(newValue);
    localStorage.setItem('targetSOH', newValue.toString());
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      {/* Collapsed Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          inline-flex items-center gap-2 px-4 py-1.5 h-8
          border border-gray-300 dark:border-gray-700 rounded-full
          bg-white dark:bg-gray-900
          text-sm font-medium text-gray-700 dark:text-gray-300
          hover:shadow-sm hover:border-gray-400 dark:hover:border-gray-600
          transition-all duration-150
          ${showFirstTimeHint ? 'animate-pulse' : ''}
        `}
        aria-label="Adjust target stock level"
        aria-expanded={isExpanded}
      >
        <span>Target: {targetSOH} weeks</span>
        <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Expanded Popover */}
      {isExpanded && (
        <div
          ref={popoverRef}
          className="
            absolute right-0 top-10 z-50 w-96
            bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
            rounded-lg shadow-lg
            animate-in slide-in-from-top-2 fade-in duration-150
          "
          role="dialog"
          aria-label="Target stock level settings"
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Target Stock Level
              </h3>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {targetSOH} weeks
              </span>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <Slider
                value={[targetSOH]}
                onValueChange={handleChange}
                min={4}
                max={16}
                step={1}
                className="w-full"
                aria-label="Target stock level in weeks"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>4 weeks</span>
                <span>16 weeks</span>
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Products below <span className="font-semibold text-gray-900 dark:text-gray-100">{targetSOH} weeks</span> are marked as{' '}
              <span className="text-red-600 dark:text-red-500 font-medium">CRITICAL</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
