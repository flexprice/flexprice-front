import { FC, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import CouponApi from '@/api/CouponApi';
import FlexpriceTable, { ColumnData } from '../Table';
import { DropdownMenu, getCopyIdOption } from '@/components/molecules';
import { Chip, Card, CardHeader, AddButton, NoDataCard } from '@/components/atoms';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { RouteNames } from '@/core/routes/Routes';
import { CouponAssociation } from '@/models/CouponAssociation';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { TrashIcon } from 'lucide-react';

interface Props {
	subscriptionId: string;
	onAdd?: () => void;
	onRemove?: (association: CouponAssociation) => void;
}

const formatDiscount = (association: CouponAssociation): string => {
	const c = association.coupon;
	if (!c) return '—';
	if (c.type === COUPON_TYPE.PERCENTAGE) return `${c.percentage_off ?? 0}%`;
	return `${getCurrencySymbol(c.currency)}${c.amount_off ?? '0.00'}`;
};

interface RowActionsProps {
	row: CouponAssociation;
	onRemove: (row: CouponAssociation) => void;
}

const RowActions: FC<RowActionsProps> = ({ row, onRemove }) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen((v) => !v);
	};
	return (
		<div data-interactive='true' onClick={handleClick}>
			<DropdownMenu
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				options={[
					getCopyIdOption(row.id, t, { entityType: 'Coupon Association' }),
					{
						label: t('form.remove'),
						icon: <TrashIcon />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onRemove(row);
						},
					},
				]}
			/>
		</div>
	);
};

const CouponAssociationTable: FC<Props> = ({ subscriptionId, onAdd, onRemove }) => {
	const { t } = useTranslation('common');

	const { data } = useQuery({
		queryKey: ['couponAssociations', subscriptionId],
		queryFn: () =>
			CouponApi.listCouponAssociations({
				subscription_ids: [subscriptionId],
				active_only: true,
			}),
		enabled: !!subscriptionId,
	});

	const rows = useMemo(() => {
		const now = new Date();
		return (data?.items ?? []).filter((a) => !a.end_date || new Date(a.end_date) > now);
	}, [data?.items]);

	const addButton = onAdd ? <AddButton onClick={onAdd} /> : undefined;
	const title = t('subscriptionEdit.couponAssociations', 'Coupon Associations');

	const columns: ColumnData<CouponAssociation>[] = [
		{
			title: 'Coupon Name',
			render: (row) =>
				row.coupon ? (
					<Link to={`${RouteNames.coupons}/${row.coupon_id}`} className='text-primary hover:underline'>
						{row.coupon.name}
					</Link>
				) : (
					row.coupon_id
				),
		},
		{
			title: 'Coupon Code',
			render: (row) =>
				row.coupon?.coupon_code ? <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{row.coupon.coupon_code}</code> : '—',
		},
		{
			title: 'Discount',
			render: (row) => formatDiscount(row),
		},
		{
			title: 'Scope',
			render: (row) =>
				row.subscription_line_item_id ? (
					<Chip variant='info' label={t('coupons.scope.lineItem', 'Line Item')} />
				) : (
					<Chip variant='default' label={t('coupons.scope.subscription', 'Subscription')} />
				),
		},
		{
			title: 'Start Date',
			render: (row) => formatDateShort(row.start_date),
		},
		{
			title: 'End Date',
			render: (row) => (row.end_date ? formatDateShort(row.end_date) : 'Forever'),
		},
		...(onRemove
			? [
					{
						fieldVariant: 'interactive' as const,
						width: '48px',
						render: (row: CouponAssociation) => <RowActions row={row} onRemove={onRemove} />,
					},
				]
			: []),
	];

	if (rows.length === 0) {
		return (
			<NoDataCard title={title} subtitle={t('coupons.noAssociations', 'No coupons applied to this subscription yet')} cta={addButton} />
		);
	}

	return (
		<Card variant='notched'>
			<CardHeader title={title} cta={addButton} />
			<FlexpriceTable columns={columns} data={rows} variant='no-bordered' />
		</Card>
	);
};

export default CouponAssociationTable;
