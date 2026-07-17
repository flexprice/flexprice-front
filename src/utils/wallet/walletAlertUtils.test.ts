import { describe, expect, it } from 'vitest';
import { WalletAlertLevel } from '@/models/Wallet';
import {
	computeWalletAlertStatus,
	getWalletAlertValidationErrorKey,
	hasActiveWalletAlertStatus,
	hasConfiguredWalletAlertThresholds,
	isWalletAlertThresholdTriggered,
	normalizeWalletAlertSettingsForSave,
	updateWalletAlertThreshold,
} from './walletAlertUtils';

describe('walletAlertUtils', () => {
	describe('isWalletAlertThresholdTriggered', () => {
		it('returns true when balance is below threshold', () => {
			expect(isWalletAlertThresholdTriggered(4, { threshold: '5', condition: 'below' })).toBe(true);
		});

		it('returns false when balance is above below-threshold', () => {
			expect(isWalletAlertThresholdTriggered(6, { threshold: '5', condition: 'below' })).toBe(false);
		});

		it('returns true when balance is above threshold', () => {
			expect(isWalletAlertThresholdTriggered(110, { threshold: '100', condition: 'above' })).toBe(true);
		});
	});

	describe('computeWalletAlertStatus', () => {
		const belowSettings = {
			alert_enabled: true,
			critical: { threshold: '0', condition: 'below' as const },
			warning: { threshold: '5', condition: 'below' as const },
			info: { threshold: '10', condition: 'below' as const },
		};

		it('returns null when alerts are disabled', () => {
			expect(computeWalletAlertStatus(3, { alert_enabled: false, critical: belowSettings.critical })).toBeNull();
		});

		it('returns null when no thresholds are configured', () => {
			expect(computeWalletAlertStatus(3, { alert_enabled: true })).toBeNull();
		});

		it('returns critical state for balance below critical threshold', () => {
			const result = computeWalletAlertStatus(-1, belowSettings);
			expect(result?.state).toBe('in_alarm');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.CRITICAL);
		});

		it('returns warning state for balance below warning threshold', () => {
			const result = computeWalletAlertStatus(3, belowSettings);
			expect(result?.state).toBe('warning');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.WARNING);
		});

		it('returns info state for balance below info threshold', () => {
			const result = computeWalletAlertStatus(7, belowSettings);
			expect(result?.state).toBe('info');
			expect(result?.triggeredLevel).toBe(WalletAlertLevel.INFO);
		});

		it('returns ok when balance is healthy', () => {
			const result = computeWalletAlertStatus(15, belowSettings);
			expect(result?.state).toBe('ok');
			expect(result?.triggeredLevel).toBeUndefined();
		});
	});

	describe('hasActiveWalletAlertStatus', () => {
		const belowSettings = {
			alert_enabled: true,
			warning: { threshold: '5', condition: 'below' as const },
		};

		it('returns false when balance is healthy', () => {
			expect(hasActiveWalletAlertStatus(15, belowSettings)).toBe(false);
		});

		it('returns true when an alert threshold is triggered', () => {
			expect(hasActiveWalletAlertStatus(3, belowSettings)).toBe(true);
		});
	});

	describe('hasConfiguredWalletAlertThresholds', () => {
		it('returns true when alerts are enabled with a threshold', () => {
			expect(
				hasConfiguredWalletAlertThresholds({
					alert_enabled: true,
					info: { threshold: '10', condition: 'below' },
				}),
			).toBe(true);
		});
	});

	describe('normalizeWalletAlertSettingsForSave', () => {
		it('syncs all threshold conditions to the master condition before save', () => {
			const normalized = normalizeWalletAlertSettingsForSave({
				alert_enabled: true,
				critical: { threshold: '0', condition: 'below' },
				warning: { threshold: '10', condition: 'above' },
				info: null,
			});

			expect(normalized.warning).toEqual({ threshold: '10', condition: 'below' });
			expect(normalized.critical).toEqual({ threshold: '0', condition: 'below' });
		});

		it('drops thresholds with empty values', () => {
			const normalized = normalizeWalletAlertSettingsForSave({
				alert_enabled: true,
				critical: { threshold: '0', condition: 'below' },
				warning: { threshold: '', condition: 'below' },
				info: null,
			});

			expect(normalized.warning).toBeNull();
		});
	});

	describe('updateWalletAlertThreshold', () => {
		it('syncs condition across all configured levels', () => {
			const updated = updateWalletAlertThreshold(
				{
					alert_enabled: true,
					critical: { threshold: '0', condition: 'below' },
					warning: { threshold: '10', condition: 'below' },
					info: null,
				},
				WalletAlertLevel.WARNING,
				{ condition: 'above' },
			);

			expect(updated.critical?.condition).toBe('above');
			expect(updated.warning?.condition).toBe('above');
		});
	});

	describe('getWalletAlertValidationErrorKey', () => {
		it('returns null when alerts are disabled', () => {
			expect(getWalletAlertValidationErrorKey({ alert_enabled: false })).toBeNull();
		});

		it('requires at least one threshold when alerts are enabled', () => {
			expect(getWalletAlertValidationErrorKey({ alert_enabled: true })).toBe('atLeastOneThreshold');
		});

		it('requires critical when warning is set', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					warning: { threshold: '10', condition: 'below' },
				}),
			).toBe('criticalRequiredForWarning');
		});

		it('rejects above condition when warning is greater than critical', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '10', condition: 'above' },
					warning: { threshold: '12', condition: 'above' },
				}),
			).toBe('warningMustBeLessThanCritical');
		});

		it('accepts above condition when warning is less than critical', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '12', condition: 'above' },
					warning: { threshold: '10', condition: 'above' },
				}),
			).toBeNull();
		});

		it('rejects below condition when warning is less than critical', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '20', condition: 'below' },
					warning: { threshold: '10', condition: 'below' },
				}),
			).toBe('warningMustBeGreaterThanCritical');
		});

		it('accepts below condition when warning is greater than critical', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '10', condition: 'below' },
					warning: { threshold: '20', condition: 'below' },
				}),
			).toBeNull();
		});

		it('rejects above info threshold greater than warning', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '20', condition: 'above' },
					warning: { threshold: '10', condition: 'above' },
					info: { threshold: '15', condition: 'above' },
				}),
			).toBe('infoMustBeLessThanWarning');
		});

		it('rejects below info threshold less than warning', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '5', condition: 'below' },
					warning: { threshold: '20', condition: 'below' },
					info: { threshold: '10', condition: 'below' },
				}),
			).toBe('infoMustBeGreaterThanWarning');
		});
	});
});
