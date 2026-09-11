import { FC, useState, useCallback } from 'react';
import { Button, CopyIdButton } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import LicenseApi from '@/api/LicenseApi';
import { useTranslation } from 'react-i18next';

interface Props {
	jti: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const RevokeLicenseDialog: FC<Props> = ({ jti, open, onOpenChange, onSuccess }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [isRevoking, setIsRevoking] = useState(false);

	const handleRevoke = useCallback(async () => {
		setIsRevoking(true);
		try {
			await LicenseApi.revokeLicense(jti);
			toast.success('License revoked');
			onSuccess();
			onOpenChange(false);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Revoke failed';
			toast.error(message);
		} finally {
			setIsRevoking(false);
		}
	}, [jti, onSuccess, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='w-full max-w-md bg-surface'>
				<DialogHeader>
					<DialogTitle>{t('catalog:licenses.revokeDialog.title')}</DialogTitle>
				</DialogHeader>

				<div className='py-2 space-y-3'>
					<div className='space-y-1'>
						<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.revokeDialog.keyIdLabel')}</span>
						<div className='flex items-center gap-2 rounded-md border border-line-strong bg-muted/40 p-2'>
							<code className='flex-1 break-all [overflow-wrap:anywhere] font-mono text-xs'>{jti}</code>
							<CopyIdButton id={jti} toastMessage={t('catalog:licenses.createDialog.copyToastMessage')} />
						</div>
					</div>
					<p className='text-sm text-content-zinc-secondary'>{t('catalog:licenses.revokeDialog.confirmMessage')}</p>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button variant='destructive' onClick={handleRevoke} isLoading={isRevoking} className='flex-1'>
						{t('catalog:licenses.details.revoke')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RevokeLicenseDialog;
