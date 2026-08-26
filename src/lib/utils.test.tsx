import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn / tailwind-merge with revamp table tokens', () => {
	it('lets card row height replace the default 36px row', () => {
		expect(cn('h-[2.25rem]', 'h-[var(--fp-table-row-height)]')).toBe('h-[var(--fp-table-row-height)]');
	});

	it('lets card radius replace the default 6px radius', () => {
		expect(cn('rounded-[6px]', 'rounded-[var(--fp-radius-lg)]')).toBe('rounded-[var(--fp-radius-lg)]');
	});
});
