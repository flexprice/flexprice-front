import { Button, Dialog, Tooltip } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PREMIUM_TOOLTIP_CLASSNAME =
	'max-w-[200px] border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-500 opacity-100 z-[190] py-1 px-2';

interface PremiumFeatureIconProps {
	className?: string;
	align?: 'start' | 'center' | 'end';
	sideOffset?: number;
	side?: 'top' | 'right' | 'bottom' | 'left';
}

export const PremiumFeatureIcon: React.FC<PremiumFeatureIconProps> = ({ className, align = 'center', sideOffset, side = 'top' }) => {
	const { t } = useTranslation('catalog');
	return (
		<Tooltip
			content={
				<div className='flex items-start gap-2'>
					<div className='flex flex-col gap-0.5'>
						<span className='text-sm text-popover-foreground'>{t('premiumFeature.tooltip')}</span>
					</div>
				</div>
			}
			delayDuration={0}
			side={side}
			align={align}
			sideOffset={sideOffset ?? 4}
			className={cn(PREMIUM_TOOLTIP_CLASSNAME, className)}>
			<span className={cn('inline-flex items-center justify-center', className)}>
				<Sparkles className='size-4 text-amber-500' fill='currentColor' />
			</span>
		</Tooltip>
	);
};

export const PremiumFeatureTag = () => {
	return (
		<div className='flex gap-2 top-2 right-2 items-center justify-center  text-[#ffbf76] text-xs !font-semibold px-2 py-1 rounded-2xl !opacity-80'>
			<Sparkles fill='#ffbf76' className='size-4 text-xs !font-bold' />
		</div>
	);
};

interface Props {
	children?: React.ReactNode;
	isPremiumFeature?: boolean;
}
const PremiumFeature: React.FC<Props> = ({ children, isPremiumFeature = false }) => {
	const { t } = useTranslation('catalog');
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className='h-full'>
			<Dialog
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title={t('premiumFeature.dialogTitle')}
				description={t('premiumFeature.dialogDescription')}
				descriptionClassName='text-sm w-[90%]'>
				<div className='flex gap-2  justify-end items-center'>
					<Button>
						<a href='mailto:manish@flexprice.com'>{t('premiumFeature.contactUs')}</a>
					</Button>
				</div>
			</Dialog>
			{isPremiumFeature ? (
				<div
					className='h-full'
					onClick={(e) => {
						if (isPremiumFeature) {
							e.preventDefault();
							e.stopPropagation();
							setIsOpen(true);
						}
					}}
					style={{
						pointerEvents: isPremiumFeature ? 'auto' : 'none',
						cursor: isPremiumFeature ? 'pointer' : 'not-allowed',
					}}>
					<div className={cn('h-full', isPremiumFeature && 'pointer-events-none cursor-not-allowed')}>{children}</div>
				</div>
			) : (
				children
			)}
		</div>
	);
};

export default PremiumFeature;
