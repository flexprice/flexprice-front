import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currenciesOf, rangeForPreset } from '../reports/reportMath';
import { currencyOf, DashboardCompare, DashboardControls, DashboardPreset, outstandingQ, reportQ } from './queries';

export const REVENUE_KPI = { key: 'invoice_total', opts: { shape: 'scalar' as const, compare: true } };

export const useDashboardControls = (initialNow?: Date) => {
	const [now] = useState(() => initialNow ?? new Date());
	const [preset, setPreset] = useState<DashboardPreset>('last_90_days');
	const [compare, setCompare] = useState<DashboardCompare>('none');
	const [picked, setCurrency] = useState('');
	const base: DashboardControls = { preset, compare, currency: picked, range: rangeForPreset(preset, now), now };
	const revenue = useQuery(reportQ(REVENUE_KPI.key, REVENUE_KPI.opts, base));
	const receivables = useQuery(outstandingQ(base));
	const currencies = [
		...new Set([...(revenue.data ? currenciesOf(revenue.data) : []), ...(receivables.data ? currenciesOf(receivables.data) : [])]),
	];
	const controls: DashboardControls = { ...base, currency: currencyOf(picked, currencies) };
	return { controls, currencies, setPreset, setCompare, setCurrency };
};
