import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLinkIcon } from 'lucide-react';
import { Card, CardHeader, FieldWithInfo, Loader, Select } from '@/components/atoms';
import { SettingsToggleRow } from '@/components/molecules';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE } from '@/models';
import { TAX_PROVIDERS, usesExternalTaxEngine, type TaxConfig, type TaxProvider } from '@/types/dto/TaxSettings';
import { useTaxConfiguration } from './useTaxConfiguration';
import SettingsFormActions from '../SettingsFormActions';
import { DOCS_LINKS } from '@/constants/guides';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

/** The provider a freshly enabled config starts on — the only external engine the backend supports. */
const DEFAULT_EXTERNAL_PROVIDER: TaxProvider = 'stripe';

const TaxConfigurationSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { configuration, savedConfiguration, isLoading, updateConfiguration } = useTaxConfiguration();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Backed by SettingsApi (a generic settings key), whose PUT/DELETE the backend restricts
	// to Super Admin regardless of setting:write — same gating as the sibling sections.
	const canWriteSetting = can('setting', 'write') && isSuperAdmin;
	const [draft, setDraft] = useState<TaxConfig>(configuration);

	useEffect(() => {
		setDraft(configuration);
	}, [configuration]);

	// Only asked for once an external engine is actually selected: the docs are
	// explicit that a named engine without a connection makes tax calculation
	// fail outright, with no fallback to native rates — so this is the one thing
	// worth checking before someone saves.
	const needsConnectionCheck = usesExternalTaxEngine(draft);
	const { data: stripeConnections, isLoading: isCheckingConnection } = useQuery({
		queryKey: ['connections', CONNECTION_PROVIDER_TYPE.STRIPE],
		queryFn: () => ConnectionApi.List({ provider_type: CONNECTION_PROVIDER_TYPE.STRIPE }),
		enabled: needsConnectionCheck && draft.provider === 'stripe',
	});
	const isMissingConnection =
		needsConnectionCheck && draft.provider === 'stripe' && !isCheckingConnection && (stripeConnections?.connections?.length ?? 0) === 0;

	const providerOptions = TAX_PROVIDERS.map((provider) => ({
		value: provider,
		label: t(`billing.taxConfiguration.providers.${provider}`),
	}));

	const handleReset = () => setDraft(savedConfiguration);

	const handleSave = () => {
		updateConfiguration.mutate(draft, {
			onSuccess: () => toast.success(t('billing.taxConfiguration.saveSuccess')),
			onError: (error: Error) => toast.error(error.message || t('billing.taxConfiguration.saveError')),
		});
	};

	// Turning the engine on with no provider chosen would be saved as enabled with
	// the native engine, which reads as "on" but changes nothing. Seed the only
	// external engine there is instead, so the toggle means what it says.
	const handleToggle = (enabled: boolean) =>
		setDraft((current) => ({
			enabled,
			provider: enabled && (current.provider === '' || current.provider === 'flexprice') ? DEFAULT_EXTERNAL_PROVIDER : current.provider,
		}));

	const enabledLabel = t('billing.taxConfiguration.fields.enabled');
	const providerLabel = t('billing.taxConfiguration.fields.provider');

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<CardHeader
				title={t('billing.taxConfiguration.title')}
				titleClassName='text-lg font-medium text-content-zinc-strong'
				cta={
					<a
						href={DOCS_LINKS.SETTINGS_TAX}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex h-5 items-center gap-1 text-xs text-content-slate-muted transition-colors hover:text-content-slate-secondary'
						title={t('billing.taxConfiguration.actions.docsTitle')}>
						{t('billing.taxConfiguration.actions.docs')}
						<ExternalLinkIcon className='size-3.5' />
					</a>
				}
			/>
			{isLoading ? (
				<div className='flex min-h-[160px] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<>
					<p className='mb-4 text-sm text-content-zinc-tertiary'>{t('billing.taxConfiguration.description')}</p>

					<SettingsToggleRow
						label={enabledLabel}
						description={t('billing.taxConfiguration.hints.enabled')}
						infoAriaLabel={t('info.ariaLabel', { field: enabledLabel })}
						checked={draft.enabled}
						onCheckedChange={handleToggle}
						disabled={!canWriteSetting || updateConfiguration.isPending}
					/>

					{draft.enabled ? (
						<div className='mt-4'>
							<FieldWithInfo
								label={providerLabel}
								description={t('billing.taxConfiguration.hints.provider')}
								infoAriaLabel={t('info.ariaLabel', { field: providerLabel })}
								disabled={!canWriteSetting || updateConfiguration.isPending}>
								<Select
									value={draft.provider}
									options={providerOptions}
									onChange={(value) => setDraft((current) => ({ ...current, provider: value as TaxProvider }))}
									disabled={!canWriteSetting || updateConfiguration.isPending}
								/>
							</FieldWithInfo>
						</div>
					) : null}

					{/* Native engine named while enabled: saved as on, but nothing changes. */}
					{draft.enabled && !usesExternalTaxEngine(draft) ? (
						<div className='mt-4 flex items-start gap-2 rounded-lg border border-line bg-surface-faint px-3 py-2.5'>
							<AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-content-zinc-subtle' />
							<p className='text-xs text-content-zinc-tertiary'>{t('billing.taxConfiguration.warnings.nativeSelected')}</p>
						</div>
					) : null}

					{isMissingConnection ? (
						<div className='mt-4 flex items-start gap-2 rounded-lg border border-warning-muted bg-warning-muted-strong px-3 py-2.5'>
							<AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-warning-bright' />
							<p className='text-xs text-content-zinc-secondary'>{t('billing.taxConfiguration.warnings.missingConnection')}</p>
						</div>
					) : null}

					{usesExternalTaxEngine(draft) ? (
						<div className='mt-4 flex items-start gap-2 rounded-lg border border-line bg-surface-faint px-3 py-2.5'>
							<AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-content-zinc-subtle' />
							<p className='text-xs text-content-zinc-tertiary'>{t('billing.taxConfiguration.warnings.overridesNativeRates')}</p>
						</div>
					) : null}

					<SettingsFormActions
						onReset={handleReset}
						onSave={handleSave}
						isSaving={updateConfiguration.isPending}
						disabled={!canWriteSetting}
						disabledReason={!canWriteSetting ? t('billing.taxConfiguration.actions.superAdminOnly') : undefined}
					/>
				</>
			)}
		</Card>
	);
};

export default TaxConfigurationSection;
