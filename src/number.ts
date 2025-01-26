export function formatStep(value: number, stepSize: string): string {
  // Extract decimal precision from stepSize string (e.g., "0.001" → 3 decimals)
  const decimals = stepSize.includes('.')
    ? stepSize.split('.')[1].length
    : 0;

  // Scaling factor to avoid floating-point errors
  const factor = 10 ** decimals;
  const scaledStep = parseFloat(stepSize) * factor;

  // Integer-based rounding
  const scaledValue = Math.round(value * factor);
  const adjusted = Math.round(scaledValue / scaledStep) * scaledStep;

  // Format with trailing zeros
  return (adjusted / factor).toFixed(decimals);
}
