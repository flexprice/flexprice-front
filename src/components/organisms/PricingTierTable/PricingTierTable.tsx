import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';

export interface PricingTier {
	from: number;
	to: number | null;
	unitPrice: number;
	flatFee?: number;
}

export type PricingModel = 'flat' | 'per_unit' | 'tiered' | 'graduated' | 'volume';

interface PricingTierTableProps {
	model: PricingModel;
	tiers: PricingTier[];
	currency?: string;
	unitLabel?: string;
}

const MODEL_LABELS: Record<PricingModel, string> = {
	flat: 'Flat Rate',
	per_unit: 'Per Unit',
	tiered: 'Tiered',
	graduated: 'Graduated',
	volume: 'Volume',
};

/**
 * Displays the pricing structure for a plan — supports flat, per-unit, tiered, graduated, and volume models.
 */
const PricingTierTable: React.FC<PricingTierTableProps> = ({ model, tiers, currency = 'USD', unitLabel = 'unit' }) => {
	const symbol = getCurrencySymbol(currency);
	const isSimple = model === 'flat' || model === 'per_unit';

	return (
		<div className='rounded-[8px] border border-gray-200 overflow-hidden'>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200'>
				<span className='text-sm font-semibold text-gray-700'>{MODEL_LABELS[model]} Pricing</span>
				<span className='text-xs text-muted-foreground'>{currency}</span>
			</div>

			{isSimple ? (
				// Flat / Per Unit — just show a single price row
				<div className='px-4 py-4 flex items-center justify-between'>
					<span className='text-sm text-gray-600'>{model === 'flat' ? 'Flat fee' : `Per ${unitLabel}`}</span>
					<span className='text-sm font-medium text-gray-900'>
						{symbol}
						{tiers[0]?.unitPrice.toFixed(4)} / {unitLabel}
					</span>
				</div>
			) : (
				// Tiered / Graduated / Volume — show tier table
				<table className='w-full text-sm'>
					<thead>
						<tr className='bg-gray-50 border-b border-gray-100'>
							<th className='px-4 py-2 text-left font-medium text-gray-600'>From</th>
							<th className='px-4 py-2 text-left font-medium text-gray-600'>To</th>
							<th className='px-4 py-2 text-right font-medium text-gray-600'>Unit Price</th>
							{tiers.some((t) => t.flatFee !== undefined) && <th className='px-4 py-2 text-right font-medium text-gray-600'>Flat Fee</th>}
						</tr>
					</thead>
					<tbody>
						{tiers.map((tier, i) => (
							<tr key={i} className={cn('border-b border-gray-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
								<td className='px-4 py-3 text-gray-700'>{tier.from.toLocaleString()}</td>
								<td className='px-4 py-3 text-gray-700'>{tier.to === null ? '∞' : tier.to.toLocaleString()}</td>
								<td className='px-4 py-3 text-right text-gray-900 font-medium'>
									{symbol}
									{tier.unitPrice.toFixed(4)}
								</td>
								{tiers.some((t) => t.flatFee !== undefined) && (
									<td className='px-4 py-3 text-right text-gray-700'>
										{tier.flatFee !== undefined ? `${symbol}${tier.flatFee.toFixed(2)}` : '—'}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default PricingTierTable;
