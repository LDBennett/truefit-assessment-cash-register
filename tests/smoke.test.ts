import { CASH_REGISTER_VERSION } from '@core/smoke';
import { describe, expect, it } from 'vitest';

describe('Toolchain & Path Aliases Smoke Test', () => {
  it('correctly resolves @core alias and executes under Vitest', () => {
    expect(CASH_REGISTER_VERSION).toBe('1.0.0');
  });
});
