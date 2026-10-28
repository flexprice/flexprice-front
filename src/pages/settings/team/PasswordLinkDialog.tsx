import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, Link2 } from 'lucide-react';
import { Button, Dialog } from '@/components/atoms';
import { buildPasswordLink, formatLinkExpiry } from '@/pages/auth/passwordLink';
import type { PasswordLinkPurpose } from '@/types/dto/UserApi';

export interface PasswordLinkDialogLink {
	email: string;
	purpose: PasswordLinkPurpose;
	token: string;
	expiresAt: string;
}

interface PasswordLinkDialogProps {
	link: PasswordLinkDialogLink | null;
	onClose: () => void;
}

/** Shows a one-time password link once, for an admin to send to the member. */
const PasswordLinkDialog = ({ link, onClose }: PasswordLinkDialogProps) => {
	const { t, i18n } = useTranslation(['settings', 'common']);
	const url = link ? buildPasswordLink(window.location.origin, link.token) : '';

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			toast.success(t('members.passwordLink.copied'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	return (
		<Dialog
			isOpen={!!link}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={link?.purpose === 'invite' ? t('members.passwordLink.inviteTitle') : t('members.passwordLink.resetTitle')}
			description={
				link ? t('members.passwordLink.description', { email: link.email, expiry: formatLinkExpiry(link.expiresAt, i18n.language) }) : ''
			}
			className='w-full max-w-[480px] rounded-xl border border-line-subtle shadow-lg'>
			<div className='mt-3 space-y-4'>
				<div className='flex min-h-[40px] items-center gap-2 rounded-md border border-line bg-surface-faint px-3 py-2'>
					<Link2 className='h-4 w-4 flex-shrink-0 text-content-zinc-subtle' />
					<span className='min-w-0 flex-1 truncate font-mono text-sm text-content-zinc-bold' title={url}>
						{url}
					</span>
				</div>
				<div className='flex justify-end'>
					<Button onClick={handleCopy}>
						<Copy className='mr-1.5 h-3.5 w-3.5' />
						{t('members.passwordLink.copy')}
					</Button>
				</div>
				<div className='flex items-center gap-2 text-xs text-content-zinc-muted'>
					<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-warning-bright' />
					<span>{t('members.passwordLink.note')}</span>
				</div>
			</div>
		</Dialog>
	);
};

export default PasswordLinkDialog;
