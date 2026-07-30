import { FC, useState, useCallback, useMemo } from 'react';
import { Button, DatePicker, Select } from '@/components/atoms';
import type { SelectOption } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import TaxApi from '@/api/TaxApi';
import { SUB_MODIFY_TAX_ACTION, SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import type { ExecuteSubscriptionModifyRequest, SubModifyTaxParams } from '@/types/dto/Subscription';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import { EXPAND } from '@/models';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { useTranslation } from 'react-i18next';

interface Props {
	subscriptionId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ApplyTaxDialog: FC<Props> = ({ subscriptionId, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [taxRateId, setTaxRateId] = useState('');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
	const [isApplying, setIsApplying] = useState(false);

	const { data: taxRatesData } = useQuery({
		queryKey: ['tax-rates', 'list'],
		queryFn: () => TaxApi.listTaxRates({ limit: 100, offset: 0 }),
		enabled: open,
	});

	const { data: existingAssocs } = useQuery({
		queryKey: ['subscriptionTaxAssociations', subscriptionId],
		queryFn: () =>
			TaxApi.listTaxAssociations({
				limit: 1000,
				offset: 0,
				entity_id: subscriptionId,
				entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
				expand: generateExpandQueryParams([EXPAND.TAX_RATE]),
			}),
		enabled: open && !!subscriptionId,
	});

	const appliedRateIds = useMemo(() => new Set((existingAssocs?.items ?? []).map((a) => a.tax_rate_id)), [existingAssocs?.items]);

	const taxRateOptions: SelectOption[] = useMemo(
		() =>
			(taxRatesData?.items ?? [])
				.filter((rate) => !appliedRateIds.has(rate.id))
				.map((rate) => ({
					value: rate.id,
					label: `${rate.name} (${rate.code})`,
				})),
		[taxRatesData?.items, appliedRateIds],
	);

	const allApplied = !!taxRatesData && taxRatesData.items.length > 0 && taxRateOptions.length === 0;

	const buildPayload = useCallback((): ExecuteSubscriptionModifyRequest => {
		const tax_params: SubModifyTaxParams = {
			action: SUB_MODIFY_TAX_ACTION.ADD,
			tax_rate_id: taxRateId,
		};
		if (effectiveDate) {
			tax_params.effective_date = effectiveDate.toISOString();
		}
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.TAX,
			tax_params,
		};
	}, [taxRateId, effectiveDate]);

	const handleApply = useCallback(async () => {
		setIsApplying(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Tax applied successfully');
			onSuccess();
			onOpenChange(false);
			setTaxRateId('');
			setEffectiveDate(undefined);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				setTaxRateId('');
				setEffectiveDate(undefined);
			}
			onOpenChange(value);
		},
		[onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.applyTaxDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					{allApplied ? (
						<p className='text-sm text-muted-foreground py-4 text-center'>
							{t('subscriptions.applyTaxDialog.allApplied', 'All available tax rates are already applied to this subscription.')}
						</p>
					) : (
						<>
							<Select
								label={t('subscriptions.applyTaxDialog.taxRateLabel')}
								options={taxRateOptions}
								value={taxRateId}
								onChange={setTaxRateId}
								placeholder={t('subscriptions.applyTaxDialog.selectTaxRatePlaceholder')}
								required
							/>

							<div className='space-y-1.5'>
								<Label className='text-sm font-medium'>{t('subscriptions.applyTaxDialog.effectiveDateOptional')}</Label>
								<DatePicker date={effectiveDate} setDate={setEffectiveDate} placeholder={t('subscriptions.applyTaxDialog.pickDate')} />
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					{!allApplied && (
						<Button onClick={handleApply} isLoading={isApplying} disabled={!taxRateId} className='flex-1'>
							{t('common:actions.apply')}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyTaxDialog;
