import { FormHeader } from '@/components/atoms';
import { LineItem } from '@/models/Invoice';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
	data: LineItem[];
	currency?: string;
	total_amount?: number;
	sub_total?: number;
	tax?: number;
	title?: string;
	total_label?: string;
}

const formatAmount = (amount: number, currency: string): string => {
	return `${getCurrencySymbol(currency)}${amount}`;
};

const InvoiceCreditLineItemTable: FC<Props> = ({ data, total_amount, currency, title, sub_total, tax, total_label }) => {
	const { t } = useTranslation(['billing', 'common']);
	const li = 'invoices.details.lineItemsTable';
	const clt = 'invoices.details.creditLineTable';

	if (data.length === 0) {
		return <div></div>;
	}

	return (
		<div>
			<div className='w-full '>
				<FormHeader className='!mb-0' title={title} variant='form-component-title' titleClassName='font-semibold' />

				<div className='overflow-x-auto'>
					<table className='table-auto w-full border-collapse text-start text-sm text-content-heading my-4 px-4'>
						<thead className='border-b border-line'>
							<tr>
								<th className='py-2 px-2 text-content-tertiary'>{t(`${li}.subscription`)}</th>

								<th className='py-2 px-2 text-content-tertiary text-center'>{t(`${clt}.creditQuantity`)}</th>
								<th className='py-2 px-2 text-content-tertiary text-center'>{t(`${clt}.unitPrice`)}</th>
								<th className='py-2 px-2 text-content-tertiary text-end'>{t(`${clt}.creditAmount`)}</th>
							</tr>
						</thead>
						<tbody>
							{data?.map((item, index) => {
								return (
									<tr key={index}>
										<td className='py-3 px-2 text-content-heading'>{item.display_name ?? t('common:labels.na')}</td>
										<td className='py-3 px-2 text-center text-content-heading'>
											{item.quantity != null && item.quantity !== '' ? item.quantity : t('common:labels.na')}
										</td>
										<td className='py-3 px-2 text-center text-content-heading'>{t('common:labels.na')}</td>
										<td className='py-3 px-2 text-end text-accent-teal-brand'>{formatAmount(Number(item.amount ?? 0), item.currency)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className='flex justify-end px-[6px]  py-4 border-t border-line'>
					<div className='text-sm text-content-heading space-y-4 w-1/3'>
						<div className='flex justify-between'>
							<span>{t(`${li}.subtotal`)}</span>
							<span className='text-accent-teal-brand '>{`${getCurrencySymbol(currency ?? '')}${sub_total}`}</span>
						</div>
						<div className='flex justify-between'>
							<span>{t(`${li}.tax`)}</span>
							<span>{tax != null ? tax : t('common:labels.na')}</span>
						</div>
						<div className=' border-t '></div>
						<div className='flex justify-between font-bold text-content '>
							<span>{total_label || t('invoices.details.creditOnCustomerWallet')}</span>
							<span className=' text-accent-teal-brand '>{formatAmount(total_amount ?? 0, currency ?? '')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InvoiceCreditLineItemTable;
