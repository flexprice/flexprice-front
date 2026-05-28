export enum ConsentStatus {
	Accepted = 'accepted',
	Rejected = 'rejected',
}

export interface ConsentState {
	status: ConsentStatus | null;
	version: string | null;
}

export const CONSENT_VERSION = '2025-v1';
