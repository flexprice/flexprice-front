import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldWithInfo, Input, Select } from '@/components/atoms';
import { SettingsToggleRow } from '@/components/molecules';
import { billingCycleOptions, currencyOptions, DEFAULT_CURRENCY_CODE } from '@/constants/constants';
import { cn } from '@/lib/utils';
import { CREDIT_GRANT_PERIOD_UNIT } from '@/models/CreditGrant';
import { BILLING_CYCLE } from '@/models/Subscription';
import { WALLET_TYPE } from '@/models/Wallet';
import type { CustomerOnboardingActionSetDraft } from '@/types/dto/CustomerOnboarding';

const CREDIT_EXPIRATION_UNIT_OPTIONS = [
	{ value: CREDIT_GRANT_PERIOD_UNIT.DAYS, labelKey: 'day' as const },
	{ value: CREDIT_GRANT_PERIOD_UNIT.WEEKS, labelKey: 'week' as const },
	{ value: CREDIT_GRANT_PERIOD_UNIT.MONTHS, labelKey: 'month' as const },
	{ value: CREDIT_GRANT_PERIOD_UNIT.YEARS, labelKey: 'year' as const },
];

export interface OnboardingActionSetEditorPlanOption {
	value: string;
	label: string;
	description?: string;
}

interface OnboardingActionSetEditorProps {
	value: CustomerOnboardingActionSetDraft;
	onChange: (next: CustomerOnboardingActionSetDraft) => void;
	planOptions: OnboardingActionSetEditorPlanOption[];
	arePlansLoading?: boolean;
	disabled?: boolean;
}

