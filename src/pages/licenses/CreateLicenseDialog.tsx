import { FC, useState, useMemo } from 'react';
import { Button, Input, Select, CopyIdButton } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import LicenseApi from '@/api/LicenseApi';
import { LICENSE_TIER } from '@/models/License';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useTranslation } from 'react-i18next';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const CreateLicenseDialog: FC<Props> = ({ open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const { isProduction } = useEnvironment();
	const [tier, setTier] = useState<LICENSE_TIER>(LICENSE_TIER.COMMUNITY);
	const [customer, setCustomer] = useState('');
	const [features, setFeatures] = useState('');
	const [ttlDays, setTtlDays] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [issuedKey, setIssuedKey] = useState<string | null>(null);

	const tierOptions = useMemo(
		() => [
			{ value: LICENSE_TIER.COMMUNITY, label: t('catalog:licenses.createDialog.tierCommunity') },
			// Backend enforces admin-only minting; shown here regardless, a non-admin gets a 403.
			{ value: LICENSE_TIER.ENTERPRISE, label: t('catalog:licenses.createDialog.tierEnterprise') },
		],
		[t],
	);

	const reset = () => {
		setTier(LICENSE_TIER.COMMUNITY);
		setCustomer('');
		setFeatures('');
		setTtlDays('');
		setIssuedKey(null);
	};

	const handleClose = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const res = await LicenseApi.mintLicense({
				tier,
				env: isProduction ? 'production' : 'sandbox',
				customer: customer || undefined,
				features: features
					? features
							.split(',')
							.map((f) => f.trim())
							.filter(Boolean)
					: undefined,
				ttl_days: ttlDays ? Number(ttlDays) : undefined,
			});
			setIssuedKey(res.license_key);
			onSuccess();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Mint failed';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='w-full max-w-md bg-surface'>
				<DialogHeader>
					<DialogTitle>
						{issuedKey ? t('catalog:licenses.createDialog.createdTitle') : t('catalog:licenses.createDialog.title')}
					</DialogTitle>
				</DialogHeader>

				{issuedKey ? (
					<div className='space-y-3 py-2'>
						<div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
							{t('catalog:licenses.createDialog.keySavedWarning')}
						</div>
						<div className='flex items-center gap-2 rounded-md border border-line-strong bg-muted/40 p-2'>
							<code className='flex-1 break-all font-mono text-xs'>{issuedKey}</code>
							<CopyIdButton id={issuedKey} toastMessage={t('catalog:licenses.createDialog.copyToastMessage')} />
						</div>
					</div>
				) : (
					<div className='space-y-4 py-2'>
						<Select
							label={t('catalog:licenses.createDialog.tier')}
							options={tierOptions}
							value={tier}
							onChange={(v) => setTier(v as LICENSE_TIER)}
						/>
						<Input
							label={t('catalog:licenses.createDialog.customer')}
							value={customer}
							onChange={setCustomer}
							placeholder={t('catalog:licenses.createDialog.customerPlaceholder')}
						/>
						<Input
							label={t('catalog:licenses.createDialog.features')}
							value={features}
							onChange={setFeatures}
							placeholder={t('catalog:licenses.createDialog.featuresPlaceholder')}
						/>
						<Input
							label={t('catalog:licenses.createDialog.ttl')}
							type='number'
							value={ttlDays}
							onChange={setTtlDays}
							placeholder={t('catalog:licenses.createDialog.ttlPlaceholder')}
						/>
					</div>
				)}

				<DialogFooter>
					{issuedKey ? (
						<Button className='flex-1' onClick={() => handleClose(false)}>
							{t('catalog:licenses.createDialog.done')}
						</Button>
					) : (
						<>
							<Button variant='outline' onClick={() => handleClose(false)} className='flex-1'>
								{t('common:actions.cancel')}
							</Button>
							<Button onClick={handleSubmit} isLoading={isSubmitting} className='flex-1'>
								{t('catalog:licenses.createDialog.create')}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateLicenseDialog;
