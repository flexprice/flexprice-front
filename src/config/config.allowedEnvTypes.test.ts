import { describe, it, expect } from 'vitest';
import { parseAllowedEnvTypes } from './config';
import { ENVIRONMENT_TYPE } from '@/models/Environment';

describe('parseAllowedEnvTypes', () => {
	it('returns [] when raw is undefined', () => {
		expect(parseAllowedEnvTypes(undefined)).toEqual([]);
	});

	it('returns [] when raw is empty string', () => {
		expect(parseAllowedEnvTypes('')).toEqual([]);
	});

	it('returns [] when raw is only whitespace', () => {
		expect(parseAllowedEnvTypes('   ')).toEqual([]);
	});

	it('parses a single valid type', () => {
		expect(parseAllowedEnvTypes('development')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
	});

	it('parses two valid types', () => {
		const result = parseAllowedEnvTypes('development,production');
		expect(result).toContain(ENVIRONMENT_TYPE.DEVELOPMENT);
		expect(result).toContain(ENVIRONMENT_TYPE.PRODUCTION);
		expect(result).toHaveLength(2);
	});

	it('trims whitespace around values', () => {
		expect(parseAllowedEnvTypes(' development , production ')).toHaveLength(2);
	});

	it('silently drops unknown values', () => {
		expect(parseAllowedEnvTypes('development,sandbox,unknown')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
	});

	it('returns [] when all values are unknown', () => {
		expect(parseAllowedEnvTypes('sandbox,bogus')).toEqual([]);
	});
});
