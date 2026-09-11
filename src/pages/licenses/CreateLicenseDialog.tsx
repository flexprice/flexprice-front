import { FC, useState, useMemo, useEffect } from 'react';
import { Button, Input, Select, CopyIdButton, Loader } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import LicenseApi from '@/api/LicenseApi';
import { LICENSE_TIER } from '@/models/License';
import { useTranslation } from 'react-i18next';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const ENV_SANDBOX = 'sandbox';
const ENV_PRODUCTION = 'production';

const CreateLicenseDialog: FC<Props> = ({ open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
	const [tenantId, setTenantId] = useState('');
	const [customer, setCustomer] = useState('');
	const [tier, setTier] = useState<LICENSE_TIER>(LICENSE_TIER.COMMUNITY);
	const [env, setEnv] = useState(ENV_SANDBOX);
	const [features, setFeatures] = useState('');
	const [ttlDays, setTtlDays] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [issuedKey, setIssuedKey] = useState<string | null>(null);

	// Only known once the licensing token is fetched/decoded — gates full form vs single button.
	useEffect(() => {
		if (!open) return;
		LicenseApi.isAdmin()
			.then(setIsAdmin)
			.catch(() => setIsAdmin(false));
	}, [open]);

	const tierOptions = useMemo(
		() => [
			{ value: LICENSE_TIER.COMMUNITY, label: t('catalog:licenses.createDialog.tierCommunity') },
			{ value: LICENSE_TIER.ENTERPRISE, label: t('catalog:licenses.createDialog.tierEnterprise') },
		],
		[t],
	);

	const envOptions = useMemo(
		() => [
			{ value: ENV_SANDBOX, label: t('catalog:licenses.createDialog.envSandbox') },
			{ value: ENV_PRODUCTION, label: t('catalog:licenses.createDialog.envProduction') },
		],
		[t],
	);

	const reset = () => {
		setTenantId('');
		setCustomer('');
		setTier(LICENSE_TIER.COMMUNITY);
		setEnv(ENV_SANDBOX);
		setFeatures('');
		setTtlDays('');
		setIssuedKey(null);
	};

	const handleClose = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	// Non-admin: no inputs at all — backend forces env/ttl/features for community.
	const handleGenerate = async () => {
		setIsSubmitting(true);
		try {
			const res = await LicenseApi.mintLicense({ tier: LICENSE_TIER.COMMUNITY });
			setIssuedKey(res.license_key);
			onSuccess();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Mint failed';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const res = await LicenseApi.mintLicense({
				tier,
				env,
				tenant_id: tenantId.trim() || undefined,
				customer: customer.trim() || undefined,
				features: features
					? features
							.split(',')
							.map((f) => f.trim())
							.filter(Boolean)
					: undefined,
				// Backend only honors TTL for enterprise; community TTL is forced server-side.
				ttl_days: tier === LICENSE_TIER.ENTERPRISE && ttlDays ? Number(ttlDays) : undefined,
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
				) : isAdmin === null ? (
					<div className='flex justify-center py-6'>
						<Loader />
					</div>
				) : isAdmin ? (
					<div className='space-y-4 py-2'>
						<Input
							label={t('catalog:licenses.createDialog.tenantId')}
							value={tenantId}
							onChange={setTenantId}
							placeholder={t('catalog:licenses.createDialog.tenantIdPlaceholder')}
							description={t('catalog:licenses.createDialog.tenantIdHint')}
						/>
						<Input
							label={t('catalog:licenses.createDialog.customer')}
							value={customer}
							onChange={setCustomer}
							placeholder={t('catalog:licenses.createDialog.customerPlaceholder')}
						/>
						<Select
							label={t('catalog:licenses.createDialog.tier')}
							options={tierOptions}
							value={tier}
							onChange={(v) => setTier(v as LICENSE_TIER)}
						/>
						<Select label={t('catalog:licenses.createDialog.environment')} options={envOptions} value={env} onChange={setEnv} />
						<Input
							label={t('catalog:licenses.createDialog.features')}
							value={features}
							onChange={setFeatures}
							placeholder={t('catalog:licenses.createDialog.featuresPlaceholder')}
						/>
						{tier === LICENSE_TIER.ENTERPRISE && (
							<Input
								label={t('catalog:licenses.createDialog.ttl')}
								type='number'
								value={ttlDays}
								onChange={setTtlDays}
								placeholder={t('catalog:licenses.createDialog.ttlPlaceholder')}
							/>
						)}
					</div>
				) : (
					<p className='text-sm text-content-zinc-secondary py-2'>{t('catalog:licenses.createDialog.generateExplainer')}</p>
				)}

				<DialogFooter>
					{issuedKey ? (
						<Button className='flex-1' onClick={() => handleClose(false)}>
							{t('catalog:licenses.createDialog.done')}
						</Button>
					) : isAdmin === false ? (
						<>
							<Button variant='outline' onClick={() => handleClose(false)} className='flex-1'>
								{t('common:actions.cancel')}
							</Button>
							<Button onClick={handleGenerate} isLoading={isSubmitting} className='flex-1'>
								{t('catalog:licenses.createDialog.generate')}
							</Button>
						</>
					) : isAdmin ? (
						<>
							<Button variant='outline' onClick={() => handleClose(false)} className='flex-1'>
								{t('common:actions.cancel')}
							</Button>
							<Button onClick={handleSubmit} isLoading={isSubmitting} className='flex-1'>
								{t('catalog:licenses.createDialog.create')}
							</Button>
						</>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateLicenseDialog;
