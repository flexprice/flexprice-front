import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { SUB_MODIFY_COUPON_ACTION, SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import type { CouponAssociation } from '@/models/CouponAssociation';
import type { ExecuteSubscriptionModifyRequest, SubModifyCouponParams } from '@/types/dto/Subscription';
import { Trans, useTranslation } from 'react-i18next';

interface Props {
	subscriptionId: string;
	association: CouponAssociation;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RemoveCouponDialog: FC<Props> = ({ subscriptionId, association, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [isRemoving, setIsRemoving] = useState(false);

	const buildPayload = useCallback((): ExecuteSubscriptionModifyRequest => {
		const coupon_params: SubModifyCouponParams = {
			action: SUB_MODIFY_COUPON_ACTION.REMOVE,
			coupon_association_id: association.id,
		};
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.COUPON,
			coupon_params,
		};
	}, [association.id]);

	const handleRemove = useCallback(async () => {
		setIsRemoving(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Coupon removed successfully');
			onSuccess();
			onOpenChange(false);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Remove failed';
			toast.error(message);
		} finally {
			setIsRemoving(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const couponName = association.coupon?.name ?? association.coupon_id;
	const couponCode = association.coupon?.coupon_code;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='w-full max-w-md bg-white'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.removeCouponDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='py-2'>
					<p className='text-sm text-zinc-700'>
						<Trans
							ns='billing'
							i18nKey={
								couponCode ? 'subscriptions.removeCouponDialog.confirmMessageWithCode' : 'subscriptions.removeCouponDialog.confirmMessage'
							}
							values={{ name: couponName, code: couponCode }}
							components={{ bold: <span className='font-medium' /> }}
						/>
					</p>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button variant='destructive' onClick={handleRemove} isLoading={isRemoving} className='flex-1'>
						{t('subscriptions.coupon.remove')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RemoveCouponDialog;
