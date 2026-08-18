import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterIcon, Layout03Icon, PaintBrushIcon } from '@hugeicons/core-free-icons';
import { HugeIcon, Modal } from '@/components/atoms';
import type { HugeIconData } from '@/components/atoms';
import useUser from '@/hooks/useUser';
import {
	WHATS_NEW_DISMISSALS_STORAGE_KEY,
	WHATS_NEW_PREVIEW_EVENT,
	WHATS_NEW_RELEASE_ID,
	hasSeenWhatsNew,
	markWhatsNewSeen,
} from '@/utils/whatsNew/whatsNewDismissal';
import leftModalImage from '../../../../assets/leftmodallight.png';
import leftModalImageDark from '../../../../assets/leftmodaldark.png';

export { WHATS_NEW_DISMISSALS_STORAGE_KEY, WHATS_NEW_RELEASE_ID };

const HIGHLIGHTS: { icon: HugeIconData; titleKey: string; bodyKey: string }[] = [
	{ icon: PaintBrushIcon, titleKey: 'whatsNew.highlightUiTitle', bodyKey: 'whatsNew.highlightUiBody' },
	{ icon: FilterIcon, titleKey: 'whatsNew.highlightFiltersTitle', bodyKey: 'whatsNew.highlightFiltersBody' },
	{ icon: Layout03Icon, titleKey: 'whatsNew.highlightSpaceTitle', bodyKey: 'whatsNew.highlightSpaceBody' },
];

const WhatsNewModal = () => {
	const { t } = useTranslation('common');
	const { user, loading } = useUser();
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (loading || !user?.id) return;
		if (hasSeenWhatsNew(user.id)) return;
		setIsOpen(true);
	}, [loading, user?.id]);

	useEffect(() => {
		const openPreview = () => setIsOpen(true);
		window.addEventListener(WHATS_NEW_PREVIEW_EVENT, openPreview);
		return () => window.removeEventListener(WHATS_NEW_PREVIEW_EVENT, openPreview);
	}, []);

	const dismiss = () => {
		if (user?.id) {
			markWhatsNewSeen(user.id);
		}
		setIsOpen(false);
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => !open && dismiss()}
			className='w-[min(850px,92vw)]'
			overlayClassName='bg-surface-scrim/30 backdrop-blur-[3px]'>
			<div className='flex items-stretch gap-5 overflow-hidden rounded-[var(--fp-radius-shell)] border border-line-zinc-strong bg-surface p-3 shadow-[0_16px_50px_rgb(15_23_42/0.18)] dark:shadow-[0_16px_50px_rgb(0_0_0/0.5)]'>
				<div
					className='relative w-[45%] min-h-[360px] shrink-0 overflow-hidden rounded-[var(--fp-radius-lg)] border border-line-hairline'
					data-testid='whats-new-photo-island'>
					<img src={leftModalImage} alt='' className='absolute inset-0 size-full object-cover object-left-top dark:hidden' />
					<img src={leftModalImageDark} alt='' className='absolute inset-0 hidden size-full object-cover object-left-top dark:block' />
				</div>
				<div className='flex min-w-0 flex-1 flex-col justify-center py-8 ps-5 pe-10'>
					<div className='flex flex-col gap-1.5'>
						<h2 className='text-[22px] font-medium leading-snug text-content'>{t('whatsNew.title')}</h2>
						<p className='text-[15px] leading-relaxed text-content-muted'>{t('whatsNew.subtitle')}</p>
					</div>
					<ul className='mt-6 flex flex-col gap-5'>
						{HIGHLIGHTS.map((item) => (
							<li key={item.titleKey} className='flex items-start gap-3'>
								<div className='flex size-9 shrink-0 items-center justify-center rounded-[var(--fp-radius-md)] border border-line-hairline bg-surface-subtle'>
									<HugeIcon icon={item.icon} size={18} />
								</div>
								<div className='min-w-0 pt-0.5'>
									<p className='text-sm font-medium leading-snug text-content'>{t(item.titleKey)}</p>
									<p className='mt-1 text-sm leading-relaxed text-content-muted'>{t(item.bodyKey)}</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</Modal>
	);
};

export default WhatsNewModal;
