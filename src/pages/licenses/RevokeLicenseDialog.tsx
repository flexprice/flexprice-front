import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import LicenseApi from '@/api/LicenseApi';
import { Trans, useTranslation } from 'react-i18next';

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

				<div className='py-2'>
					<p className='text-sm text-content-zinc-secondary'>
						<Trans
							ns='catalog'
							i18nKey='licenses.revokeDialog.confirmMessage'
							values={{ jti }}
							components={{ bold: <span className='font-medium' /> }}
						/>
					</p>
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
