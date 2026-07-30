import { Card } from '@/components/atoms';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TutorialItem {
	title: string;
	imageUrl?: string;
	onClick?: () => void;
}

interface TutorialCardsProps {
	tutorials: TutorialItem[];
}

const TutorialCards = ({ tutorials }: TutorialCardsProps) => {
	const { t } = useTranslation('common');
	if (!tutorials || tutorials.length === 0) return null;

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
			{tutorials.map((item, index) => {
				const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : t('queryableDataArea.defaultPromoImageUrl');
				return (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
						<Card
							className='h-full group bg-white border border-slate-100 rounded-[6px] shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 flex flex-col max-w-[280px] mx-auto p-4 bg-gradient-to-r from-[#ffffff] to-[#fcfcfc]'
							onClick={item.onClick}>
							<div className='w-full h-[80px] aspect-video rounded-t-[6px] overflow-hidden bg-[#f5f5f5] flex items-center justify-center'>
								<img src={imageUrl} loading='lazy' className='object-cover bg-gray-100 w-full h-full' alt=' ' />
							</div>
							<div className='flex-1 flex flex-col justify-between mt-4'>
								<div>
									<h3 className='text-slate-800 text-base font-medium group-hover:text-gray-600 transition-colors duration-200 text-start'>
										{item.title}
									</h3>
								</div>
								<div className='flex items-center gap-1 mt-8 text-slate-400 group-hover:text-gray-500 transition-all duration-200 text-start'>
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
