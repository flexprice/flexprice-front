import { BaseModel, Metadata } from './base';
import { Meter } from './Meter';

export type DurationUnit = 'second' | 'minute' | 'hour' | 'day';

export type Duration = {
	value: number;
	unit: DurationUnit;
};

export type AutoTopup = {
	enabled: boolean;
	threshold: string;
	amount: string;
	invoicing: boolean;
	/** Omit/null/undefined = no cooloff. Send `{ value: 0, unit: 'second' }` on PUT to clear. */
	cooldown?: Duration | null;
};

export interface WalletAlertThreshold {
	threshold: string;
	condition: 'above' | 'below';
}

/**
 * Whether a wallet's critical/warning/info thresholds are read as currency amounts or as a
 * percentage. Backend note: only the low_ongoing_balance alert type evaluates percentage
 * mode — the low_credit_balance alert type silently skips evaluation while it's selected.
 * Missing/undefined always means 'absolute' (see getWalletAlertThresholdType).
 */
export type WalletAlertThresholdType = 'absolute' | 'percentage';

export interface WalletAlertSettings {
	critical?: WalletAlertThreshold | null;
	warning?: WalletAlertThreshold | null;
	info?: WalletAlertThreshold | null;
	alert_enabled?: boolean;
	alert_threshold_type?: WalletAlertThresholdType;
}

/** Just the per-level thresholds, without alert_enabled/alert_threshold_type — one "side" of a WalletAlertDraft. */
export type WalletAlertLevels = Pick<WalletAlertSettings, 'critical' | 'warning' | 'info'>;

/**
 * Editing-time state for a wallet alert form. Absolute and percentage thresholds are kept as
 * two independent sets so switching alert_threshold_type never discards either one — only the
 * active side's values (plus alert_threshold_type) end up in the saved WalletAlertSettings.
 * Built/read via walletAlertUtils.ts's toWalletAlertDraft / fromWalletAlertDraftForSave.
 */
export interface WalletAlertDraft {
	alert_enabled: boolean;
	alert_threshold_type: WalletAlertThresholdType;
	absolute: WalletAlertLevels;
	percentage: WalletAlertLevels;
}

export enum WalletAlertLevel {
	CRITICAL = 'critical',
	WARNING = 'warning',
	INFO = 'info',
}

export type WalletAlertState = 'ok' | 'info' | 'warning' | 'in_alarm';

export interface Wallet extends BaseModel {
	readonly balance: number;
	readonly name: string;
	readonly currency: string;
	readonly customer_id: string;
	readonly metadata: Metadata;
	readonly wallet_status: WALLET_STATUS;
	readonly wallet_type: WALLET_TYPE;
	readonly conversion_rate: number;
	readonly topup_conversion_rate?: number;
	readonly meter: Meter;
	readonly alert_settings?: WalletAlertSettings;
	readonly alert_state?: WalletAlertState;
	readonly auto_topup?: AutoTopup;
}

export enum WALLET_STATUS {
	ACTIVE = 'active',
	FROZEN = 'frozen',
	CLOSED = 'closed',
}

// interface
export enum WALLET_TX_REFERENCE_TYPE {
	PAYMENT = 'PAYMENT',
	EXTERNAL = 'EXTERNAL',
	REQUEST = 'REQUEST',
}

export enum WALLET_TRANSACTION_REASON {
	INVOICE_PAYMENT = 'INVOICE_PAYMENT',
	FREE_CREDIT_GRANT = 'FREE_CREDIT_GRANT',
	SUBSCRIPTION_CREDIT_GRANT = 'SUBSCRIPTION_CREDIT_GRANT',
	PURCHASED_CREDIT_INVOICED = 'PURCHASED_CREDIT_INVOICED',
	PURCHASED_CREDIT_DIRECT = 'PURCHASED_CREDIT_DIRECT',
	INVOICE_REFUND = 'INVOICE_REFUND',
	CREDIT_EXPIRED = 'CREDIT_EXPIRED',
	WALLET_TERMINATION = 'WALLET_TERMINATION',
	CREDIT_NOTE = 'CREDIT_NOTE',
	MANUAL_BALANCE_DEBIT = 'MANUAL_BALANCE_DEBIT',
}

export enum WALLET_TRANSACTION_TYPE {
	CREDIT = 'credit',
	DEBIT = 'debit',
}

export enum WALLET_TYPE {
	PRE_PAID = 'PRE_PAID',
	POST_PAID = 'POST_PAID',
}

export enum WALLET_AUTO_TOPUP_TRIGGER {
	DISABLED = 'disabled',
	BALANCE_BELOW_THRESHOLD = 'balance_below_threshold',
}

export enum WALLET_CONFIG_PRICE_TYPE {
	ALL = 'ALL',
	USAGE = 'USAGE',
	FIXED = 'FIXED',
}
