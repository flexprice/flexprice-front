import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EllipsisVertical, Settings2 } from 'lucide-react';
import { Button, Dialog } from '@/components/atoms';
import { DropdownMenu } from '@/components/molecules';
import { WalletResponse } from '@/types/dto/Wallet';
import AutoTopUpForm from './AutoTopUpForm';
import useChargeableMethod from '../useChargeableMethod';

interface WalletActionsProps {
	wallet: WalletResponse;
}

/**
 * The wallet's secondary menu. Top up is the primary action and sits beside the
 * balance itself — see CreditBalance's balanceAction.
 *
 * The admin wallet menu also carries Create Wallet, Alert Settings, Manual Debit
 * and Terminate. None of those belong to a customer, so the portal menu exposes
 * auto top-up configuration only.
 */
const WalletActions = ({ wallet }: WalletActionsProps) => {
	const { hasChargeableMethod } = useChargeableMethod();
	const { t } = useTranslation('customer-portal');
	const [isAutoTopUpOpen, setIsAutoTopUpOpen] = useState(false);

	return (
		<div className='flex items-center'>
			<DropdownMenu
				options={[
					{
						label: t('autoTopUp.title'),
						icon: <Settings2 className='h-4 w-4' />,
						onSelect: () => setIsAutoTopUpOpen(true),
					},
				]}
				// Matches the admin wallet header: an outline icon button sized to sit
				// beside the primary action. The shared default trigger is a bare icon
				// with no border and no accessible name, so it neither lines up with the
				// button next to it nor announces itself.
				trigger={<Button variant='outline' size='icon' prefixIcon={<EllipsisVertical />} aria-label={t('wallet.moreActions')} />}
			/>
			<Dialog
				isOpen={isAutoTopUpOpen}
				onOpenChange={setIsAutoTopUpOpen}
				title={t('autoTopUp.title')}
				description={t('autoTopUp.description')}>
				<AutoTopUpForm wallet={wallet} hasChargeableMethod={hasChargeableMethod} onDone={() => setIsAutoTopUpOpen(false)} />
			</Dialog>
		</div>
	);
};

export default WalletActions;
