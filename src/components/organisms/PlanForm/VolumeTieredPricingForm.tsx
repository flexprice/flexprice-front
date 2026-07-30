import { FC } from 'react';
import { cn } from '@/lib/utils';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Input, DecimalUsageInput } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { PriceTier } from './UsagePricingForm';
import { AddChargesButton } from './SetupChargesSection';
import { TIER_MODE } from '@/models/Price';
import { useTranslation } from 'react-i18next';

interface Props {
	tieredPrices: PriceTier[];
	setTieredPrices: React.Dispatch<React.SetStateAction<PriceTier[]>>;
	currency?: string;
	tierMode?: TIER_MODE;
}

const formatNumber = (value: string): number | null => {
	if (value.trim() === '') {
		return null;
	}
	// Support decimal values for tier boundaries
	const numericString = value.replace(/[^0-9.]/g, '');
	const numValue = parseFloat(numericString);
	return isNaN(numValue) ? null : numValue;
};

const validateDecimal = (value: string): boolean => {
	if (value.trim() === '') {
		return true; // Allow empty values for validation to be handled elsewhere
	}
	const decimalRegex = /^\d*\.?\d*$/;
	return decimalRegex.test(value);
};

// Helper function to get display symbol for currency or price unit
const getDisplaySymbol = (value?: string): string => {
	if (!value) return '';
	const normalized = value.toUpperCase();
	// Check if it's a currency code (3 uppercase letters)
	const isCurrencyCode = /^[A-Z]{3}$/.test(normalized);

	if (isCurrencyCode) {
		return getCurrencySymbol(normalized);
	}
	// Otherwise, it's a custom price unit code - display as-is
	return value;
};

const VolumeTieredPricingForm: FC<Props> = ({ setTieredPrices, tieredPrices, currency }) => {
	const { t } = useTranslation('catalog');
	const addTieredPrice = () => {
		setTieredPrices((prev) => {
			const lastTier = prev[prev.length - 1];

			if (lastTier.up_to === null) {
				prev[prev.length - 1] = { ...lastTier, up_to: lastTier.from + 1 };
			}
			const newFrom = lastTier.up_to ?? lastTier.from + 1;

			const newTier = {
				from: newFrom,
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
					nextTier.from = newValue;
				}

				if (key === 'from' && index > 0) {
					// If 'from' is updated, adjust the 'up_to' value of the previous tier
					const previousTier = updatedTiers[index - 1];
					previousTier.up_to = newValue;
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
		<div className='w-full min-w-0 space-y-4'>
			<div className={cn('w-full min-w-0', tieredPrices.length > 0 ? '' : 'hidden')}>
				<div className='w-full min-w-0 overflow-x-auto'>
					<table className='w-full min-w-0 table-fixed border-collapse border border-gray-200'>
						<colgroup>
							<col className='w-[18%]' />
							<col className='w-[18%]' />
							<col className='w-[28%]' />
							<col className='w-[28%]' />
							<col className='w-10' />
						</colgroup>
						<thead>
							<tr className='border-b bg-gray-100 text-start'>
								<th className='bg-white px-2 py-2 text-left text-xs font-normal whitespace-normal text-[#71717A]'>
									{t('plans.organisms.volumeTier.from')} {t('plans.organisms.volumeTier.fromSuffix')}
								</th>
								<th className='bg-white px-2 py-2 text-left text-xs font-normal whitespace-normal text-[#71717A]'>
									{t('plans.organisms.volumeTier.upTo')} {t('plans.organisms.volumeTier.upToSuffix')}
								</th>
								<th className='bg-white px-2 py-2 text-left text-xs font-normal whitespace-normal text-[#71717A]'>
									{t('plans.organisms.volumeTier.perUnitPrice')}
								</th>
								<th className='bg-white px-2 py-2 text-left text-xs font-normal whitespace-normal text-[#71717A]'>
									{t('plans.organisms.volumeTier.flatFee')}
								</th>
								<th className='bg-white px-1 py-2' />
							</tr>
						</thead>
						<tbody>
							{tieredPrices.map((tier, index) => (
								<tr key={index}>
									<td className='min-w-0 px-2 py-2'>
										<Input
											disabled
											className='h-9 w-full min-w-0'
											// onChange={(e) => updateTier(index, 'from', e)}
											value={tier.from.toString()}
										/>
									</td>
									<td className='min-w-0 px-2 py-2'>
										<DecimalUsageInput
											label=''
											className='h-9 w-full min-w-0'
											value={tier.up_to === null ? '∞' : tier.up_to.toString()}
											onChange={(e) => updateTier(index, 'up_to', e)}
											disabled={tier.up_to === null}
											precision={3}
											min={0}
											placeholder='∞'
										/>
									</td>
									<td className='min-w-0 px-2 py-2'>
										<Input
											className='h-9 w-full min-w-0'
											onChange={(e) => {
												if (validateDecimal(e)) {
													updatePrice(index, 'unit_amount', e);
												}
											}}
											value={tier.unit_amount?.toString() || ''}
											inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
											placeholder={t('plans.organisms.volumeTier.zeroPlaceholder')}
										/>
									</td>
									<td className='min-w-0 px-2 py-2'>
										<Input
											className='h-9 w-full min-w-0'
											onChange={(e) => {
												if (validateDecimal(e)) {
													updatePrice(index, 'flat_amount', e);
												}
											}}
											value={tier.flat_amount?.toString() ?? '0'}
											inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
											placeholder={t('plans.organisms.volumeTier.zeroPlaceholder')}
										/>
									</td>
									<td className='px-1 py-2 text-center'>
										<button
											type='button'
											className='mx-auto flex size-9 shrink-0 items-center justify-center rounded-md border text-zinc'
											onClick={() => removeTier(index)}>
											<RiDeleteBin6Line className='text-zinc' />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div className='flex justify-between items-center mt-4'>
				<AddChargesButton onClick={addTieredPrice} label={t('plans.organisms.volumeTier.addTier')} />
			</div>
		</div>
	);
};

export default VolumeTieredPricingForm;
