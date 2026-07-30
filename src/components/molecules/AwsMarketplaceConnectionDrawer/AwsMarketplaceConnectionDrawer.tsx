import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Highlight, themes } from 'prism-react-renderer';
import { ChevronDown, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, FieldWithInfo, InfoIcon, Input, Sheet, Spacer } from '@/components/atoms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { CreateConnectionPayload } from '@/types/dto';
import { config } from '@/config/config';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';
import useUser from '@/hooks/useUser';
import useEnvironment from '@/hooks/useEnvironment';

interface AwsMarketplaceConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: Connection; // for editing
	onSave: (connection: Connection) => void;
}

interface FormData {
	name: string;
	role_arn: string;
	region: string;
}

interface ValidationErrors {
	name?: string;
	role_arn?: string;
	region?: string;
}

// arn:aws:iam::<12-digit-account>:role/<name>
const ROLE_ARN_REGEX = /^arn:aws:iam::\d{12}:role\/.+$/;

// AWS enables SaaS Marketplace metering in this region by default for every seller; sellers only
// end up on a different region if they specifically requested one from AWS Marketplace.
const DEFAULT_AWS_MARKETPLACE_REGION = 'us-east-1';

/** On-screen mask for variable values (real value is only ever copied, never shown). */
const MASKED_VALUE = '••••••••••••';

/**
 * Deterministic STS ExternalId scoped to the current tenant + environment.
 * Replaces a random UUID so the same org/env always gets a stable AssumeRole condition.
 */
export const generateExternalId = (tenantId: string, environmentId: string): string => {
	return `${tenantId}_${environmentId}`;
};

/** IAM permission policy — identical for every tenant. `BatchMeterUsage` is not resource-scopable. */
const buildIamPolicy = () => ({
	Version: '2012-10-17',
	Statement: [{ Effect: 'Allow', Action: 'aws-marketplace:BatchMeterUsage', Resource: '*' }],
});

/**
 * Trust policy — grants Flexprice's AWS account permission to assume the role, scoped to `externalId`.
 * Rendered twice: once with `{VARIABLE}` placeholders for on-screen display, once with the real values
 * for the clipboard (so the tenant only ever sees the real IDs after pasting).
 */
const buildTrustPolicy = (flexpriceAwsAccountId: string, externalId: string) => ({
	Version: '2012-10-17',
	Statement: [
		{
			Effect: 'Allow',
			Principal: { AWS: `arn:aws:iam::${flexpriceAwsAccountId}:root` },
			Action: 'sts:AssumeRole',
			Condition: { StringEquals: { 'sts:ExternalId': externalId } },
		},
	],
});

/**
 * Collapsed-by-default JSON viewer with a copy control that works without expanding.
 * `json` is what's shown on screen; `copyJson` (when given) is what lands on the clipboard — so the
 * masked `{VARIABLE}` view can be displayed while the real values are copied.
 */
