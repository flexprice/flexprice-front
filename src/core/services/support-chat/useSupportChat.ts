import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import TenantApi from '@/api/TenantApi';
import type { SupportChatFlowConfig } from '@/config/support-chat';
import { CommandPaletteActionId, getCommandPaletteActionEventName } from '@/core/actions';
import { errorLogger } from '@/core/services/error/ErrorLoggingService';
import useUser from '@/hooks/useUser';
import { SupportChatStatus, SupportChatStorageValue, SupportChatVisibility } from '@/models/SupportChat';
import { TenantMetadataFlag, TenantMetadataKey } from '@/models/Tenant';
import type { SupportChatAdapter } from './SupportChatAdapter';
import { refetchQueries } from '../tanstack/ReactQueryProvider';

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
	if (typeof window === 'undefined') return null;
	const candidate = (window as unknown as { gtag?: GtagFn }).gtag;
	return typeof candidate === 'function' ? candidate : null;
}

/** Every provider-independent messenger behaviour. The adapter only identifies, opens, and reports visibility. */
export function useSupportChat(adapter: SupportChatAdapter, flow: SupportChatFlowConfig) {
	const { user } = useUser();

	// Primitives, not the `user` object: a refetch returns a fresh reference and would re-init the SDK.
	const userId = user?.id;
	const userEmail = user?.email;
	const userName = user?.name;
	const tenantId = user?.tenant?.id;
	const tenantName = user?.tenant?.name;
	const tenantCreatedAt = user?.tenant?.created_at;

	// Falls back to the tenant name, which was the only name sent before Pylon.
	const displayName = userName ?? tenantName;

	const visibility = useRef<SupportChatVisibility>(SupportChatVisibility.Unknown);
	const status = useRef<SupportChatStatus>(SupportChatStatus.Idle);
	const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant', tenantId],
		queryFn: async () => {
			return await TenantApi.getTenantById(tenantId ?? '');
		},
		enabled: !!tenantId,
	});

	const { mutate: markTenantOnboarded } = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: tenant?.name || '',
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: TenantMetadataFlag.True,
				},
			}),
		onSuccess: async () => {
			await refetchQueries(['user', 'tenant']);
			toast.success(flow.toastSuccessMarkOnboarded);
		},
		onError: (error: Error) => {
			errorLogger.logError(error, undefined, { scope: 'support-chat', action: 'mark-tenant-onboarded' });
			toast.error(flow.toastErrorMarkOnboarded);
		},
	});

	const isOnboardingCompleted = useCallback(() => {
		return tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED] === TenantMetadataFlag.True;
	}, [tenant?.metadata]);

	const handleShow = useCallback(() => {
		if (visibility.current === SupportChatVisibility.Open) return;
		visibility.current = SupportChatVisibility.Open;

		if (flow.trackGtagEvents) {
			getGtag()?.('event', flow.gtagOpenedEvent, {
				user_id: userId,
				tenant_id: tenantId,
			});
		}
	}, [flow.trackGtagEvents, flow.gtagOpenedEvent, userId, tenantId]);

	const handleHide = useCallback(() => {
		// Only counts if we saw it open; also collapses repeated hide events into one close.
		if (visibility.current !== SupportChatVisibility.Open) return;
		visibility.current = SupportChatVisibility.Closed;

		const onboardingCompleted = isOnboardingCompleted();

		if (flow.markCompletedOnClose && !onboardingCompleted && userId && tenant) {
			markTenantOnboarded();
		}

		if (flow.trackGtagEvents) {
			getGtag()?.('event', flow.gtagClosedEvent, {
				user_id: userId,
				tenant_id: tenantId,
				onboarding_completed: onboardingCompleted,
			});
		}

		if (flow.persistMessengerSeenToStorage && typeof window !== 'undefined') {
			localStorage.setItem(flow.messengerSeenStorageKey, SupportChatStorageValue.Seen);
		}
	}, [
		flow.markCompletedOnClose,
		flow.trackGtagEvents,
		flow.gtagClosedEvent,
		flow.persistMessengerSeenToStorage,
		flow.messengerSeenStorageKey,
		isOnboardingCompleted,
		markTenantOnboarded,
		tenant,
		userId,
		tenantId,
	]);

	// Stable indirection so the init effect does not re-run when the handlers' identity changes.
	const handleShowRef = useRef(handleShow);
	const handleHideRef = useRef(handleHide);
	useEffect(() => {
		handleShowRef.current = handleShow;
		handleHideRef.current = handleHide;
	}, [handleShow, handleHide]);

	const open = useCallback(() => {
		if (status.current !== SupportChatStatus.Ready) return;
		adapter.show();
	}, [adapter]);

	// Boot the provider and wire visibility events. Rebinds on identity change without
	// disposing the adapter — dispose() is terminal (see effect below) and must fire once.
	useEffect(() => {
		if (!userId) return;

		let cancelled = false;
		status.current = SupportChatStatus.Initializing;

		const unsubscribe = adapter.subscribe({
			onShow: () => handleShowRef.current(),
			onHide: () => handleHideRef.current(),
		});

		adapter
			.init({
				id: userId,
				email: userEmail,
				name: displayName,
				createdAt: tenantCreatedAt ? new Date(tenantCreatedAt).getTime() : undefined,
				tenantId,
			})
			.then(() => {
				if (!cancelled) status.current = SupportChatStatus.Ready;
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				status.current = SupportChatStatus.Failed;
				errorLogger.logError(error instanceof Error ? error : new Error(String(error)), undefined, {
					scope: 'support-chat',
					action: 'init',
				});
			});

		return () => {
			cancelled = true;
			unsubscribe();
		};
	}, [adapter, userId, userEmail, displayName, tenantCreatedAt, tenantId]);

	// Tied only to the adapter instance, so this fires once — on unmount, or if the
	// memoized adapter is ever replaced — never on an identity-only re-run above.
	useEffect(() => {
		return () => {
			adapter.dispose();
		};
	}, [adapter]);

	// Open from the command palette (Cmd+K → Open <provider>).
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.OpenIntercom);
		const handler = () => open();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [open]);

	const resetInactivityTimer = useCallback(() => {
		if (!flow.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}

		if (!isOnboardingCompleted()) {
			inactivityTimer.current = setTimeout(() => {
				open();
			}, flow.inactivityOpenDelayMs);
		}
	}, [flow.autoOpenOnInactivity, flow.inactivityOpenDelayMs, isOnboardingCompleted, open]);

	// Auto-open for users who have not completed onboarding.
	useEffect(() => {
		if (!flow.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
			inactivityTimer.current = null;
		}

		if (!userId || isTenantLoading || isOnboardingCompleted()) return;

		const activityEvents = flow.activityEvents;
		activityEvents.forEach((event) => {
			window.addEventListener(event, resetInactivityTimer, { passive: true });
		});

		resetInactivityTimer();

		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
			activityEvents.forEach((event) => {
				window.removeEventListener(event, resetInactivityTimer);
			});
		};
	}, [flow.autoOpenOnInactivity, flow.activityEvents, userId, isTenantLoading, isOnboardingCompleted, resetInactivityTimer]);

	return { open };
}
