import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Select } from '@/components/atoms';
import { CustomerSearchSelect } from '@/components/molecules/Customer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MeterApi } from '@/api/MeterApi';
import { Customer } from '@/models';
import { ReportCatalogEntry, ReportFilter } from '@/types/dto/Reports';

const ENUMS: Record<string, string[]> = {
	invoice_type: ['SUBSCRIPTION', 'ONE_OFF', 'CREDIT'],
	transaction_reason: [
		'PURCHASED_CREDIT_DIRECT',
		'PURCHASED_CREDIT_INVOICED',
		'PURCHASED_CREDIT_BONUS',
		'FREE_CREDIT_GRANT',
		'SUBSCRIPTION_CREDIT_GRANT',
	],
	aging_bucket: ['Current', '1-30', '31-60', '61-90', '90+', 'No due date'],
};
const ALL = '__all__';

interface Props {
	entry: ReportCatalogEntry;
	filters: ReportFilter[];
	onChange: (next: ReportFilter[]) => void;
}

const ReportFilterBar = ({ entry, filters, onChange }: Props) => {
	const { t } = useTranslation('settings');
	const [customers, setCustomers] = useState<Record<string, string>>({});
	const dims = entry.dimensions;
	const hasMeter = dims.some((d) => d.key === 'meter_id');
	const meters = useQuery({
		queryKey: ['report-filter-meters'],
		queryFn: () => MeterApi.getAllActiveMeters(),
		enabled: hasMeter,
	});
	if (dims.length === 0) return null;

	const meterOptions = (meters.data?.items ?? []).map((m) => ({ value: m.id, label: m.name }));
	const current = (field: string) => filters.find((f) => f.field === field)?.value[0];
	const set = (field: string, value?: string) => {
		const rest = filters.filter((f) => f.field !== field);
		onChange(value ? [...rest, { field, op: 'eq', value: [value] }] : rest);
	};
	const valueLabel = (field: string, value: string) => {
		if (field === 'customer_id') return customers[value] ?? value;
		if (field === 'meter_id') return meterOptions.find((o) => o.value === value)?.label ?? value;
		return value;
	};
	const all = { value: ALL, label: t('insightsTools.revenue.reports.filters.all') };
	const active = filters.filter((f) => dims.some((d) => d.key === f.field));

	return (
		<div className='flex flex-col gap-2'>
			<span className='text-sm font-medium'>{t('insightsTools.revenue.reports.filters.title')}</span>
			<div className='flex flex-wrap items-end gap-3'>
				{dims.map((d) => {
					if (d.key === 'customer_id') {
						return (
							<CustomerSearchSelect
								key={d.key}
								includeNoneOption={false}
								display={{ label: d.label, placeholder: all.label }}
								value={undefined}
								onChange={(c: Customer | undefined) => {
									if (!c?.id) return set(d.key);
									setCustomers((prev) => ({ ...prev, [c.id]: c.name }));
									set(d.key, c.id);
								}}
							/>
						);
					}
					const options = d.key === 'meter_id' ? meterOptions : (ENUMS[d.key] ?? []).map((v) => ({ value: v, label: v }));
					if (d.key !== 'meter_id' && !ENUMS[d.key]) return null;
					return (
						<Select
							key={d.key}
							label={d.label}
							value={current(d.key) ?? ALL}
							options={[all, ...options]}
							onChange={(v) => set(d.key, v === ALL ? undefined : v)}
						/>
					);
				})}
			</div>
			{active.length > 0 && (
				<div className='flex flex-wrap items-center gap-2'>
					{active.map((f) => {
						const label = dims.find((d) => d.key === f.field)?.label ?? f.field;
						return (
							<Badge key={f.field} variant='secondary' className='gap-1'>
								{`${label}: ${valueLabel(f.field, f.value[0])}`}
								<button
									type='button'
									aria-label={t('insightsTools.revenue.reports.filters.remove', { label })}
									onClick={() => set(f.field)}>
									<X className='h-3 w-3' />
								</button>
							</Badge>
						);
					})}
					<Button type='button' variant='ghost' size='sm' onClick={() => onChange(filters.filter((f) => !active.includes(f)))}>
						{t('insightsTools.revenue.reports.filters.clear')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default ReportFilterBar;
