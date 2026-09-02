import { UnderpaidError } from '@core/domain/errors/DomainErrors';
import { Money } from '@core/domain/model/Money';
import { RegisterTransaction } from '@core/domain/model/RegisterTransaction';
import { describe, expect, it } from 'vitest';

describe('RegisterTransaction Value Object', () => {
  it('creates transaction and computes changeDue when paid > owed', () => {
    const owed = new Money(212);
    const paid = new Money(300);
    const tx = new RegisterTransaction(owed, paid);

    expect(tx.owed.minorUnits).toBe(212);
    expect(tx.paid.minorUnits).toBe(300);
    expect(tx.changeDue.minorUnits).toBe(88);
  });

  it('creates transaction with zero changeDue when owed === paid (exact payment)', () => {
    const owed = new Money(200);
    const paid = new Money(200);
    const tx = new RegisterTransaction(owed, paid);

    expect(tx.changeDue.isZero()).toBe(true);
    expect(tx.changeDue.minorUnits).toBe(0);
  });

  it('throws UnderpaidError directly when paid < owed before any subtraction', () => {
    const owed = new Money(300);
    const paid = new Money(212);

    expect(() => new RegisterTransaction(owed, paid)).toThrow(UnderpaidError);
  });
});
