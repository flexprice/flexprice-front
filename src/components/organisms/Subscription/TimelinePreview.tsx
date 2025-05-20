import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
	icon: React.ReactNode;
	label: React.ReactNode;
	subtitle?: React.ReactNode;
	date?: Date;
	className?: string;
	isFirst: boolean;
	isLast: boolean;
}

const TimelineItem: FC<TimelineItemProps> = ({ icon, label, subtitle, isLast, className, isFirst }) => (
	<div className={cn('flex gap-3 items-start relative min-h-[64px]', className)}>
		{/* Vertical line behind the icon */}
		<div className='absolute left-[11px] top-0 bottom-0 flex items-center justify-center'>
			{!isFirst && <div className='absolute top-0 w-[1px] h-full bg-gray-300' />}
			{!isLast && <div className='absolute bottom-0 w-[1px] h-full bg-gray-300' />}
		</div>

		{/* Icon circle */}
		<div className='flex flex-col items-center min-w-[24px] z-10'>
			<div className='flex items-center justify-center h-6 w-6 bg-white rounded-full border border-gray-300 z-10'>{icon}</div>
		</div>

		{/* Label & Subtitle */}
		<div className='space-y-1.5 pt-0.5'>
			<p className='text-base font-medium text-gray-900'>{label}</p>
			{subtitle && <div className='text-sm text-gray-600'>{subtitle}</div>}
		</div>
	</div>
);

export interface PreviewTimelineItem {
	icon: React.ReactNode;
	label: string;
	subtitle?: string | React.ReactNode;
	date?: Date;
}

interface TimelinePreviewProps {
	items: PreviewTimelineItem[];
	className?: string;
}

const TimelinePreview: FC<TimelinePreviewProps> = ({ items, className }) => {
	if (items.length === 0) {
		return (
			<div className={cn('w-full', className)}>
				<Card className='bg-white border border-gray-200'>
					<CardContent className='p-5'>
						<div className='text-center text-gray-400 py-8'>No timeline items available</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn('w-full', className)}>
			<Card className='bg-white border border-gray-200'>
				<CardContent className='p-5'>
					<div className='flex flex-col gap-6'>
						{items.map((item, idx) => (
							<TimelineItem key={idx} {...item} isFirst={idx === 0} isLast={idx === items.length - 1} />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default TimelinePreview;
