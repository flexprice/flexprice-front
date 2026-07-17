import { WalletAlertLevel, WalletAlertSettings, WalletAlertState, WalletAlertThreshold } from '@/models/Wallet';

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

export function getMasterWalletAlertCondition(settings: WalletAlertSettings): 'above' | 'below' | undefined {
	if (settings.critical) return settings.critical.condition;
	if (settings.warning) return settings.warning.condition;
	if (settings.info) return settings.info.condition;
	return undefined;
}

export function isWalletAlertConditionDisabled(level: WalletAlertLevel, settings: WalletAlertSettings): boolean {
	const threshold = settings[level];
	if (!threshold) return false;

	if (level !== WalletAlertLevel.CRITICAL && settings.critical) {
		return true;
	}

	if (level === WalletAlertLevel.INFO && settings.warning && !settings.critical) {
		return true;
	}

	if (level === WalletAlertLevel.WARNING && settings.info && !settings.critical) {
		return true;
	}

	return false;
}

export function applyWalletAlertThresholdChange(
	settings: WalletAlertSettings,
	level: WalletAlertLevel,
	field: 'threshold' | 'condition',
	value: string,
): WalletAlertSettings {
	const currentThreshold = settings[level] || { threshold: '0', condition: 'below' as const };

	if (field === 'condition') {
		const newCondition = value as 'above' | 'below';
		return {
			...settings,
			critical: settings.critical ? { ...settings.critical, condition: newCondition } : null,
			warning: settings.warning ? { ...settings.warning, condition: newCondition } : null,
			info: settings.info ? { ...settings.info, condition: newCondition } : null,
		};
	}

	return {
		...settings,
		[level]: {
			...currentThreshold,
			[field]: value,
		},
	};
}

export function updateWalletAlertThreshold(
	settings: WalletAlertSettings,
	level: WalletAlertLevel,
	patch: { threshold?: string; condition?: 'above' | 'below' } | null,
): WalletAlertSettings {
	if (patch === null) {
		return { ...settings, [level]: null };
	}

	if (patch.condition !== undefined) {
		return applyWalletAlertThresholdChange(settings, level, 'condition', patch.condition);
	}

	const masterCondition = getMasterWalletAlertCondition(settings) ?? 'below';
	const currentThreshold = settings[level] ?? { threshold: '', condition: masterCondition };

	return {
		...settings,
		[level]: {
			threshold: patch.threshold ?? currentThreshold.threshold,
			condition: currentThreshold.condition,
		},
	};
}

export function addWalletAlertThreshold(settings: WalletAlertSettings, level: WalletAlertLevel): WalletAlertSettings {
	const masterCondition = getMasterWalletAlertCondition(settings) ?? 'below';

	return {
		...settings,
		[level]: {
			threshold: '0',
			condition: masterCondition,
		},
	};
}

export type WalletAlertValidationErrorKey =
	| 'atLeastOneThreshold'
	| 'invalidCriticalThreshold'
	| 'invalidWarningThreshold'
	| 'invalidInfoThreshold'
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

export function getWalletAlertValidationErrorKey(settings: WalletAlertSettings): WalletAlertValidationErrorKey | null {
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

	if (settings.warning && !settings.critical) return 'criticalRequiredForWarning';

	const condition = getMasterWalletAlertCondition(settings) ?? 'below';
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

export function normalizeWalletAlertSettingsForSave(settings: WalletAlertSettings): WalletAlertSettings {
	const masterCondition = getMasterWalletAlertCondition(settings) ?? 'below';

	const normalizeLevel = (level: WalletAlertLevel): WalletAlertThreshold | null => {
		const threshold = settings[level];
		if (!threshold || threshold.threshold.trim() === '') return null;
		const value = parseFloat(threshold.threshold);
		if (Number.isNaN(value)) return null;
		return { threshold: threshold.threshold, condition: masterCondition };
	};

	return {
		alert_enabled: settings.alert_enabled ?? false,
		critical: normalizeLevel(WalletAlertLevel.CRITICAL),
		warning: normalizeLevel(WalletAlertLevel.WARNING),
		info: normalizeLevel(WalletAlertLevel.INFO),
	};
}
