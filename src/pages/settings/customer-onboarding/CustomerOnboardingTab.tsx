import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Card, FieldWithInfo, Input, Loader, Select } from '@/components/atoms';
import { SettingsCardHeader, SettingsToggleRow } from '@/components/molecules';
import { billingCycleOptions, currencyOptions, DEFAULT_CURRENCY_CODE } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import { getCustomerOnboardingValidationErrorKey, type CustomerOnboardingDraft } from '@/types/dto/CustomerOnboarding';
import SettingsFormActions from '../SettingsFormActions';
import { buildConfigFromDraft, buildDraftFromConfig, useCustomerOnboardingConfig, usePublishedPlans } from './useCustomerOnboardingConfig';

const CustomerOnboardingTab = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { configuration, isLoading, updateConfiguration, resetToDefaults } = useCustomerOnboardingConfig();
	const { plans, isLoading: arePlansLoading } = usePublishedPlans();
	const [draft, setDraft] = useState<CustomerOnboardingDraft>(() => buildDraftFromConfig(configuration));

	useEffect(() => {
		setDraft(buildDraftFromConfig(configuration));
	}, [configuration]);

	const isSaving = updateConfiguration.isPending || resetToDefaults.isPending;
	const configuredActionCount = draft.advancedActions.length + (draft.walletEnabled ? 1 : 0) + (draft.subscriptionEnabled ? 1 : 0);

	const planOptions = useMemo(() => {
		const options = plans.map((plan) => ({
			value: plan.id,
			label: plan.name,
			description: plan.description,
		}));

		if (draft.subscriptionPlanId && !options.some((option) => option.value === draft.subscriptionPlanId)) {
			return [
				{
					value: draft.subscriptionPlanId,
					label: draft.subscriptionPlanId,
					description: t('customerOnboarding.workflow.selectedPlanUnavailable'),
				},
				...options,
			];
		}

		return options;
	}, [draft.subscriptionPlanId, plans, t]);

	const handleSave = () => {
		const config = buildConfigFromDraft(draft);
		const validationErrorKey = getCustomerOnboardingValidationErrorKey(config);

		if (validationErrorKey) {
			toast.error(t(`customerOnboarding.workflow.validation.${validationErrorKey}`));
			return;
		}

		updateConfiguration.mutate(config, {
			onSuccess: () => toast.success(t('customerOnboarding.workflow.saveSuccess')),
			onError: () => toast.error(t('customerOnboarding.workflow.saveError')),
		});
	};

	const handleReset = () => {
		resetToDefaults.mutate(undefined, {
			onSuccess: () => toast.success(t('customerOnboarding.workflow.resetSuccess')),
			onError: () => toast.error(t('customerOnboarding.workflow.resetError')),
		});
	};

	const workflowTitle = t('customerOnboarding.workflow.title');
	const walletTitle = t('customerOnboarding.workflow.wallet.title');
	const subscriptionTitle = t('customerOnboarding.workflow.subscription.title');
	const walletCurrencyLabel = t('customerOnboarding.workflow.wallet.currency');
	const walletConversionRateLabel = t('customerOnboarding.workflow.wallet.conversionRate');
	const subscriptionPlanLabel = t('customerOnboarding.workflow.subscription.plan');
	const subscriptionBillingCycleLabel = t('customerOnboarding.workflow.subscription.billingCycle');
	const subscriptionStartDateLabel = t('customerOnboarding.workflow.subscription.startDate');

	return (
		<Card variant='default' className='rounded-xl border border-gray-200 bg-white shadow-sm'>
			<SettingsCardHeader
				title={workflowTitle}
				titleClassName='text-lg font-medium text-zinc-800'
				infoDescription={t('customerOnboarding.workflow.description')}
				infoAriaLabel={t('info.ariaLabel', { field: workflowTitle })}
			/>
			{isLoading ? (
				<Loader />
			) : (
				<>
					<div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
						<p className='text-xs font-medium uppercase tracking-wide text-zinc-400'>{t('customerOnboarding.workflow.summaryLabel')}</p>
						<p className='mt-2 text-sm text-zinc-700'>
							{configuredActionCount === 0
								? t('customerOnboarding.workflow.noActionsConfigured')
								: t(
										configuredActionCount === 1
											? 'customerOnboarding.workflow.actionConfigured'
											: 'customerOnboarding.workflow.actionsConfigured',
										{ count: configuredActionCount },
									)}
						</p>
						{draft.advancedActions.length > 0 ? (
							<p className='mt-2 text-sm text-amber-700'>{t('customerOnboarding.workflow.advancedActionsPreserved')}</p>
						) : null}
					</div>

					<div className='mt-4 divide-y divide-gray-200'>
						<div>
							<SettingsToggleRow
								label={walletTitle}
								description={t('customerOnboarding.workflow.wallet.description')}
								infoAriaLabel={t('info.ariaLabel', { field: walletTitle })}
								checked={draft.walletEnabled}
								disabled={isSaving}
								onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, walletEnabled: checked }))}
							/>
							{draft.walletEnabled ? (
								<div className='grid grid-cols-1 gap-x-6 gap-y-5 pb-4 md:grid-cols-2'>
									<FieldWithInfo
										label={walletCurrencyLabel}
										description={t('customerOnboarding.workflow.wallet.currencyHint')}
										infoAriaLabel={t('info.ariaLabel', { field: walletCurrencyLabel })}
										disabled={isSaving}>
										<Select
											value={draft.walletCurrency}
											options={currencyOptions}
											onChange={(value) => setDraft((prev) => ({ ...prev, walletCurrency: value || DEFAULT_CURRENCY_CODE }))}
											disabled={isSaving}
										/>
									</FieldWithInfo>
									<FieldWithInfo
										label={walletConversionRateLabel}
										description={t('customerOnboarding.workflow.wallet.conversionRateHint')}
										infoAriaLabel={t('info.ariaLabel', { field: walletConversionRateLabel })}
										disabled={isSaving}>
										<Input
											value={draft.walletConversionRate}
											variant='number'
											onChange={(value) => setDraft((prev) => ({ ...prev, walletConversionRate: value }))}
											disabled={isSaving}
										/>
									</FieldWithInfo>
								</div>
							) : null}
						</div>

						<div>
							<SettingsToggleRow
								label={subscriptionTitle}
								description={t('customerOnboarding.workflow.subscription.description')}
								infoAriaLabel={t('info.ariaLabel', { field: subscriptionTitle })}
								checked={draft.subscriptionEnabled}
								disabled={isSaving}
								onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, subscriptionEnabled: checked }))}
							/>
							{draft.subscriptionEnabled ? (
								<div className='grid grid-cols-1 gap-x-6 gap-y-5 pb-4 md:grid-cols-2'>
									<FieldWithInfo
										label={subscriptionPlanLabel}
										description={t('customerOnboarding.workflow.subscription.planHint')}
										infoAriaLabel={t('info.ariaLabel', { field: subscriptionPlanLabel })}
										disabled={isSaving || arePlansLoading}>
										<Select
											value={draft.subscriptionPlanId}
											options={planOptions}
											placeholder={t('customerOnboarding.workflow.subscription.planPlaceholder')}
											noOptionsText={t('customerOnboarding.workflow.subscription.noPlans')}
											onChange={(value) => setDraft((prev) => ({ ...prev, subscriptionPlanId: value }))}
											disabled={isSaving || arePlansLoading}
										/>
									</FieldWithInfo>
									<FieldWithInfo
										label={subscriptionBillingCycleLabel}
										description={t('customerOnboarding.workflow.subscription.billingCycleHint')}
										infoAriaLabel={t('info.ariaLabel', { field: subscriptionBillingCycleLabel })}
										disabled={isSaving}>
										<Select
											value={draft.subscriptionBillingCycle}
											options={billingCycleOptions}
											onChange={(value) =>
												setDraft((prev) => ({
													...prev,
													subscriptionBillingCycle: (value as BILLING_CYCLE) || BILLING_CYCLE.ANNIVERSARY,
												}))
											}
											disabled={isSaving}
										/>
									</FieldWithInfo>
									<FieldWithInfo
										label={subscriptionStartDateLabel}
										description={t('customerOnboarding.workflow.subscription.startDateHint')}
										infoAriaLabel={t('info.ariaLabel', { field: subscriptionStartDateLabel })}
										disabled={isSaving}>
										<Input
											value={draft.subscriptionStartDate}
											onChange={(value) => setDraft((prev) => ({ ...prev, subscriptionStartDate: value }))}
											placeholder={t('customerOnboarding.workflow.subscription.startDatePlaceholder')}
											disabled={isSaving}
										/>
									</FieldWithInfo>
								</div>
							) : null}
						</div>
					</div>

					<SettingsFormActions onReset={handleReset} onSave={handleSave} isSaving={isSaving} disabled={isLoading} />
				</>
			)}
		</Card>
	);
};

export default CustomerOnboardingTab;
