import {
	WalletAlertDraft,
	WalletAlertLevel,
	WalletAlertLevels,
	WalletAlertSettings,
	WalletAlertState,
	WalletAlertThreshold,
	WalletAlertThresholdType,
} from '@/models/Wallet';

export interface WalletAlertStatusResult {
	state: WalletAlertState;
	triggeredLevel?: WalletAlertLevel;
	triggeredThreshold?: WalletAlertThreshold;
}

const ALERT_LEVEL_CHECKS: Array<{ level: WalletAlertLevel; state: WalletAlertState }> = [
	{ level: WalletAlertLevel.CRITICAL, state: 'in_alarm' },
	{ level: WalletAlertLevel.WARNING, state: 'warning' },
	{ level: WalletAlertLevel.INFO, state: 'info' },
];

export function hasConfiguredWalletAlertThresholds(settings?: WalletAlertSettings | null): boolean {
	if (!settings?.alert_enabled) return false;
	return Boolean(settings.critical || settings.warning || settings.info);
}

/** Missing/undefined always means 'absolute' — matches the backend's own default. */
export function getWalletAlertThresholdType(settings?: WalletAlertSettings | null): WalletAlertThresholdType {
	return settings?.alert_threshold_type === 'percentage' ? 'percentage' : 'absolute';
}

const emptyWalletAlertLevels = (): WalletAlertLevels => ({ critical: null, warning: null, info: null });

/**
 * Builds editing-time draft state from a saved (or absent) WalletAlertSettings. The saved
 * values land on whichever side matches their actual mode; the other side starts empty — a
 * wallet that has never used percentage mode must not have percentage fields pre-filled by
 * whatever numbers happen to be in absolute mode.
 */
export function toWalletAlertDraft(settings?: WalletAlertSettings | null): WalletAlertDraft {
	const type = getWalletAlertThresholdType(settings);
	const levels: WalletAlertLevels = {
		critical: settings?.critical ?? null,
		warning: settings?.warning ?? null,
		info: settings?.info ?? null,
	};
	return {
		alert_enabled: settings?.alert_enabled ?? false,
		alert_threshold_type: type,
		absolute: type === 'absolute' ? levels : emptyWalletAlertLevels(),
		percentage: type === 'percentage' ? levels : emptyWalletAlertLevels(),
	};
}

export function getActiveWalletAlertLevels(draft: WalletAlertDraft): WalletAlertLevels {
	return draft[draft.alert_threshold_type];
}

/** Changes only which side is active — never touches either side's values. */
export function setWalletAlertDraftThresholdType(draft: WalletAlertDraft, type: WalletAlertThresholdType): WalletAlertDraft {
	return { ...draft, alert_threshold_type: type };
}

export function setWalletAlertDraftEnabled(draft: WalletAlertDraft, enabled: boolean): WalletAlertDraft {
	return { ...draft, alert_enabled: enabled };
}

/**
 * Applies `updater` to only the currently-active side (absolute or percentage), leaving the
 * other side's values completely untouched — this is what makes mode-switching non-destructive.
 * `updater` is typically setWalletAlertThresholdValue, called with the active side's WalletAlertLevels.
 */
export function updateWalletAlertDraftLevels(
	draft: WalletAlertDraft,
	updater: (levels: WalletAlertLevels) => WalletAlertLevels,
): WalletAlertDraft {
	return { ...draft, [draft.alert_threshold_type]: updater(getActiveWalletAlertLevels(draft)) };
}

/** Composes the active side + alert_enabled/alert_threshold_type, unnormalized — for validating raw (possibly invalid) input before save. */
export function toWalletAlertSettingsForValidation(draft: WalletAlertDraft): WalletAlertSettings {
	return {
		alert_enabled: draft.alert_enabled,
		alert_threshold_type: draft.alert_threshold_type,
		...getActiveWalletAlertLevels(draft),
	};
}

