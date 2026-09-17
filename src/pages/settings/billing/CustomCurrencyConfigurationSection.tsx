import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ExternalLinkIcon, Trash2 } from 'lucide-react';
import { AddButton, Button, Card, CardHeader, FieldWithInfo, Input, Loader, Select } from '@/components/atoms';
import { currencyOptions } from '@/constants/constants';
import { DOCS_LINKS } from '@/constants/guides';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { getCustomCurrencyErrorKey, type CustomCurrencyDraft, type CustomCurrencyDraftRow } from '@/types/dto/CustomCurrency';
import { useCustomCurrencyConfiguration } from './useCustomCurrencyConfiguration';
import SettingsFormActions from '../SettingsFormActions';

const newRow = (fiatCurrencies: string[]): CustomCurrencyDraftRow => ({
	id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
	code: '',
	name: '',
	symbol: '',
	factors: fiatCurrencies.reduce<Record<string, string>>((factors, fiat) => {
		factors[fiat] = '';
		return factors;
	}, {}),
});

// The form always shows a currency to fill in. A row left untouched is dropped on save.
const withStarterRow = (draft: CustomCurrencyDraft): CustomCurrencyDraft =>
	draft.currencies.length > 0 ? draft : { ...draft, currencies: [newRow(draft.fiatCurrencies)] };

const CustomCurrencyConfigurationSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { savedConfiguration, isLoading, isError, updateConfiguration } = useCustomCurrencyConfiguration();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Same gate as the sibling sections: the generic settings endpoints are Super Admin only.
	const canWriteSetting = can('setting', 'write') && isSuperAdmin;

	const [draft, setDraft] = useState<CustomCurrencyDraft>(() => withStarterRow(savedConfiguration));

	useEffect(() => {
		setDraft(withStarterRow(savedConfiguration));
	}, [savedConfiguration]);

	const fiatOptions = useMemo(() => currencyOptions.map((option) => ({ label: option.label, value: option.value.toLowerCase() })), []);

	const addableFiatOptions = useMemo(
		() => fiatOptions.filter((option) => !draft.fiatCurrencies.includes(option.value)),
		[fiatOptions, draft.fiatCurrencies],
	);

	// A failed load leaves an empty draft, which would otherwise be saved over a
	// configuration that is still there.
	const errorKey = isError ? 'loadFailed' : getCustomCurrencyErrorKey(draft);
	const isSaving = updateConfiguration.isPending;
	const isDisabled = isSaving || isError || !canWriteSetting;

	const settlementLabel = t('billing.customCurrencyConfiguration.fields.settlementCurrency');
	const conversionLabel = t('billing.customCurrencyConfiguration.fields.conversionCurrencies');
	const codeLabel = t('billing.customCurrencyConfiguration.fields.code');
	const nameLabel = t('billing.customCurrencyConfiguration.fields.name');
	const symbolLabel = t('billing.customCurrencyConfiguration.fields.symbol');

	const setSettlementCurrency = (value: string) => {
		setDraft((prev) => {
			const fiatCurrencies = [value, ...prev.fiatCurrencies.filter((fiat) => fiat !== value && fiat !== prev.defaultFiatCurrency)];
			return {
				defaultFiatCurrency: value,
				fiatCurrencies,
				currencies: prev.currencies.map((row) => ({
					...row,
					factors: fiatCurrencies.reduce<Record<string, string>>((factors, fiat) => {
						factors[fiat] = row.factors[fiat] ?? '';
						return factors;
					}, {}),
				})),
			};
		});
	};

	const addFiat = (value: string) => {
		setDraft((prev) => ({
			...prev,
			fiatCurrencies: [...prev.fiatCurrencies, value],
			currencies: prev.currencies.map((row) => ({ ...row, factors: { ...row.factors, [value]: '' } })),
		}));
	};

	const removeFiat = (value: string) => {
		setDraft((prev) => ({
			...prev,
			fiatCurrencies: prev.fiatCurrencies.filter((fiat) => fiat !== value),
			currencies: prev.currencies.map((row) => {
				const factors = { ...row.factors };
				delete factors[value];
				return { ...row, factors };
			}),
		}));
	};

	const updateRow = (id: string, patch: Partial<CustomCurrencyDraftRow>) => {
		setDraft((prev) => ({
			...prev,
			currencies: prev.currencies.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		}));
	};

	const updateFactor = (id: string, fiat: string, rate: string) => {
		setDraft((prev) => ({
			...prev,
			currencies: prev.currencies.map((row) => (row.id === id ? { ...row, factors: { ...row.factors, [fiat]: rate } } : row)),
		}));
	};

	const handleSave = () => {
		updateConfiguration.mutate(draft, {
			onSuccess: () => toast.success(t('billing.customCurrencyConfiguration.saveSuccess')),
			onError: () => toast.error(t('billing.customCurrencyConfiguration.saveError')),
		});
	};

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<CardHeader
				title={t('billing.customCurrencyConfiguration.title')}
				titleClassName='text-lg font-medium text-content-zinc-strong'
				cta={
					<a
						href={DOCS_LINKS.SETTINGS_CUSTOM_CURRENCY}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex h-5 items-center gap-1 text-xs text-content-slate-muted transition-colors hover:text-content-slate-secondary'
						title={t('billing.customCurrencyConfiguration.actions.docsTitle')}>
						{t('billing.customCurrencyConfiguration.actions.docs')}
						<ExternalLinkIcon className='size-3.5' />
					</a>
				}
			/>
			{isLoading ? (
				<div className='flex min-h-[200px] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<>
					<div className='grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-2'>
						<FieldWithInfo
							label={settlementLabel}
							description={t('billing.customCurrencyConfiguration.hints.settlementCurrency')}
							infoAriaLabel={t('info.ariaLabel', { field: settlementLabel })}
							disabled={isDisabled}>
							<Select
								options={fiatOptions}
								value={draft.defaultFiatCurrency}
								onChange={setSettlementCurrency}
								disabled={isDisabled}
								placeholder={t('billing.customCurrencyConfiguration.fields.settlementPlaceholder')}
								ariaLabel={settlementLabel}
							/>
						</FieldWithInfo>

						{/* Nothing to convert into until a settlement currency exists, so the label would head an empty box. */}
						{draft.defaultFiatCurrency ? (
							<FieldWithInfo
								label={conversionLabel}
								description={
									<>
										{t('billing.customCurrencyConfiguration.hints.conversionCurrencies')}
										<strong className='mt-1.5 block font-semibold'>
											{t('billing.customCurrencyConfiguration.hints.conversionFormula')}
										</strong>
									</>
								}
								infoAriaLabel={t('info.ariaLabel', { field: conversionLabel })}
								disabled={isDisabled}>
								<div className='flex flex-wrap items-center gap-2'>
									{draft.fiatCurrencies.map((fiat) => (
										<span key={fiat} className='inline-flex h-8 items-center gap-2 rounded-md border border-line px-3 text-sm uppercase'>
											{fiat}
											{fiat === draft.defaultFiatCurrency ? (
												<span className='text-xs normal-case text-content-zinc-subtle'>
													{t('billing.customCurrencyConfiguration.fields.defaultBadge')}
												</span>
											) : (
												<button
													type='button'
													onClick={() => removeFiat(fiat)}
													disabled={isDisabled}
													aria-label={t('billing.customCurrencyConfiguration.actions.removeConversionCurrency', {
														currency: fiat.toUpperCase(),
													})}
													className='text-content-zinc-subtle hover:text-content-zinc-bold disabled:opacity-50'>
													<Trash2 className='h-3.5 w-3.5' />
												</button>
											)}
										</span>
									))}
									{addableFiatOptions.length > 0 ? (
										<Select
											options={addableFiatOptions}
											value=''
											onChange={addFiat}
											disabled={isDisabled}
											placeholder={t('billing.customCurrencyConfiguration.actions.addConversionCurrency')}
											className='w-40'
											ariaLabel={t('billing.customCurrencyConfiguration.actions.addConversionCurrency')}
										/>
									) : null}
								</div>
							</FieldWithInfo>
						) : null}
					</div>

					<hr className='my-6 border-line' />

					<div className='flex flex-col gap-4'>
						{draft.currencies.map((row) => (
							<div key={row.id} className='relative rounded-lg border border-line p-4 pe-16'>
								<div className='grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-3'>
									<FieldWithInfo
										label={codeLabel}
										description={t('billing.customCurrencyConfiguration.hints.code')}
										infoAriaLabel={t('info.ariaLabel', { field: codeLabel })}
										disabled={isDisabled}>
										<Input
											value={row.code}
											onChange={(value) => updateRow(row.id, { code: value.toLowerCase().slice(0, 3) })}
											placeholder={t('billing.customCurrencyConfiguration.fields.codePlaceholder')}
											disabled={isDisabled}
										/>
									</FieldWithInfo>
									<Input
										label={nameLabel}
										value={row.name}
										onChange={(value) => updateRow(row.id, { name: value })}
										placeholder={t('billing.customCurrencyConfiguration.fields.namePlaceholder')}
										disabled={isDisabled}
									/>
									<Input
										label={symbolLabel}
										value={row.symbol}
										onChange={(value) => updateRow(row.id, { symbol: value })}
										placeholder={t('billing.customCurrencyConfiguration.fields.symbolPlaceholder')}
										disabled={isDisabled}
									/>
								</div>

								{draft.fiatCurrencies.length > 0 ? (
									<div className='mt-5 grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-3'>
										{draft.fiatCurrencies.map((fiat) => (
											<Input
												key={fiat}
												label={t('billing.customCurrencyConfiguration.fields.rate', { fiat: fiat.toUpperCase() })}
												value={row.factors[fiat] ?? ''}
												onChange={(value) => updateFactor(row.id, fiat, value)}
												placeholder={t('billing.customCurrencyConfiguration.fields.ratePlaceholder')}
												disabled={isDisabled}
											/>
										))}
									</div>
								) : null}

								<Button
									variant='outline'
									size='icon'
									className='absolute end-4 top-10'
									disabled={isDisabled || draft.currencies.length === 1}
									aria-label={t('billing.customCurrencyConfiguration.actions.removeCurrency', {
										currency: row.code.toUpperCase() || codeLabel,
									})}
									onClick={() => setDraft((prev) => ({ ...prev, currencies: prev.currencies.filter((item) => item.id !== row.id) }))}>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						))}

						<div>
							<AddButton
								variant='outline'
								disabled={isDisabled || !draft.defaultFiatCurrency}
								label={t('billing.customCurrencyConfiguration.actions.addCurrency')}
								onClick={() => setDraft((prev) => ({ ...prev, currencies: [...prev.currencies, newRow(prev.fiatCurrencies)] }))}
							/>
						</div>
					</div>

					{errorKey ? <p className='mt-4 text-sm text-destructive'>{t(`billing.customCurrencyConfiguration.errors.${errorKey}`)}</p> : null}

					<SettingsFormActions
						onSave={handleSave}
						isSaving={isSaving}
						disabled={isLoading || isError || !canWriteSetting || !!errorKey}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
					/>
				</>
			)}
		</Card>
	);
};

export default CustomCurrencyConfigurationSection;
