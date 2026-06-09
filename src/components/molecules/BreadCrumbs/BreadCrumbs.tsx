import { FC } from 'react';
import { Link } from 'react-router';
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ApiDocs from '../ApiDocs';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import IntercomMessenger from '@/core/services/intercom/IntercomMessenger';
import ThemeToggle from '@/components/molecules/ThemeToggle';
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
			className='flex w-full min-w-[180px] sm:min-w-[220px] items-center border-border bg-card hover:bg-accent hover:border-border !ps-3 !pe-2 [&>div]:w-full [&>div]:min-w-0 [&>div]:gap-2'
			aria-label={t('commandPalette.searchAriaLabel')}>
			<Search className='h-4 w-4 shrink-0 text-muted-foreground order-first' />
			<span className='flex-1 min-w-0 truncate text-start text-muted-foreground order-2'>{t('commandPalette.searchPlaceholder')}</span>
			<kbd
				className='pointer-events-none order-last ms-auto hidden h-6 shrink-0 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:inline-flex'
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
			<header className='bg-card sticky top-0 z-10 border-b-[1.5px] border-border'>
				<div className='px-6 py-4'>
					<div className='h-6 animate-pulse bg-muted rounded w-48'></div>
				</div>
			</header>
		);
	}

	return (
		<header className='bg-card sticky top-0 z-10 border-b-[1.5px] border-border'>
			<div className='px-6 py-4 flex items-center justify-between'>
				{/* Breadcrumbs */}
				<nav className='flex items-center space-x-2 text-sm text-muted-foreground'>
					<div className='flex items-center gap-2 me-2'>
						<SidebarTrigger className='text-foreground' />
						<div className='h-5 w-[1px] border-r border-border'></div>
					</div>

					{breadcrumbs.map((breadcrumb, index) => (
						<span key={index} className='flex items-center space-x-2 min-w-0'>
							{breadcrumb.isLoading ? (
								<div className='h-5 w-20 animate-pulse bg-muted rounded'></div>
							) : index === breadcrumbs.length - 1 || index === 0 ? (
								<div
									title={breadcrumb.label}
									className={`hover:text-foreground capitalize select-none max-w-[140px] truncate ${
										index === breadcrumbs.length - 1 ? 'font-normal text-foreground' : ''
									}`}>
									{breadcrumb.label}
								</div>
							) : (
								<Link
									to={breadcrumb.path}
									title={breadcrumb.label}
									className={`hover:text-foreground capitalize max-w-[140px] truncate block ${index === breadcrumbs.length - 1 ? 'font-normal text-foreground' : ''}`}>
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
				<div className='flex items-center gap-4'>
					<LocaleSelector />
					<BreadCrumbsSearchTrigger />
					<ThemeToggle />
					<IntercomMessenger />
					<ApiDocs />
				</div>
			</div>
		</header>
	);
};

export default BreadCrumbs;
