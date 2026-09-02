import { describe, expect, it } from 'vitest';

import { cn } from '@/shared/lib/cn';

describe('cn utility (shared/lib)', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1', 'text-sm')).toBe('px-2 py-1 text-sm');
  });

  it('filters out falsy and undefined values', () => {
    expect(cn('font-bold', false && 'hidden', null, undefined, 'text-red-500')).toBe(
      'font-bold text-red-500'
    );
  });

  it('resolves conflicting Tailwind utility classes via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});
