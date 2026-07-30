import { FC, useState, useCallback } from 'react';
import { Button, DatePicker, Select } from '@/components/atoms';
import AsyncSearchableSelect from '@/components/atoms/Select/AsyncSearchableSelect';
import type { SelectOption } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import CouponApi from '@/api/CouponApi';
import type { ExecuteSubscriptionModifyRequest, SubModifyCouponParams, SubscriptionLineItemResponse } from '@/types/dto/Subscription';
import { SUB_MODIFY_COUPON_ACTION, SUBSCRIPTION_MODIFY_TYPE } from '@/types/dto';
import { ENTITY_STATUS } from '@/models';
import type { Coupon } from '@/models';
import { useTranslation } from 'react-i18next';

type CouponScope = 'subscription' | 'line_item';

interface Props {
	subscriptionId: string;
	lineItems: SubscriptionLineItemResponse[];
	prefilledLineItemId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const SCOPE_OPTIONS: SelectOption[] = [
	{ value: 'subscription', label: 'Subscription Level' },
	{ value: 'line_item', label: 'Line Item Level' },
];

const ApplyCouponDialog: FC<Props> = ({ subscriptionId, lineItems, prefilledLineItemId, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | undefined>(undefined);
	const [scope, setScope] = useState<CouponScope>(prefilledLineItemId ? 'line_item' : 'subscription');
	const [selectedLineItemId, setSelectedLineItemId] = useState<string>(prefilledLineItemId ?? '');
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const [isApplying, setIsApplying] = useState(false);

	const couponSearchFn = useCallback(async (query: string) => {
		const result = await CouponApi.getAllCoupons({ limit: 200, offset: 0 });
		const lower = query.toLowerCase();
		return result.items
			.filter((c) => c.status === ENTITY_STATUS.PUBLISHED && c.coupon_code)
			.filter((c) => !query || c.name.toLowerCase().includes(lower) || (c.coupon_code ?? '').toLowerCase().includes(lower))
			.map((c) => ({
				value: c.coupon_code!,
				label: c.name,
				description: c.coupon_code,
				data: c,
			}));
	}, []);

	const buildPayload = useCallback((): ExecuteSubscriptionModifyRequest => {
		const coupon_params: SubModifyCouponParams = {
			action: SUB_MODIFY_COUPON_ACTION.ADD,
			coupon_code: selectedCoupon?.coupon_code ?? '',
		};
		if (scope === 'line_item' && selectedLineItemId) {
			coupon_params.subscription_line_item_id = selectedLineItemId;
		}
		if (startDate) {
			coupon_params.start_date = startDate.toISOString();
		}
		if (endDate) {
			coupon_params.end_date = endDate.toISOString();
		}
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.COUPON,
			coupon_params,
		};
	}, [selectedCoupon, scope, selectedLineItemId, startDate, endDate]);

	const reset = useCallback(() => {
		setSelectedCoupon(undefined);
		setScope(prefilledLineItemId ? 'line_item' : 'subscription');
		setSelectedLineItemId(prefilledLineItemId ?? '');
		setStartDate(undefined);
		setEndDate(undefined);
	}, [prefilledLineItemId]);

	const handleApply = useCallback(async () => {
		setIsApplying(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Coupon applied successfully');
			onSuccess();
			onOpenChange(false);
			reset();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Apply failed';
			toast.error(message);
		} finally {
			setIsApplying(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange, reset]);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) reset();
			onOpenChange(value);
		},
		[onOpenChange, reset],
	);

	const lineItemOptions: SelectOption[] = lineItems.map((item) => ({
		value: item.id,
		label: item.display_name || item.id,
	}));

	const canApply = !!selectedCoupon?.coupon_code && (scope === 'subscription' || !!selectedLineItemId);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='w-full max-w-lg bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.applyCouponDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					<AsyncSearchableSelect<Coupon>
						search={{
							searchFn: couponSearchFn,
							placeholder: t('subscriptions.applyCouponDialog.couponCodePlaceholder', 'Search by name or code…'),
						}}
						extractors={{
							valueExtractor: (c: Coupon) => c.coupon_code ?? '',
							labelExtractor: (c: Coupon) => c.name,
							descriptionExtractor: (c: Coupon) => c.coupon_code ?? '',
						}}
						display={{
							label: t('subscriptions.applyCouponDialog.couponCodeLabel'),
							placeholder: t('subscriptions.applyCouponDialog.couponCodePlaceholder', 'Search by name or code…'),
							side: 'bottom',
							align: 'start',
						}}
						options={{ hideSelectedTick: false }}
						value={selectedCoupon}
						onChange={setSelectedCoupon}
					/>

					<Select
						label={t('subscriptions.applyCouponDialog.applyToLabel')}
						options={SCOPE_OPTIONS}
						value={scope}
						onChange={(val) => setScope(val as CouponScope)}
						disabled={!!prefilledLineItemId}
					/>

					{scope === 'line_item' && (
						<div className='space-y-1.5'>
							<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.lineItemLabel')}</Label>
							<ShadcnSelect value={selectedLineItemId} onValueChange={setSelectedLineItemId} disabled={!!prefilledLineItemId}>
								<SelectTrigger>
									<SelectValue placeholder={t('subscriptions.applyCouponDialog.selectLineItemPlaceholder')} />
								</SelectTrigger>
								<SelectContent>
									{lineItemOptions.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</ShadcnSelect>
						</div>
					)}

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-1.5'>
							<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.startDateOptional')}</Label>
							<DatePicker date={startDate} setDate={setStartDate} placeholder={t('subscriptions.applyCouponDialog.pickStartDate')} />
						</div>
						<div className='space-y-1.5'>
							<Label className='text-sm font-medium'>{t('subscriptions.applyCouponDialog.endDateOptional')}</Label>
							<DatePicker date={endDate} setDate={setEndDate} placeholder={t('subscriptions.applyCouponDialog.pickEndDate')} />
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleApply} isLoading={isApplying} disabled={!canApply} className='flex-1'>
						{t('common:actions.apply')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApplyCouponDialog;
