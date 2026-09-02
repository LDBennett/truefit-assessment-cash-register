import {
  createMoney,
  createTransaction,
  isZeroMoney,
  UnderpaidError
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('RegisterTransaction (Functional Value Object)', () => {
  it('creates transaction and computes changeDue when paid > owed', () => {
    const owed = createMoney(212);
    const paid = createMoney(300);
    const tx = createTransaction(owed, paid);

    expect(tx.owed.minorUnits).toBe(212);
    expect(tx.paid.minorUnits).toBe(300);
    expect(tx.changeDue.minorUnits).toBe(88);
  });

  it('creates transaction with zero changeDue when owed === paid (exact payment)', () => {
    const owed = createMoney(200);
    const paid = createMoney(200);
    const tx = createTransaction(owed, paid);

    expect(isZeroMoney(tx.changeDue)).toBe(true);
    expect(tx.changeDue.minorUnits).toBe(0);
  });

  it('throws UnderpaidError directly when paid < owed before any subtraction', () => {
    const owed = createMoney(300);
    const paid = createMoney(212);

    expect(() => createTransaction(owed, paid)).toThrow(UnderpaidError);
  });
});
