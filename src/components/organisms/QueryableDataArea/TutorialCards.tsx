import { Card } from '@/components/atoms';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TutorialCardItem {
	title: string;
	imageUrl?: string;
	onClick?: () => void;
}

interface TutorialCardsProps {
	tutorials: TutorialCardItem[];
	/** Optional fallback when a card has no imageUrl */
	fallbackImageUrl?: string;
}

const TutorialCards = ({ tutorials, fallbackImageUrl }: TutorialCardsProps) => {
	const { t } = useTranslation('common');
	if (!tutorials || tutorials.length === 0) return null;

	const defaultImage = fallbackImageUrl ?? t('queryableDataArea.defaultPromoImageUrl');

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
			{tutorials.map((item, index) => {
				const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : defaultImage;
				return (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
						<Card
							className='h-full group bg-surface border border-line-slate-subtle rounded-[6px] shadow-sm hover:border-info-muted-strong hover:bg-surface-cool transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-info-bright/5 flex flex-col max-w-[280px] mx-auto p-4 bg-gradient-to-r from-surface to-surface-panel-alt'
							onClick={item.onClick}>
							{/*
							 * Thumbnail well uses surface-thumb (token matches surface in dark).
							 * Do not filter/tint the image artwork — baked-in SVG fills are asset-level.
							 */}
							<div className='w-full h-[80px] aspect-video rounded-t-[6px] overflow-hidden bg-surface-thumb flex items-center justify-center'>
								<img src={imageUrl} loading='lazy' className='object-cover w-full h-full bg-surface-thumb-inner' alt=' ' />
							</div>
							<div className='flex-1 flex flex-col justify-between mt-4'>
								<div>
									<h3 className='text-content-slate-strong text-base font-medium group-hover:text-content-tertiary transition-colors duration-200 text-start'>
										{item.title}
									</h3>
								</div>
								<div className='flex items-center gap-1 mt-8 text-content-slate-subtle group-hover:text-content-muted transition-all duration-200 text-start'>
									<span className='text-xs font-regular'>{t('emptyPage.learnMore')}</span>
									<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
								</div>
							</div>
						</Card>
					</motion.div>
				);
			})}
		</div>
	);
};

export default TutorialCards;
