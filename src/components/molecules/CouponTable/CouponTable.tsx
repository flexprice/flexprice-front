import { FC, useState } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { Coupon } from '@/models/Coupon';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { ENTITY_STATUS } from '@/models';
import formatDate from '@/utils/common/format_date';
import CouponApi from '@/api/CouponApi';
import { useNavigate } from 'react-router';
import CouponDrawer from '../CouponDrawer';
import { RouteNames } from '@/core/routes/Routes';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';

export interface CouponTableProps {
	data: Coupon[];
	onEdit?: (coupon: Coupon) => void;
}

const CouponTable: FC<CouponTableProps> = ({ data, onEdit }) => {
	const { t } = useTranslation('catalog');
	const navigate = useNavigate();
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const mappedData = data?.map((coupon) => ({
		...coupon,
	}));

	const handleEdit = (coupon: Coupon) => {
		setSelectedCoupon(coupon);
		setIsDrawerOpen(true);
		onEdit?.(coupon);
	};

	const columns: ColumnData<Coupon>[] = [
		{
			fieldName: 'name',
			title: t('coupons.table.name'),
		},
		{
			title: t('coupons.table.type'),
			render: (row) => {
				const label = row.type === COUPON_TYPE.FIXED ? t('coupons.drawer.fixedAmount') : t('coupons.drawer.percentage');
				return <Chip variant='default' label={label} />;
			},
		},
		{
			title: t('coupons.table.discount'),
			render: (row) => {
				if (row.type === COUPON_TYPE.FIXED) {
					return row.amount_off ? `${getCurrencySymbol(row.currency)} ${row.amount_off}` : '—';
				} else {
					return row.percentage_off ? `${row.percentage_off}%` : '—';
				}
			},
		},
		{
			title: t('coupons.table.redemptions'),
			render: (row) => {
				const max = row.max_redemptions || '∞';
				const current = row.total_redemptions;
				return `${current}/${max}`;
			},
		},
		{
			title: t('coupons.table.status'),
			render: (row) => {
				const isActive = row.status === ENTITY_STATUS.PUBLISHED;
				const label = isActive ? t('coupons.table.statusActive') : t('coupons.table.statusInactive');
				return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: t('coupons.table.updatedAt'),
			render: (row) => {
				return formatDate(row.updated_at);
			},
		},
		{
			fieldVariant: 'interactive',
			render: (row) => (
				<ActionButton
					id={row.id}
					copyId={{ entityType: 'Coupon' }}
					deleteMutationFn={(id) => CouponApi.deleteCoupon(id)}
					refetchQueryKey='fetchCoupons'
					entityName={t('coupons.table.entityName')}
					edit={{
						path: `${RouteNames.couponDetails}/${row.id}`,
						onClick: () => handleEdit(row),
					}}
					archive={{
						enabled: row.status === ENTITY_STATUS.PUBLISHED,
					}}
				/>
			),
		},
	];

	return (
		<>
			<FlexpriceTable
				columns={columns}
				data={mappedData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(`${RouteNames.couponDetails}/${row.id}`);
				}}
			/>
			<CouponDrawer data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']} />
		</>
	);
};

export default CouponTable;