const OnboardingActionSetEditor = ({
	value,
	onChange,
	planOptions,
	arePlansLoading = false,
	disabled = false,
}: OnboardingActionSetEditorProps) => {
	const { t } = useTranslation(['settings', 'common']);
	const showCreditsExpiry = Number(value.walletInitialCreditsToLoad) > 0;

	const resolvedPlanOptions = useMemo(() => {
		if (value.subscriptionPlanId && !planOptions.some((option) => option.value === value.subscriptionPlanId)) {
			return [
				{
					value: value.subscriptionPlanId,
					label: value.subscriptionPlanId,
					description: t('customerOnboarding.workflow.selectedPlanUnavailable'),
				},
				...planOptions,
			];
		}
		return planOptions;
	}, [planOptions, t, value.subscriptionPlanId]);

	const creditExpirationUnitOptions = useMemo(
		() =>
			CREDIT_EXPIRATION_UNIT_OPTIONS.map(({ value: unit, labelKey }) => ({
				value: unit,
				label: t(`customerOnboarding.workflow.wallet.expirationUnits.${labelKey}`),
			})),
		[t],
	);

	const walletTypeOptions = useMemo(
		() => [
			{
				value: WALLET_TYPE.PRE_PAID,
				label: t('customerOnboarding.workflow.wallet.types.prePaid'),
				description: t('customerOnboarding.workflow.wallet.types.prePaidHint'),
			},
			{
				value: WALLET_TYPE.POST_PAID,
				label: t('customerOnboarding.workflow.wallet.types.postPaid'),
				description: t('customerOnboarding.workflow.wallet.types.postPaidHint'),
			},
		],
		[t],
	);

	const walletTitle = t('customerOnboarding.workflow.wallet.title');
	const subscriptionTitle = t('customerOnboarding.workflow.subscription.title');
	const walletTypeLabel = t('customerOnboarding.workflow.wallet.type');
	const walletCurrencyLabel = t('customerOnboarding.workflow.wallet.currency');
	const walletConversionRateLabel = t('customerOnboarding.workflow.wallet.conversionRate');
	const walletInitialCreditsLabel = t('customerOnboarding.workflow.wallet.initialCredits');
	const walletExpireCreditsLabel = t('customerOnboarding.workflow.wallet.expireCredits', {
		defaultValue: 'Expire credits',
	});
	const walletCreditsExpirationDurationLabel = t('customerOnboarding.workflow.wallet.expirationDuration');
	const walletCreditsExpirationUnitLabel = t('customerOnboarding.workflow.wallet.expirationUnit');
	const subscriptionPlanLabel = t('customerOnboarding.workflow.subscription.plan');
	const subscriptionBillingCycleLabel = t('customerOnboarding.workflow.subscription.billingCycle');
	const subscriptionStartDateLabel = t('customerOnboarding.workflow.subscription.startDate');

	const patch = (partial: Partial<CustomerOnboardingActionSetDraft>) => {
		onChange({ ...value, ...partial });
	};

	return (
		<div className='divide-y divide-gray-200'>
			<div>
				<SettingsToggleRow
					label={walletTitle}
					description={t('customerOnboarding.workflow.wallet.description')}
					infoAriaLabel={t('info.ariaLabel', { field: walletTitle })}
					checked={value.walletEnabled}
					disabled={disabled}
					onCheckedChange={(checked) => patch({ walletEnabled: checked })}
				/>
				{value.walletEnabled ? (
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 pb-4 md:grid-cols-2'>
						<FieldWithInfo
							label={walletTypeLabel}
							description={t('customerOnboarding.workflow.wallet.typeHint')}
							infoAriaLabel={t('info.ariaLabel', { field: walletTypeLabel })}
							disabled={disabled}>
							<Select
								value={value.walletType || WALLET_TYPE.PRE_PAID}
								options={walletTypeOptions}
								placeholder={t('customerOnboarding.workflow.wallet.typePlaceholder')}
								onChange={(next) => patch({ walletType: (next as WALLET_TYPE) || WALLET_TYPE.PRE_PAID })}
								disabled={disabled}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={walletCurrencyLabel}
							description={t('customerOnboarding.workflow.wallet.currencyHint')}
							infoAriaLabel={t('info.ariaLabel', { field: walletCurrencyLabel })}
							disabled={disabled}>
							<Select
								value={value.walletCurrency}
								options={currencyOptions}
								onChange={(next) => patch({ walletCurrency: next || DEFAULT_CURRENCY_CODE })}
								disabled={disabled}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={walletConversionRateLabel}
							description={t('customerOnboarding.workflow.wallet.conversionRateHint')}
							infoAriaLabel={t('info.ariaLabel', { field: walletConversionRateLabel })}
							disabled={disabled}>
							<Input
								value={value.walletConversionRate}
								variant='number'
								onChange={(next) => patch({ walletConversionRate: next })}
								disabled={disabled}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={walletInitialCreditsLabel}
							description={t('customerOnboarding.workflow.wallet.initialCreditsHint')}
							infoAriaLabel={t('info.ariaLabel', { field: walletInitialCreditsLabel })}
							disabled={disabled}>
							<Input
								value={value.walletInitialCreditsToLoad}
								variant='formatted-number'
								formatOptions={{
									allowDecimals: true,
									allowNegative: false,
									decimalSeparator: '.',
									thousandSeparator: ',',
								}}
								placeholder={t('customerOnboarding.workflow.wallet.initialCreditsPlaceholder')}
								onChange={(next) => patch({ walletInitialCreditsToLoad: next })}
								disabled={disabled}
							/>
						</FieldWithInfo>
						{/* Keep mounted (hidden) so toggle/select remounts don't wipe draft expiry state. */}
						<div className={cn('col-span-full', !showCreditsExpiry && 'hidden')}>
							<SettingsToggleRow
								label={walletExpireCreditsLabel}
								description={t('customerOnboarding.workflow.wallet.expireCreditsHint', {
									defaultValue: 'When off, welcome credits never expire. When on, set a relative duration and unit.',
								})}
								infoAriaLabel={t('info.ariaLabel', { field: walletExpireCreditsLabel })}
								checked={value.walletCreditsExpireEnabled}
								disabled={disabled || !showCreditsExpiry}
								onCheckedChange={(checked) => patch({ walletCreditsExpireEnabled: checked })}
							/>
							<div className={cn('grid grid-cols-1 gap-x-6 gap-y-5 pb-4 md:grid-cols-2', !value.walletCreditsExpireEnabled && 'hidden')}>
								<FieldWithInfo
									label={walletCreditsExpirationDurationLabel}
									description={t('customerOnboarding.workflow.wallet.expirationDurationHint')}
									infoAriaLabel={t('info.ariaLabel', { field: walletCreditsExpirationDurationLabel })}
									disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}>
									<Input
										value={value.walletCreditsExpirationDuration}
										variant='formatted-number'
										formatOptions={{
											allowDecimals: false,
											allowNegative: false,
											decimalSeparator: '.',
											thousandSeparator: ',',
										}}
										placeholder={t('customerOnboarding.workflow.wallet.expirationDurationPlaceholder')}
										onChange={(next) => patch({ walletCreditsExpirationDuration: next })}
										disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}
									/>
								</FieldWithInfo>
								<FieldWithInfo
									label={walletCreditsExpirationUnitLabel}
									description={t('customerOnboarding.workflow.wallet.expirationUnitHint')}
									infoAriaLabel={t('info.ariaLabel', { field: walletCreditsExpirationUnitLabel })}
									disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}>
									<Select
										value={value.walletCreditsExpirationDurationUnit}
										options={creditExpirationUnitOptions}
										placeholder={t('customerOnboarding.workflow.wallet.expirationUnitPlaceholder')}
										onChange={(next) => patch({ walletCreditsExpirationDurationUnit: (next as CREDIT_GRANT_PERIOD_UNIT) || '' })}
										disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}
									/>
								</FieldWithInfo>
							</div>
						</div>
					</div>
				) : null}
			</div>

			<div>
				<SettingsToggleRow
					label={subscriptionTitle}
					description={t('customerOnboarding.workflow.subscription.description')}
					infoAriaLabel={t('info.ariaLabel', { field: subscriptionTitle })}
					checked={value.subscriptionEnabled}
					disabled={disabled}
					onCheckedChange={(checked) => patch({ subscriptionEnabled: checked })}
				/>
				{value.subscriptionEnabled ? (
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 pb-4 md:grid-cols-2'>
						<FieldWithInfo
							label={subscriptionPlanLabel}
							description={t('customerOnboarding.workflow.subscription.planHint')}
							infoAriaLabel={t('info.ariaLabel', { field: subscriptionPlanLabel })}
							disabled={disabled || arePlansLoading}>
							<Select
								value={value.subscriptionPlanId}
								options={resolvedPlanOptions}
								placeholder={t('customerOnboarding.workflow.subscription.planPlaceholder')}
								noOptionsText={t('customerOnboarding.workflow.subscription.noPlans')}
								onChange={(next) => patch({ subscriptionPlanId: next })}
								disabled={disabled || arePlansLoading}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={subscriptionBillingCycleLabel}
							description={t('customerOnboarding.workflow.subscription.billingCycleHint')}
							infoAriaLabel={t('info.ariaLabel', { field: subscriptionBillingCycleLabel })}
							disabled={disabled}>
							<Select
								value={value.subscriptionBillingCycle}
								options={billingCycleOptions}
								onChange={(next) => patch({ subscriptionBillingCycle: (next as BILLING_CYCLE) || BILLING_CYCLE.ANNIVERSARY })}
								disabled={disabled}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={subscriptionStartDateLabel}
							description={t('customerOnboarding.workflow.subscription.startDateHint')}
							infoAriaLabel={t('info.ariaLabel', { field: subscriptionStartDateLabel })}
							disabled={disabled}>
							<Input
								value={value.subscriptionStartDate}
								onChange={(next) => patch({ subscriptionStartDate: next })}
								placeholder={t('customerOnboarding.workflow.subscription.startDatePlaceholder')}
								disabled={disabled}
							/>
						</FieldWithInfo>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default OnboardingActionSetEditor;
