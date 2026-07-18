import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Chip from '@/components/atoms/Chip';
import { formatAmount } from '@/components/atoms/Input/Input';
import { WalletAlertSettings } from '@/models/Wallet';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { computeWalletAlertStatus } from '@/utils/wallet/walletAlertUtils';

type ChipVariant = 'info' | 'warning' | 'failed';

const STATUS_VARIANTS: Record<string, ChipVariant> = {
	info: 'info',
	warning: 'warning',
	in_alarm: 'failed',
};

const STATUS_ICONS = {
	info: Info,
	warning: AlertTriangle,
	in_alarm: AlertCircle,
} as const;

interface WalletAlertStatusBadgeProps {
	balance: number;
	alertSettings?: WalletAlertSettings | null;
	currency?: string;
}

const WalletAlertStatusBadge: FC<WalletAlertStatusBadgeProps> = ({ balance, alertSettings, currency }) => {
	const { t } = useTranslation('billing');
	const status = computeWalletAlertStatus(balance, alertSettings);

	if (!status || status.state === 'ok' || !status.triggeredThreshold) return null;

	const StatusIcon = STATUS_ICONS[status.state];
	const conditionLabel =
		status.triggeredThreshold.condition === 'above' ? t('wallet.alerts.conditionAbove') : t('wallet.alerts.conditionBelow');
	const threshold = `${getCurrencySymbol(currency ?? '')}${formatAmount(status.triggeredThreshold.threshold)}`;

	return (
		<Chip
			variant={STATUS_VARIANTS[status.state]}
			label={t('wallet.alerts.statusBadgeLabel', {
				condition: conditionLabel.toLowerCase(),
				threshold,
			})}
			icon={<StatusIcon className='size-3.5' />}
		/>
	);
};

export default WalletAlertStatusBadge;
