import { isDivisibleMoney } from '../../currency';
import { InvalidDivisorError } from '../../errors';
import { RegisterTransaction } from '../../transaction';
import {
  ChangeStrategy,
  StrategyRule,
  StrategySelectorFn,
  StrategySelectorOptions
} from '../types';
import {
  createRandomChangeStrategy,
  greedyMinimumChangeStrategy
} from './changeStrategy';

export function createStrategySelector(
  options: StrategySelectorOptions = {}
): StrategySelectorFn {
  const {
    divisor = 3,
    customRules = [],
    randomStrategy = createRandomChangeStrategy(),
    defaultStrategy = greedyMinimumChangeStrategy
  } = options;

  if (!Number.isInteger(divisor) || divisor < 2) {
    throw new InvalidDivisorError(
      `Divisor must be an integer greater than or equal to 2. Received: ${divisor}`
    );
  }

  const defaultDivisorRule: StrategyRule = Object.freeze({
    name: `DivisibleBy${divisor}Rule`,
    predicate: (tx: RegisterTransaction) => isDivisibleMoney(tx.owed, divisor),
    strategy: randomStrategy
  });

  const rules: readonly StrategyRule[] = Object.freeze([
    ...customRules,
    defaultDivisorRule
  ]);

  return (tx: RegisterTransaction): ChangeStrategy => {
    for (const rule of rules) {
      if (rule.predicate(tx)) {
        return rule.strategy;
      }
    }
    return defaultStrategy;
  };
}
