import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/atoms';
import { FC, useEffect } from 'react';
import { useBrand } from '@/config/branding';

interface Props {
	children?: React.ReactNode;
	className?: string;
	type?: 'left-aligned' | 'default';
	header?: React.ReactNode;
	heading?: string | React.ReactNode;
	headingClassName?: string;
	headingCTA?: React.ReactNode;
	documentTitle?: string;
}

const Page: FC<Props> = ({ children, className, type = 'default', header, heading, headingClassName, headingCTA, documentTitle }) => {
	const { name } = useBrand();

	if (heading && header) {
		throw new Error('You cannot pass both heading and header props');
	}

	useEffect(() => {
		if (documentTitle) {
			document.title = `${documentTitle} | ${name}`;
		} else if (heading) {
			if (typeof heading === 'string') {
				document.title = `${heading} | ${name}`;
			}
		}
	}, [heading, documentTitle, name]);

	return (
		<div className='min-h-screen flex flex-col'>
			<div
				className={cn(
					'flex-1 page w-full p-0!',
					type === 'left-aligned' && '!px-12',
					type === 'default' && 'mx-auto max-w-[var(--fp-page-max-width)]',
					className,
				)}>
				{header && header}
				{heading && (
					<SectionHeader
						title={heading}
						titleClassName={cn(
							headingClassName,
							// Sized by tokens (src/index.css) so a brand can restyle every page title from its theme.
							'text-[length:var(--fp-page-heading-size)] leading-[var(--fp-page-heading-leading)] font-[number:var(--fp-page-heading-weight)] tracking-[var(--fp-page-heading-tracking)]',
						)}>
						{headingCTA}
					</SectionHeader>
				)}
				<div className='pb-12 mt-2'>{children}</div>
			</div>
		</div>
	);
};

export default Page;
