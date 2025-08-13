import { FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { InternalPrice } from '../EntityChargesPage/EntityChargesPage';
import ChargeValueCell from '@/pages/product-catalog/plans/ChargeValueCell';

interface Props {
	charge: InternalPrice;
	index: number;
	onEdit?: (price: InternalPrice) => void;
	onDelete?: (index: number) => void;
	disabled?: boolean;
}

const UsageChargePreview: FC<Props> = ({ charge: price, index, onDelete, onEdit, disabled }) => {
	return (
		<div className='gap-2 w-full flex justify-between group min-h-9 items-center rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground hover:bg-gray-50 transition-colors'>
			<div>
				<p className='font-normal text-sm'>{price.meter?.name || 'Usage Based Charge'}</p>
				<div className='flex gap-2 items-center text-zinc-500 text-xs'>
					<span>{price.currency}</span>
					<span>•</span>
					<span>{toSentenceCase(price.billing_period || '')}</span>
					{price.billing_model && (
						<>
							<span>•</span>
							{/* <span>{formatBillingModel(price.billing_model)}</span> */}
							<ChargeValueCell data={{ ...price, currency: price.currency } as any} />
						</>
					)}
				</div>
			</div>
			{!disabled && (
				<span className='text-[#18181B] flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity'>
					<button
						onClick={() => {
							const newPrice = { ...price, isEdit: true };
							onEdit?.(newPrice);
						}}
						className='p-1 hover:bg-gray-100 rounded-md'>
						<Pencil size={16} />
					</button>
					<div className='border-r h-[16px] border-[#E4E4E7]' />
					<button onClick={() => onDelete?.(index)} className='p-1 hover:bg-gray-100 rounded-md text-red-500'>
						<Trash2 size={16} />
					</button>
				</span>
			)}
		</div>
	);
};

export default UsageChargePreview;
