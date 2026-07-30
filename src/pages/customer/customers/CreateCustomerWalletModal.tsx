import { Button, DatePicker, Input, Select } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { Wallet, WALLET_TYPE } from '@/models';
import WalletApi from '@/api/WalletApi';
import { getCurrencySymbol } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { FC, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreateWalletPayload } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import CurrencyPriceUnitSelector from '@/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector';
import { CurrencyPriceUnitSelection, isPriceUnitOption } from '@/types/common/PriceUnitSelector';
import { CirclePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMinCreditExpiryDate, toDateOnlyUtc } from '@/hooks/useMinCreditExpiryDate';

// Reusable AddButton component
const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
	<div className='w-fit'>
		<button
			onClick={onClick}
			className='px-3 py-1.5 h-8 cursor-pointer flex gap-2 items-center bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-md transition-colors'>
			<CirclePlus size={14} className='text-zinc-600' />
			<p className='text-[#18181B] text-sm font-medium'>{label}</p>
		</button>
	</div>
);

interface Props {
	customerId: string;
	onSuccess?: (walletId: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CreateCustomerWalletModal: FC<Props> = ({ customerId, onSuccess = () => {}, open, onOpenChange }) => {
	const { t } = useTranslation(['customers']);
	const [errors, setErrors] = useState({
		currency: '',
		conversion_rate: '',
		topup_conversion_rate: '',
		initial_credits_expiry_date_utc: '',
	});

	const { minExpiryDate } = useMinCreditExpiryDate(customerId);

	const [selectedPriceUnitOrCurrency, setSelectedPriceUnitOrCurrency] = useState<CurrencyPriceUnitSelection | null>(null);
	const [showTopupConversionRate, setShowTopupConversionRate] = useState(false);
	const [showFreeCredits, setShowFreeCredits] = useState(false);

	const [walletPayload, setwalletPayload] = useState<CreateWalletPayload>({
		currency: '',
		initial_credits_to_load: 0,
		conversion_rate: 1,
		topup_conversion_rate: undefined,
		price_unit: undefined,
		wallet_type: WALLET_TYPE.PRE_PAID,
		customer_id: customerId,
	});

	// Check if custom currency is selected
	const isPriceUnitSelected = !!(selectedPriceUnitOrCurrency && isPriceUnitOption(selectedPriceUnitOrCurrency.data));

	// Reset form helper
	const resetForm = useCallback(() => {
		setwalletPayload({
			currency: '',
			initial_credits_to_load: 0,
			conversion_rate: 1,
			topup_conversion_rate: undefined,
			price_unit: undefined,
			wallet_type: WALLET_TYPE.PRE_PAID,
			customer_id: customerId,
		});
		setSelectedPriceUnitOrCurrency(null);
		setShowTopupConversionRate(false);
		setShowFreeCredits(false);
		setErrors({
			currency: '',
			conversion_rate: '',
			topup_conversion_rate: '',
			initial_credits_expiry_date_utc: '',
		});
	}, [customerId]);

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			resetForm();
		}
	}, [open, resetForm]);

	// Handle custom currency/currency selection change
	const handlePriceUnitOrCurrencyChange = (selection: CurrencyPriceUnitSelection) => {
		setSelectedPriceUnitOrCurrency(selection);
		setErrors((prev) => ({ ...prev, currency: '' }));

		if (isPriceUnitOption(selection.data)) {
			const priceUnit = selection.data;
			setwalletPayload((prev) => ({
				...prev,
				currency: priceUnit.base_currency.toLowerCase(),
				conversion_rate: parseFloat(priceUnit.conversion_rate),
				price_unit: priceUnit.code,
			}));
		} else {
			const currency = selection.data;
			setwalletPayload((prev) => ({
				...prev,
				currency: currency.code.toLowerCase(),
				conversion_rate: 1,
				price_unit: undefined,
			}));
		}
	};

	const { mutateAsync: createWallet, isPending } = useMutation({
		mutationKey: ['createWallet', customerId],
		mutationFn: async () => {
			const payload: CreateWalletPayload = {
				customer_id: customerId,
				currency: walletPayload.currency,
				initial_credits_to_load: walletPayload.initial_credits_to_load,
				conversion_rate: walletPayload.conversion_rate || 1,
				...(walletPayload.topup_conversion_rate !== undefined && {
					topup_conversion_rate: walletPayload.topup_conversion_rate,
				}),
				initial_credits_expiry_date_utc: walletPayload.initial_credits_expiry_date_utc,
				...(walletPayload.price_unit && { price_unit: walletPayload.price_unit }),
				wallet_type: walletPayload.wallet_type,
			};

			return await WalletApi.createWallet(payload);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('customers:wallet.toast.createError'));
		},
		onSuccess: async (data: Wallet) => {
			toast.success(t('customers:wallet.toast.createSuccess'));
			onSuccess(data.id);
			await refetchQueries(['fetchWallets']);
			await refetchQueries(['fetchWalletBalances']);
			await refetchQueries(['fetchWalletsTransactions']);
		},
	});

	const handleCreateWallet = async () => {
		let expiryError = '';
		if (walletPayload.initial_credits_expiry_date_utc && minExpiryDate) {
			const expiryDateOnly = toDateOnlyUtc(walletPayload.initial_credits_expiry_date_utc);
			if (expiryDateOnly.getTime() < minExpiryDate.getTime()) {
				expiryError = t('customers:wallet.errors.expiryAfterSubscription');
			}
		}

		const newErrors = {
			currency: !walletPayload.currency ? t('customers:wallet.errors.currencyRequired') : '',
			conversion_rate: (walletPayload.conversion_rate ?? 0) <= 0 ? t('customers:wallet.errors.conversionRatePositive') : '',
			topup_conversion_rate:
				walletPayload.topup_conversion_rate !== undefined && walletPayload.topup_conversion_rate <= 0
					? t('customers:wallet.errors.topupConversionPositive')
					: '',
			initial_credits_expiry_date_utc: expiryError,
		};

		if (Object.values(newErrors).some((error) => error !== '')) {
			setErrors(newErrors);
			return;
		}

		const wallet = await createWallet();
		return wallet.id;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='bg-white sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{t('customers:wallet.createTitle')}</DialogTitle>
					<DialogDescription>{t('customers:wallet.description')}</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<Select
						value={walletPayload.wallet_type || WALLET_TYPE.PRE_PAID}
						options={[
							{
								label: t('customers:wallet.labelPrePaid'),
								value: WALLET_TYPE.PRE_PAID,
								description: t('customers:wallet.typePrepaidDesc'),
							},
							{
								label: t('customers:wallet.labelPostPaid'),
								value: WALLET_TYPE.POST_PAID,
								description: t('customers:wallet.typePostpaidDesc'),
							},
						]}
						label={t('customers:wallet.typeLabel')}
						onChange={(value) =>
							setwalletPayload({
								...walletPayload,
								wallet_type: value as WALLET_TYPE,
							})
						}
						placeholder={t('customers:wallet.typePlaceholder')}
					/>

					<CurrencyPriceUnitSelector
						value={selectedPriceUnitOrCurrency?.data.value || walletPayload.currency || walletPayload.price_unit}
						onChange={handlePriceUnitOrCurrencyChange}
						label={t('customers:wallet.currencyLabel')}
						error={errors.currency}
						description={isPriceUnitSelected ? t('customers:wallet.customCurrencyHint') : t('customers:wallet.selectCurrencyHint')}
					/>

					{/* Conversion Rate - only show for FIAT currencies */}
					{!isPriceUnitSelected && (
						<div className='flex flex-col items-start gap-2 w-full'>
							<label className={cn('block text-sm font-medium', 'text-zinc-950')}>{t('customers:wallet.conversionRate')}</label>
							<div className='flex items-center gap-2 w-full'>
								<Input className='w-full' value={'1'} disabled suffix={t('customers:wallet.suffixCredit')} />
								<span>=</span>
								<Input
									className='w-full'
									variant='number'
									suffix={getCurrencySymbol(walletPayload.currency || '')}
									value={walletPayload.conversion_rate}
									onChange={(e) => {
										setwalletPayload({ ...walletPayload, conversion_rate: e as unknown as number });
									}}
								/>
							</div>
							{errors.conversion_rate && <p className='text-sm text-destructive'>{errors.conversion_rate}</p>}
						</div>
					)}

					{/* Top-up Conversion Rate Input - conditionally rendered above */}
					{showTopupConversionRate && (
						<div className='flex flex-col items-start gap-2 w-full'>
							<label className={cn('block text-sm font-medium', 'text-zinc-950')}>{t('customers:wallet.topupConversionRate')}</label>
							<div className='flex items-center gap-2 w-full'>
								<Input className='w-full' value={'1'} disabled suffix={t('customers:wallet.suffixCredit')} />
								<span>=</span>
								<Input
									className='w-full'
									variant='number'
									suffix={getCurrencySymbol(walletPayload.currency || '')}
									value={walletPayload.topup_conversion_rate ?? walletPayload.conversion_rate}
									onChange={(e) => {
										setwalletPayload({
											...walletPayload,
											topup_conversion_rate: e as unknown as number,
										});
									}}
								/>
							</div>
							<p className='text-sm text-muted-foreground'>{t('customers:wallet.topupConversionDescription')}</p>
							{errors.topup_conversion_rate && <p className='text-sm text-destructive'>{errors.topup_conversion_rate}</p>}
						</div>
					)}

					{/* Free Credits Input - conditionally rendered above */}
					{showFreeCredits && (
						<div className='flex items-start gap-4 w-full'>
							<div className='flex-1'>
								<Input
									label={t('customers:wallet.freeCredits')}
									suffix={t('customers:wallet.creditsPluralSuffix')}
									variant='formatted-number'
									placeholder={t('customers:wallet.freeCreditsPlaceholder')}
									value={walletPayload.initial_credits_to_load}
									onChange={(e) => {
										setwalletPayload({ ...walletPayload, initial_credits_to_load: e as unknown as number });
									}}
								/>
							</div>
							<div className='flex-1'>
								<DatePicker
									labelClassName='text-foreground'
									label={t('customers:wallet.freeCreditsExpiry')}
									minDate={
										minExpiryDate
											? new Date(minExpiryDate.getUTCFullYear(), minExpiryDate.getUTCMonth(), minExpiryDate.getUTCDate())
											: (() => {
													const startOfToday = new Date();
													startOfToday.setHours(0, 0, 0, 0);
													return startOfToday;
												})()
									}
									popoverTriggerClassName='w-full'
									className='w-full'
									placeholder={t('customers:wallet.expiryPlaceholder')}
									date={walletPayload.initial_credits_expiry_date_utc ? new Date(walletPayload.initial_credits_expiry_date_utc) : undefined}
									setDate={(e) => {
										setwalletPayload({
											...walletPayload,
											initial_credits_expiry_date_utc: e
												? new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), 0, 0, 0, 0)).toISOString()
												: undefined,
										});
										if (errors.initial_credits_expiry_date_utc) setErrors((prev) => ({ ...prev, initial_credits_expiry_date_utc: '' }));
									}}
								/>
								{errors.initial_credits_expiry_date_utc && (
									<p className='text-sm text-destructive mt-1'>{errors.initial_credits_expiry_date_utc}</p>
								)}
							</div>
						</div>
					)}

					{/* Add Buttons - always shown at bottom */}
					<div className='flex gap-2 pt-2'>
						{!showTopupConversionRate && (
							<AddButton onClick={() => setShowTopupConversionRate(true)} label={t('customers:wallet.addTopupRate')} />
						)}
						{!showFreeCredits && <AddButton onClick={() => setShowFreeCredits(true)} label={t('customers:wallet.addFreeCredits')} />}
					</div>

					<div className='w-full justify-end flex pt-2'>
						<Button isLoading={isPending} disabled={isPending} onClick={handleCreateWallet}>
							{t('customers:wallet.saveWallet')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateCustomerWalletModal;
