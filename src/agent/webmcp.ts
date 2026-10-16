import { brandConfig } from '@/config/branding';
import { config } from '@/config/config';
import { docsUrl } from '@/config/docs';
type ModelContextNavigator = Navigator & {
	modelContext?: {
		provideContext: (ctx: { tools: unknown[] }) => void;
	};
};

export function registerWebMCPTools() {
	if (typeof navigator === 'undefined') return;
	const nav = navigator as ModelContextNavigator;
	if (!nav.modelContext?.provideContext) return;

	nav.modelContext.provideContext({
		tools: [
			{
				name: 'get_flexprice_app_info',
				description:
					'Returns metadata about the billing dashboard the user is currently viewing: product name, build version, and canonical documentation and API URLs.',
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				execute: async () => ({
					name: `${brandConfig.name} Dashboard`,
					version: __APP_VERSION__,
					docs: docsUrl(),
					api: config.api.baseUrl,
				}),
			},
		],
	});
}
