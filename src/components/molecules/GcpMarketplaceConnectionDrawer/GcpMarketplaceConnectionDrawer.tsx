import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Highlight, themes } from 'prism-react-renderer';
import { ChevronDown, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, FieldWithInfo, InfoIcon, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { CreateConnectionPayload } from '@/types/dto';
import { config } from '@/config/config';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';

interface GcpMarketplaceConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: Connection; // for editing
	onSave: (connection: Connection) => void;
}

interface FormData {
	name: string;
	credentials_json: string;
}

interface ValidationErrors {
	name?: string;
	credentials_json?: string;
}

/** On-screen mask for variable values (real value is only ever copied, never shown). */
const MASKED_VALUE = '••••••••••••';

/** Six-step gcloud script the tenant runs in Cloud Shell against their own GCP project. Rendered
 * twice: once with `{VARIABLE}` placeholders for on-screen display, once with the real values for
 * the clipboard, so the tenant only ever sees the real IDs after pasting.
 * Mirrors design doc FLE-981 §5.3 command-by-command. */
const buildSetupScript = (flexpriceAwsAccountId: string, flexpriceAwsRoleName: string): string =>
	`GCP_PROJECT_ID="your-gcp-project-id"
GCP_PROJECT_NUMBER="your-gcp-project-number"
SA_ID="flexprice-metering-sa"
FLEXPRICE_AWS_ACCOUNT_ID="${flexpriceAwsAccountId}"
FLEXPRICE_AWS_ROLE_NAME="${flexpriceAwsRoleName}"

# 1. Create the workload identity pool
gcloud iam workload-identity-pools create "flexprice-pool" \\
  --location="global" --project="$GCP_PROJECT_ID"

# 2. Create the provider inside it, and pin exactly who to trust
gcloud iam workload-identity-pools providers create-aws "flexprice-provider" \\
  --location="global" --workload-identity-pool="flexprice-pool" \\
  --account-id="$FLEXPRICE_AWS_ACCOUNT_ID" \\
  --attribute-mapping="google.subject=assertion.arn,attribute.account=assertion.account,attribute.aws_role=assertion.arn.extract('assumed-role/{role}/')" \\
  --attribute-condition="attribute.aws_role == '$FLEXPRICE_AWS_ROLE_NAME'" \\
  --project="$GCP_PROJECT_ID"

# 3. Create the service account
gcloud iam service-accounts create "$SA_ID" --project="$GCP_PROJECT_ID"

# 4. Grant it exactly one permission: report usage
gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \\
  --role="roles/servicemanagement.serviceController" \\
  --member="serviceAccount:$SA_ID@$GCP_PROJECT_ID.iam.gserviceaccount.com"

# 5. THE trust binding: let Flexprice's AWS identity impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \\
  "$SA_ID@$GCP_PROJECT_ID.iam.gserviceaccount.com" \\
  --role="roles/iam.workloadIdentityUser" \\
  --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/flexprice-pool/attribute.account/$FLEXPRICE_AWS_ACCOUNT_ID" \\
  --project="$GCP_PROJECT_ID"

# 6. Generate the credentials JSON
gcloud iam workload-identity-pools create-cred-config \\
  "projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/flexprice-pool/providers/flexprice-provider" \\
  --service-account="$SA_ID@$GCP_PROJECT_ID.iam.gserviceaccount.com" \\
  --aws --output-file="flexprice-gcp-creds.json"
`;

/**
 * Collapsed-by-default code viewer with a copy control that works without expanding.
 * `code` is what's shown on screen; `copyCode` (when given) is what lands on the clipboard — so the
 * masked `{VARIABLE}` view can be displayed while the real values are copied.
 */
