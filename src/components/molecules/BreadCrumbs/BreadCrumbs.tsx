import { FC } from 'react';
import { Link } from 'react-router';
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ApiDocs from '../ApiDocs';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import IntercomMessenger from '@/core/services/intercom/IntercomMessenger';
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
			className='flex w-full min-w-[180px] sm:min-w-[220px] items-center border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-200 !ps-3 !pe-2 [&>div]:w-full [&>div]:min-w-0 [&>div]:gap-2'
			aria-label={t('commandPalette.searchAriaLabel')}>
			<Search className='h-4 w-4 shrink-0 text-gray-400 order-first' />
			<span className='flex-1 min-w-0 truncate text-start text-muted-foreground order-2'>{t('commandPalette.searchPlaceholder')}</span>
			<kbd
				className='pointer-events-none order-last ms-auto hidden h-6 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-xs font-medium text-gray-500 sm:inline-flex'
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
			<header className='bg-white sticky top-0 z-10 border-b-[1.5px] border-gray-300'>
				<div className='px-6 py-4'>
					<div className='h-6 animate-pulse bg-gray-200 rounded w-48'></div>
				</div>
			</header>
		);
	}

	return (
		<header className='bg-white sticky top-0 z-10 border-b-[1.5px] border-gray-200'>
			<div className='px-6 py-4 flex items-center justify-between'>
				{/* Breadcrumbs */}
				<nav className='flex items-center space-x-2 text-sm text-gray-500'>
					<div className='flex items-center gap-2 me-2'>
						<SidebarTrigger className='text-gray-800' />
						<div className='h-5 w-[1px] border-r border-gray-200'></div>
					</div>

					{breadcrumbs.map((breadcrumb, index) => (
						<span key={index} className='flex items-center space-x-2 min-w-0'>
							{breadcrumb.isLoading ? (
								<div className='h-5 w-20 animate-pulse bg-gray-200 rounded'></div>
							) : index === breadcrumbs.length - 1 || index === 0 ? (
								<div
									title={breadcrumb.label}
									className={`hover:text-gray-800 capitalize select-none max-w-[140px] truncate ${
										index === breadcrumbs.length - 1 ? 'font-normal text-[#020617]' : ''
									}`}>
									{breadcrumb.label}
								</div>
							) : (
								<Link
									to={breadcrumb.path}
									title={breadcrumb.label}
									className={`hover:text-gray-800 capitalize max-w-[140px] truncate block ${index === breadcrumbs.length - 1 ? 'font-normal text-[#020617]' : ''}`}>
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
					<IntercomMessenger />
					<ApiDocs />
				</div>
			</div>
		</header>
	);
};

export default BreadCrumbs;
