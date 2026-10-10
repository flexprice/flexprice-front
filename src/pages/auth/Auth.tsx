import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import AuthService from '@/core/auth/AuthService';
import type { UserLookupFailedState } from '@/core/auth/AuthProvider';
import BrandTemplate from './BrandTemplate';
import { AuthTab } from './authTabs';
import { resolveAuthTab } from './resolveAuthTab';
import { isPasswordRecoveryLanding } from '@/utils/auth/recoveryLanding';
import { config } from '@/config/config';

const AuthPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const signupEnabled = config.platform.signup.enabled;

	// Derived during render rather than held in state and corrected in an effect,
	// so the first paint is already the right form. The old effect-based version
	// rendered the login form for a frame before switching, which on a reset
	// landing flashed a form the user did not ask for.
	const currentTab = resolveAuthTab({
		pathname: location.pathname,
		search: location.search,
		isRecoveryLanding: isPasswordRecoveryLanding(),
		signupEnabled,
	});
	const isResettingPassword = currentTab === AuthTab.RESET_PASSWORD;

	useEffect(() => {
		// Two independent reasons not to send an existing session to the dashboard.
		//
		// A password reset arrives *with* a valid session — that is how the new
		// password can be set at all. Redirecting would turn the reset link into a
		// sign-in link and the user would never see the form. This supersedes the
		// earlier `?tab=reset-password` check: the reset flow is now also reached by
		// path and by recovery fragment, and resolveAuthTab covers all three.
		if (isResettingPassword) return;
		// User lookup just failed; redirecting to / again would loop.
		if ((location.state as UserLookupFailedState | null)?.userLookupFailed) return;
		const fetchUser = async () => {
			const tokenStr = await AuthService.getAcessToken();
			if (tokenStr) navigate('/');
		};
		fetchUser();
	}, [isResettingPassword, location.search, location.state, navigate]);

	useEffect(() => {
		// Signup disabled: drop the parameter so the URL stops advertising a form
		// that cannot be used. resolveAuthTab has already fallen back to login.
		const requestedTab = new URLSearchParams(location.search).get('tab');
		if (requestedTab === AuthTab.SIGNUP && !signupEnabled) {
			navigate('/auth', { replace: true });
		}
	}, [location.search, navigate, signupEnabled]);

	const switchTab = (tab: AuthTab) => {
		if (tab === AuthTab.SIGNUP && !signupEnabled) {
			navigate('/auth');
			return;
		}
		navigate(`/auth?tab=${tab}`);
	};

	return <BrandTemplate currentTab={currentTab} switchTab={switchTab} />;
};

export default AuthPage;