/** The payload to actually submit: only the active side's (normalized) values, plus alert_threshold_type. */
export function fromWalletAlertDraftForSave(draft: WalletAlertDraft): WalletAlertSettings {
	const raw = toWalletAlertSettingsForValidation(draft);
	return { ...normalizeWalletAlertSettingsForSave(raw), alert_threshold_type: raw.alert_threshold_type };
}

export function isWalletAlertThresholdTriggered(balance: number, threshold: WalletAlertThreshold): boolean {
	const value = parseFloat(threshold.threshold);
	if (Number.isNaN(value)) return false;
	return threshold.condition === 'below' ? balance < value : balance > value;
}

export function computeWalletAlertStatus(balance: number, settings?: WalletAlertSettings | null): WalletAlertStatusResult | null {
	if (!hasConfiguredWalletAlertThresholds(settings)) return null;

	for (const { level, state } of ALERT_LEVEL_CHECKS) {
		const threshold = settings?.[level];
		if (threshold && isWalletAlertThresholdTriggered(balance, threshold)) {
			return { state, triggeredLevel: level, triggeredThreshold: threshold };
		}
	}

	return { state: 'ok' };
}

export function hasActiveWalletAlertStatus(balance: number, settings?: WalletAlertSettings | null): boolean {
	const status = computeWalletAlertStatus(balance, settings);
	return status !== null && status.state !== 'ok';
}

/**
 * Wallet balance alerts only ever fire on a falling balance, so every threshold is stored with
 * condition 'below'. The field is retained because the backend contract still carries it (and
 * legacy rows may hold 'above', which computeWalletAlertStatus still evaluates correctly), but
 * the UI no longer offers a choice and every value written from here is 'below'.
 */
export type WalletAlertCondition = WalletAlertThreshold['condition'];

export const WALLET_ALERT_CONDITION: WalletAlertCondition = 'below';

/**
 * Writes one level's threshold from raw input. A blank value clears the level to null rather
 * than storing an empty string, so an intentionally-unset optional threshold is never reported
 * as an invalid number by getWalletAlertValidationErrorKey.
 */
export function setWalletAlertThresholdValue(levels: WalletAlertLevels, level: WalletAlertLevel, value: string): WalletAlertLevels {
	if (value.trim() === '') {
		return { ...levels, [level]: null };
	}

	return { ...levels, [level]: { threshold: value, condition: WALLET_ALERT_CONDITION } };
}

export type WalletAlertValidationErrorKey =
	| 'atLeastOneThreshold'
	| 'invalidCriticalThreshold'
	| 'invalidWarningThreshold'
	| 'invalidInfoThreshold'
	| 'criticalThresholdOutOfRange'
	| 'warningThresholdOutOfRange'
	| 'infoThresholdOutOfRange'
	| 'criticalRequiredForWarning'
	| 'warningMustBeLessThanCritical'
	| 'warningMustBeGreaterThanCritical'
	| 'infoMustBeLessThanWarning'
	| 'infoMustBeGreaterThanWarning'
	| 'infoMustBeLessThanCritical'
	| 'infoMustBeGreaterThanCritical';

function parseWalletAlertThresholdValue(threshold: WalletAlertThreshold): number | null {
	const value = parseFloat(threshold.threshold);
	return Number.isNaN(value) ? null : value;
}

/**
 * `condition` is supplied by the caller rather than read from the thresholds: wallet balance
 * alerts are always 'below' (their picker is gone), while subscription/line-item spend alerts are
 * always 'above'. It decides which way the critical/warning/info ordering must run.
 */
