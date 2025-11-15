export type ValidationState = 'valid' | 'warning' | 'error';

export interface ValidationResult {
  state: ValidationState;
  message?: string;
}

export function validateCurrentStock(
  stock: number,
  weeklyConsumption: number
): ValidationResult {
  if (stock < 0) {
    return { state: 'error', message: 'Stock cannot be negative' };
  }

  if (isNaN(stock)) {
    return { state: 'error', message: 'Please enter a valid number' };
  }

  // Warning if critically low (less than half week supply)
  if (weeklyConsumption > 0 && stock < weeklyConsumption * 0.5) {
    return { state: 'warning', message: 'Critically low stock (< 0.5 weeks)' };
  }

  // Warning if unusually high (more than 30 weeks supply)
  if (weeklyConsumption > 0 && stock > weeklyConsumption * 30) {
    return { state: 'warning', message: 'Unusually high stock (> 30 weeks)' };
  }

  return { state: 'valid' };
}

export function validateWeeklyConsumption(
  consumption: number,
  previousValue?: number
): ValidationResult {
  if (consumption < 0) {
    return { state: 'error', message: 'Consumption cannot be negative' };
  }

  if (isNaN(consumption)) {
    return { state: 'error', message: 'Please enter a valid number' };
  }

  // Allow 0 consumption (indicates discontinued/inactive product)
  if (consumption === 0) {
    return { state: 'valid' };
  }

  // Warning if changed by more than 50% from previous value
  if (previousValue && previousValue > 0) {
    const changePercent = Math.abs((consumption - previousValue) / previousValue);
    if (changePercent > 0.5) {
      return {
        state: 'warning',
        message: `Changed by ${Math.round(changePercent * 100)}% - please verify`,
      };
    }
  }

  return { state: 'valid' };
}

export function validateTargetSOH(targetSOH: number): ValidationResult {
  if (targetSOH < 0) {
    return { state: 'error', message: 'Target SOH cannot be negative' };
  }

  if (isNaN(targetSOH)) {
    return { state: 'error', message: 'Please enter a valid number' };
  }

  // Must be a whole number (integer)
  if (!Number.isInteger(targetSOH)) {
    return { state: 'error', message: 'Target SOH must be a whole number' };
  }

  // Allow 0 (indicates discontinued/inactive product)
  return { state: 'valid' };
}
