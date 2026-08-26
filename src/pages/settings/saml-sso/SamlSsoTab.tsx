import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Input, Loader, Select, Textarea } from '@/components/atoms';
import { SettingsCardHeader, SettingsToggleRow } from '@/components/molecules';
import { useUser as useUserContext } from '@/hooks/UserContext';
import { config as appConfig } from '@/config/config';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { SAML_DEFAULT_ROLES, isSameSamlConfig, isValidIdpSsoUrl, type SamlConfig, type SamlDefaultRole } from '@/types/dto/SamlConfig';
import SettingsFormActions from '../SettingsFormActions';
import { SamlDisabledError, useSamlConfig } from './useSamlConfig';

/** SP metadata URL the customer pastes into their IdP. Built from the API base URL and tenant id —
 * onboarding must happen in this order: create the app in the IdP with this URL first, THEN fill
 * in the idp_* fields below with values the IdP hands back. */
function buildMetadataUrl(tenantId: string): string {
	const base = appConfig.api.baseUrl.replace(/\/$/, '');
	return `${base}/auth/saml/${encodeURIComponent(tenantId)}/metadata`;
}

/** The link an administrator hands to their users to sign in with SSO.
 *
 * Points at this dashboard rather than at the API's own /login endpoint: SSO is per tenant, so the
 * page needs to be told which tenant it is signing into, and finishing on the dashboard is what a
 * user expects. Until email-domain discovery exists there is no way to derive the tenant from a
 * typed email, so the tenant travels in the link. */
function buildSsoLoginUrl(tenantId: string): string {
	return `${window.location.origin}/login?sso=${encodeURIComponent(tenantId)}`;
}

interface FormErrors {
	idp_entity_id?: string;
	idp_sso_url?: string;
	idp_certificate?: string;
	default_role?: string;
}

function validateDraft(draft: SamlConfig, t: (key: string) => string): FormErrors {
	if (!draft.enabled) return {};

	const errors: FormErrors = {};
	if (!draft.idp_entity_id.trim()) errors.idp_entity_id = t('saml.config.validation.idpEntityIdRequired');
	if (!draft.idp_sso_url.trim()) {
		errors.idp_sso_url = t('saml.config.validation.idpSsoUrlRequired');
	} else if (!isValidIdpSsoUrl(draft.idp_sso_url.trim())) {
		errors.idp_sso_url = t('saml.config.validation.idpSsoUrlInvalid');
	}
	if (!draft.idp_certificate.trim()) errors.idp_certificate = t('saml.config.validation.idpCertificateRequired');
	if (!draft.default_role) errors.default_role = t('saml.config.validation.defaultRoleRequired');

	return errors;
}

const ROLE_LABEL_KEYS: Record<SamlDefaultRole, string> = {
	all_reader: 'saml.config.roleAllReader',
	all_writer: 'saml.config.roleAllWriter',
};

