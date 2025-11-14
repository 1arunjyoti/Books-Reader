import { useCallback } from 'react';

/**
 * Custom hook for creating increase/decrease functions with bounds
 * Consolidates repetitive font size/line height adjustment logic
 * 
 * @param setValue - State setter function
 * @param step - Amount to increase/decrease by
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Object with increase and decrease functions
 */
export function useValueAdjuster(
  setValue: React.Dispatch<React.SetStateAction<number>>,
  step: number,
  min: number,
  max: number
) {
  const increase = useCallback(() => {
    setValue((prev) => Math.min(prev + step, max));
  }, [setValue, step, max]);

  const decrease = useCallback(() => {
    setValue((prev) => Math.max(prev - step, min));
  }, [setValue, step, min]);

  return { increase, decrease };
}

/**
 * Utility function to create bounded adjuster functions without hooks
 * Useful for cases where hooks cannot be used (e.g., conditional rendering)
 * 
 * @param setValue - State setter function
 * @param step - Amount to increase/decrease by
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Object with increase and decrease functions
 */
export function createValueAdjuster(
  setValue: React.Dispatch<React.SetStateAction<number>>,
  step: number,
  min: number,
  max: number
) {
  return {
    increase: () => setValue((prev) => Math.min(prev + step, max)),
    decrease: () => setValue((prev) => Math.max(prev - step, min)),
  };
}
