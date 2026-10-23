import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReportCatalogEntry, ReportCategory } from '@/types/dto/Reports';

const ORDER: ReportCategory[] = ['billing', 'receivables', 'customers', 'credits', 'usage'];

interface Props {
	entries: ReportCatalogEntry[];
	selectedKey: string;
	onSelect: (key: string) => void;
}

const ReportList = ({ entries, selectedKey, onSelect }: Props) => {
	const { t } = useTranslation('settings');
	const [q, setQ] = useState('');
	const groups = useMemo(() => {
		const needle = q.trim().toLowerCase();
		const visible = entries.filter((e) => !e.variant_of && (!needle || e.name.toLowerCase().includes(needle)));
		return ORDER.map((c) => ({ category: c, items: visible.filter((e) => e.category === c) })).filter((g) => g.items.length > 0);
	}, [entries, q]);

	return (
		<Card className='flex flex-col gap-4 p-4'>
			<label className='flex items-center gap-2 rounded-md border px-3 py-2'>
				<Search className='size-4 text-muted-foreground' aria-hidden='true' />
				<input
					className='w-full bg-transparent text-sm outline-none'
					placeholder={t('insightsTools.revenue.reports.search')}
					aria-label={t('insightsTools.revenue.reports.search')}
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
			</label>
			{groups.map((g) => (
				<div key={g.category} className='flex flex-col gap-1'>
					<div className='px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
						{t(`insightsTools.revenue.reports.categories.${g.category}`)}
					</div>
					{g.items.map((e) => (
						<button
							key={e.key}
							type='button'
							onClick={() => onSelect(e.key)}
							aria-current={e.key === selectedKey ? 'true' : undefined}
							className={cn(
								'rounded-md px-2 py-1.5 text-start text-sm hover:bg-zinc-100',
								e.key === selectedKey && 'bg-zinc-100 font-medium',
							)}>
							{e.name}
						</button>
					))}
				</div>
			))}
			<div className='flex flex-col gap-1 border-t pt-3'>
				<button type='button' disabled className='rounded-md px-2 py-1.5 text-start text-sm text-muted-foreground'>
					{t('insightsTools.revenue.reports.newCustomReport')}
				</button>
				<span className='px-2 text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.comingSoon')}</span>
			</div>
		</Card>
	);
};

export default ReportList;
