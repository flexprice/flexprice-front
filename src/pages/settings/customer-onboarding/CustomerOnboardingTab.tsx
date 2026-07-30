import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AddButton, Card, Loader } from '@/components/atoms';
import { SettingsCardHeader } from '@/components/molecules';
import {
	getCustomWorkflowNamesValidationErrorKey,
	getCustomerOnboardingValidationErrorKey,
	type CustomerOnboardingActionSetDraft,
	type CustomerOnboardingCustomWorkflowDraft,
	type CustomerOnboardingDraft,
} from '@/types/dto/CustomerOnboarding';
import SettingsFormActions from '../SettingsFormActions';
import CustomWorkflowCard from './CustomWorkflowCard';
import OnboardingActionSetEditor from './OnboardingActionSetEditor';
import {
	buildConfigFromDraft,
	buildDraftFromConfig,
	createEmptyCustomWorkflowDraft,
	useCustomerOnboardingConfig,
	usePublishedPlans,
} from './useCustomerOnboardingConfig';

function countConfiguredActions(draft: CustomerOnboardingActionSetDraft): number {
	return draft.advancedActions.length + (draft.walletEnabled ? 1 : 0) + (draft.subscriptionEnabled ? 1 : 0);
}

const CustomerOnboardingTab = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { configuration, isLoading, updateConfiguration, resetToDefaults } = useCustomerOnboardingConfig();
	const { plans, isLoading: arePlansLoading } = usePublishedPlans();
	const [draft, setDraft] = useState<CustomerOnboardingDraft>(() => buildDraftFromConfig(configuration));
	const [expandedCustomWorkflowId, setExpandedCustomWorkflowId] = useState<string | null>(null);

	useEffect(() => {
		setDraft(buildDraftFromConfig(configuration));
		setExpandedCustomWorkflowId(null);
	}, [configuration]);

	const isSaving = updateConfiguration.isPending || resetToDefaults.isPending;
	const configuredActionCount = countConfiguredActions(draft);
	const hasAdvancedActions =
		draft.advancedActions.length > 0 || draft.customWorkflows.some((workflow) => workflow.advancedActions.length > 0);

	const planOptions = useMemo(
		() =>
			plans.map((plan) => ({
				value: plan.id,
				label: plan.name,
				description: plan.description,
			})),
		[plans],
	);

	const handleSave = () => {
		const setsToValidate: CustomerOnboardingActionSetDraft[] = [draft, ...draft.customWorkflows];
		for (const set of setsToValidate) {
			const creditsPositive = Number(set.walletInitialCreditsToLoad) > 0;
			if (
				creditsPositive &&
				set.walletCreditsExpireEnabled &&
				(!set.walletCreditsExpirationDuration.trim() || !set.walletCreditsExpirationDurationUnit)
			) {
				toast.error(t('customerOnboarding.workflow.validation.walletCreditsExpirationIncomplete'));
				return;
			}
		}

		const nameErrorKey = getCustomWorkflowNamesValidationErrorKey(draft.customWorkflows.map((workflow) => workflow.label));
		if (nameErrorKey) {
			toast.error(t(`customerOnboarding.workflow.validation.${nameErrorKey}`));
			return;
		}

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

	const updateDefaultActionSet = (next: CustomerOnboardingActionSetDraft) => {
		setDraft((prev) => ({ ...prev, ...next, customWorkflows: prev.customWorkflows }));
	};

	const updateCustomWorkflow = (id: string, next: CustomerOnboardingCustomWorkflowDraft) => {
		setDraft((prev) => ({
			...prev,
			customWorkflows: prev.customWorkflows.map((workflow) => (workflow.id === id ? next : workflow)),
		}));
	};

	const removeCustomWorkflow = (id: string) => {
		setDraft((prev) => ({
			...prev,
			customWorkflows: prev.customWorkflows.filter((workflow) => workflow.id !== id),
		}));
		setExpandedCustomWorkflowId((prev) => (prev === id ? null : prev));
	};

	const addCustomWorkflow = () => {
		const next = createEmptyCustomWorkflowDraft();
		setDraft((prev) => ({
			...prev,
			customWorkflows: [...prev.customWorkflows, next],
		}));
		setExpandedCustomWorkflowId(next.id);
	};

	const workflowTitle = t('customerOnboarding.workflow.title');

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
						{hasAdvancedActions ? (
							<p className='mt-2 text-sm text-amber-700'>{t('customerOnboarding.workflow.advancedActionsPreserved')}</p>
						) : null}
					</div>

					<div className='mt-4'>
						<OnboardingActionSetEditor
							value={draft}
							onChange={updateDefaultActionSet}
							planOptions={planOptions}
							arePlansLoading={arePlansLoading}
							disabled={isSaving}
						/>
					</div>

					<div className='mt-6 flex flex-col gap-4 border-t border-gray-200 pt-6'>
						<div>
							<p className='text-sm font-medium text-zinc-900'>{t('customerOnboarding.workflow.customWorkflows.title')}</p>
							<p className='mt-1 text-sm text-zinc-500'>{t('customerOnboarding.workflow.customWorkflows.description')}</p>
						</div>

						{draft.customWorkflows.length === 0 ? (
							<p className='text-sm text-zinc-500'>{t('customerOnboarding.workflow.customWorkflows.empty')}</p>
						) : (
							<div className='flex flex-col gap-3'>
								{draft.customWorkflows.map((workflow) => (
									<CustomWorkflowCard
										key={workflow.id}
										value={workflow}
										onChange={(next) => updateCustomWorkflow(workflow.id, next)}
										onRemove={() => removeCustomWorkflow(workflow.id)}
										planOptions={planOptions}
										arePlansLoading={arePlansLoading}
										disabled={isSaving}
										defaultOpen={expandedCustomWorkflowId === workflow.id}
									/>
								))}
							</div>
						)}

						<AddButton
							className='self-start'
							label={t('customerOnboarding.workflow.customWorkflows.add')}
							variant='outline'
							onClick={addCustomWorkflow}
							disabled={isSaving}
						/>
					</div>

					<SettingsFormActions onReset={handleReset} onSave={handleSave} isSaving={isSaving} disabled={isLoading} />
				</>
			)}
		</Card>
	);
};

export default CustomerOnboardingTab;
