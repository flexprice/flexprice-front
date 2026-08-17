import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/atoms';
import { FC, useCallback, useEffect, useState } from 'react';
import { useBrand } from '@/config/branding';
import { PageToolbarSlotContext } from '@/context/PageToolbarSlotContext';

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

const Page: FC<Props> = ({ children, className, header, heading, headingClassName, headingCTA, documentTitle }) => {
	const { name } = useBrand();
	const [toolbarSlotEl, setToolbarSlotEl] = useState<HTMLDivElement | null>(null);
	const toolbarSlotRef = useCallback((node: HTMLDivElement | null) => {
		setToolbarSlotEl(node);
	}, []);

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

	const headingActions = heading ? (
		<div className='flex flex-wrap items-center justify-end'>
			<div ref={toolbarSlotRef} className='flex flex-wrap items-center gap-2.5 empty:hidden' />
			{headingCTA ? <div className='ml-6 flex items-center'>{headingCTA}</div> : null}
		</div>
	) : (
		headingCTA
	);

	return (
		<PageToolbarSlotContext.Provider value={toolbarSlotEl}>
			<div className='flex min-h-0 w-full flex-col'>
				<div className={cn('page w-full !h-auto min-h-0 !px-12', className)}>
					{header && header}
					{heading && (
						<SectionHeader title={heading} titleClassName={cn(headingClassName, 'text-3xl font-medium')}>
							{headingActions}
						</SectionHeader>
					)}
					<div className='pb-12 mt-2'>{children}</div>
				</div>
			</div>
		</PageToolbarSlotContext.Provider>
	);
};

export default Page;
