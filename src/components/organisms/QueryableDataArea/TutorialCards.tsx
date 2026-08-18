import { Card, HugeIcon } from '@/components/atoms';
import type { HugeIconData } from '@/components/atoms';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
	Archive02Icon,
	BookOpen01Icon,
	Copy01Icon,
	CouponPercentIcon,
	CreditCardIcon,
	Delete02Icon,
	File01Icon,
	FileImportIcon,
	FileSpreadsheetIcon,
	Invoice01Icon,
	Key01Icon,
	Layers01Icon,
	Link01Icon,
	PencilEdit01Icon,
	PercentCircleIcon,
	PlayCircleIcon,
	PlusSignIcon,
	PuzzleIcon,
	User03Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';

export interface TutorialCardItem {
	title: string;
	description?: string;
	imageUrl?: string;
	onClick?: () => void;
	icon?: HugeIconData;
}

interface TutorialCardsProps {
	tutorials: TutorialCardItem[];
	fallbackImageUrl?: string;
}

/** Last-resort guess from English titles when a card has no explicit icon. */
export const iconForTutorial = (title: string): HugeIconData => {
	const t = title.toLowerCase();
	if (/link|associat/.test(t)) return Link01Icon;
	if (/list all|list addons|spreadsheet|sheet/.test(t)) return FileSpreadsheetIcon;
	if (/clone|copy|duplicat/.test(t)) return Copy01Icon;
	if (/import/.test(t)) return FileImportIcon;
	if (/archive/.test(t)) return Archive02Icon;
	if (/delete|void|trash/.test(t)) return Delete02Icon;
	if (/process/.test(t)) return PlayCircleIcon;
	if (/api key/.test(t)) return Key01Icon;
	if (/subscription/.test(t)) return File01Icon;
	if (/customer/.test(t)) return User03Icon;
	if (/coupon/.test(t)) return CouponPercentIcon;
	if (/group/.test(t)) return UserGroupIcon;
	if (/feature/.test(t)) return PuzzleIcon;
	if (/billing|charge|advance|arrear/.test(t)) return Invoice01Icon;
	if (/plan/.test(t)) return Layers01Icon;
	if (/payment/.test(t)) return CreditCardIcon;
	if (/invoice/.test(t)) return Invoice01Icon;
	if (/tax/.test(t)) return PercentCircleIcon;
	if (/create|add|new|generate/.test(t)) return PlusSignIcon;
	if (/update|edit|manage/.test(t)) return PencilEdit01Icon;
	if (/list|overview|understanding|how .* work/.test(t)) return BookOpen01Icon;
	return BookOpen01Icon;
};

export const resolveTutorialIcon = (item: TutorialCardItem): HugeIconData => item.icon ?? iconForTutorial(item.title);

const TutorialCards = ({ tutorials }: TutorialCardsProps) => {
	const { t } = useTranslation('common');
	if (!tutorials || tutorials.length === 0) return null;

	return (
		<div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
			{tutorials.map((item, index) => (
				<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} key={index}>
					<Card
						noPadding
						className='group flex h-full cursor-pointer flex-col rounded-[var(--fp-radius-lg)] border border-line-hairline bg-surface p-5 shadow-none transition-colors duration-200 hover:border-line-zinc-strong hover:bg-surface-subtle'
						onClick={item.onClick}>
						<div className='flex size-9 items-center justify-center rounded-[var(--fp-radius-md)] border border-line-hairline bg-surface-subtle'>
							<HugeIcon icon={resolveTutorialIcon(item)} size={18} />
						</div>
						<div className='mt-4 flex flex-1 flex-col'>
							<h3 className='text-start text-base font-medium text-content'>{item.title}</h3>
							{item.description ? (
								<p className='mt-1.5 text-start text-sm font-normal leading-5 text-content-muted'>{item.description}</p>
							) : null}
							<div className='mt-auto flex items-center gap-1 pt-6 text-content-secondary transition-colors duration-200 group-hover:text-content'>
								<span className='text-xs font-medium'>{t('emptyPage.learnMore')}</span>
								<ArrowRight className='h-4 w-4 transition-transform duration-200 group-hover:translate-x-1' />
							</div>
						</div>
					</Card>
				</motion.div>
			))}
		</div>
	);
};

export default TutorialCards;
