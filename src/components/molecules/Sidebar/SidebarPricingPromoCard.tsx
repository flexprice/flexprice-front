'use client';

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

/** Figma export: sidebar “Create with AI” promo (grid art on the right). */
import promoFrameUrl from '../../../../assets/Frame 1400002331.png';

export interface SidebarPricingPromoCardProps {
	onCreateWithAI: () => void;
	className?: string;
}

const SidebarPricingPromoCard: FC<SidebarPricingPromoCardProps> = ({ onCreateWithAI, className }) => {
	const { t } = useTranslation('common');
	return (
		<div
			className={cn(
				'group-data-[collapsible=icon]:hidden',
				'relative w-full overflow-hidden rounded-lg border border-border bg-card',
				'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
				className,
			)}>
			<div
				className='pointer-events-none absolute inset-0 bg-muted bg-cover bg-right bg-no-repeat'
				style={{ backgroundImage: `url("${promoFrameUrl}")` }}
				aria-hidden
			/>
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/65 to-transparent' aria-hidden />

			<div className='relative z-10 flex flex-col gap-5 p-4'>
				<h2 className='text-start text-base font-semibold leading-snug tracking-normal text-foreground antialiased'>
					{t('labels.describeYourPricing')}
				</h2>

				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={onCreateWithAI}
					className={cn(
						'h-10 w-full rounded-md border-border bg-card px-3.5 text-xs font-medium text-brand',
						'shadow-none hover:bg-muted hover:text-brand',
						'inline-flex items-center justify-center gap-1.5',
					)}>
					<Wand2 className='size-3.5 shrink-0 text-brand opacity-90' strokeWidth={1.75} aria-hidden />
					<span className='analyzing-prompt-shimmer text-xs font-medium'>{t('labels.createPlan')}</span>
				</Button>
			</div>
		</div>
	);
};

export default SidebarPricingPromoCard;
