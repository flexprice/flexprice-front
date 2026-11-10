import i18n from 'i18next';
import { Eye, EyeOff, LucideIcon, PencilIcon, ShieldCheck } from 'lucide-react';

// Utility function to format permissions for display
export const formatPermissionDisplay = (permissions: readonly string[]): string => {
	const t = i18n.getFixedT(i18n.language ?? 'en', 'developers');
	if (!permissions || permissions.length === 0) {
		return t('apiKeys.permissionDisplay.none');
	}

	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return t('apiKeys.permissionDisplay.fullAccess');
	} else if (hasRead) {
		return t('apiKeys.permissionDisplay.read');
	} else if (hasWrite) {
		return t('apiKeys.permissionDisplay.write');
	} else {
		return t('apiKeys.permissionDisplay.none');
	}
};

export const getPermissionIcon = (permissions: readonly string[]): LucideIcon => {
	if (!permissions || permissions.length === 0) {
		return EyeOff;
	}
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return ShieldCheck; // Full access icon
	} else if (hasRead) {
		return Eye; // Read only icon
	} else if (hasWrite) {
		return PencilIcon; // Write only icon
	} else {
		return EyeOff; // No access icon
	}
};

// Utility function to get color based on permission level
export const getPermissionColor = (permissions: readonly string[]): string => {
	if (!permissions || permissions.length === 0) {
		return 'text-content-muted';
	}
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return 'text-success'; // Full access color
	} else if (hasRead) {
		return 'text-info'; // Read only color
	} else if (hasWrite) {
		return 'text-warning'; // Write only color
	} else {
		return 'text-content-muted'; // No access color
	}
};
