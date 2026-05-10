import { PencilIcon, ClockIcon, CheckCircleIcon, BanIcon, AlertCircleIcon } from 'lucide-react';
import Chip from '@/components/atoms/Chip/Chip';

export type InvoiceStatus = 'draft' | 'finalized' | 'paid' | 'void' | 'uncollectible';

interface InvoiceStatusBadgeProps {
	status: InvoiceStatus;
	showLabel?: boolean;
}

const STATUS_CONFIG: Record<
	InvoiceStatus,
	{
		label: string;
		variant: 'default' | 'success' | 'warning' | 'failed' | 'info';
		icon: React.ReactNode;
	}
> = {
	draft: { label: 'Draft', variant: 'warning', icon: <PencilIcon size={12} /> },
	finalized: { label: 'Finalized', variant: 'info', icon: <ClockIcon size={12} /> },
	paid: { label: 'Paid', variant: 'success', icon: <CheckCircleIcon size={12} /> },
	void: { label: 'Void', variant: 'failed', icon: <BanIcon size={12} /> },
	uncollectible: { label: 'Uncollectible', variant: 'default', icon: <AlertCircleIcon size={12} /> },
};

/**
 * Displays an invoice's status as a colored chip with an icon.
 */
const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, showLabel = true }) => {
	const config = STATUS_CONFIG[status];
	return <Chip label={showLabel ? config.label : undefined} variant={config.variant} icon={config.icon} />;
};

export default InvoiceStatusBadge;
