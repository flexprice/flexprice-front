import { FC, MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Chip, Tooltip, CopyIdButton } from '@/components/atoms';
import { formatDateTime } from '@/utils/common/format_date';
import useEntityRef from '@/hooks/useEntityRef';
import { getEntityDef, shortId } from './entityRegistry';

interface Props {
	value: unknown;
	format: string;
	siblings?: Record<string, unknown>;
	customerId?: string;
}

const text = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v));

export const EntityRef: FC<{ type: string; id: string; customerId?: string }> = ({ type, id, customerId }) => {
	const { t } = useTranslation('activity');
	const { data, isLoading } = useEntityRef(type, id);
	const def = getEntityDef(type);
	if (isLoading) return <span className='text-content-muted'>{shortId(id)}</span>;
	const label = data?.label ?? shortId(id);
	const href = data?.state === 'exists' ? (def?.route(id, { customerId }) ?? null) : null;
	// Stop clicks on the link/copy button from bubbling to an enclosing clickable row.
	const stop = (e: ReactMouseEvent) => e.stopPropagation();
	return (
		<Tooltip content={id}>
			<span className='inline-flex items-center gap-1' onClick={stop}>
				{href ? (
					<Link to={href} className='text-content-link font-medium hover:underline'>
						{label}
					</Link>
				) : (
					<span>{label}</span>
				)}
				{data?.state === 'deleted' && <Chip label={t('ref.deleted')} variant='default' />}
				<CopyIdButton id={id} />
			</span>
		</Tooltip>
	);
};

export const FormattedValue: FC<Props> = ({ value, format, siblings, customerId }) => {
	const { t } = useTranslation('activity');
	if (format.startsWith('ref:') && typeof value === 'string' && value) {
		return <EntityRef type={format.slice(4)} id={value} customerId={customerId} />;
	}
	switch (format) {
		case 'money': {
			const n = Number(value);
			if (Number.isNaN(n)) return <span>{text(value)}</span>;
			const currency = typeof siblings?.currency === 'string' ? siblings.currency : '';
			return (
				<span className='tabular-nums'>
					{n.toFixed(2)}
					{currency ? ` ${currency}` : ''}
				</span>
			);
		}
		case 'date':
			return <span>{typeof value === 'string' ? formatDateTime(value) : text(value)}</span>;
		case 'enum':
			return <Chip label={text(value).replace(/_/g, ' ').toLowerCase()} variant='default' />;
		case 'boolean':
			return <span>{value ? t('value.on') : t('value.off')}</span>;
		default: {
			const s = text(value);
			return s.length > 80 ? (
				<Tooltip content={s}>
					<span>{s.slice(0, 77)}…</span>
				</Tooltip>
			) : (
				<span>{s}</span>
			);
		}
	}
};
