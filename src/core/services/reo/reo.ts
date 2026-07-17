import { config } from '@/config/config';

export function initReo(): void {
	if (!config.reo.enabled || !config.reo.clientId) return;
	const clientId = config.reo.clientId;
	const script = document.createElement('script');
	script.src = `https://static.reo.dev/${clientId}/reo.js`;
	script.defer = true;
	script.onload = () => {
		(window as Window & { Reo?: { init: (opts: { clientID: string }) => void } }).Reo?.init({ clientID: clientId });
	};
	document.head.appendChild(script);
}
