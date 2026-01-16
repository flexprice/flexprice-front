import { Outlet, useNavigate } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/molecules/Sidebar';
import { BreadCrumbs } from '@/components/molecules';
import { DebugMenu } from '@/components/molecules';
import useUser from '@/hooks/useUser';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { IS_PROD } from '@/types';

const MainLayout: React.FC = () => {
	const { user } = useUser();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user || !IS_PROD) return;

		posthog.identify(user.email, {
			id: user.id,
			email: user.email,
			name: user.tenant?.name,
			tenant_id: user.tenant?.id,
			tenant_name: user.tenant?.name,
		});

		Sentry.setUser({
			id: user.id,
			email: user.email,
			name: user.tenant?.name,
			tenant_id: user.tenant?.id,
			tenant_name: user.tenant?.name,
		});

		Sentry.setContext('tenant', {
			created_at: user.tenant?.created_at,
			tenant_id: user.tenant?.id,
			tenant_name: user.tenant?.name,
		});
	}, [user, navigate]);

	useEffect(() => {
		if (!user && IS_PROD) {
			Sentry.setUser(null);
			posthog.reset();
		}
	}, [user]);

	return (
		<SidebarProvider className='flex h-screen bg-gray-100 relative font-open-sans'>
			{/* Sidebar */}
			<Sidebar />
			{/* Right Layout */}
			<SidebarInset className='flex flex-col flex-1 bg-white h-screen relative'>
				<BreadCrumbs />
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
