import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/molecules/Sidebar';
import { BreadCrumbs, RestrictedEnvBanner } from '@/components/molecules';

/** The app's own frame: collapsible sidebar, breadcrumb header, scrolling content column. */
const DefaultAppShell = ({ children }: { children: ReactNode }) => (
	<SidebarProvider className='flex h-screen bg-surface-shell relative'>
		<Sidebar />
		<SidebarInset className='flex flex-col flex-1 bg-surface-canvas h-screen relative'>
			<BreadCrumbs />
			<RestrictedEnvBanner />
			<main className='flex-1 px-4 relative overflow-y-auto '>{children}</main>
		</SidebarInset>
	</SidebarProvider>
);

export default DefaultAppShell;
