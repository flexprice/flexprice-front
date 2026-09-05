import { describe, it, expect } from 'vitest';
import { hexToRgbTriple, isColorDark, portalTokenOverrides } from './portalTheme';

describe('hexToRgbTriple', () => {
	// Tailwind applies alpha with rgb(var(--fp-x) / <alpha>), so the token has to be
	// a bare triple. A hex string there produces an invalid colour and no styling.
	it('produces a space-separated triple, not a hex string', () => {
		expect(hexToRgbTriple('#2563eb')).toBe('37 99 235');
	});

	it('expands the three-digit form', () => {
		expect(hexToRgbTriple('#fff')).toBe('255 255 255');
	});

	it('refuses anything it cannot read', () => {
		expect(hexToRgbTriple('rgb(1,2,3)')).toBeNull();
		expect(hexToRgbTriple('#12345')).toBeNull();
		expect(hexToRgbTriple(undefined)).toBeNull();
	});
});

describe('isColorDark', () => {
	it('separates light from dark backgrounds', () => {
		expect(isColorDark('#0f1216')).toBe(true);
		expect(isColorDark('#ffffff')).toBe(false);
	});
});

describe('portalTokenOverrides', () => {
	// An unthemed portal must keep its own greys. Returning only a tenant's
	// overrides would let the dashboard's palette show through everywhere else, so
	// every portal without a theme would have shifted the day the bridge landed.
	it('writes a full set of tokens even with no theme', () => {
		const tokens = portalTokenOverrides(undefined);
		expect(tokens['--fp-surface']).toBe('255 255 255');
		expect(tokens['--fp-content-secondary']).toBe('113 113 122');
		expect(tokens['--fp-line']).toBe('233 233 233');
	});

	it("takes the tenant's colours when it has them", () => {
		const tokens = portalTokenOverrides({ surface_color: '#101010', border_color: '#202020' } as never);
		expect(tokens['--fp-surface']).toBe('16 16 16');
		expect(tokens['--fp-line']).toBe('32 32 32');
	});

	// Tenants supply brand colours only; text has to stay readable on whatever
	// background they chose.
	it('flips text light on a dark tenant background', () => {
		const tokens = portalTokenOverrides({ background_color: '#0f1216' } as never);
		expect(tokens['--fp-content']).toBe('255 255 255');
	});

	// A malformed value must not leave the token unset — that would fall through to
	// the dashboard's palette for that one slot and split the portal's look.
	it('falls back to the portal default for a colour it cannot parse', () => {
		const tokens = portalTokenOverrides({ surface_color: 'not-a-colour' } as never);
		expect(tokens['--fp-surface']).toBe('255 255 255');
	});
});
