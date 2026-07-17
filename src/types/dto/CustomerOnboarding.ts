import { z } from 'zod';
import { BILLING_CYCLE } from '@/models/Subscription';

export const CUSTOMER_ONBOARDING_WORKFLOW_TYPE = 'customer_onboarding' as const;

export type CustomerOnboardingWorkflowType = typeof CUSTOMER_ONBOARDING_WORKFLOW_TYPE;

export type CustomerOnboardingActionType =
	| 'create_customer'
	| 'create_wallet'
	| 'create_subscription'
	| 'create_feature_and_price'
	| 'rollout_to_subscriptions';

export interface CustomerOnboardingActionBase {
	action: string;
	[key: string]: unknown;
}

export interface CreateWalletOnboardingAction extends CustomerOnboardingActionBase {
	action: 'create_wallet';
	currency: string;
	conversion_rate?: string;
}

export interface CreateSubscriptionOnboardingAction extends CustomerOnboardingActionBase {
	action: 'create_subscription';
	plan_id: string;
	billing_cycle?: BILLING_CYCLE;
	start_date?: string;
}

export type CustomerOnboardingAction = CreateWalletOnboardingAction | CreateSubscriptionOnboardingAction | CustomerOnboardingActionBase;

export interface CustomerOnboardingConfig {
	workflow_type: CustomerOnboardingWorkflowType;
	actions: CustomerOnboardingAction[];
}

export const DEFAULT_CUSTOMER_ONBOARDING_CONFIG: CustomerOnboardingConfig = {
	workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
	actions: [],
};

/** Editable draft form-state for the customer onboarding settings tab. */
export interface CustomerOnboardingDraft {
	walletEnabled: boolean;
	walletCurrency: string;
	walletConversionRate: string;
	subscriptionEnabled: boolean;
	subscriptionPlanId: string;
	subscriptionBillingCycle: BILLING_CYCLE;
	subscriptionStartDate: string;
	advancedActions: CustomerOnboardingAction[];
}

const RFC3339_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidIsoDateTime(value: string): boolean {
	const trimmed = value.trim();
	return RFC3339_DATE_TIME_REGEX.test(trimmed) && Number.isFinite(Date.parse(trimmed));
}

/** Mirrors the old `readString`: stringifies any present value, but leaves missing/null as undefined. */
const looseOptionalString = z.preprocess(
	(value) => (value === undefined || value === null ? undefined : String(value)),
	z.string().optional(),
);
const looseRequiredString = z.preprocess((value) => (value === undefined || value === null ? '' : String(value)), z.string());
const looseBillingCycle = looseOptionalString.pipe(z.nativeEnum(BILLING_CYCLE).optional().catch(undefined));

// `.passthrough()` keeps any extra/unrecognized fields on the action object intact, since
// advanced (non-wallet/subscription) actions must round-trip untouched.
const createWalletActionSchema = z
	.object({
		action: z.literal('create_wallet'),
		currency: looseRequiredString,
		conversion_rate: looseOptionalString,
	})
	.passthrough();

const createSubscriptionActionSchema = z
	.object({
		action: z.literal('create_subscription'),
		plan_id: looseRequiredString,
		billing_cycle: looseBillingCycle,
		start_date: looseOptionalString,
	})
	.passthrough();

const genericActionSchema = z.object({ action: z.string() }).passthrough();

function parseAction(value: unknown): CustomerOnboardingAction | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
	const action = (value as Record<string, unknown>).action;
	if (action === undefined || action === null) return null;

	if (action === 'create_wallet') {
		const result = createWalletActionSchema.safeParse(value);
		return result.success ? result.data : null;
	}

	if (action === 'create_subscription') {
		const result = createSubscriptionActionSchema.safeParse(value);
		return result.success ? result.data : null;
	}

	const result = genericActionSchema.safeParse({ ...value, action: String(action) });
	return result.success ? result.data : null;
}

export function parseCustomerOnboardingConfig(value: unknown): CustomerOnboardingConfig {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return { ...DEFAULT_CUSTOMER_ONBOARDING_CONFIG };
	}

	const rawActions = Array.isArray((value as Record<string, unknown>).actions) ? (value as { actions: unknown[] }).actions : [];
	const actions = rawActions.map(parseAction).filter((action): action is CustomerOnboardingAction => action !== null);

	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions,
	};
}

export function normalizeCustomerOnboardingConfig(config: CustomerOnboardingConfig): CustomerOnboardingConfig {
	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions: config.actions.map((action) => {
			if (action.action === 'create_wallet') {
				const walletAction = action as CreateWalletOnboardingAction;
				return {
					action: walletAction.action,
					currency: walletAction.currency.trim().toUpperCase(),
					...(walletAction.conversion_rate?.trim() ? { conversion_rate: walletAction.conversion_rate.trim() } : {}),
				};
			}

			if (action.action === 'create_subscription') {
				const subscriptionAction = action as CreateSubscriptionOnboardingAction;
				return {
					action: subscriptionAction.action,
					plan_id: subscriptionAction.plan_id.trim(),
					...(subscriptionAction.billing_cycle ? { billing_cycle: subscriptionAction.billing_cycle } : {}),
					...(subscriptionAction.start_date?.trim() ? { start_date: subscriptionAction.start_date.trim() } : {}),
				};
			}

			return action;
		}),
	};
}

export type CustomerOnboardingValidationErrorKey =
	| 'walletCurrencyRequired'
	| 'walletConversionRateInvalid'
	| 'subscriptionPlanRequired'
	| 'subscriptionStartDateInvalid';

export function getCustomerOnboardingValidationErrorKey(config: CustomerOnboardingConfig): CustomerOnboardingValidationErrorKey | null {
	for (const action of config.actions) {
		if (action.action === 'create_wallet') {
			const walletAction = action as CreateWalletOnboardingAction;
			if (!walletAction.currency.trim()) return 'walletCurrencyRequired';
			if (walletAction.conversion_rate?.trim()) {
				const conversionRate = Number(walletAction.conversion_rate);
				if (!Number.isFinite(conversionRate) || conversionRate <= 0) return 'walletConversionRateInvalid';
			}
		}

		if (action.action === 'create_subscription') {
			const subscriptionAction = action as CreateSubscriptionOnboardingAction;
			if (!subscriptionAction.plan_id.trim()) return 'subscriptionPlanRequired';
			if (subscriptionAction.start_date?.trim() && !isValidIsoDateTime(subscriptionAction.start_date)) {
				return 'subscriptionStartDateInvalid';
			}
		}
	}

	return null;
}
