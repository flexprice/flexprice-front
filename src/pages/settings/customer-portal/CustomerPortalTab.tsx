import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Card, Loader } from '@/components/atoms';
import { SettingsCardHeader, SettingsToggleRow } from '@/components/molecules';
import type { PortalConfig } from '@/types/dto/PortalConfig';
import SettingsFormActions from '../SettingsFormActions';
import { applyPortalVisibility, getPortalVisibility, type PortalVisibility } from './portalVisibility';
import { useCustomerPortalConfig } from './useCustomerPortalConfig';

const CustomerPortalTab = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { config, isLoading, updateConfig } = useCustomerPortalConfig();
	const [draftConfig, setDraftConfig] = useState<PortalConfig>(config);

	useEffect(() => {
		setDraftConfig(config);
	}, [config]);

	const visibility = useMemo(() => getPortalVisibility(draftConfig), [draftConfig]);

	const handleToggle = (key: keyof PortalVisibility, checked: boolean) => {
		setDraftConfig((prev) => applyPortalVisibility(prev, { ...getPortalVisibility(prev), [key]: checked }));
	};

	const handleReset = () => {
		setDraftConfig(config);
	};

	const handleSave = () => {
		updateConfig.mutate(draftConfig, {
			onSuccess: () => toast.success(t('customerPortal.portal.saveSuccess')),
			onError: () => toast.error(t('customerPortal.portal.saveError')),
		});
	};

	const portalTitle = t('customerPortal.portal.title');

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<SettingsCardHeader
				title={portalTitle}
				titleClassName='text-lg font-medium text-content-zinc-strong'
				infoDescription={t('customerPortal.portal.description')}
				infoAriaLabel={t('info.ariaLabel', { field: portalTitle })}
			/>
			{isLoading ? (
				<Loader />
			) : (
				<>
					<div className='mt-4 divide-y divide-line'>
						<SettingsToggleRow
							label={t('customerPortal.portal.showInvoices')}
							description={t('customerPortal.portal.showInvoicesDescription')}
							infoAriaLabel={t('info.ariaLabel', { field: t('customerPortal.portal.showInvoices') })}
							checked={visibility.showInvoices}
							disabled={updateConfig.isPending}
							onCheckedChange={(checked) => handleToggle('showInvoices', checked)}
						/>
						<SettingsToggleRow
							label={t('customerPortal.portal.showWalletBalance')}
							description={t('customerPortal.portal.showWalletBalanceDescription')}
							infoAriaLabel={t('info.ariaLabel', { field: t('customerPortal.portal.showWalletBalance') })}
							checked={visibility.showWalletBalance}
							disabled={updateConfig.isPending}
							onCheckedChange={(checked) => handleToggle('showWalletBalance', checked)}
						/>
						<SettingsToggleRow
							label={t('customerPortal.portal.showUsage')}
							description={t('customerPortal.portal.showUsageDescription')}
							infoAriaLabel={t('info.ariaLabel', { field: t('customerPortal.portal.showUsage') })}
							checked={visibility.showUsage}
							disabled={updateConfig.isPending}
							onCheckedChange={(checked) => handleToggle('showUsage', checked)}
						/>
						<SettingsToggleRow
							label={t('customerPortal.portal.showSubscriptions')}
							description={t('customerPortal.portal.showSubscriptionsDescription')}
							infoAriaLabel={t('info.ariaLabel', { field: t('customerPortal.portal.showSubscriptions') })}
							checked={visibility.showSubscriptions}
							disabled={updateConfig.isPending}
							onCheckedChange={(checked) => handleToggle('showSubscriptions', checked)}
						/>
					</div>
					<SettingsFormActions onReset={handleReset} onSave={handleSave} isSaving={updateConfig.isPending} disabled={isLoading} />
				</>
			)}
		</Card>
	);
};

export default CustomerPortalTab;
