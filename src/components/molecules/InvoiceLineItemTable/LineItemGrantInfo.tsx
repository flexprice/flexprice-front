import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineItem } from '@/models/Invoice';
import { formatCurrencyAmount } from '@/utils/common/format_currency_amount';
import { getGrantAllowance } from './grantAllowance';

/** Wraps a line's amount; on hover it shows usage, the entitlement taken off, and what is billed. */
const LineItemGrantInfo: FC<{ item: LineItem; children: ReactNode }> = ({ item, children }) => {
	const { t } = useTranslation('billing');
	const allowance = getGrantAllowance(item);
	if (allowance <= 0) return <>{children}</>;

	const li = 'invoices.details.lineItemsTable';
	const billed = Number(item.amount ?? 0);
	const rows = [
		{ label: t(`${li}.grantUsage`), value: formatCurrencyAmount(billed + allowance, item.currency) },
		{ label: t(`${li}.grantCovered`), value: `−${formatCurrencyAmount(allowance, item.currency)}` },
		{ label: t(`${li}.grantBilled`), value: formatCurrencyAmount(billed, item.currency) },
	];
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className='cursor-help'>{children}</span>
				</TooltipTrigger>
				<TooltipContent
					sideOffset={5}
					className='bg-surface-inverse text-xs text-content-inverse px-2.5 py-1.5 rounded-[6px] max-w-[280px]'>
					{rows.map((row) => (
						<div key={row.label} className='flex justify-between gap-4'>
							<span>{row.label}</span>
							<span>{row.value}</span>
						</div>
					))}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default LineItemGrantInfo;
