import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { PlanApi } from '@/api/PlanApi';
import { DEFAULT_CURRENCY_CODE } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import type { PlanResponse } from '@/types/dto';
import {
	CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
	DEFAULT_CUSTOMER_ONBOARDING_CONFIG,
	normalizeCustomerOnboardingConfig,
	parseCustomerOnboardingConfig,
	type CreateSubscriptionOnboardingAction,
	type CreateWalletOnboardingAction,
	type CustomerOnboardingAction,
	type CustomerOnboardingConfig,
	type CustomerOnboardingDraft,
} from '@/types/dto/CustomerOnboarding';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

const COMMON_ACTIONS = new Set(['create_wallet', 'create_subscription']);
const DEFAULT_CONVERSION_RATE = '1';

function isWalletAction(action: CustomerOnboardingAction): action is CreateWalletOnboardingAction {
	return action.action === 'create_wallet';
}

function isSubscriptionAction(action: CustomerOnboardingAction): action is CreateSubscriptionOnboardingAction {
	return action.action === 'create_subscription';
}

export function buildDraftFromConfig(config: CustomerOnboardingConfig): CustomerOnboardingDraft {
	const walletAction = config.actions.find(isWalletAction);
	const subscriptionAction = config.actions.find(isSubscriptionAction);

	return {
		walletEnabled: Boolean(walletAction),
		walletCurrency: walletAction?.currency || DEFAULT_CURRENCY_CODE,
		walletConversionRate: walletAction?.conversion_rate || DEFAULT_CONVERSION_RATE,
		subscriptionEnabled: Boolean(subscriptionAction),
		subscriptionPlanId: subscriptionAction?.plan_id || '',
		subscriptionBillingCycle: subscriptionAction?.billing_cycle || BILLING_CYCLE.ANNIVERSARY,
		subscriptionStartDate: subscriptionAction?.start_date || '',
		advancedActions: config.actions.filter((action) => !COMMON_ACTIONS.has(action.action)),
	};
}

export function buildConfigFromDraft(draft: CustomerOnboardingDraft): CustomerOnboardingConfig {
	const createCustomerActions = draft.advancedActions.filter((action) => action.action === 'create_customer');
	const otherAdvancedActions = draft.advancedActions.filter((action) => action.action !== 'create_customer');
	const actions: CustomerOnboardingAction[] = [...createCustomerActions];

	if (draft.walletEnabled) {
		actions.push({
			action: 'create_wallet',
			currency: draft.walletCurrency,
			conversion_rate: draft.walletConversionRate,
		});
	}

	if (draft.subscriptionEnabled) {
		actions.push({
			action: 'create_subscription',
			plan_id: draft.subscriptionPlanId,
			billing_cycle: draft.subscriptionBillingCycle,
			...(draft.subscriptionStartDate.trim() ? { start_date: draft.subscriptionStartDate.trim() } : {}),
		});
	}

	return {
		workflow_type: CUSTOMER_ONBOARDING_WORKFLOW_TYPE,
		actions: [...actions, ...otherAdvancedActions],
	};
}

async function fetchCustomerOnboardingConfig(): Promise<CustomerOnboardingConfig> {
	const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.CUSTOMER_ONBOARDING);
	return parseCustomerOnboardingConfig(setting.value);
}

export function useCustomerOnboardingConfig() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.customerOnboardingConfig,
		queryFn: fetchCustomerOnboardingConfig,
	});

	const updateConfiguration = useMutation({
		mutationFn: async (configuration: CustomerOnboardingConfig) => {
			const payload = normalizeCustomerOnboardingConfig(configuration);
			const setting = await SettingsApi.updateSettingByKey(SETTINGS_KEYS.CUSTOMER_ONBOARDING, { value: payload });
			return parseCustomerOnboardingConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.customerOnboardingConfig, configuration);
		},
	});

	const resetToDefaults = useMutation({
		mutationFn: async () => {
			const setting = await SettingsApi.resetSettingToDefaults(SETTINGS_KEYS.CUSTOMER_ONBOARDING);
			return parseCustomerOnboardingConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.customerOnboardingConfig, configuration);
		},
	});

	return {
		configuration: query.data ?? DEFAULT_CUSTOMER_ONBOARDING_CONFIG,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfiguration,
		resetToDefaults,
	};
}

async function fetchPublishedPlans(): Promise<PlanResponse[]> {
	const response = await PlanApi.getPlansByFilter({
		limit: 1000,
		offset: 0,
		filters: [
			{
				field: 'status',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: 'published' },
			},
		],
		sort: [],
	});

	return response.items;
}

export function usePublishedPlans() {
	const query = useQuery({
		queryKey: settingsQueryKeys.customerOnboardingPlans,
		queryFn: fetchPublishedPlans,
	});

	return { plans: query.data ?? [], isLoading: query.isLoading };
}
