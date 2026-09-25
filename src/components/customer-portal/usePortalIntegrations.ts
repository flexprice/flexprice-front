import { useQuery } from '@tanstack/react-query';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import type { IntegrationCapabilityType, PaymentGatewayType } from '@/types/dto/CustomerPortalBilling';

export const portalIntegrationsQueryKey = ['portal-integrations'] as const;

/**
 * Which providers are connected and what each can do.
 *
 * The portal should not offer an action no connected provider supports — a Add
 * card button is noise on a tenant whose only gateway cannot vault. Capabilities
 * come from connection rows at read time, so they cannot drift from reality.
 */
const usePortalIntegrations = () => {
	const { data, isLoading, isError } = useQuery({
		queryKey: portalIntegrationsQueryKey,
		queryFn: () => CustomerPortalApi.getIntegrations(),
	});

	const integrations = data?.payment_integrations ?? [];

	/** Providers supporting a capability, defaults first so callers can take [0]. */
	const providersFor = (capability: IntegrationCapabilityType): PaymentGatewayType[] => {
		const matched = integrations
			.filter((integration) => integration.capabilities.some((c) => c.type === capability))
			.sort((a, b) => {
				const aDefault = a.capabilities.some((c) => c.type === capability && c.is_default);
				const bDefault = b.capabilities.some((c) => c.type === capability && c.is_default);
				return Number(bDefault) - Number(aDefault);
			})
			.map((integration) => integration.provider);
		return Array.from(new Set(matched));
	};

	const supports = (capability: IntegrationCapabilityType) => providersFor(capability).length > 0;

	/**
	 * Whether to offer an action, when hiding it outright would be worse than
	 * letting the backend refuse it.
	 *
	 * `supports` is false while the query is in flight and false if it failed, so
	 * gating a primary action on it hides that action whenever /integrations is
	 * slow or down — the customer simply loses the ability to pay. Only a loaded,
	 * successful response that names no provider is real evidence of absence.
	 */
	const maySupport = (capability: IntegrationCapabilityType) => isLoading || isError || supports(capability);

	return {
		integrations,
		isLoading,
		isError,
		providersFor,
		supports,
		maySupport,
		/** The provider to use when the customer is not asked to choose. */
		defaultProviderFor: (capability: IntegrationCapabilityType) => providersFor(capability)[0],
	};
};

export default usePortalIntegrations;
