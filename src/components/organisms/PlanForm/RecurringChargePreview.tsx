import { Trash2 } from 'lucide-react';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { Price } from '@/models/Price';
import { FC } from 'react';
import { Pencil } from 'lucide-react';
import { InternalPrice } from './SetupChargesSection';

interface Props {
	charge: Price | InternalPrice;
	onEditClicked?: () => void;
	onDeleteClicked?: () => void;
	disabled?: boolean;
}

const RecurringChargePreview: FC<Props> = ({ charge, onEditClicked, onDeleteClicked, disabled }) => {
	return (
		<div className='gap-2 w-full flex justify-between group min-h-9 items-center rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground hover:bg-gray-50 transition-colors mb-2'>
			<div>
				<p className='font-normal text-sm'>Recurring Charge</p>
				<div className='flex gap-2 items-center text-zinc-500 text-xs'>
					<span>{charge.currency}</span>
					<span>•</span>
					<span>{toSentenceCase(charge.billing_period || '')}</span>
					<span>•</span>
					<span>
						{getCurrencySymbol(charge.currency || '')}
						{charge.amount} / {formatBillingPeriodForPrice(charge.billing_period || '')}
					</span>
				</div>
			</div>

			{!disabled && (
				<span className='text-[#18181B] flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity'>
					<button onClick={() => onEditClicked?.()} className='p-1 hover:bg-gray-100 rounded-md'>
						<Pencil size={16} />
					</button>
					<div className='border-r h-[16px] border-[#E4E4E7]' />
					<button onClick={onDeleteClicked} className='p-1 hover:bg-gray-100 rounded-md text-red-500'>
						<Trash2 size={16} />
					</button>
				</span>
			)}
		</div>
	);
};

export default RecurringChargePreview;
