import { describe, expect, it } from 'vitest';
import { WalletAlertLevel, WalletAlertDraft } from '@/models/Wallet';
import {
	computeWalletAlertStatus,
	fromWalletAlertDraftForSave,
	getActiveWalletAlertLevels,
	getWalletAlertThresholdType,
	getWalletAlertValidationErrorKey,
	hasActiveWalletAlertStatus,
	hasConfiguredWalletAlertThresholds,
	isWalletAlertThresholdTriggered,
	normalizeWalletAlertSettingsForSave,
	setWalletAlertDraftEnabled,
	setWalletAlertDraftThresholdType,
	toWalletAlertDraft,
	toWalletAlertSettingsForValidation,
	updateWalletAlertDraftLevels,
	setWalletAlertThresholdValue,
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

	describe('setWalletAlertThresholdValue', () => {
		const levels = { critical: { threshold: '10', condition: 'below' as const }, warning: null, info: null };

		it('writes the value with condition below', () => {
			const next = setWalletAlertThresholdValue(levels, WalletAlertLevel.WARNING, '25');
			expect(next.warning).toEqual({ threshold: '25', condition: 'below' });
		});

		it('rewrites a legacy above threshold to below when edited', () => {
			const legacy = { critical: { threshold: '10', condition: 'above' as const }, warning: null, info: null };
			const next = setWalletAlertThresholdValue(legacy, WalletAlertLevel.CRITICAL, '12');
			expect(next.critical).toEqual({ threshold: '12', condition: 'below' });
		});

		it('clears the level to null for a blank value rather than storing an empty string', () => {
			expect(setWalletAlertThresholdValue(levels, WalletAlertLevel.CRITICAL, '').critical).toBeNull();
			expect(setWalletAlertThresholdValue(levels, WalletAlertLevel.CRITICAL, '   ').critical).toBeNull();
		});

		it('leaves the other levels untouched', () => {
			const next = setWalletAlertThresholdValue(levels, WalletAlertLevel.INFO, '50');
			expect(next.critical).toBe(levels.critical);
			expect(next.warning).toBeNull();
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
				getWalletAlertValidationErrorKey(
					{
						alert_enabled: true,
						critical: { threshold: '10', condition: 'above' },
						warning: { threshold: '12', condition: 'above' },
					},
					'above',
				),
			).toBe('warningMustBeLessThanCritical');
		});

		it('accepts above condition when warning is less than critical', () => {
			expect(
				getWalletAlertValidationErrorKey(
					{
						alert_enabled: true,
						critical: { threshold: '12', condition: 'above' },
						warning: { threshold: '10', condition: 'above' },
					},
					'above',
				),
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
				getWalletAlertValidationErrorKey(
					{
						alert_enabled: true,
						critical: { threshold: '20', condition: 'above' },
						warning: { threshold: '10', condition: 'above' },
						info: { threshold: '15', condition: 'above' },
					},
					'above',
				),
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

	describe('getWalletAlertValidationErrorKey — condition parameter', () => {
		const settings = {
			alert_enabled: true,
			critical: { threshold: '10', condition: 'below' as const },
			warning: { threshold: '25', condition: 'below' as const },
		};

		it('defaults to below, so ascending thresholds are valid', () => {
			expect(getWalletAlertValidationErrorKey(settings)).toBeNull();
		});

		it('rejects the same ascending thresholds when the caller asks for above (spend alerts)', () => {
			expect(getWalletAlertValidationErrorKey(settings, 'above')).toBe('warningMustBeLessThanCritical');
		});
	});

	describe('normalizeWalletAlertSettingsForSave — condition parameter', () => {
		it('writes above when the caller asks for it', () => {
			const normalized = normalizeWalletAlertSettingsForSave(
				{ alert_enabled: true, critical: { threshold: '10', condition: 'below' } },
				'above',
			);
			expect(normalized.critical).toEqual({ threshold: '10', condition: 'above' });
		});
	});

	describe('getWalletAlertThresholdType', () => {
		it('defaults to absolute when alert_threshold_type is undefined', () => {
			expect(getWalletAlertThresholdType({ alert_enabled: true })).toBe('absolute');
		});

		it('defaults to absolute when settings is null/undefined', () => {
			expect(getWalletAlertThresholdType(null)).toBe('absolute');
			expect(getWalletAlertThresholdType(undefined)).toBe('absolute');
		});

		it('returns percentage when explicitly set', () => {
			expect(getWalletAlertThresholdType({ alert_threshold_type: 'percentage' })).toBe('percentage');
		});
	});

	describe('toWalletAlertDraft', () => {
		it('seeds an empty draft (both sides empty, absolute active) when settings is absent', () => {
			const draft = toWalletAlertDraft(undefined);
			expect(draft.alert_threshold_type).toBe('absolute');
			expect(draft.alert_enabled).toBe(false);
			expect(draft.absolute).toEqual({ critical: null, warning: null, info: null });
			expect(draft.percentage).toEqual({ critical: null, warning: null, info: null });
		});

		it('puts absolute-mode settings on the absolute side and leaves percentage empty', () => {
			const draft = toWalletAlertDraft({
				alert_enabled: true,
				critical: { threshold: '10', condition: 'below' },
				warning: null,
				info: null,
			});
			expect(draft.alert_threshold_type).toBe('absolute');
			expect(draft.absolute.critical).toEqual({ threshold: '10', condition: 'below' });
			expect(draft.percentage).toEqual({ critical: null, warning: null, info: null });
		});

		it('puts percentage-mode settings on the percentage side and leaves absolute empty', () => {
			const draft = toWalletAlertDraft({
				alert_enabled: true,
				alert_threshold_type: 'percentage',
				critical: { threshold: '20', condition: 'below' },
				warning: null,
				info: null,
			});
			expect(draft.alert_threshold_type).toBe('percentage');
			expect(draft.percentage.critical).toEqual({ threshold: '20', condition: 'below' });
			expect(draft.absolute).toEqual({ critical: null, warning: null, info: null });
		});
	});

	describe('getActiveWalletAlertLevels', () => {
		it('returns the absolute side when active', () => {
			const draft: WalletAlertDraft = {
				alert_enabled: true,
				alert_threshold_type: 'absolute',
				absolute: { critical: { threshold: '10', condition: 'below' }, warning: null, info: null },
				percentage: { critical: null, warning: null, info: null },
			};
			expect(getActiveWalletAlertLevels(draft)).toBe(draft.absolute);
		});

		it('returns the percentage side when active', () => {
			const draft: WalletAlertDraft = {
				alert_enabled: true,
				alert_threshold_type: 'percentage',
				absolute: { critical: null, warning: null, info: null },
				percentage: { critical: { threshold: '20', condition: 'below' }, warning: null, info: null },
			};
			expect(getActiveWalletAlertLevels(draft)).toBe(draft.percentage);
		});
	});

	describe('setWalletAlertDraftThresholdType / setWalletAlertDraftEnabled', () => {
		const draft: WalletAlertDraft = {
			alert_enabled: true,
			alert_threshold_type: 'absolute',
			absolute: { critical: { threshold: '10', condition: 'below' }, warning: null, info: null },
			percentage: { critical: { threshold: '20', condition: 'below' }, warning: null, info: null },
		};

		it('switching threshold type changes only alert_threshold_type, preserving both sides', () => {
			const next = setWalletAlertDraftThresholdType(draft, 'percentage');
			expect(next.alert_threshold_type).toBe('percentage');
			expect(next.absolute).toEqual(draft.absolute);
			expect(next.percentage).toEqual(draft.percentage);
		});

		it('switching back restores the other side unchanged (round trip)', () => {
			const toPercentage = setWalletAlertDraftThresholdType(draft, 'percentage');
			const backToAbsolute = setWalletAlertDraftThresholdType(toPercentage, 'absolute');
			expect(backToAbsolute.absolute).toEqual(draft.absolute);
			expect(backToAbsolute.percentage).toEqual(draft.percentage);
		});

		it('setWalletAlertDraftEnabled changes only alert_enabled', () => {
			const next = setWalletAlertDraftEnabled(draft, false);
			expect(next.alert_enabled).toBe(false);
			expect(next.absolute).toEqual(draft.absolute);
			expect(next.percentage).toEqual(draft.percentage);
		});
	});

	describe('updateWalletAlertDraftLevels', () => {
		it('applies the updater only to the active side, leaving the inactive side untouched', () => {
			const draft: WalletAlertDraft = {
				alert_enabled: true,
				alert_threshold_type: 'absolute',
				absolute: { critical: null, warning: null, info: null },
				percentage: { critical: { threshold: '20', condition: 'below' }, warning: null, info: null },
			};
			const next = updateWalletAlertDraftLevels(draft, (levels) => setWalletAlertThresholdValue(levels, WalletAlertLevel.CRITICAL, '10'));
			expect(next.absolute.critical).toEqual({ threshold: '10', condition: 'below' });
			// The percentage side, which was not active, is byte-for-byte unchanged.
			expect(next.percentage).toEqual(draft.percentage);
		});
	});

	describe('toWalletAlertSettingsForValidation / fromWalletAlertDraftForSave', () => {
		const draft: WalletAlertDraft = {
			alert_enabled: true,
			alert_threshold_type: 'percentage',
			absolute: { critical: { threshold: '10', condition: 'below' }, warning: null, info: null },
			percentage: { critical: { threshold: '20', condition: 'below' }, warning: null, info: null },
		};

		it('toWalletAlertSettingsForValidation composes the active side with alert_enabled/alert_threshold_type', () => {
			const settings = toWalletAlertSettingsForValidation(draft);
			expect(settings.alert_enabled).toBe(true);
			expect(settings.alert_threshold_type).toBe('percentage');
			expect(settings.critical).toEqual({ threshold: '20', condition: 'below' });
		});

		it('fromWalletAlertDraftForSave normalizes the active side and keeps alert_threshold_type', () => {
			const saved = fromWalletAlertDraftForSave(draft);
			expect(saved.alert_threshold_type).toBe('percentage');
			expect(saved.critical).toEqual({ threshold: '20', condition: 'below' });
			// The inactive (absolute) side never reaches the payload.
			expect(saved).not.toHaveProperty('absolute');
			expect(saved).not.toHaveProperty('percentage');
		});

		it('fromWalletAlertDraftForSave still drops an empty/unparseable threshold via the existing normalize logic', () => {
			const draftWithBadValue: WalletAlertDraft = {
				...draft,
				percentage: { critical: { threshold: '', condition: 'below' }, warning: null, info: null },
			};
			const saved = fromWalletAlertDraftForSave(draftWithBadValue);
			expect(saved.critical).toBeNull();
		});
	});

	describe('getWalletAlertValidationErrorKey — percentage range', () => {
		it('accepts 0 and 100 as valid boundary values', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'percentage',
					critical: { threshold: '0', condition: 'below' },
				}),
			).toBeNull();
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'percentage',
					critical: { threshold: '100', condition: 'above' },
				}),
			).toBeNull();
		});

		it('rejects a negative percentage', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'percentage',
					critical: { threshold: '-1', condition: 'below' },
				}),
			).toBe('criticalThresholdOutOfRange');
		});

		it('rejects a percentage above 100', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'percentage',
					warning: { threshold: '101', condition: 'below' },
					critical: { threshold: '50', condition: 'below' },
				}),
			).toBe('warningThresholdOutOfRange');
		});

		it('never range-checks in absolute mode, even for a value > 100', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'absolute',
					critical: { threshold: '5000', condition: 'below' },
				}),
			).toBeNull();
		});

		it('never range-checks in absolute mode when alert_threshold_type is entirely absent', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					critical: { threshold: '5000', condition: 'below' },
				}),
			).toBeNull();
		});

		it('skips an unset (null) threshold rather than treating it as out of range', () => {
			expect(
				getWalletAlertValidationErrorKey({
					alert_enabled: true,
					alert_threshold_type: 'percentage',
					critical: { threshold: '50', condition: 'below' },
					warning: null,
					info: null,
				}),
			).toBeNull();
		});
	});
});
