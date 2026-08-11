import React from 'react';
import { useTranslation } from 'react-i18next';
import { Testimonial } from '@/types';
import Card from '../../atoms/Card/Card';
import { getTypographyClass } from '@/lib/typography';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
	testimonial: Testimonial;
	logoHeightClass?: string;
}

const DUMMY_DP = 'https://randomuser.me/api/portraits/men/32.jpg'; // dummy image for dp

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, logoHeightClass }) => {
	const { t } = useTranslation('common');
	return (
		<Card
			className={cn(
				'bg-surface-canvas rounded-2xl shadow-[0_10px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_32px_rgba(0,0,0,0.35)] border w-[340px] border-line flex flex-col gap-4 p-6',
				'transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.11)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)]',
			)}>
			<div className='flex items-center justify-between gap-2 mb-1'>
				<img
					src={testimonial.companyTitleLogoUrl || testimonial.logoUrl}
					// eslint-disable-next-line i18next/no-literal-string
					alt={testimonial.companyName + ' logo'}
					className={cn(logoHeightClass ? logoHeightClass + ' w-auto ' : 'max-h-8 w-auto', 'object-contain')}
				/>
				{testimonial.labelImageUrl ? (
					<img src={testimonial.labelImageUrl} alt={t('labels.label')} className='h-4 w-auto object-contain' />
				) : (
					testimonial.label && <span className='text-xs font-medium text-info'>{testimonial.label}</span>
				)}
			</div>
			<div className={cn('text-content-black mb-6', 'font-normal', 'text-[13px]', 'leading-relaxed', 'font-[400]')}>
				"{testimonial.testimonial}"
			</div>
			<div className='flex items-center gap-3 mt-auto '>
				<img
					src={testimonial.dpUrl || DUMMY_DP}
					alt={testimonial.name}
					className='size-9 rounded-full object-cover border border-line bg-surface-muted'
					onError={(e) => {
						(e.currentTarget as HTMLImageElement).src = DUMMY_DP;
					}}
				/>
				<div>
					<div className={getTypographyClass('card-header', 'leading-tight font-normal text-[14px]')}>{testimonial.name}</div>
					<div className={cn('text-[13px] text-content-zinc-muted leading-tight font-[400]')}>{testimonial.designation}</div>
				</div>
			</div>
		</Card>
	);
};

export default TestimonialCard;
