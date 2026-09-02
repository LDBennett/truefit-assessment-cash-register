// @vitest-environment happy-dom
import {
  calculateGreedyChange,
  createChangeDistribution,
  createMoney,
  createTransaction,
  CURRENCIES
} from '@core/index';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TransactionLineItem, TransactionResultRow } from '@/entities/transaction';

describe('TransactionResultRow component (entities/transaction)', () => {
  const usd = CURRENCIES.USD;

  it('renders Minimal Coins strategy badge and denomination chips for greedy calculation', () => {
    const owed = createMoney(212);
    const paid = createMoney(300);
    const tx = createTransaction(owed, paid);
    const dist = calculateGreedyChange(tx.changeDue, usd);

    const item: TransactionLineItem = {
      lineNumber: 1,
      rawLine: '2.12,3.00',
      result: {
        transaction: tx,
        distribution: dist,
        strategyName: 'GreedyMinimumChange'
      }
    };

    render(<TransactionResultRow item={item} />);

    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('2.12,3.00')).toBeDefined();
    expect(screen.getByText(/Minimal Coins/i)).toBeDefined();
    expect(screen.getByText('3 quarters')).toBeDefined();
    expect(screen.getByText('1 dime')).toBeDefined();
    expect(screen.getByText('3 pennies')).toBeDefined();
  });

  it('renders Random Twist strategy badge for random change calculation', () => {
    const owed = createMoney(333);
    const paid = createMoney(500);
    const tx = createTransaction(owed, paid);
    const dist = calculateGreedyChange(tx.changeDue, usd);

    const item: TransactionLineItem = {
      lineNumber: 3,
      rawLine: '3.33,5.00',
      result: {
        transaction: tx,
        distribution: dist,
        strategyName: 'RandomChange'
      }
    };

    render(<TransactionResultRow item={item} />);

    expect(screen.getByText('#3')).toBeDefined();
    expect(screen.getByText(/Random Twist/i)).toBeDefined();
  });

  it('renders 0 (No change due) when exact payment is received', () => {
    const owed = createMoney(300);
    const paid = createMoney(300);
    const tx = createTransaction(owed, paid);
    const dist = createChangeDistribution([], tx.changeDue);

    const item: TransactionLineItem = {
      lineNumber: 1,
      rawLine: '3.00,3.00',
      result: {
        transaction: tx,
        distribution: dist,
        strategyName: 'GreedyMinimumChange'
      }
    };

    render(<TransactionResultRow item={item} />);

    expect(screen.getByText(/0 \(No change due\)/i)).toBeDefined();
  });
});
