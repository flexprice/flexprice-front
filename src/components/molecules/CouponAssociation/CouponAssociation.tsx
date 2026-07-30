import { useTranslation } from 'react-i18next';
import { FC, useState } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { AddButton, FormHeader, Button } from '@/components/atoms';
import { Coupon } from '@/models/Coupon';
import { CouponModal } from '@/components/molecules';
import CouponApi from '@/api/CouponApi';
import { useQuery } from '@tanstack/react-query';
import filterValidCoupons from '@/utils/helpers/coupons';
import formatCouponName from '@/utils/common/format_coupon_name';
import { Trash2 } from 'lucide-react';

interface Props {
	data: Coupon[];
	onChange: (data: Coupon[]) => void;
	currency?: string;
	disabled?: boolean;
}

const CouponAssociation: FC<Props> = ({ data, onChange, currency, disabled }) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);

	const { data: availableCoupons = [] } = useQuery({
		queryKey: ['availableCoupons'],
		queryFn: async () => {
			const response = await CouponApi.getAllCoupons({ limit: 1000, offset: 0 });
			return filterValidCoupons(response.items);
		},
	});

	const filteredCoupons = currency ? filterValidCoupons(availableCoupons, currency) : availableCoupons;

	const handleSave = (couponId: string) => {
		const coupon = filteredCoupons.find((c) => c.id === couponId);
		if (!coupon) return;
		if (data.some((c) => c.id === coupon.id)) {
			setIsOpen(false);
			return;
		}
		onChange([...data, coupon]);
		setIsOpen(false);
	};

	const handleDelete = async (couponId: string) => {
		onChange(data.filter((coupon) => coupon.id !== couponId));
	};

	const columns: ColumnData<Coupon>[] = [
		{
			title: 'Coupon',
			render: (row) => (
				<div>
					<div className='text-sm font-medium'>{row.name}</div>
					<div className='text-xs text-gray-500'>{formatCouponName(row)}</div>
				</div>
			),
		},
		{ title: 'Type', render: (row) => row.type || '--' },
		{ title: 'Cadence', render: (row) => row.cadence || '--' },
		{ title: 'Currency', render: (row) => row.currency.toUpperCase() },
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<Button
					variant='ghost'
					size='sm'
					className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
					onClick={() => handleDelete(row.id)}
					disabled={disabled}
					aria-label={`Remove coupon ${row.name}`}>
					<Trash2 className='h-4 w-4' />
				</Button>
			),
		},
	];

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<FormHeader className='mb-0' title={t('labels.linkedCoupons')} variant='sub-header' />
				<AddButton onClick={() => setIsOpen(true)} disabled={disabled} />
			</div>

			<div className='rounded-xl border border-gray-300 space-y-6 mt-2'>
				<FlexpriceTable data={data} columns={columns} showEmptyRow />
			</div>

			<CouponModal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				coupons={filteredCoupons}
				onSave={handleSave}
				onCancel={() => setIsOpen(false)}
			/>
		</div>
	);
};

export default CouponAssociation;
