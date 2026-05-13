import { useEffect, useRef, useCallback } from 'react';
import Intercom from '@intercom/messenger-js-sdk';
import './index.css';
import { BotMessageSquare } from 'lucide-react';
import { Button } from '@/components/atoms';
import { config } from '@/config/config';
import { INTERCOM_MESSENGER_FLOW, isIntercomMessengerAvailable } from '@/config/intercom';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import useUser from '@/hooks/useUser';
import { useQuery, useMutation } from '@tanstack/react-query';
import TenantApi from '@/api/TenantApi';
import { TenantMetadataKey } from '@/models/Tenant';
import { toast } from 'react-hot-toast';
import { refetchQueries } from '../tanstack/ReactQueryProvider';

/** Mounted only when Intercom is enabled with an app id; owns SDK init and onboarding/help behavior. */
const IntercomMessengerImpl = () => {
	const { user } = useUser();
	const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
	const isInitialized = useRef(false);
	const isIntercomOpen = useRef(false);
	const hideEventTriggered = useRef(false);

	const openIntercom = useCallback(() => {
		// @ts-expect-error - Intercom types don't include messenger
		window.Intercom('show');
		isIntercomOpen.current = true;
		hideEventTriggered.current = false;
	}, []);

	// Open from command palette (Cmd+K → Open Intercom)
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.OpenIntercom);
		const handler = () => openIntercom();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [openIntercom]);

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant'],
		queryFn: async () => {
			return await TenantApi.getTenantById(user?.tenant?.id ?? '');
		},
		enabled: !!user?.tenant?.id,
	});

	// Mutation to update tenant when user closes Intercom
	const { mutate: updateTenantOnIntercomClose } = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: tenant?.name || '',
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
				},
			}),
		onSuccess: async () => {
			// Refetch user data to update the UI
			await refetchQueries(['user', 'tenant']);
			toast.success(INTERCOM_MESSENGER_FLOW.toastSuccessMarkOnboarded);
		},
		onError: (error: Error) => {
			console.error('Failed to mark user as onboarded:', error);
			toast.error(INTERCOM_MESSENGER_FLOW.toastErrorMarkOnboarded);
		},
	});

	// Fires when the messenger is dismissed (polling, postMessage, or user action).
	const handleIntercomHide = useCallback(() => {
		if (hideEventTriggered.current) return; // Prevent multiple calls

		hideEventTriggered.current = true;
		isIntercomOpen.current = false;

		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		if (INTERCOM_MESSENGER_FLOW.markCompletedOnClose && !onboardingCompleted && user && tenant) {
			updateTenantOnIntercomClose();
		}

		if (
			INTERCOM_MESSENGER_FLOW.trackGtagEvents &&
			typeof window !== 'undefined' &&
			typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === 'function'
		) {
			(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', INTERCOM_MESSENGER_FLOW.gtagClosedEvent, {
				user_id: user?.id,
				tenant_id: user?.tenant?.id,
				onboarding_completed: onboardingCompleted,
			});
		}

		if (INTERCOM_MESSENGER_FLOW.persistMessengerSeenToStorage && typeof window !== 'undefined') {
			localStorage.setItem(INTERCOM_MESSENGER_FLOW.messengerSeenStorageKey, 'true');
		}
	}, [user, tenant, updateTenantOnIntercomClose]);

	const handleIntercomShow = useCallback(() => {
		isIntercomOpen.current = true;
		hideEventTriggered.current = false;

		// Analytics when the messenger becomes visible
		if (
			INTERCOM_MESSENGER_FLOW.trackGtagEvents &&
			typeof window !== 'undefined' &&
			typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === 'function'
		) {
			(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', INTERCOM_MESSENGER_FLOW.gtagOpenedEvent, {
				user_id: user?.id,
				tenant_id: user?.tenant?.id,
			});
		}
	}, [user]);

	// Poll for Intercom state changes
	useEffect(() => {
		if (!isInitialized.current) return;

		const checkIntercomState = () => {
			try {
				// @ts-expect-error - Intercom types don't include messenger
				const isVisible = window.Intercom('isVisible');

				if (isVisible && !isIntercomOpen.current) {
					// Messenger opened (e.g. programmatic show)
					handleIntercomShow();
				} else if (!isVisible && isIntercomOpen.current && !hideEventTriggered.current) {
					// Visible → hidden without hide handler firing yet
					handleIntercomHide();
				}
			} catch {
				// Intercom might not be ready yet
			}
		};

		const interval = setInterval(checkIntercomState, INTERCOM_MESSENGER_FLOW.statePollIntervalMs);

		return () => {
			clearInterval(interval);
		};
	}, [handleIntercomShow, handleIntercomHide]);

	// Initialize Intercom with user data (`app_id` from env via config.intercom)
	useEffect(() => {
		if (!user || isInitialized.current) return;

		Intercom({
			app_id: config.intercom.appId,
			user_id: user.id,
			name: user.tenant?.name,
			email: user.email,
			created_at: user.tenant?.created_at ? new Date(user.tenant.created_at).getTime() : undefined,
			hide_default_launcher: INTERCOM_MESSENGER_FLOW.hideDefaultLauncher,
		});

		isInitialized.current = true;

		// postMessage events from the Intercom embed (when supported)
		const handleMessage = (event: MessageEvent) => {
			if (event.data && typeof event.data === 'object') {
				if (event.data.type === 'intercom:hide' || event.data.type === 'hide') {
					handleIntercomHide();
				} else if (event.data.type === 'intercom:show' || event.data.type === 'show') {
					handleIntercomShow();
				}
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [user, handleIntercomHide, handleIntercomShow]);

	const resetTimer = useCallback(() => {
		if (!INTERCOM_MESSENGER_FLOW.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}

		// Schedule auto-open only while onboarding metadata is missing or not `'true'`
		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		if (!onboardingCompleted) {
			inactivityTimer.current = setTimeout(() => {
				openIntercom();
			}, INTERCOM_MESSENGER_FLOW.inactivityOpenDelayMs);
		}
	}, [tenant?.metadata, openIntercom]);

	// Inactivity timer: auto-open Intercom for users who have not completed onboarding (metadata not `'true'`)
	useEffect(() => {
		if (!INTERCOM_MESSENGER_FLOW.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
			inactivityTimer.current = null;
		}

		// Don't attach listeners until user and tenant are ready
		if (!user || isTenantLoading) {
			return;
		}

		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		if (onboardingCompleted) {
			return;
		}

		const activityEvents = INTERCOM_MESSENGER_FLOW.activityEvents;

		activityEvents.forEach((event) => {
			window.addEventListener(event, resetTimer, { passive: true });
		});

		// Start initial countdown; user activity resets the timer via listeners above
		resetTimer();

		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}

			activityEvents.forEach((event) => {
				window.removeEventListener(event, resetTimer);
			});
		};
	}, [user, tenant?.metadata, isTenantLoading, resetTimer]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
		};
	}, []);

	return (
		<Button size='sm' variant='outline' onClick={openIntercom}>
			<BotMessageSquare absoluteStrokeWidth />
			Help
		</Button>
	);
};

/** Renders nothing when Intercom is disabled or app id is missing (see `config.intercom`). */
const IntercomMessenger = () => {
	if (!isIntercomMessengerAvailable()) return null;
	return <IntercomMessengerImpl />;
};

export default IntercomMessenger;