const PolicyBlock: FC<{ label: string; info: string; infoAriaLabel: string; json: unknown; copyJson?: unknown; copyToast: string }> = ({
	label,
	info,
	infoAriaLabel,
	json,
	copyJson,
	copyToast,
}) => {
	const { t: tc } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const text = useMemo(() => JSON.stringify(json, null, 2), [json]);
	const clipboardText = useMemo(() => JSON.stringify(copyJson ?? json, null, 2), [copyJson, json]);

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
					<InfoIcon description={info} ariaLabel={infoAriaLabel} />
				</div>
				<Button type='button' variant='ghost' size='sm' className='h-7' onClick={() => copyToClipboard(clipboardText, copyToast)}>
					<Copy size={12} className='me-1' />
					<span className='text-xs'>{tc('actions.copy')}</span>
				</Button>
			</div>
			<CollapsibleContent>
				<Highlight theme={themes.nightOwl} code={text} language='json'>
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

const AwsMarketplaceConnectionDrawer: FC<AwsMarketplaceConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();
	const isEditMode = !!connection;

	const [formData, setFormData] = useState<FormData>({ name: '', role_arn: '', region: DEFAULT_AWS_MARKETPLACE_REGION });
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [externalId, setExternalId] = useState<string>('');

	// Reset form and set ExternalId from tenant + environment when opening a new connection.
	useEffect(() => {
		if (!isOpen) return;
		if (connection) {
			setFormData({ name: connection.name || '', role_arn: '', region: DEFAULT_AWS_MARKETPLACE_REGION });
			setExternalId('');
		} else {
			setFormData({ name: '', role_arn: '', region: DEFAULT_AWS_MARKETPLACE_REGION });
			const tenantId = user?.tenant?.id;
			const environmentId = activeEnvironment?.id;
			setExternalId(tenantId && environmentId ? generateExternalId(tenantId, environmentId) : '');
		}
		setErrors({});
	}, [connection, isOpen, user?.tenant?.id, activeEnvironment?.id]);

	const flexpriceAwsAccountId = config.integrations.flexpriceAwsAccountId;

	const iamPolicy = useMemo(() => buildIamPolicy(), []);
	// Shown on screen: masked variables. Copied to clipboard: the real account ID + external ID.
	const trustPolicyDisplay = useMemo(() => buildTrustPolicy('{FLEXPRICE_AWS_ACCOUNT_ID}', '{EXTERNAL_ID}'), []);
	const trustPolicyCopy = useMemo(
		() => buildTrustPolicy(flexpriceAwsAccountId || '{FLEXPRICE_AWS_ACCOUNT_ID}', externalId || '{EXTERNAL_ID}'),
		[flexpriceAwsAccountId, externalId],
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
			if (!formData.role_arn.trim()) {
				newErrors.role_arn = t('connection.validation.roleArnRequired');
			} else if (!ROLE_ARN_REGEX.test(formData.role_arn.trim())) {
				newErrors.role_arn = t('connection.validation.roleArnInvalid');
			}
			if (!formData.region.trim()) {
				newErrors.region = t('connection.validation.regionRequired');
			}
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: CreateConnectionPayload = {
				name: formData.name.trim(),
				provider_type: CONNECTION_PROVIDER_TYPE.AWS_MARKETPLACE,
				encrypted_secret_data: {
					role_arn: formData.role_arn.trim(),
					external_id: externalId,
				},
				sync_config: {
					aws_marketplace: { region: formData.region.trim() },
				},
			};
			// Backend performs a live STS AssumeRole with this role_arn + external_id and only persists
			// on success; a failure surfaces here as the AWS error verbatim (HTTP 422).
			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: 'AWS Marketplace' }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		// Only invoked via the isEditMode branch below, which is exactly `!!connection`.
		mutationFn: async () => ConnectionApi.Update(connection!.id, { name: formData.name.trim() }),
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: 'AWS Marketplace' }));
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
			if (!externalId.trim()) {
				toast.error(t('connection.toast.externalIdUnavailable'));
				return;
			}
			createConnection();
		}
	};

	const isPending = isCreating || isUpdating;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={isEditMode ? t('connection.awsMarketplace.titleEdit') : t('connection.awsMarketplace.titleConnect')}
			description={t('connection.awsMarketplace.description')}
			size='lg'>
			<div className='space-y-6 mt-9'>
				<FieldWithInfo
					label={t('connection.awsMarketplace.connectionNameLabel')}
					description={t('connection.awsMarketplace.connectionNameInfo')}
					infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}>
					<Input
						placeholder={t('connection.awsMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.awsMarketplace.connectionNameHint')}
					/>
				</FieldWithInfo>

				{!isEditMode && (
					<>
						{/* Step 1 — policies to paste into the tenant's own AWS account */}
						<div className='space-y-3'>
							<div>
								<p className='text-sm font-medium text-foreground'>{t('connection.awsMarketplace.step1Title')}</p>
								<p className='text-xs text-gray-500 mt-1'>{t('connection.awsMarketplace.step1Hint')}</p>
							</div>

							<PolicyBlock
								label={t('connection.awsMarketplace.iamPolicyLabel')}
								info={t('connection.awsMarketplace.iamPolicyInfo')}
								infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}
								json={iamPolicy}
								copyToast={t('connection.awsMarketplace.copyIamPolicy')}
							/>

							<PolicyBlock
								label={t('connection.awsMarketplace.trustPolicyLabel')}
								info={t('connection.awsMarketplace.trustPolicyInfo')}
								infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}
								json={trustPolicyDisplay}
								copyJson={trustPolicyCopy}
								copyToast={t('connection.awsMarketplace.copyTrustPolicy')}
							/>

							{/* Variables — copy the real values without revealing them on screen */}
							<div>
								<p className='text-sm font-medium text-foreground'>{t('connection.awsMarketplace.variablesTitle')}</p>
								<p className='text-xs text-gray-500 mt-1 mb-2'>{t('connection.awsMarketplace.variablesHint')}</p>
								<div className='rounded-lg border border-gray-200 divide-y divide-gray-200'>
									<VariableCopyRow
										name='FLEXPRICE_AWS_ACCOUNT_ID'
										value={flexpriceAwsAccountId}
										copyToast={t('connection.awsMarketplace.copyAccountId')}
										info={t('connection.awsMarketplace.accountIdInfo')}
										infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}
									/>
									<VariableCopyRow
										name='EXTERNAL_ID'
										value={externalId}
										copyToast={t('connection.awsMarketplace.copyExternalId')}
										info={t('connection.awsMarketplace.externalIdInfo')}
										infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}
									/>
								</div>
							</div>
						</div>

						{/* Step 2 — the Role ARN the tenant gets back from AWS, and their Marketplace region */}
						<div className='space-y-3'>
							<p className='text-sm font-medium text-foreground'>{t('connection.awsMarketplace.step2Title')}</p>
							<FieldWithInfo
								label={t('connection.awsMarketplace.roleArnLabel')}
								description={t('connection.awsMarketplace.roleArnInfo')}
								infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}>
								<Input
									placeholder={t('connection.awsMarketplace.roleArnPlaceholder')}
									type='password'
									value={formData.role_arn}
									onChange={(value) => handleChange('role_arn', value)}
									error={errors.role_arn}
									description={t('connection.awsMarketplace.roleArnHint')}
								/>
							</FieldWithInfo>
							<FieldWithInfo
								label={t('connection.awsMarketplace.regionLabel')}
								description={t('connection.awsMarketplace.regionInfo')}
								infoAriaLabel={t('connection.awsMarketplace.infoAriaLabel')}>
								<Input
									placeholder={t('connection.awsMarketplace.regionPlaceholder')}
									value={formData.region}
									onChange={(value) => handleChange('region', value)}
									error={errors.region}
									description={t('connection.awsMarketplace.regionHint')}
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

export default AwsMarketplaceConnectionDrawer;
