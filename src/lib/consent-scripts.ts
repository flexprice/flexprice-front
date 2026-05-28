import posthog from 'posthog-js';
import { ConsentStatus } from '@/types/consent';
import type { User } from '@/models';

export function scheduleIdle(cb: () => void): void {
	if (typeof requestIdleCallback !== 'undefined') {
		requestIdleCallback(cb, { timeout: 2000 });
	} else {
		setTimeout(cb, 0);
	}
}

export function applyConsentDecision(status: ConsentStatus, user?: User): void {
	if (status === ConsentStatus.Accepted) {
		posthog.opt_in_capturing();
	} else {
		posthog.opt_out_capturing();
	}

	if (status === ConsentStatus.Accepted && user && window.Reo) {
		window.Reo.identify({
			username: user.email,
			type: 'email',
			firstname: user.name || '',
			company: user.tenant?.name || '',
		});
	}
}
