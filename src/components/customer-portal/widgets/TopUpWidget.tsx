import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/atoms';
import usePortalWallet from '../usePortalWallet';
import EmptyState from '../EmptyState';
import TopUpForm from './TopUpForm';
import CheckoutLinkDialog from './CheckoutLinkDialog';
import { Wallet } from 'lucide-react';

interface TopUpWidgetProps {
	label?: string;
}

/** Standalone top-up card. The Credits page surfaces `TopUpButton` in the wallet header instead. */
const TopUpWidget = ({ label }: TopUpWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
	const { wallet, isLoading } = usePortalWallet();

	if (isLoading) {
		return (
			<Card className='rounded-xl p-5 bg-surface border border-line'>
				<div className='animate-pulse space-y-3'>
					<div className='h-4 bg-zinc-100 rounded w-24'></div>
					<div className='h-10 bg-zinc-100 rounded w-full'></div>
				</div>
			</Card>
		);
	}

	if (!wallet) {
		return (
			<Card className='rounded-xl p-5 bg-surface border border-line'>
				<EmptyState icon={<Wallet />} title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	return (
		<Card className='rounded-xl p-5 bg-surface border border-line'>
			<h3 className='text-sm font-medium mb-1 text-content'>{label ?? t('topUp.title')}</h3>
			<p className='text-sm mb-4 text-content-secondary'>{t('topUp.description')}</p>
			{/* Same fallback as the dialog variant: the open can be blocked, so the link
			    has to remain reachable on the page. */}
			<TopUpForm wallet={wallet} onActionUrl={setCheckoutUrl} />
			<CheckoutLinkDialog url={checkoutUrl} onOpenChange={(open) => !open && setCheckoutUrl(null)} />
		</Card>
	);
};

export default TopUpWidget;
