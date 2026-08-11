import { Page, AddButton, Button } from '@/components/atoms';
import { FC, ReactNode } from 'react';
import { ApiDocsContent } from '@/components/molecules/ApiDocs/ApiDocs';
import { TutorialItem } from '@/pages';
import TutorialCards from '@/components/organisms/QueryableDataArea/TutorialCards';

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
			<div className='bg-surface-faint border border-line-hairline dark:bg-surface dark:border-line rounded-[6px] w-full h-[360px] flex flex-col items-center justify-center mx-auto '>
				{card?.icon && <div className='mb-8'>{card?.icon}</div>}
				{card?.heading && (
					<div className=' font-medium text-[20px] leading-normal text-content-secondary mb-4 text-center'>{card?.heading}</div>
				)}
				{card?.description && (
					<div className=' font-normal bg-surface-faint-inner dark:bg-transparent text-[16px] leading-normal text-content-subtle mb-8 text-center max-w-[350px]'>
						{card?.description}
					</div>
				)}
				{card?.buttonAction && card?.buttonLabel && (
					<Button variant={'outline'} onClick={card?.buttonAction} className='!p-5 !bg-surface-panel !border-line-muted'>
						{card?.buttonLabel}
					</Button>
				)}
			</div>
			{/* Quick Start Section */}
			<ApiDocsContent tags={tags} />
			{children}

			<TutorialCards tutorials={tutorials ?? []} fallbackImageUrl={DEFAULT_TUTORIAL_CARD_IMAGE_URL} />
		</Page>
	);
};

export default EmptyPage;
