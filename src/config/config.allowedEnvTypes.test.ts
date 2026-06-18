import { describe, it, expect } from 'vitest';
import { parseAllowedEnvTypes, isSandboxDeployment } from './config';
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
		expect(parseAllowedEnvTypes('["development"]')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
	});

	it('parses two valid types', () => {
		const result = parseAllowedEnvTypes('["development","production"]');
		expect(result).toContain(ENVIRONMENT_TYPE.DEVELOPMENT);
		expect(result).toContain(ENVIRONMENT_TYPE.PRODUCTION);
		expect(result).toHaveLength(2);
	});

	it('silently drops unknown values', () => {
		expect(parseAllowedEnvTypes('["development","bogus","invalid"]')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
	});

	it('returns [] when all values are unknown', () => {
		expect(parseAllowedEnvTypes('["sandbox","bogus"]')).toEqual([]);
	});

	it('returns [] for invalid JSON', () => {
		expect(parseAllowedEnvTypes('development,production')).toEqual([]);
	});

	it('returns [] when JSON is not an array', () => {
		expect(parseAllowedEnvTypes('"development"')).toEqual([]);
	});
});

describe('isSandboxDeployment', () => {
	it('returns false for empty array', () => {
		expect(isSandboxDeployment([])).toBe(false);
	});

	it('returns true when only development', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.DEVELOPMENT])).toBe(true);
	});

	it('returns false when both types present', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.DEVELOPMENT, ENVIRONMENT_TYPE.PRODUCTION])).toBe(false);
	});

	it('returns false when only production', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.PRODUCTION])).toBe(false);
	});
});
