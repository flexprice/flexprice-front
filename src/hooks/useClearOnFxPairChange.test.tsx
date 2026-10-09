import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useClearOnFxPairChange } from './useClearOnFxPairChange';

type Props = { pair: string | undefined; editable: boolean; hasRows: boolean };

const setup = (initial: Props) => {
	const clear = vi.fn();
	const hook = renderHook((props: Props) => useClearOnFxPairChange(props.pair, props.editable, props.hasRows, clear), {
		initialProps: initial,
	});
	return { clear, ...hook };
};

describe('useClearOnFxPairChange', () => {
	it('clears rows when the pair changes (charge currency or billing customer)', () => {
		const { clear, rerender } = setup({ pair: 'usd->inr', editable: true, hasRows: true });
		rerender({ pair: 'eur->inr', editable: true, hasRows: true });
		expect(clear).toHaveBeenCalledTimes(1);
	});
	it('clears rows when the table hides', () => {
		const { clear, rerender } = setup({ pair: 'usd->inr', editable: true, hasRows: true });
		rerender({ pair: undefined, editable: true, hasRows: true });
		expect(clear).toHaveBeenCalledTimes(1);
	});
	it('keeps rows while the pair is unchanged', () => {
		const { clear, rerender } = setup({ pair: 'usd->inr', editable: true, hasRows: true });
		rerender({ pair: 'usd->inr', editable: true, hasRows: true });
		expect(clear).not.toHaveBeenCalled();
	});
	it('never clears read-only rows (view mode)', () => {
		const { clear, rerender } = setup({ pair: undefined, editable: false, hasRows: true });
		rerender({ pair: 'usd->inr', editable: false, hasRows: true });
		expect(clear).not.toHaveBeenCalled();
	});
});
