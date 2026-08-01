import { useTranslation } from 'react-i18next';
import { FC } from 'react';

interface IdempotencyKeySectionProps {
	idempotencyKey: string;
}

const IdempotencyKeySection: FC<IdempotencyKeySectionProps> = ({ idempotencyKey }) => {
	const { t } = useTranslation(['developers', 'common']);
	return (
		<div className='pb-3 border-b border-line-subtle'>
			<p className='text-xs font-medium text-content-slate-muted mb-1'>{t('common:labels.idempotencyKey')}</p>
			<p className='text-sm font-mono text-foreground break-all'>{idempotencyKey}</p>
		</div>
	);
};

export default IdempotencyKeySection;
