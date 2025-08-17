import { FC } from 'react';
import { cn } from '@/lib/utils';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { AddActionButton, Input, Spacer } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { PriceTier } from './UsagePricingForm';
import { PriceUnit } from '@/models/PriceUnit';

interface Props {
	tieredPrices: PriceTier[];
	setTieredPrices: React.Dispatch<React.SetStateAction<PriceTier[]>>;
	currency?: string;
	pricingUnit?: PriceUnit;
}

const formatNumber = (value: string): number | null => {
	if (value.trim() === '') {
		return null;
	}
	const numericString = value.replace(/[^0-9]/g, '');
	return parseInt(numericString, 10);
};

const validateDecimal = (value: string): boolean => {
	if (value.trim() === '') {
		return true; // Allow empty values for validation to be handled elsewhere
	}
	const decimalRegex = /^\d*\.?\d*$/;
	return decimalRegex.test(value);
};

const VolumeTieredPricingForm: FC<Props> = ({ setTieredPrices, tieredPrices, currency, pricingUnit }) => {
	const addTieredPrice = () => {
		setTieredPrices((prev) => {
			const lastTier = prev[prev.length - 1];

			if (lastTier.up_to === null) {
				prev[prev.length - 1] = { ...lastTier, up_to: lastTier.from + 1 };
			}
			const newFrom = lastTier.up_to ?? lastTier.from + 1;

			const newTier = {
				from: newFrom + 1,
				up_to: null,
				unit_amount: '',
				flat_amount: '0',
			};
			return [...prev, newTier];
		});
	};

	// Remove a tier
	const removeTier = (index: number) => {
		if (index === 0 && tieredPrices.length === 1) {
			return;
		}
		setTieredPrices((prev) => {
			const updatedTiers = prev.filter((_, i) => i !== index);
			if (updatedTiers.length > 0 && index === prev.length - 1) {
				updatedTiers[updatedTiers.length - 1].up_to = null;
			}
			return updatedTiers;
		});
	};

	// Update a tier value
	const updateTier = (index: number, key: string, value: string) => {
		const newValue = formatNumber(value);
		setTieredPrices((prev) => {
			const updatedTiers = [...prev];
			if (newValue !== null) {
				updatedTiers[index] = { ...updatedTiers[index], [key]: newValue };

				// Adjust the 'from' and 'up_to' values based on the tier being updated
				if (key === 'up_to' && index < prev.length - 1) {
					// If 'up_to' is updated, adjust the 'from' value of the next tier
					const nextTier = updatedTiers[index + 1];
					nextTier.from = newValue + 1;
				}

				if (key === 'from' && index > 0) {
					// If 'from' is updated, adjust the 'up_to' value of the previous tier
					const previousTier = updatedTiers[index - 1];
					previousTier.up_to = newValue - 1;
				}
			} else {
				updatedTiers[index] = { ...updatedTiers[index], [key]: '' };
			}
			return updatedTiers;
		});
	};

	const updatePrice = (index: number, key: string, value: string) => {
		// Allow only valid decimal numbers for price fields
		const numericString = value.replace(/[^0-9.]/g, '');

		// Prevent multiple decimal points
		const decimalCount = (numericString.match(/\./g) || []).length;
		if (decimalCount > 1) {
			return;
		}

		setTieredPrices((prev) => {
			const updatedTiers = [...prev];
			updatedTiers[index] = { ...updatedTiers[index], [key]: numericString };
			return updatedTiers;
		});
	};

	return (
		<div className='space-y-4'>
			<Spacer height='16px' />
			<div className={cn('w-full', tieredPrices.length > 0 ? '' : 'hidden')}>
				<table className='table-auto w-full border-collapse border border-gray-200 overflow-x-auto'>
					<thead>
						<tr className='bg-gray-100 text-left border-b'>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>First unit</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>Last unit</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>{`Per unit price `}</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>Flat fee </th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'></th>
						</tr>
					</thead>
					<tbody>
						{tieredPrices.map((tier, index) => (
							<tr key={index}>
								<td className='px-4 py-2'>
									<Input
										disabled
										className='h-9'
										// onChange={(e) => updateTier(index, 'from', e)}
										value={tier.from.toString()}
									/>
								</td>
								<td className='px-4 py-2'>
									<Input
										className='h-9'
										onChange={(e) => updateTier(index, 'up_to', e)}
										disabled={tier.up_to === null}
										value={tier.up_to === null ? '∞' : tier.up_to.toString()}
									/>
								</td>
								<td className='px-4 py-2'>
									<Input
										className='h-9'
										onChange={(e) => {
											if (validateDecimal(e)) {
												updatePrice(index, 'unit_amount', e);
											}
										}}
										value={tier.unit_amount?.toString() || ''}
										inputPrefix={pricingUnit?.symbol || (currency ? `${getCurrencySymbol(currency)}` : undefined)}
										placeholder={'0.00'}
									/>
								</td>
								<td className='px-4 py-2'>
									<Input
										className='h-9'
										onChange={(e) => {
											if (validateDecimal(e)) {
												updatePrice(index, 'flat_amount', e);
											}
										}}
										value={tier.flat_amount?.toString() ?? '0'}
										inputPrefix={pricingUnit?.symbol || (currency ? `${getCurrencySymbol(currency)}` : undefined)}
										placeholder={'0.00'}
									/>
								</td>
								<td className='px-4 py-2 text-center'>
									<button className='flex justify-center items-center size-9 rounded-md border text-zinc' onClick={() => removeTier(index)}>
										<RiDeleteBin6Line className='text-zinc' />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className='flex justify-between items-center mt-4'>
				<AddActionButton onClick={addTieredPrice} label='Add Tier' />
			</div>
		</div>
	);
};

export default VolumeTieredPricingForm;
