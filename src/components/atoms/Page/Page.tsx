import { cn } from '@/lib/utils';
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

const Page: FC<Props> = ({ children, className, header, heading, headingCTA, documentTitle }) => {
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

	/*
	 * The page title itself is intentionally not rendered. The Figma `App · Pages` deck
	 * (119:2775) runs the topbar breadcrumb straight into the toolbar row — there is no H1 on a
	 * list page. `heading` is still accepted and still drives `document.title`, so no call site
	 * had to change and tab titles are preserved.
	 *
	 * The row survives because it owns the portal target that `QueryableDataArea` renders its
	 * filter/sort controls into (`usePageToolbarSlot`); dropping it would push those controls
	 * into a second standalone row. Controls sit left, CTA right, matching the deck.
	 */
	const showToolbarRow = Boolean(heading || headingCTA);

	return (
		<PageToolbarSlotContext.Provider value={toolbarSlotEl}>
			<div className='flex min-h-0 w-full flex-col'>
				<div className={cn('page w-full !h-auto min-h-0 !px-12', className)}>
					{header && header}
					{showToolbarRow && (
						<div className='flex w-full flex-wrap items-center gap-2.5 pb-4 pt-2'>
							<div ref={toolbarSlotRef} className='flex flex-wrap items-center gap-2.5 empty:hidden' />
							{headingCTA ? <div className='ms-auto flex items-center'>{headingCTA}</div> : null}
						</div>
					)}
					<div className='pb-12 mt-2'>{children}</div>
				</div>
			</div>
		</PageToolbarSlotContext.Provider>
	);
};

export default Page;