const SamlSsoTab = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { user } = useUserContext();
	const { config, isLoading, isForbidden, updateConfig, refetch } = useSamlConfig();
	const [draft, setDraft] = useState<SamlConfig>(config);
	const [errors, setErrors] = useState<FormErrors>({});

	useEffect(() => {
		setDraft(config);
	}, [config]);

	const tenantId: string | undefined = user?.tenant?.id;
	const metadataUrl = useMemo(() => (tenantId ? buildMetadataUrl(tenantId) : ''), [tenantId]);

	// Role options intentionally exclude super_admin — JIT provisioning must never be able to mint
	// an admin, and the backend rejects it outright.
	const roleOptions = SAML_DEFAULT_ROLES.map((role) => ({ value: role, label: t(ROLE_LABEL_KEYS[role]) }));

	const handleReset = () => {
		setDraft(config);
		setErrors({});
	};

	const handleSave = async () => {
		const validationErrors = validateDraft(draft, t);
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		// The whole configuration is sent, so a save built on a stale read would
		// silently overwrite whatever another administrator changed in the
		// meantime — including the certificate and the identity provider URL.
		// Re-read first and refuse rather than clobber; the administrator sees the
		// current values and decides what to do with them.
		const latest = await refetch();

		// A failed refetch resolves with the cached data still attached, so the
		// comparison below would find it unchanged and let the save through — the
		// stale-overwrite this check exists to prevent. Without a confirmed read
		// there is nothing to compare against, so refuse.
		if (latest.isError || !latest.data) {
			toast.error(t('saml.config.saveError'));
			return;
		}

		if (!isSameSamlConfig(latest.data, config)) {
			setDraft(latest.data);
			toast.error(t('saml.config.saveConflict'));
			return;
		}

		updateConfig.mutate(draft, {
			onSuccess: () => {
				// `active` is Flexprice's own approval flag and is never sent in the PUT body — a
				// tenant can enable SSO on their side but still be waiting on Flexprice to approve it,
				// and that distinction is exactly what a 404 on the login endpoint would otherwise hide.
				if (draft.enabled && !draft.active) {
					toast.success(t('saml.config.saveSuccessPendingApproval'));
				} else {
					toast.success(t('saml.config.saveSuccess'));
				}
			},
			onError: (error) => {
				if (error instanceof SamlDisabledError) {
					toast.error(t('saml.config.saveErrorDisabled'));
					return;
				}
				toast.error(error instanceof Error ? error.message : t('saml.config.saveError'));
			},
		});
	};

	const handleCopyMetadataUrl = () => {
		if (!metadataUrl) return;
		copyToClipboard(metadataUrl, t('saml.config.copiedMetadataUrl'));
	};

	const ssoLoginUrl = useMemo(() => (tenantId ? buildSsoLoginUrl(tenantId) : ''), [tenantId]);

	// Shown only once sign-in actually works. Both flags are required: the saved config is what the
	// tenant asked for, and `active` is Flexprice's approval — with either missing the endpoint
	// returns 404, so handing the link out would send users to a dead page.
	const isSsoLive = config.enabled && config.active;

	const handleCopySsoLoginUrl = () => {
		if (!ssoLoginUrl) return;
		copyToClipboard(ssoLoginUrl, t('saml.config.copiedSsoLoginUrl'));
	};

	const configTitle = t('saml.config.title');
	const isSaving = updateConfig.isPending;

	if (isForbidden) {
		return (
			<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
				<div className='flex items-start gap-2 rounded-md border border-warning-line bg-warning-muted p-3'>
					<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-warning-bright' />
					<p className='text-sm text-warning-deep'>{t('saml.config.saveErrorForbidden')}</p>
				</div>
			</Card>
		);
	}

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<SettingsCardHeader
				title={configTitle}
				titleClassName='text-lg font-medium text-content-zinc-strong'
				infoDescription={t('saml.config.description')}
				infoAriaLabel={t('info.ariaLabel', { field: configTitle })}
			/>
			{isLoading ? (
				<div className='flex min-h-[12.5rem] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<>
					<p className='mb-4 text-sm text-content-zinc-muted'>{t('saml.config.onboardingOrder')}</p>

					<div className='mb-4 space-y-1.5'>
						<label className='block text-sm font-medium text-content-zinc'>{t('saml.config.metadataUrlLabel')}</label>
						<div className='flex items-center gap-2'>
							<Input value={metadataUrl} disabled className='flex-1' />
							<Button variant='outline' size='icon' onClick={handleCopyMetadataUrl} title={t('saml.config.copyMetadataUrl')}>
								<Copy className='h-4 w-4' />
							</Button>
						</div>
						<p className='text-sm text-muted-foreground'>{t('saml.config.metadataUrlDescription')}</p>
					</div>

					{isSsoLive && (
						<div className='mb-4 space-y-1.5'>
							<label className='block text-sm font-medium text-content-zinc'>{t('saml.config.ssoLoginUrlLabel')}</label>
							<div className='flex items-center gap-2'>
								<Input value={ssoLoginUrl} disabled className='flex-1' />
								<Button variant='outline' size='icon' onClick={handleCopySsoLoginUrl} title={t('saml.config.copySsoLoginUrl')}>
									<Copy className='h-4 w-4' />
								</Button>
							</div>
							<p className='text-sm text-muted-foreground'>{t('saml.config.ssoLoginUrlDescription')}</p>
						</div>
					)}

					<div className='divide-y divide-line'>
						<SettingsToggleRow
							label={t('saml.config.enabled')}
							description={t('saml.config.enabledDescription')}
							infoAriaLabel={t('info.ariaLabel', { field: t('saml.config.enabled') })}
							checked={draft.enabled}
							disabled={isSaving}
							onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, enabled: checked }))}
						/>

						{/* `active` is read-only: Flexprice flips it directly in the database once a tenant is
						    approved to serve SSO. The API silently ignores it if sent in the PUT body. */}
						<div className='flex items-center justify-between gap-4 py-4'>
							<div>
								<span className='text-sm font-medium text-content-zinc-bold'>{t('saml.config.statusApproved')}</span>
								<p className='text-sm text-content-zinc-muted'>{t('saml.config.statusDescription')}</p>
							</div>
							<Chip
								label={config.active ? t('saml.config.statusApproved') : t('saml.config.statusPending')}
								variant={config.active ? 'success' : 'warning'}
							/>
						</div>

						<SettingsToggleRow
							label={t('saml.config.enforceSso')}
							description={t('saml.config.enforceSsoWarning')}
							infoAriaLabel={t('info.ariaLabel', { field: t('saml.config.enforceSso') })}
							checked={draft.enforce_sso}
							disabled={isSaving}
							onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, enforce_sso: checked }))}
						/>
					</div>

					<div className='mt-4 space-y-4'>
						<Input
							label={t('saml.config.idpEntityId')}
							description={t('saml.config.idpEntityIdDescription')}
							placeholder={t('saml.config.idpEntityIdPlaceholder')}
							value={draft.idp_entity_id}
							disabled={isSaving}
							error={errors.idp_entity_id}
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_entity_id: value }))}
						/>

						<Input
							label={t('saml.config.idpSsoUrl')}
							description={t('saml.config.idpSsoUrlDescription')}
							placeholder={t('saml.config.idpSsoUrlPlaceholder')}
							value={draft.idp_sso_url}
							disabled={isSaving}
							error={errors.idp_sso_url}
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_sso_url: value }))}
						/>

						<Textarea
							label={t('saml.config.idpCertificate')}
							description={t('saml.config.idpCertificateDescription')}
							placeholder={t('saml.config.idpCertificatePlaceholder')}
							value={draft.idp_certificate}
							disabled={isSaving}
							error={errors.idp_certificate}
							textAreaClassName='min-h-[11.25rem] font-mono text-xs'
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_certificate: value }))}
						/>

						{/* Stated next to the certificate field because that is where someone looks for it. The
						    certificate below is the identity provider's public one; Flexprice holds no key of its
						    own, so an identity provider configured to require signed requests or encrypted
						    assertions will reject every login, and the error would not say why. */}
						<div className='flex items-start gap-2 rounded-md border border-line bg-surface-subtle p-3'>
							<Info className='mt-0.5 h-4 w-4 shrink-0 text-content-zinc-muted' />
							<p className='text-sm text-content-zinc-muted'>{t('saml.config.unsupportedSigning')}</p>
						</div>

						<Input
							label={t('saml.config.emailAttribute')}
							description={t('saml.config.emailAttributeDescription')}
							placeholder={t('saml.config.emailAttributePlaceholder')}
							value={draft.email_attribute}
							disabled={isSaving}
							onChange={(value) => setDraft((prev) => ({ ...prev, email_attribute: value }))}
						/>

						<Select
							label={t('saml.config.defaultRole')}
							description={t('saml.config.defaultRoleDescription')}
							placeholder={t('saml.config.defaultRolePlaceholder')}
							options={roleOptions}
							value={draft.default_role || undefined}
							disabled={isSaving}
							error={errors.default_role}
							onChange={(value) => setDraft((prev) => ({ ...prev, default_role: value as SamlDefaultRole }))}
						/>
					</div>

					<SettingsFormActions onReset={handleReset} onSave={handleSave} isSaving={isSaving} disabled={isLoading} />
				</>
			)}
		</Card>
	);
};

export default SamlSsoTab;
