import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy } from 'lucide-react';
import { Button } from '../Button';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';

interface CopyIdButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'> {
	/** The ID to copy to clipboard */
	id: string;
	/** The entity type (e.g., "Feature", "Plan", "Customer") used to generate the toast message */
	entityType?: string;
	/** Custom toast message. If provided, takes precedence over entityType */
	toastMessage?: string;
}

/**
 * A reusable button component for copying entity IDs to clipboard
 * @example
 * <CopyIdButton id={featureId} entityType="Feature" />
 * <CopyIdButton id={planId} toastMessage="Plan ID copied to clipboard" />
 */
export const CopyIdButton: React.FC<CopyIdButtonProps> = ({ id, entityType, toastMessage, className, ...buttonProps }) => {
	const { t } = useTranslation('common');
	const handleCopy = () => {
		if (id) {
			const message = toastMessage || (entityType ? t('copyId.toastWithType', { type: entityType }) : t('copyId.toastFallback'));
			copyToClipboard(id, message);
		}
	};

	return (
		<Button
			variant='ghost'
			size='icon'
			onClick={handleCopy}
			className={cn('h-6 w-6 p-0 hover:bg-gray-100', className)}
			title={t('copyId.titleWithType', { type: entityType ?? t('copyId.defaultEntityType') })}
			{...buttonProps}>
			<Copy className='w-4 h-4 text-gray-500' />
		</Button>
	);
};
