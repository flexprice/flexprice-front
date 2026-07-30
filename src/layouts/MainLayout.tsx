import { config } from '@/config/config';
import { Outlet, useNavigate } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/molecules/Sidebar';
import { BreadCrumbs, DebugMenu, FundingStrip, RestrictedEnvBanner } from '@/components/molecules';
import { CommandPalette } from '@/components/organisms';
import AppPrefetcher from '@/components/organisms/AppPrefetcher';
import useUser from '@/hooks/useUser';
import posthog from 'posthog-js';
import { useEffect } from 'react';

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
		<SidebarProvider className='flex h-screen bg-gray-100 relative'>
			<AppPrefetcher />
			<CommandPalette />
			{/* Sidebar */}
			<Sidebar />
			{/* Right Layout */}
			<SidebarInset className='flex flex-col flex-1 bg-white h-screen relative'>
				<FundingStrip />
				<BreadCrumbs />
				<RestrictedEnvBanner />
				{/* Main Content */}
				<main className='flex-1 px-4 relative overflow-y-auto '>
					<Outlet />
					<DebugMenu />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default MainLayout;
