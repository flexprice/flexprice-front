import Tooltip from '@/components/atoms/Tooltip';
import { cn } from '@/lib/utils';
import { formatProviderName, getProviderLogo } from '@/utils/integrations/providerMarks';
import { FC } from 'react';

export interface ProviderLogoStackProps {
	providers: string[];
	emptyLabel: string;
}

const MAX_VISIBLE_LOGOS = 3;

const ProviderMark: FC<{ provider: string }> = ({ provider }) => {
	const marks = getProviderLogo(provider);
	const name = formatProviderName(provider);
	if (!marks) {
		return (
			<span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-shell text-xs font-medium text-content-zinc-bold'>
				{name.charAt(0)}
			</span>
		);
	}
	return (
		<span className='inline-flex size-8 shrink-0 items-center justify-center'>
			<img src={marks.logo} alt='' className={cn('size-8 object-contain', marks.logoDark && 'dark:hidden')} />
			{marks.logoDark ? <img src={marks.logoDark} alt='' className='hidden size-8 object-contain dark:block' /> : null}
		</span>
	);
};

const ProviderLogoStack: FC<ProviderLogoStackProps> = ({ providers, emptyLabel }) => {
	const unique = [...new Set(providers.filter(Boolean))];
	if (unique.length === 0) {
		return <span className='text-content-zinc-subtle'>{emptyLabel}</span>;
	}

	const visible = unique.slice(0, MAX_VISIBLE_LOGOS);
	const overflow = unique.length - visible.length;
	const names = unique.map(formatProviderName).join(', ');

	return (
		<Tooltip content={names} delayDuration={200}>
			<div className='inline-flex max-w-full items-center gap-2' role='img' aria-label={names}>
				{visible.map((provider) => (
					<ProviderMark key={provider} provider={provider} />
				))}
				{overflow > 0 ? (
					<span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-shell text-[11px] font-medium tabular-nums text-content-zinc-bold'>
						+{overflow}
					</span>
				) : null}
			</div>
		</Tooltip>
	);
};

export default ProviderLogoStack;
