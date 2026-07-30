import { useTranslation } from 'react-i18next';
import { FC } from 'react';

interface IdempotencyKeySectionProps {
	idempotencyKey: string;
}

const IdempotencyKeySection: FC<IdempotencyKeySectionProps> = ({ idempotencyKey }) => {
	const { t } = useTranslation(['developers', 'common']);
	return (
		<div className='pb-3 border-b border-gray-100'>
			<p className='text-xs font-medium text-slate-500 mb-1'>{t('common:labels.idempotencyKey')}</p>
			<p className='text-sm font-mono text-foreground break-all'>{idempotencyKey}</p>
		</div>
	);
};

export default IdempotencyKeySection;
