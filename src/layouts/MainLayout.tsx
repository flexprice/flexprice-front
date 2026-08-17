import { config } from '@/config/config';
import { Outlet, useNavigate } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/molecules/Sidebar';
import { BreadCrumbs, DebugMenu, RestrictedEnvBanner, WhatsNewModal } from '@/components/molecules';
import { CommandPalette } from '@/components/organisms';
import AppPrefetcher from '@/components/organisms/AppPrefetcher';
import useUser from '@/hooks/useUser';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const MainLayout: React.FC = () => {
	const { user } = useUser();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user || !config.app.isProd) return;

		posthog.identify(user.email, {
			id: user.id,
			email: user.email,
			name: user.tenant?.name,
			tenant_id: user.tenant?.id,
			tenant_name: user.tenant?.name,
		});

		if (window.Reo) {
			window.Reo.identify({
				username: user.email,
				type: 'email',
				firstname: user.name || '',
				company: user.tenant?.name || '',
			});
		}
	}, [user, navigate]);

	useEffect(() => {
		if (!user && config.app.isProd) {
			posthog.reset();
		}
	}, [user]);

	return (
		<SidebarProvider className='relative flex h-svh max-h-svh overflow-hidden bg-surface-shell'>
			<AppPrefetcher />
			<CommandPalette />
			<Sidebar />
			<div className='flex min-h-0 min-w-0 flex-1 flex-col p-[var(--fp-shell-inset)] md:ps-0'>
				<SidebarInset
					className={cn(
						'relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-canvas shadow-[var(--fp-shell-shadow)]',
						'rounded-[var(--fp-radius-shell)] border border-line-zinc-strong',
						'!min-h-0',
					)}>
					<BreadCrumbs />
					<RestrictedEnvBanner />
					<div className='fp-shell-scroll relative min-h-0 flex-1 overflow-y-auto'>
						<Outlet />
						<DebugMenu />
					</div>
				</SidebarInset>
			</div>
			<WhatsNewModal />
		</SidebarProvider>
	);
};

export default MainLayout;
