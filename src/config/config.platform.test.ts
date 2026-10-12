import { describe, it, expect } from 'vitest';
import { parsePlatformConfig } from './config';

describe('parsePlatformConfig reports', () => {
	it('defaults reports to disabled', () => {
		expect(parsePlatformConfig(undefined).reports.enabled).toBe(false);
	});
	it('enables reports from json', () => {
		expect(parsePlatformConfig('{"reports":{"enabled":true}}').reports.enabled).toBe(true);
	});
});
