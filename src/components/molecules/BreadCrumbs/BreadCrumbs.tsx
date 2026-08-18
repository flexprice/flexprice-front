import { FC } from 'react';
import { Link } from 'react-router';
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ApiDocs from '../ApiDocs';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import ThemeToggle from '@/components/molecules/ThemeToggle';
import SupportChat from '@/core/services/support-chat/SupportChat';
import { Search } from 'lucide-react';
import { Button } from '@/components/atoms';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';
import { useTranslation } from 'react-i18next';

const COMMAND_PALETTE_EVENT = 'open-command-palette';

const BreadCrumbsSearchTrigger: React.FC = () => {
	const { t } = useTranslation('common');
	const handleClick = () => window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));

	return (
		<Button
			type='button'
			onClick={handleClick}
			variant='outline'
			size='sm'
			className='flex w-auto min-w-0 sm:min-w-[180px] md:min-w-[220px] items-center border-line bg-surface hover:bg-surface-subtle hover:border-line !ps-2 sm:!ps-3 !pe-1 [&>div]:w-full [&>div]:min-w-0 [&>div]:gap-2'
			aria-label={t('commandPalette.searchAriaLabel')}>
			<Search className='h-4 w-4 shrink-0 text-content-subtle order-first' />
			<span className='hidden sm:block flex-1 min-w-0 truncate text-start text-muted-foreground order-2'>
				{t('commandPalette.searchPlaceholder')}
			</span>
			<kbd
				className='pointer-events-none order-last ms-auto hidden h-6 shrink-0 items-center justify-center rounded border border-line bg-surface-subtle px-1.5 font-mono text-xs font-medium text-content-muted md:inline-flex'
				title={t('commandPalette.keyboardShortcutTitle')}>
				{t('commandPalette.kbdDisplay')}
			</kbd>
		</Button>
	);
};

const BreadCrumbs: FC = () => {
	useBreadcrumbs();
	const { breadcrumbs, isLoading } = useBreadcrumbsStore();
	const direction = useLocaleStore((s) => s.direction);
	const Separator = direction === Direction.RTL ? BsChevronLeft : BsChevronRight;

	if (isLoading) {
		return (
			<header className='bg-surface sticky top-0 z-10 border-b-[1.5px] border-line-strong overflow-x-hidden'>
				<div className='px-4 sm:px-6 py-4'>
					<div className='h-6 animate-pulse bg-surface-strong rounded w-48'></div>
				</div>
			</header>
		);
	}

	return (
		<header className='bg-surface sticky top-0 z-10 border-b-[1.5px] border-line overflow-x-hidden'>
			<div className='px-4 sm:px-6 py-4 flex items-center justify-between gap-2 min-w-0'>
				{/* Breadcrumbs */}
				<nav className='flex min-w-0 flex-1 items-center space-x-2 overflow-hidden text-sm text-content-muted'>
					<div className='flex shrink-0 items-center gap-2 me-2'>
						<SidebarTrigger className='text-content-heading' />
						<div className='h-5 w-[1px] border-r border-line'></div>
					</div>

					{breadcrumbs.map((breadcrumb, index) => (
						<span key={index} className='flex items-center space-x-2 min-w-0'>
							{breadcrumb.isLoading ? (
								<div className='h-5 w-20 animate-pulse bg-surface-strong rounded'></div>
							) : index === breadcrumbs.length - 1 || index === 0 ? (
								<div
									title={breadcrumb.label}
									className={`hover:text-content-heading capitalize select-none max-w-[140px] truncate ${
										index === breadcrumbs.length - 1 ? 'font-normal text-content-slate-deep' : ''
									}`}>
									{breadcrumb.label}
								</div>
							) : (
								<Link
									to={breadcrumb.path}
									title={breadcrumb.label}
									className={`hover:text-content-heading capitalize max-w-[140px] truncate block ${index === breadcrumbs.length - 1 ? 'font-normal text-content-slate-deep' : ''}`}>
									{breadcrumb.label}
								</Link>
							)}
							{index < breadcrumbs.length - 1 && (
								<span className='shrink-0'>
									<Separator />
								</span>
							)}
						</span>
					))}
				</nav>
				<div className='flex shrink-0 items-center gap-2 sm:gap-4'>
					<ThemeToggle />
					<LocaleSelector />
					<BreadCrumbsSearchTrigger />
					<SupportChat />
					<ApiDocs />
				</div>
			</div>
		</header>
	);
};

export default BreadCrumbs;
