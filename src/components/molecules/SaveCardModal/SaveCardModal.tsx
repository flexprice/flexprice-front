import { FC, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Switch } from '@/components/ui';
import { Button } from '@/components/atoms';
import { CreditCard, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import toast from 'react-hot-toast';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useTranslation } from 'react-i18next';

interface SaveCardModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	customerId: string;
	currentUrl: string;
}

const SaveCardModal: FC<SaveCardModalProps> = ({ isOpen, onOpenChange, customerId, currentUrl }) => {
	const { t } = useTranslation('billing');
	const [setAsDefault, setSetAsDefault] = useState(true);
	const [setupUrlPopup, setSetupUrlPopup] = useState<{
		isOpen: boolean;
		setupUrl: string;
		isCopied: boolean;
	}>({
		isOpen: false,
		setupUrl: '',
		isCopied: false,
	});
	const { activeEnvironment } = useEnvironment();

	const { mutate: createSetupIntent, isPending } = useMutation({
		mutationFn: async () => {
			return await PaymentApi.createSetupIntent(customerId, {
				success_url: currentUrl,
				cancel_url: currentUrl,
				provider: 'stripe',
				set_default: setAsDefault,
			});
		},
		onSuccess: (response) => {
			if (response.checkout_url) {
				// Close main dialog first
				onOpenChange(false);
				// Show the setup URL popup
				setSetupUrlPopup({
					isOpen: true,
					setupUrl: response.checkout_url,
					isCopied: false,
				});
				toast.success('Setup link created successfully!');
			} else {
				toast.error('Failed to generate payment setup link');
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create setup intent');
		},
	});

	const handleGetLink = () => {
		if (!activeEnvironment?.id) {
			toast.error('No active environment found');
			return;
		}
		createSetupIntent();
	};

	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(setupUrlPopup.setupUrl);
			setSetupUrlPopup((prev) => ({ ...prev, isCopied: true }));
			toast.success('Setup URL copied to clipboard!');

			// Reset copy status after 2 seconds
			setTimeout(() => {
				setSetupUrlPopup((prev) => ({ ...prev, isCopied: false }));
			}, 2000);
		} catch (error) {
			console.error('Failed to copy setup URL:', error);
			toast.error('Failed to copy setup URL. Please try again or copy manually.');
		}
	};

	const handleGoToLink = () => {
		window.open(setupUrlPopup.setupUrl, '_blank');
	};

	const handleCloseUrlPopup = () => {
		setSetupUrlPopup({
			isOpen: false,
			setupUrl: '',
			isCopied: false,
		});
	};

	return (
		<>
			{/* Main Save Card Dialog */}
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent className='bg-white sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='text-lg font-semibold text-[#18181B] flex items-center gap-2'>
							<CreditCard className='size-5' />
							{t('saveCardModal.title')}
						</DialogTitle>
					</DialogHeader>

					<div className='space-y-6 py-4'>
						<div className='text-sm text-gray-600'>{t('saveCardModal.intro')}</div>

						<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
							<div className='flex-1'>
								<h4 className='font-medium text-sm text-gray-900'>{t('saveCardModal.defaultMethodTitle')}</h4>
								<p className='text-xs text-gray-500'>{t('saveCardModal.defaultMethodHint')}</p>
							</div>
							<Switch checked={setAsDefault} onCheckedChange={setSetAsDefault} />
						</div>

						<div className='flex justify-end gap-3'>
							<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
								{t('saveCardModal.cancel')}
							</Button>
							<Button onClick={handleGetLink} disabled={isPending} isLoading={isPending} className='flex items-center gap-2'>
								<ExternalLink className='size-4' />
								{t('saveCardModal.getLink')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Setup URL Success Dialog */}
			<Dialog open={setupUrlPopup.isOpen} onOpenChange={handleCloseUrlPopup}>
				<DialogContent className='bg-white sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='text-lg font-semibold text-[#18181B]'>{t('saveCardModal.successTitle')}</DialogTitle>
					</DialogHeader>

					<div className='space-y-4 py-4'>
						<div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
							<div className='text-sm text-green-800 mb-2'>{t('saveCardModal.successBody')}</div>
						</div>

						<div className='flex gap-3'>
							<Button onClick={handleGoToLink} className='flex-1 flex items-center gap-2'>
								<ExternalLink className='w-4 h-4' />
								{t('saveCardModal.goToLink')}
							</Button>
							<Button variant='outline' onClick={handleCopyUrl} className='flex-1 flex items-center gap-2'>
								{setupUrlPopup.isCopied ? <CheckCircle className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
								{setupUrlPopup.isCopied ? t('saveCardModal.copied') : t('saveCardModal.copyLink')}
							</Button>
						</div>

						<div className='pt-2 flex justify-end'>
							<Button variant='outline' onClick={handleCloseUrlPopup}>
								{t('saveCardModal.close')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default SaveCardModal;
