import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BotMessageSquare } from 'lucide-react';
import { Button } from '@/components/atoms';
import { getActiveSupportChatProvider, SUPPORT_CHAT_FLOW } from '@/config/support-chat';
import type { SupportChatProvider } from '@/models/SupportChat';
import { createSupportChatAdapter } from './adapters';
import { useSupportChat } from './useSupportChat';

/** Mounted only when a provider is configured. */
const SupportChatImpl = ({ provider }: { provider: SupportChatProvider }) => {
	const { t } = useTranslation('common');
	const flow = SUPPORT_CHAT_FLOW[provider];
	const adapter = useMemo(() => createSupportChatAdapter(provider, flow), [provider, flow]);
	const { open } = useSupportChat(adapter, flow);

	return (
		<Button size='sm' variant='outline' onClick={open}>
			<BotMessageSquare absoluteStrokeWidth />
			{t('chrome.help')}
		</Button>
	);
};

/** Renders nothing when no provider is enabled or its app id is missing. */
const SupportChat = () => {
	const provider = getActiveSupportChatProvider();
	if (!provider) return null;
	return <SupportChatImpl provider={provider} />;
};

export default SupportChat;
