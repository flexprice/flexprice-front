import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, DatePicker, Dialog, Input, Select } from '@/components/atoms';
import EntitlementApi from '@/api/EntitlementApi';
import {
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_ENTITY_TYPE,
	ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
	type Entitlement,
} from '@/models/Entitlement';
import { getCurrencySymbol } from '@/constants/common';

interface SubscriptionGrantDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	currency: string;
	/** Edits this grant's quota when set; creates a new grant otherwise. Mount per open, so the form starts fresh. */
	grant?: Entitlement | null;
	onSaved: () => void;
}

const SubscriptionGrantDialog: FC<SubscriptionGrantDialogProps> = ({ isOpen, onOpenChange, subscriptionId, currency, grant, onSaved }) => {
	const { t } = useTranslation('catalog');
	const { t: tc } = useTranslation('common');
	const isEdit = !!grant;

	const [quota, setQuota] = useState(grant?.grant_quota ?? '');
	const [unit, setUnit] = useState<ENTITLEMENT_GRANT_DURATION_UNIT>(ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD);
	const [every, setEvery] = useState('1');
	const [allocation, setAllocation] = useState<ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR>(ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE);
	const [mode, setMode] = useState<ENTITLEMENT_AGGREGATION_MODE>(ENTITLEMENT_AGGREGATION_MODE.ADDITIVE);
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();
	const [errors, setErrors] = useState<{ quota?: string; every?: string }>({});

	const isPeriod = unit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD;

	const { mutate: save, isPending } = useMutation({
		mutationFn: async () => {
			if (isEdit && grant) {
				return await EntitlementApi.update(grant.id, { grant_quota: quota.trim() });
			}
			return await EntitlementApi.createSubscriptionGrant({
				entity_type: ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION,
				entity_id: subscriptionId,
				grant_measure: ENTITLEMENT_GRANT_MEASURE.AMOUNT,
				grant_quota: quota.trim(),
				grant_duration_unit: unit,
				grant_duration_value: isPeriod ? undefined : Number(every),
				grant_allocation_behavior: isPeriod ? undefined : allocation,
				aggregation_mode: mode,
				start_date: startDate?.toISOString(),
				end_date: endDate?.toISOString(),
			});
		},
		onSuccess: () => {
			toast.success(isEdit ? t('entitlements.subscriptionGrants.updateSuccess') : t('entitlements.subscriptionGrants.createSuccess'));
			onSaved();
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('entitlements.subscriptionGrants.saveFailed'));
		},
	});

	const handleSave = () => {
		const next: typeof errors = {};
		const amount = Number(quota);
		if (!quota.trim() || !Number.isFinite(amount) || amount <= 0) {
			next.quota = t('entitlements.subscriptionGrants.quotaRequired');
		}
		if (!isEdit && !isPeriod && (!Number.isInteger(Number(every)) || Number(every) < 1)) {
			next.every = t('entitlements.subscriptionGrants.everyRequired');
		}
		setErrors(next);
		if (Object.keys(next).length === 0) {
			save();
		}
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={isEdit ? t('entitlements.subscriptionGrants.editTitle') : t('entitlements.subscriptionGrants.createTitle')}
			description={isEdit ? t('entitlements.subscriptionGrants.editDescription') : t('entitlements.subscriptionGrants.createDescription')}
			scrollBody
			className='w-full max-w-xl'>
			<div className='space-y-5'>
				<Input
					id='subscription-grant-quota'
					label={t('entitlements.subscriptionGrants.quotaLabel')}
					type='number'
					value={quota}
					onChange={setQuota}
					inputPrefix={getCurrencySymbol(currency)}
					placeholder={t('entitlements.subscriptionGrants.quotaPlaceholder')}
					error={errors.quota}
				/>

				{!isEdit && (
					<>
						<Select
							label={t('entitlements.subscriptionGrants.windowLabel')}
							value={unit}
							onChange={(value) => setUnit(value as ENTITLEMENT_GRANT_DURATION_UNIT)}
							options={[
								{ value: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD, label: t('entitlements.subscriptionGrants.windowPeriod') },
								{ value: ENTITLEMENT_GRANT_DURATION_UNIT.HOUR, label: t('entitlements.subscriptionGrants.windowHour') },
								{ value: ENTITLEMENT_GRANT_DURATION_UNIT.DAY, label: t('entitlements.subscriptionGrants.windowDay') },
								{ value: ENTITLEMENT_GRANT_DURATION_UNIT.WEEK, label: t('entitlements.subscriptionGrants.windowWeek') },
							]}
						/>

						{!isPeriod && (
							<div className='grid grid-cols-2 gap-4'>
								<Input
									id='subscription-grant-every'
									label={t('entitlements.subscriptionGrants.everyLabel')}
									type='number'
									value={every}
									onChange={setEvery}
									error={errors.every}
								/>
								<Select
									label={t('entitlements.subscriptionGrants.allocationLabel')}
									value={allocation}
									onChange={(value) => setAllocation(value as ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR)}
									options={[
										{
											value: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE,
											label: t('entitlements.subscriptionGrants.allocationFirstUsage'),
										},
										{
											value: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.UNIT_START,
											label: t('entitlements.subscriptionGrants.allocationUnitStart'),
										},
									]}
								/>
							</div>
						)}

						<Select
							label={t('entitlements.subscriptionGrants.modeLabel')}
							value={mode}
							onChange={(value) => setMode(value as ENTITLEMENT_AGGREGATION_MODE)}
							options={[
								{ value: ENTITLEMENT_AGGREGATION_MODE.ADDITIVE, label: t('entitlements.subscriptionGrants.modeAdditiveOption') },
								{ value: ENTITLEMENT_AGGREGATION_MODE.PARALLEL, label: t('entitlements.subscriptionGrants.modeParallelOption') },
							]}
						/>

						<div className='grid grid-cols-2 gap-4'>
							<DatePicker
								label={t('entitlements.subscriptionGrants.startDateLabel')}
								placeholder={t('entitlements.subscriptionGrants.startDateHint')}
								date={startDate}
								setDate={setStartDate}
								clearable
							/>
							<DatePicker
								label={t('entitlements.subscriptionGrants.endDateLabel')}
								date={endDate}
								setDate={setEndDate}
								minDate={startDate}
								clearable
							/>
						</div>
					</>
				)}

				<div className='flex justify-end gap-3 pt-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
						{tc('actions.cancel')}
					</Button>
					<Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
						{t('entitlements.subscriptionGrants.save')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default SubscriptionGrantDialog;