export function getWalletAlertValidationErrorKey(
	settings: WalletAlertSettings,
	condition: WalletAlertCondition = WALLET_ALERT_CONDITION,
): WalletAlertValidationErrorKey | null {
	if (!settings.alert_enabled) return null;

	const hasAnyThreshold = settings.critical || settings.warning || settings.info;
	if (!hasAnyThreshold) return 'atLeastOneThreshold';

	const validateLevel = (level: WalletAlertLevel, errorKey: WalletAlertValidationErrorKey): WalletAlertValidationErrorKey | null => {
		const threshold = settings[level];
		if (!threshold) return null;
		if (parseWalletAlertThresholdValue(threshold) === null) return errorKey;
		return null;
	};

	const valueError =
		validateLevel(WalletAlertLevel.CRITICAL, 'invalidCriticalThreshold') ??
		validateLevel(WalletAlertLevel.WARNING, 'invalidWarningThreshold') ??
		validateLevel(WalletAlertLevel.INFO, 'invalidInfoThreshold');
	if (valueError) return valueError;

	if (getWalletAlertThresholdType(settings) === 'percentage') {
		const validateRange = (level: WalletAlertLevel, errorKey: WalletAlertValidationErrorKey): WalletAlertValidationErrorKey | null => {
			const threshold = settings[level];
			if (!threshold) return null;
			const value = parseWalletAlertThresholdValue(threshold);
			if (value === null || value < 0 || value > 100) return errorKey;
			return null;
		};
		const rangeError =
			validateRange(WalletAlertLevel.CRITICAL, 'criticalThresholdOutOfRange') ??
			validateRange(WalletAlertLevel.WARNING, 'warningThresholdOutOfRange') ??
			validateRange(WalletAlertLevel.INFO, 'infoThresholdOutOfRange');
		if (rangeError) return rangeError;
	}

	if (settings.warning && !settings.critical) return 'criticalRequiredForWarning';

	// 'below' thresholds ascend (critical < warning < info); 'above' thresholds descend.
	const criticalValue = settings.critical ? parseWalletAlertThresholdValue(settings.critical) : null;
	const warningValue = settings.warning ? parseWalletAlertThresholdValue(settings.warning) : null;
	const infoValue = settings.info ? parseWalletAlertThresholdValue(settings.info) : null;

	if (warningValue !== null && criticalValue !== null) {
		if (condition === 'above' && warningValue >= criticalValue) return 'warningMustBeLessThanCritical';
		if (condition === 'below' && warningValue <= criticalValue) return 'warningMustBeGreaterThanCritical';
	}

	if (infoValue !== null && warningValue !== null) {
		if (condition === 'above' && infoValue >= warningValue) return 'infoMustBeLessThanWarning';
		if (condition === 'below' && infoValue <= warningValue) return 'infoMustBeGreaterThanWarning';
	}

	if (infoValue !== null && criticalValue !== null && !settings.warning) {
		if (condition === 'above' && infoValue >= criticalValue) return 'infoMustBeLessThanCritical';
		if (condition === 'below' && infoValue <= criticalValue) return 'infoMustBeGreaterThanCritical';
	}

	return null;
}

/**
 * Every surviving threshold is written with `condition`, so a saved set is always internally
 * consistent. Wallet alerts take the 'below' default — rewriting any legacy 'above' row the first
 * time it is saved — while spend alerts pass 'above'.
 */
export function normalizeWalletAlertSettingsForSave(
	settings: WalletAlertSettings,
	condition: WalletAlertCondition = WALLET_ALERT_CONDITION,
): WalletAlertSettings {
	const normalizeLevel = (level: WalletAlertLevel): WalletAlertThreshold | null => {
		const threshold = settings[level];
		if (!threshold || threshold.threshold.trim() === '') return null;
		const value = parseFloat(threshold.threshold);
		if (Number.isNaN(value)) return null;
		return { threshold: threshold.threshold, condition };
	};

	return {
		alert_enabled: settings.alert_enabled ?? false,
		critical: normalizeLevel(WalletAlertLevel.CRITICAL),
		warning: normalizeLevel(WalletAlertLevel.WARNING),
		info: normalizeLevel(WalletAlertLevel.INFO),
	};
}
