import { Page, AddButton, Button, Card } from '@/components/atoms';
import { FC, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { ApiDocsContent } from '@/components/molecules/ApiDocs/ApiDocs';
import { motion } from 'framer-motion';
import { TutorialItem } from '@/pages';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const DEFAULT_TUTORIAL_CARD_IMAGE_URL = 'https://mintlify.s3.us-west-1.amazonaws.com/flexprice/UsageBaseMetering(1).jpg';

interface EmptyStateCardItem {
	icon?: ReactNode;
	heading?: string;
	description?: string;
	buttonLabel?: string;
	buttonAction?: () => void;
}

export interface CardItem {
	imageUrl?: string;
	heading?: string;
	description?: string;
	onClick?: () => void;
}

interface Props {
	onAddClick?: () => void;
	tags?: string[];
	heading?: string;
	children?: ReactNode;
	addButtonLabel?: string;
	emptyStateCard?: EmptyStateCardItem;
	tutorials?: TutorialItem[];
}

const EmptyPage: FC<Props> = ({ onAddClick, tags, heading, children, addButtonLabel, emptyStateCard, tutorials }) => {
	const { t } = useTranslation('common');
	const card = emptyStateCard;
	// Use heading as documentTitle if it's a string, otherwise use undefined to avoid "[object Object]"
	const documentTitle = typeof heading === 'string' ? heading : undefined;

	return (
		<Page
			heading={heading}
			documentTitle={documentTitle}
			headingCTA={
				onAddClick && (
					<AddButton
						label={addButtonLabel}
						onClick={() => {
							if (onAddClick) {
								onAddClick();
							}
						}}
					/>
				)
			}>
			<div className='bg-[#fafafa] border border-[#E9E9E9] rounded-[6px] w-full h-[360px] flex flex-col items-center justify-center mx-auto '>
				{card?.icon && <div className='mb-8'>{card?.icon}</div>}
				{card?.heading && <div className=' font-medium text-[20px] leading-normal text-gray-700 mb-4 text-center'>{card?.heading}</div>}
				{card?.description && (
					<div className=' font-normal bg-[#F9F9F9] text-[16px] leading-normal text-gray-400 mb-8 text-center max-w-[350px]'>
						{card?.description}
					</div>
				)}
				{card?.buttonAction && card?.buttonLabel && (
					<Button variant={'outline'} onClick={card?.buttonAction} className='!p-5 !bg-[#fbfbfb] !border-[#CFCFCF]'>
						{card?.buttonLabel}
					</Button>
				)}
			</div>
			{/* Quick Start Section */}
			<ApiDocsContent tags={tags} />
			{children}

			{/* card section */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 '>
				{tutorials?.map((item, index) => {
					const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : DEFAULT_TUTORIAL_CARD_IMAGE_URL;
					return (
						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
							<Card
								className={cn(
									'h-full group bg-white border border-slate-100 rounded-[6px] shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 flex flex-col max-w-[280px] mx-auto p-4',
									'!aspect-auto bg-gradient-to-r from-[#ffffff] to-[#fcfcfc]',
								)}
								onClick={item.onClick}>
								{/* Image at the top */}
								<div className='w-full h-[80px] aspect-video rounded-t-[6px] overflow-hidden bg-[#f5f5f5] flex items-center justify-center'>
									<img src={imageUrl} loading='lazy' className='object-cover bg-gray-100 w-full h-full' alt={' '} />
								</div>
								{/* Content below image */}
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
		</Page>
	);
};

export default EmptyPage;
