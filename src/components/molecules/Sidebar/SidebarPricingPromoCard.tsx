'use client';

import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

/** Figma export: sidebar “Create with AI” promo (grid art on the right). */
import promoFrameUrl from '../../../../assets/Frame 1400002331.png';
/** Dark textured backdrop for the prompt-to-plan nudge. */
import promoFrameDarkUrl from '../../../../assets/ptpdark.png';

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
				'relative w-full overflow-hidden rounded-lg border border-line-faint bg-surface',
				'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
				className,
			)}>
			{/*
			 * The art is baked into a PNG, so it cannot follow a token — the light export is near-white
			 * and read as a bright glare patch on the Midnight card. Two layers, one per theme, with
			 * `hidden` on the unused one so only the shown image is fetched.
			 */}
			<div
				className='pointer-events-none absolute inset-0 bg-surface-faint bg-cover bg-right bg-no-repeat dark:hidden'
				style={{ backgroundImage: `url("${promoFrameUrl}")` }}
				aria-hidden
			/>
			<div
				className='pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat dark:block'
				style={{ backgroundImage: `url("${promoFrameDarkUrl}")` }}
				aria-hidden
			/>
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/65 to-transparent' aria-hidden />

			<div className='relative z-10 flex flex-col gap-5 p-4'>
				<h2 className='text-start text-base font-semibold leading-snug tracking-normal text-content antialiased'>
					{t('labels.describeYourPricing')}
				</h2>

				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={onCreateWithAI}
					className={cn(
						'h-10 w-full rounded-md border-line-strong bg-surface px-3.5 text-xs font-medium text-brand-navy',
						'shadow-none hover:bg-surface-subtle hover:text-brand-navy',
						'inline-flex items-center justify-center gap-1.5',
					)}>
					<Wand2 className='size-3.5 shrink-0 text-brand-navy opacity-90' strokeWidth={1.75} aria-hidden />
					<span className='analyzing-prompt-shimmer text-xs font-medium'>{t('labels.createPlan')}</span>
				</Button>
			</div>
		</div>
	);
};

export default SidebarPricingPromoCard;
