import { InvalidDivisorError } from '../errors/DomainErrors';
import { RegisterTransaction } from '../model/RegisterTransaction';
import { GreedyMinimumChangeStrategy } from '../strategies/GreedyMinimumChangeStrategy';
import { IChangeCalculationStrategy } from '../strategies/IChangeCalculationStrategy';
import { RandomChangeStrategy } from '../strategies/RandomChangeStrategy';

export interface StrategyRule {
  readonly name: string;
  readonly predicate: (tx: RegisterTransaction) => boolean;
  readonly strategy: IChangeCalculationStrategy;
}

export class StrategySelector {
  readonly divisor: number;
  private readonly rules: readonly StrategyRule[];
  private readonly defaultStrategy: IChangeCalculationStrategy;

  constructor(
    divisor: number = 3,
    customRules: readonly StrategyRule[] = [],
    randomStrategy: IChangeCalculationStrategy = new RandomChangeStrategy(),
    defaultStrategy: IChangeCalculationStrategy = new GreedyMinimumChangeStrategy()
  ) {
    if (!Number.isInteger(divisor) || divisor < 2) {
      throw new InvalidDivisorError(
        `Divisor must be an integer greater than or equal to 2. Received: ${divisor}`
      );
    }

    this.divisor = divisor;
    this.defaultStrategy = defaultStrategy;

    // Ordered rule array: evaluate custom rules first, then the default divisor rule
    const defaultDivisorRule: StrategyRule = {
      name: `DivisibleBy${divisor}Rule`,
      predicate: (tx: RegisterTransaction) => tx.owed.isDivisibleBy(divisor),
      strategy: randomStrategy
    };

    this.rules = [...customRules, defaultDivisorRule];
  }

  select(tx: RegisterTransaction): IChangeCalculationStrategy {
    for (const rule of this.rules) {
      if (rule.predicate(tx)) {
        return rule.strategy;
      }
    }
    return this.defaultStrategy;
  }
}
