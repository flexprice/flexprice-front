import { FC, useEffect, useState } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import OAuthApi from '@/api/OAuthApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useUser } from '@/hooks/UserContext';
import { CheckCircle, Copy } from 'lucide-react';

interface ZohoBooksConnection extends Connection {
	encrypted_secret_data?: {
		organization_id?: string;
		organization_name?: string;
		accounts_server?: string;
	};
}

interface ZohoBooksConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: ZohoBooksConnection;
	onSave: (connection: Connection) => void;
}

interface ZohoBooksFormData {
	name: string;
	client_id: string;
	client_secret: string;
	organization_id: string;
	accounts_server: string;
	webhook_secret: string;
}

const ZOHO_SESSION_KEY = 'zoho_books_oauth_session_id';
const OAUTH_PROVIDER_KEY = 'oauth_provider';

const ZohoBooksConnectionDrawer: FC<ZohoBooksConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/zoho_books/${user.tenant.id}/${activeEnvironment.id}` : '';

	const [formData, setFormData] = useState<ZohoBooksFormData>({
		name: '',
		client_id: '',
		client_secret: '',
		organization_id: '',
		accounts_server: 'https://accounts.zoho.in',
		webhook_secret: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [redirectUriCopied, setRedirectUriCopied] = useState(false);
	const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);
	const redirectUri = `${window.location.origin}/tools/integrations/oauth/callback`;

	useEffect(() => {
		if (!isOpen) return;
		const secretData = connection?.encrypted_secret_data || {};
		setFormData({
			name: connection?.name || '',
			client_id: '',
			client_secret: '',
			organization_id: (secretData.organization_id as string) || '',
			accounts_server: (secretData.accounts_server as string) || 'https://accounts.zoho.in',
			webhook_secret: '',
		});
		setErrors({});
		setWebhookUrlCopied(false);
	}, [isOpen, connection]);

	const handleChange = (field: keyof ZohoBooksFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.name.trim()) newErrors.name = 'Connection name is required';
		if (!connection && !formData.client_id.trim()) newErrors.client_id = 'Client ID is required';
		if (!connection && !formData.client_secret.trim()) newErrors.client_secret = 'Client secret is required';
		if (!formData.organization_id.trim()) newErrors.organization_id = 'Organization ID is required';
		if (!formData.accounts_server.trim()) newErrors.accounts_server = 'Accounts server is required';
		if (!connection && !formData.webhook_secret.trim()) {
			newErrors.webhook_secret = 'Webhook secret is required';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: initiateOAuth, isPending: isInitiatingOAuth } = useMutation({
		mutationFn: async () => {
			return await OAuthApi.InitiateOAuth({
				provider: 'zoho_books',
				name: formData.name,
				credentials: {
					client_id: formData.client_id,
					client_secret: formData.client_secret,
					webhook_secret: formData.webhook_secret || '',
				},
				metadata: {
					accounts_server: formData.accounts_server,
					organization_id: formData.organization_id,
					organization_name: '',
				},
				sync_config: {
					invoice: {
						inbound: false,
						outbound: true,
					},
					customer: {
						inbound: true,
						outbound: false,
					},
				},
			});
		},
		onSuccess: (response) => {
			sessionStorage.setItem(ZOHO_SESSION_KEY, response.session_id);
			sessionStorage.setItem(OAUTH_PROVIDER_KEY, 'zoho_books');
			sessionStorage.setItem('zoho_books_organization_id', formData.organization_id.trim());
			onOpenChange(false);
			window.location.href = response.oauth_url;
		},
		onError: (error: unknown) => {
			toast.error(error instanceof Error ? error.message : 'Failed to initiate Zoho OAuth');
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			if (!connection) return;
			const existingConnection = await ConnectionApi.Get(connection.id);
			const existingSecretData = (existingConnection as ZohoBooksConnection).encrypted_secret_data || {};
			const payload: Record<string, unknown> = {
				name: formData.name,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS,
					...existingSecretData,
				},
			};
			if (formData.webhook_secret.trim()) {
				(payload.encrypted_secret_data as Record<string, string>).webhook_secret = formData.webhook_secret.trim();
			}
			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('Zoho Books connection updated successfully');
			if (response) onSave(response);
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			toast.error(error instanceof Error ? error.message : 'Failed to update connection');
		},
	});

	const handleSave = () => {
		if (!validateForm()) return;
		if (connection) {
			updateConnection();
			return;
		}
		initiateOAuth();
	};

	const handleCopyRedirectUri = () => {
		navigator.clipboard.writeText(redirectUri);
		setRedirectUriCopied(true);
		toast.success('Redirect URI copied to clipboard!');
		setTimeout(() => setRedirectUriCopied(false), 2000);
	};

	const handleCopyWebhookUrl = () => {
		if (!webhookUrl) return;
		navigator.clipboard.writeText(webhookUrl);
		setWebhookUrlCopied(true);
		toast.success('Webhook URL copied to clipboard!');
		setTimeout(() => setWebhookUrlCopied(false), 2000);
	};

	const isPending = isUpdating || isInitiatingOAuth;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit Zoho Books Connection' : 'Connect to Zoho Books'}
			description='Configure your Zoho Books integration and authorize via OAuth.'
			size='lg'>
			<div className='space-y-6 mt-4'>
				<Input
					label='Connection Name'
					placeholder='e.g., Zoho Books Production'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
				/>

				{!connection && (
					<>
						<Input
							label='Client ID'
							type='password'
							placeholder='Zoho OAuth Client ID'
							value={formData.client_id}
							onChange={(value) => handleChange('client_id', value)}
							error={errors.client_id}
						/>
						<Input
							label='Client Secret'
							type='password'
							placeholder='Zoho OAuth Client Secret'
							value={formData.client_secret}
							onChange={(value) => handleChange('client_secret', value)}
							error={errors.client_secret}
						/>
					</>
				)}

				<Input
					label='Organization ID'
					placeholder='Zoho Books organization_id'
					value={formData.organization_id}
					onChange={(value) => handleChange('organization_id', value)}
					error={errors.organization_id}
					description='Required for Zoho Books API operations.'
					disabled={!!connection}
				/>

				<Input
					label='Accounts Server'
					placeholder='https://accounts.zoho.in'
					value={formData.accounts_server}
					onChange={(value) => handleChange('accounts_server', value)}
					error={errors.accounts_server}
					description='Default is India (.in). Use another region if needed (e.g. accounts.zoho.com, accounts.zoho.eu).'
					disabled={!!connection}
				/>

				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>Webhook configuration</h3>
					<p className='text-xs text-blue-700 mb-4'>
						In Zoho Books, create Invoice and Contact webhooks and set this URL on each. Use the same secret here and in Zoho so Flexprice
						can verify <code className='text-xs bg-white/80 px-1 rounded'>X-Zoho-Webhook-Signature</code>.
					</p>
					<div className='mb-4'>
						<label className='block text-sm font-medium text-blue-800 mb-2'>Webhook URL</label>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>
								{webhookUrl || 'Select tenant and environment to generate URL'}
							</code>
							<Button
								size='xs'
								variant='outline'
								onClick={handleCopyWebhookUrl}
								className='flex items-center gap-1 shrink-0'
								disabled={!webhookUrl}>
								{webhookUrlCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookUrlCopied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
					</div>
					<Input
						label='Webhook secret'
						type='password'
						placeholder={
							connection
								? 'Leave blank to keep existing secret, or enter a new secret to rotate'
								: 'Same value as in Zoho Books webhook settings'
						}
						value={formData.webhook_secret}
						onChange={(value) => handleChange('webhook_secret', value)}
						error={errors.webhook_secret}
						description={
							connection
								? 'Stored encrypted. Leave blank to keep the current secret when updating.'
								: 'Required. Must match the secret in Zoho Books so Flexprice can verify X-Zoho-Webhook-Signature. Stored encrypted with your connection.'
						}
					/>
				</div>

				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-2'>OAuth Redirect URI</h3>
					<p className='text-xs text-blue-700 mb-2'>
						This URI must exactly match your Zoho app Authorized Redirect URI and backend oauth redirect configuration.
					</p>
					<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md mt-2'>
						<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{redirectUri}</code>
						<Button size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'>
							{redirectUriCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
							{redirectUriCopied ? 'Copied!' : 'Copy'}
						</Button>
					</div>
				</div>

				{connection && (
					<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
						<p className='text-xs text-gray-500'>
							OAuth credentials are encrypted and hidden. To update credentials, delete the connection and create a new one.
						</p>
					</div>
				)}

				<Spacer className='!h-4' />

				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}>
						{connection ? 'Update Connection' : 'Create Connection'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default ZohoBooksConnectionDrawer;
