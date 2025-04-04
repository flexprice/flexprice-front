import { Price } from '@/models/Price';
import { getPriceTableCharge } from '@/utils/models/transformed_plan';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

const ChargeValueCell = ({ data }: { data: Price }) => {
	const price = getPriceTableCharge(data as any, false);
	const tiers = data.tiers as unknown as Array<{
		up_to: number | null;
		unit_amount: string;
		flat_amount: string;
	}> | null;
	const isTiered = data.billing_model === 'TIERED' && Array.isArray(tiers) && tiers.length > 0;

	const formatRange = (tier: any, index: number, allTiers: any[]) => {
		// Calculate 'from' based on previous tier's up_to
		const from = index === 0 ? 1 : allTiers[index - 1].up_to + 1;

		// For the last tier or when up_to is null, show infinity
		if (tier.up_to === null || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}
		return `${from} - ${tier.up_to}`;
	};

	return (
		<div className='flex items-center gap-2'>
			<div>{price}</div>
			{isTiered && (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger>
							<Info className='h-4 w-4 text-gray-400 hover:text-gray-500 transition-colors duration-150' />
						</TooltipTrigger>
						<TooltipContent
							sideOffset={5}
							className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
							<div className='space-y-3'>
								<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>Volume Pricing</div>
								<div className='space-y-2 '>
									{tiers.map((tier, index) => (
										<div key={index} className='flex flex-col gap-1'>
											<div className='flex items-center justify-between gap-6'>
												<div className='!font-normal text-muted-foreground'>{formatRange(tier, index, tiers)} units</div>
												<div className='text-right'>
													<div className='!font-normal text-muted-foreground'>
														{getCurrencySymbol(data.currency)}
														{formatAmount(tier.unit_amount)} per unit
													</div>
													{Number(tier.flat_amount) > 0 && (
														<div className='text-xs text-gray-500'>
															+ {getCurrencySymbol(data.currency)}
															{formatAmount(tier.flat_amount)} flat fee
														</div>
													)}
												</div>
											</div>
											{index < tiers.length - 1 && <div className='h-px bg-gray-100' />}
										</div>
									))}
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
};

export default ChargeValueCell;