const CodeBlock: FC<{
	label: string;
	info?: string;
	infoAriaLabel?: string;
	code: string;
	copyCode?: string;
	copyToast: string;
	language?: string;
}> = ({ label, info, infoAriaLabel, code, copyCode, copyToast, language = 'bash' }) => {
	const { t: tc } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const clipboardText = copyCode ?? code;

	return (
		<Collapsible open={open} onOpenChange={setOpen} className='rounded-lg border border-gray-200 overflow-hidden'>
			<div className='flex items-center justify-between bg-gray-50 px-4 py-2'>
				<div className='flex items-center gap-1'>
					<CollapsibleTrigger asChild>
						<button type='button' className='flex items-center gap-2 text-sm font-medium text-foreground'>
							<ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
							{label}
						</button>
					</CollapsibleTrigger>
					{info && <InfoIcon description={info} ariaLabel={infoAriaLabel ?? label} />}
				</div>
				<Button type='button' variant='ghost' size='sm' className='h-7' onClick={() => copyToClipboard(clipboardText, copyToast)}>
					<Copy size={12} className='me-1' />
					<span className='text-xs'>{tc('actions.copy')}</span>
				</Button>
			</div>
			<CollapsibleContent>
				<Highlight theme={themes.nightOwl} code={code} language={language}>
					{({ className, style, tokens, getLineProps, getTokenProps }) => (
						<pre className={cn(className, 'p-4 overflow-x-auto')} style={style}>
							{tokens.map((line, i) => (
								<div key={i} {...getLineProps({ line })}>
									{line.map((token, key) => (
										<span key={key} {...getTokenProps({ token })} className='text-sm font-normal font-fira-code' />
									))}
								</div>
							))}
						</pre>
					)}
				</Highlight>
			</CollapsibleContent>
		</Collapsible>
	);
};

/** One variable row: shows the variable name (masked value), copies the real value on click. */
const VariableCopyRow: FC<{ name: string; value: string; copyToast: string; info?: string; infoAriaLabel?: string }> = ({
	name,
	value,
	copyToast,
	info,
	infoAriaLabel,
}) => {
	const { t: tc } = useTranslation('common');
	return (
		<div className='flex items-center justify-between gap-2 px-3 py-2'>
			<div className='min-w-0'>
				<div className='flex items-center gap-1'>
					<p className='text-xs font-medium text-foreground font-fira-code'>{name}</p>
					{info && <InfoIcon description={info} ariaLabel={infoAriaLabel ?? name} />}
				</div>
				<p className='text-sm tracking-widest text-gray-400 select-none' aria-hidden>
					{MASKED_VALUE}
				</p>
			</div>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='h-7 shrink-0'
				disabled={!value}
				onClick={() => copyToClipboard(value, copyToast)}>
				<Copy size={12} className='me-1' />
				<span className='text-xs'>{tc('actions.copy')}</span>
			</Button>
		</div>
	);
};

