import { Trash2 } from 'lucide-react';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { BILLING_MODEL, Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { FC } from 'react';
import { Pencil } from 'lucide-react';
import { InternalPrice } from './SetupChargesSection';
import { formatAmount } from '@/components/atoms/Input/Input';
import { ChargeValueCell } from '@/components/molecules';
import { useTranslation } from 'react-i18next';

interface Props {
	charge: Price | InternalPrice;
	onEditClicked?: () => void;
	onDeleteClicked?: () => void;
	disabled?: boolean;
}

const RecurringChargePreview: FC<Props> = ({ charge, onEditClicked, onDeleteClicked, disabled }) => {
	const { t } = useTranslation('catalog');
	// Helper to get the appropriate amount and symbol for display
	const getDisplayInfo = () => {
		const isCustom = charge.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

		if (isCustom && charge.price_unit_config?.price_unit) {
			// For custom price units, use price_unit_amount or price_unit_config.amount
			const amount = (charge as any).price_unit_amount || charge.price_unit_config?.amount || charge.amount || '0';
			const priceUnitCode = charge.price_unit_config.price_unit;
			// Use price unit code as symbol (or we could fetch the actual symbol if available)
			const symbol = priceUnitCode;

			return {
				amount,
				symbol,
				currency: charge.currency, // base_currency
			};
		}

		// For FIAT, use regular amount and currency symbol
		return {
			amount: charge.amount || '0',
			symbol: getCurrencySymbol(charge.currency || ''),
			currency: charge.currency,
		};
	};

	const displayInfo = getDisplayInfo();
	const displayCurrency =
		charge.price_unit_type === PRICE_UNIT_TYPE.CUSTOM ? charge.price_unit_config?.price_unit || charge.currency : charge.currency;

	// Flat fee charges render a simple "amount / period" string; package and tiered charges
	// reuse ChargeValueCell, which knows how to format package sizes and tier summaries.
	const isFlatFee = !charge.billing_model || charge.billing_model === BILLING_MODEL.FLAT_FEE;

	return (
		<div className='gap-2 w-full flex justify-between group min-h-9 items-center rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground hover:bg-surface-subtle transition-colors mb-2'>
			<div>
				<p className='font-normal text-sm'>{charge.display_name || t('plans.organisms.chargeLabels.fixedCharge')}</p>
				<div className='flex gap-2 items-center text-content-zinc-muted text-xs'>
					<span>{displayCurrency}</span>
					<span>•</span>
					<span>{toSentenceCase(charge.billing_period || '')}</span>
					<span>•</span>
					{isFlatFee ? (
						<span>
							{displayInfo.symbol}
							{formatAmount(displayInfo.amount)} / {formatBillingPeriodForPrice(charge.billing_period || '')}
						</span>
					) : (
						<ChargeValueCell data={{ ...charge, currency: charge.currency } as any} />
					)}
				</div>
			</div>

			{!disabled && (
				<span className='text-content-zinc-bold flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity'>
					<button onClick={() => onEditClicked?.()} className='p-1 hover:bg-surface-shell rounded-md'>
						<Pencil size={16} />
					</button>
					<div className='border-r h-[16px] border-line-zinc' />
					<button onClick={onDeleteClicked} className='p-1 hover:bg-surface-shell rounded-md text-danger-bright'>
						<Trash2 size={16} />
					</button>
				</span>
			)}
		</div>
	);
};

export default RecurringChargePreview;
