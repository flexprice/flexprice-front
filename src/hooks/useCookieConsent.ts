import { useState, useEffect, useRef } from 'react';
import useUser from '@/hooks/useUser';
import { UserApi } from '@/api/UserApi';
import { ConsentStatus, ConsentState, CONSENT_VERSION } from '@/types/consent';
import { applyConsentDecision, scheduleIdle } from '@/lib/consent-scripts';

const CONSENT_CACHE_KEY = 'fp_consent';

interface ConsentCache {
	status: ConsentStatus;
	version: string;
	cachedAt: string;
}

function readCache(): ConsentState {
	try {
		const raw = localStorage.getItem(CONSENT_CACHE_KEY);
		if (!raw) return { status: null, version: null };
		const parsed: ConsentCache = JSON.parse(raw);
		return { status: parsed.status, version: parsed.version };
	} catch {
		return { status: null, version: null };
	}
}

function writeCache(status: ConsentStatus, version: string): void {
	scheduleIdle(() => {
		localStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify({ status, version, cachedAt: new Date().toISOString() } satisfies ConsentCache));
	});
}

interface UseCookieConsentReturn {
	consentState: ConsentState;
	showBanner: boolean;
	accept: () => Promise<void>;
	reject: () => Promise<void>;
	isLoading: boolean;
}

const useCookieConsent = (): UseCookieConsentReturn => {
	const { user, loading: userLoading } = useUser();
	const [consentState, setConsentState] = useState<ConsentState>(readCache);
	const [isLoading, setIsLoading] = useState(false);
	const consentStateRef = useRef(consentState);

	useEffect(() => {
		consentStateRef.current = consentState;
	});

	useEffect(() => {
		if (!user) return;

		const backendStatus = user.metadata?.['consent_status'] as ConsentStatus | undefined;
		const backendVersion = user.metadata?.['consent_version'] ?? null;

		if (backendStatus) {
			setConsentState({ status: backendStatus, version: backendVersion });
			writeCache(backendStatus, backendVersion ?? CONSENT_VERSION);
			if (backendStatus === ConsentStatus.Rejected) {
				scheduleIdle(() => applyConsentDecision(backendStatus, user));
			}
		} else if (consentStateRef.current.status !== null) {
			// Cache has a value the backend doesn't know about — sync silently
			const cached = consentStateRef.current;
			scheduleIdle(() => {
				UserApi.updateMe({
					metadata: {
						consent_status: cached.status!,
						consent_version: cached.version ?? CONSENT_VERSION,
						consent_at: new Date().toISOString(),
					},
				});
			});
		}
	}, [user]);

	const showBanner = consentState.status === null && !userLoading && !!user;

	const accept = async (): Promise<void> => {
		const previous = consentState;
		setConsentState({ status: ConsentStatus.Accepted, version: CONSENT_VERSION });
		setIsLoading(true);
		scheduleIdle(() => applyConsentDecision(ConsentStatus.Accepted, user ?? undefined));
		try {
			await UserApi.updateMe({
				metadata: {
					consent_status: ConsentStatus.Accepted,
					consent_version: CONSENT_VERSION,
					consent_at: new Date().toISOString(),
				},
			});
			writeCache(ConsentStatus.Accepted, CONSENT_VERSION);
		} catch {
			setConsentState(previous);
		} finally {
			setIsLoading(false);
		}
	};

	const reject = async (): Promise<void> => {
		const previous = consentState;
		setConsentState({ status: ConsentStatus.Rejected, version: CONSENT_VERSION });
		setIsLoading(true);
		scheduleIdle(() => applyConsentDecision(ConsentStatus.Rejected, user ?? undefined));
		try {
			await UserApi.updateMe({
				metadata: {
					consent_status: ConsentStatus.Rejected,
					consent_version: CONSENT_VERSION,
					consent_at: new Date().toISOString(),
				},
			});
			writeCache(ConsentStatus.Rejected, CONSENT_VERSION);
		} catch {
			setConsentState(previous);
		} finally {
			setIsLoading(false);
		}
	};

	return { consentState, showBanner, accept, reject, isLoading };
};

export default useCookieConsent;