const GcpMarketplaceConnectionDrawer: FC<GcpMarketplaceConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const isEditMode = !!connection;

	const [formData, setFormData] = useState<FormData>({ name: '', credentials_json: '' });
	const [errors, setErrors] = useState<ValidationErrors>({});

	const flexpriceAwsAccountId = config.integrations.flexpriceAwsAccountId;
	const flexpriceAwsRoleName = config.integrations.flexpriceAwsRoleName;

	useEffect(() => {
		if (!isOpen) return;
		if (connection) {
			setFormData({ name: connection.name || '', credentials_json: '' });
		} else {
			setFormData({ name: '', credentials_json: '' });
		}
		setErrors({});
	}, [connection, isOpen]);

	// Shown on screen: masked variables. Copied to clipboard: the real account ID + role name.
	const setupScriptDisplay = useMemo(() => buildSetupScript('{FLEXPRICE_AWS_ACCOUNT_ID}', '{FLEXPRICE_AWS_ROLE_NAME}'), []);
	const setupScriptCopy = useMemo(
		() => buildSetupScript(flexpriceAwsAccountId || '{FLEXPRICE_AWS_ACCOUNT_ID}', flexpriceAwsRoleName || '{FLEXPRICE_AWS_ROLE_NAME}'),
		[flexpriceAwsAccountId, flexpriceAwsRoleName],
	);

	const handleChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = t('connection.validation.nameRequired');
		}
		if (!isEditMode) {
			const trimmed = formData.credentials_json.trim();
			if (!trimmed) {
				newErrors.credentials_json = t('connection.gcpMarketplace.credentialsJsonRequired');
			} else {
				try {
					const parsed = JSON.parse(trimmed);
					if (parsed?.type !== 'external_account') {
						newErrors.credentials_json = t('connection.gcpMarketplace.credentialsJsonInvalid');
					}
				} catch {
					newErrors.credentials_json = t('connection.gcpMarketplace.credentialsJsonInvalid');
				}
			}
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: CreateConnectionPayload = {
				name: formData.name.trim(),
				provider_type: CONNECTION_PROVIDER_TYPE.GCP_MARKETPLACE,
				encrypted_secret_data: {
					credentials_json: formData.credentials_json.trim(),
				},
			};
			// Backend performs a live Workload Identity Federation token exchange with this
			// credentials_json and only persists on success; a failure surfaces here as the specific
			// failed step (HTTP 422).
			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: 'GCP Marketplace' }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		// Only invoked via handleSubmit's isEditMode branch below, which is exactly !!connection,
		// so connection is guaranteed defined here.
		mutationFn: async () => ConnectionApi.Update(connection!.id, { name: formData.name.trim() }),
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: 'GCP Marketplace' }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToUpdate'));
		},
	});

	const handleSave = () => {
		if (!validateForm()) return;
		if (isEditMode) {
			updateConnection();
		} else {
			createConnection();
		}
	};

	const isPending = isCreating || isUpdating;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={isEditMode ? t('connection.gcpMarketplace.titleEdit') : t('connection.gcpMarketplace.titleConnect')}
			description={t('connection.gcpMarketplace.description')}
			size='lg'>
			<div className='space-y-6 mt-9'>
				<FieldWithInfo
					label={t('connection.gcpMarketplace.connectionNameLabel')}
					description={t('connection.gcpMarketplace.connectionNameInfo')}
					infoAriaLabel={t('connection.gcpMarketplace.infoAriaLabel')}>
					<Input
						placeholder={t('connection.gcpMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.gcpMarketplace.connectionNameHint')}
					/>
				</FieldWithInfo>

				{!isEditMode && (
					<>
						{/* Step 1 — the setup script the tenant runs in their own GCP project */}
						<div className='space-y-3'>
							<div>
								<p className='text-sm font-medium text-foreground'>{t('connection.gcpMarketplace.step1Title')}</p>
								<p className='text-xs text-gray-500 mt-1'>{t('connection.gcpMarketplace.step1Hint')}</p>
							</div>

							<CodeBlock
								label={t('connection.gcpMarketplace.scriptLabel')}
								info={t('connection.gcpMarketplace.scriptInfo')}
								infoAriaLabel={t('connection.gcpMarketplace.infoAriaLabel')}
								code={setupScriptDisplay}
								copyCode={setupScriptCopy}
								copyToast={t('connection.gcpMarketplace.copyScript')}
							/>

							{/* Variables — copy the real values without revealing them on screen */}
							<div>
								<p className='text-sm font-medium text-foreground'>{t('connection.gcpMarketplace.variablesTitle')}</p>
								<p className='text-xs text-gray-500 mt-1 mb-2'>{t('connection.gcpMarketplace.variablesHint')}</p>
								<div className='rounded-lg border border-gray-200 divide-y divide-gray-200'>
									<VariableCopyRow
										name='FLEXPRICE_AWS_ACCOUNT_ID'
										value={flexpriceAwsAccountId}
										copyToast={t('connection.gcpMarketplace.copyAccountId')}
										info={t('connection.gcpMarketplace.accountIdInfo')}
										infoAriaLabel={t('connection.gcpMarketplace.infoAriaLabel')}
									/>
									<VariableCopyRow
										name='FLEXPRICE_AWS_ROLE_NAME'
										value={flexpriceAwsRoleName}
										copyToast={t('connection.gcpMarketplace.copyRoleName')}
										info={t('connection.gcpMarketplace.roleNameInfo')}
										infoAriaLabel={t('connection.gcpMarketplace.infoAriaLabel')}
									/>
								</div>
							</div>

							{(!flexpriceAwsAccountId || !flexpriceAwsRoleName) && (
								<p className='text-xs text-amber-600'>{t('connection.gcpMarketplace.accountIdMissing')}</p>
							)}
						</div>

						{/* Step 2 — the credentials JSON the tenant gets back from that script */}
						<div className='space-y-3'>
							<p className='text-sm font-medium text-foreground'>{t('connection.gcpMarketplace.step2Title')}</p>
							<FieldWithInfo
								label={t('connection.gcpMarketplace.credentialsJsonLabel')}
								description={t('connection.gcpMarketplace.credentialsJsonInfo')}
								infoAriaLabel={t('connection.gcpMarketplace.infoAriaLabel')}>
								<Textarea
									placeholder={t('connection.gcpMarketplace.credentialsJsonPlaceholder')}
									value={formData.credentials_json}
									onChange={(value) => handleChange('credentials_json', value)}
									error={errors.credentials_json}
									description={t('connection.gcpMarketplace.credentialsJsonHint')}
									textAreaClassName='font-fira-code text-xs min-h-[10rem]'
								/>
							</FieldWithInfo>
						</div>
					</>
				)}

				<Spacer className='!h-1' />
				<div className='flex gap-1'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{tc('actions.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending}>
						{isEditMode ? tc('actions.update') : tc('actions.save')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default GcpMarketplaceConnectionDrawer;
