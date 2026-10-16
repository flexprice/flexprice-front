import { config } from '@/config/config';
import { useNavigate } from 'react-router';
import { DebugMenu } from '@/components/molecules';
import { CommandPalette } from '@/components/organisms';
import AppPrefetcher from '@/components/organisms/AppPrefetcher';
import useUser from '@/hooks/useUser';
import useCustomCurrencyConfig from '@/hooks/useCustomCurrencyConfig';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import AuthService from '@/core/auth/AuthService';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import RouteGuard from '@/core/routes/RouteGuard';
import { Slot } from '@/brand/Slot';
import DefaultAppShell from './DefaultAppShell';

const MainLayout: React.FC = () => {
	const { user } = useUser();
	const navigate = useNavigate();

	// Publishes custom currency symbols to the currency formatters.
	useCustomCurrencyConfig();

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

	// Log out from the command palette (Cmd+K → Log out). Here rather than in a menu so it works
	// whichever shell is rendering.
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.Logout);
		const handler = () => void AuthService.logout();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, []);

	const page = (
		<>
			<RouteGuard />
			<DebugMenu />
		</>
	);

	// Behaviour above stays here; the frame around the page is the brand's to replace.
	return (
		<>
			<AppPrefetcher />
			<CommandPalette />
			<Slot name='layout.shell' fallback={<DefaultAppShell>{page}</DefaultAppShell>}>
				{page}
			</Slot>
		</>
	);
};

export default MainLayout;
