import { formatStep } from './number';

describe('formatStep', () => {
  it.each([
    // Price filter cases (PRICE_FILTER)
    { value: 30000.95, step: '0.10', expected: '30001.00' },
    { value: 30000.92, step: '0.10', expected: '30000.90' },
    { value: 556.8, step: '0.10', expected: '556.80' },
    { value: 0.123456, step: '0.0001', expected: '0.1235' },

    // Quantity filter cases (LOT_SIZE)
    { value: 1.2345678, step: '0.001', expected: '1.235' },
    { value: 123.456, step: '1', expected: '123' },
    { value: 2.3, step: '0.25', expected: '2.25' },
    { value: 1000.0001, step: '0.001', expected: '1000.000' },

    // Edge cases
    { value: 0, step: '0.10', expected: '0.00' },
    { value: -1.234, step: '0.01', expected: '-1.23' },
    { value: 5.0, step: '0.5', expected: '5.0' },
    { value: 0.0000000123, step: '0.00000001', expected: '0.00000001' },
  ])('should adjust $value with step $step to "$expected"', ({ value, step, expected }) => {
    const result = formatStep(value, step);
    expect(result).toBe(expected);
  });
});
