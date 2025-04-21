import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/atoms';
import { FC } from 'react';
import { ApiDocsContent } from '@/components/molecules';

interface Props {
	children?: React.ReactNode;
	className?: string;
	type?: 'left-aligned' | 'default';
	header?: React.ReactNode;
	heading?: string;
	headingClassName?: string;
	headingCTA?: React.ReactNode;
	apiTags?: string[];
}

const Page: FC<Props> = ({
	children,
	className,
	type = 'default',
	header,
	heading,
	headingClassName,
	headingCTA,
	apiTags = ['Events'],
}) => {
	if (heading && header) {
		throw new Error('You cannot pass both heading and header props');
	}

	return (
		<div className='min-h-screen flex flex-col'>
			{apiTags && <ApiDocsContent tags={apiTags} />}
			<div
				className={cn('flex-1 page w-full', type === 'left-aligned' && 'px-6', type === 'default' && 'mx-auto max-w-screen-lg', className)}>
				{header && header}
				{heading && (
					<SectionHeader title={heading} titleClassName={headingClassName}>
						{headingCTA}
					</SectionHeader>
				)}
				<div className='pb-12'>{children}</div>
			</div>
		</div>
	);
};

export default Page;
