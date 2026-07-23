import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, FieldWithInfo, Input, Loader } from '@/components/atoms';
import { SettingsToggleRow } from '@/components/molecules';
import { cn } from '@/lib/utils';
import type { SubscriptionConfig } from '@/types/dto/BillingSettings';
import { useSubscriptionConfiguration } from './useSubscriptionConfiguration';
import SettingsFormActions from '../SettingsFormActions';

const SubscriptionConfigurationSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { configuration, savedConfiguration, isLoading, updateConfiguration } = useSubscriptionConfiguration();
	const [draft, setDraft] = useState<SubscriptionConfig>(configuration);
	const [gracePeriodInput, setGracePeriodInput] = useState(String(configuration.grace_period_days));

	useEffect(() => {
		setDraft(configuration);
		setGracePeriodInput(String(configuration.grace_period_days));
	}, [configuration]);

	const normalizeGracePeriodDays = (value: string) => Math.max(1, Number(value) || savedConfiguration.grace_period_days);

	const previewGracePeriodDays = gracePeriodInput === '' ? draft.grace_period_days : normalizeGracePeriodDays(gracePeriodInput);

	const handleReset = () => {
		setDraft(savedConfiguration);
		setGracePeriodInput(String(savedConfiguration.grace_period_days));
	};

	const handleSave = () => {
		const payload = {
			...draft,
			grace_period_days: normalizeGracePeriodDays(gracePeriodInput),
		};

		updateConfiguration.mutate(payload, {
			onSuccess: () => toast.success(t('billing.subscriptionConfiguration.saveSuccess')),
			onError: () => toast.error(t('billing.subscriptionConfiguration.saveError')),
		});
	};

	const gracePeriodLabel = t('billing.subscriptionConfiguration.preview.gracePeriodValue', {
		count: previewGracePeriodDays,
	});

	const actionLabel = draft.auto_cancellation_enabled
		? t('billing.subscriptionConfiguration.preview.actionEnabled')
		: t('billing.subscriptionConfiguration.preview.actionDisabled');

	const autoCancellationLabel = t('billing.subscriptionConfiguration.fields.autoCancellation');
	const gracePeriodDaysLabel = t('billing.subscriptionConfiguration.fields.gracePeriodDays');

	return (
		<Card variant='default' className='rounded-xl border border-border bg-card shadow-sm'>
			<CardHeader title={t('billing.subscriptionConfiguration.title')} titleClassName='text-lg font-medium text-foreground' />
			{isLoading ? (
				<Loader />
			) : (
				<>
					<p className='mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
						{t('billing.subscriptionConfiguration.previewLabel')}
					</p>
					<div className='mb-6 flex overflow-hidden rounded-lg border border-border'>
						<div className='flex-1 border-r border-border px-4 py-4'>
							<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
								{t('billing.subscriptionConfiguration.preview.triggerColumn')}
							</p>
							<p className='mt-2 text-sm font-semibold text-foreground'>{t('billing.subscriptionConfiguration.preview.triggerValue')}</p>
						</div>
						<div className='flex-1 border-r border-border px-4 py-4'>
							<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
								{t('billing.subscriptionConfiguration.preview.gracePeriodColumn')}
							</p>
							<p className='mt-2 text-sm font-semibold text-foreground'>{gracePeriodLabel}</p>
						</div>
						<div className='flex-1 px-4 py-4'>
							<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
								{t('billing.subscriptionConfiguration.preview.actionColumn')}
							</p>
							<p className={cn('mt-2 text-sm', draft.auto_cancellation_enabled ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
								{actionLabel}
							</p>
						</div>
					</div>

					<SettingsToggleRow
						label={autoCancellationLabel}
						description={
							draft.auto_cancellation_enabled
								? t('billing.subscriptionConfiguration.hints.autoCancellation')
								: t('billing.subscriptionConfiguration.hints.disabledState')
						}
						infoAriaLabel={t('info.ariaLabel', { field: autoCancellationLabel })}
						checked={draft.auto_cancellation_enabled}
						disabled={updateConfiguration.isPending}
						className='py-0'
						onCheckedChange={(enabled) => setDraft((prev) => ({ ...prev, auto_cancellation_enabled: enabled }))}
					/>

					{draft.auto_cancellation_enabled ? (
						<div className='mt-5 max-w-md'>
							<FieldWithInfo
								label={gracePeriodDaysLabel}
								description={t('billing.subscriptionConfiguration.hints.gracePeriodDays')}
								infoAriaLabel={t('info.ariaLabel', { field: gracePeriodDaysLabel })}
								disabled={updateConfiguration.isPending}>
								<Input
									type='number'
									value={gracePeriodInput}
									variant='number'
									suffix={t('billing.subscriptionConfiguration.fields.gracePeriodSuffix')}
									onChange={setGracePeriodInput}
									onBlur={() => {
										const normalized = normalizeGracePeriodDays(gracePeriodInput);
										setGracePeriodInput(String(normalized));
										setDraft((prev) => ({ ...prev, grace_period_days: normalized }));
									}}
									disabled={updateConfiguration.isPending}
								/>
							</FieldWithInfo>
						</div>
					) : (
						<hr className='my-4 border-border' />
					)}

					{draft.auto_cancellation_enabled ? (
						<div className='mt-6 rounded-lg border border-info-muted-foreground/20 bg-info-muted p-4'>
							<p className='text-sm font-medium text-foreground'>{t('billing.subscriptionConfiguration.infoCallout.title')}</p>
							<ul className='mt-2 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
								<li>{t('billing.subscriptionConfiguration.infoCallout.description1')}</li>
								<li>{t('billing.subscriptionConfiguration.infoCallout.description2')}</li>
								<li>{t('billing.subscriptionConfiguration.infoCallout.description3')}</li>
							</ul>
						</div>
					) : null}

					<SettingsFormActions onReset={handleReset} onSave={handleSave} isSaving={updateConfiguration.isPending} disabled={isLoading} />
				</>
			)}
		</Card>
	);
};

export default SubscriptionConfigurationSection;
