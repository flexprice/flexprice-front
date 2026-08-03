import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { SUB_MODIFY_TAX_ACTION, SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import type { ExecuteSubscriptionModifyRequest, SubModifyTaxParams } from '@/types/dto/Subscription';
import type { TaxAssociationResponse } from '@/types/dto/tax';
import { Trans, useTranslation } from 'react-i18next';

interface Props {
	subscriptionId: string;
	association: TaxAssociationResponse;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RemoveTaxDialog: FC<Props> = ({ subscriptionId, association, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [isRemoving, setIsRemoving] = useState(false);

	const buildPayload = useCallback((): ExecuteSubscriptionModifyRequest => {
		const tax_params: SubModifyTaxParams = {
			action: SUB_MODIFY_TAX_ACTION.REMOVE,
			tax_association_id: association.id,
		};
		return {
			type: SUBSCRIPTION_MODIFY_TYPE.TAX,
			tax_params,
		};
	}, [association.id]);

	const handleRemove = useCallback(async () => {
		setIsRemoving(true);
		try {
			await SubscriptionApi.executeSubscriptionModify(subscriptionId, buildPayload());
			toast.success('Tax removed successfully');
			onSuccess();
			onOpenChange(false);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Remove failed';
			toast.error(message);
		} finally {
			setIsRemoving(false);
		}
	}, [subscriptionId, buildPayload, onSuccess, onOpenChange]);

	const taxName = association.tax_rate?.name ?? association.tax_rate_id;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='w-full max-w-md bg-surface'>
				<DialogHeader>
					<DialogTitle>{t('subscriptions.removeTaxDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='py-2'>
					<p className='text-sm text-content-zinc-secondary'>
						<Trans
							ns='billing'
							i18nKey='subscriptions.removeTaxDialog.confirmMessage'
							values={{ name: taxName }}
							components={{ bold: <span className='font-medium' /> }}
						/>
					</p>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button variant='destructive' onClick={handleRemove} isLoading={isRemoving} className='flex-1'>
						{t('subscriptions.tax.remove')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RemoveTaxDialog;
