import { config } from '@/config/config';
import SupportChatApi from '@/api/SupportChatApi';
import type { SupportChatFlowConfig } from '@/config/support-chat';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter } from '../SupportChatAdapter';
import { createIntercomAdapter } from './intercom';
import { createPylonAdapter } from './pylon';

/** Builds the adapter for the resolved provider. Exhaustive over `SupportChatProvider`. */
export function createSupportChatAdapter(provider: SupportChatProvider, flow: SupportChatFlowConfig): SupportChatAdapter {
	switch (provider) {
		case SupportChatProvider.Intercom:
			return createIntercomAdapter(config.intercom.appId, flow.statePollIntervalMs, flow.hideDefaultLauncher);
		case SupportChatProvider.Pylon:
			return createPylonAdapter(
				config.pylon.appId,
				// Undefined when the flag is off, so no request is made.
				config.pylon.identityVerificationEnabled
					? async () => (await SupportChatApi.getIdentityToken(SupportChatProvider.Pylon)).token
					: undefined,
			);
	}
}
