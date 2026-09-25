import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertTriangle, ChevronDown, CreditCard, MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalReturnUrl } from '../portalReturnUrl';
import { Button, Chip, Dialog } from '@/components/atoms';
import { DropdownMenu } from '@/components/molecules';
import { refetchPortalQueries } from '../refetchPortalQueries';
import type { PaymentGatewayType, ProviderSavedPaymentMethods, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import usePortalIntegrations from '../usePortalIntegrations';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import CheckoutLinkDialog from './CheckoutLinkDialog';
import EmptyState from '../EmptyState';
import PortalSection from '../PortalSection';
import PortalRow, { PortalRows } from '../PortalRow';

interface PaymentMethodsWidgetProps {
	label?: string;
}

/** Renders a card's expiry as MM/YY, or null when the gateway did not report one. */
const formatExpiry = (month?: number, year?: number) => {
	if (!month || !year) return null;
	return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
};

interface MethodRowProps {
	method: SavedPaymentMethod;
	canSetDefault: boolean;
	onSetDefault: (method: SavedPaymentMethod) => void;
	onDelete: (method: SavedPaymentMethod) => void;
	isBusy: boolean;
}

const MethodRow = ({ method, canSetDefault, onSetDefault, onDelete, isBusy }: MethodRowProps) => {
	const { t } = useTranslation('customer-portal');
	const expiry = formatExpiry(method.card?.exp_month, method.card?.exp_year);
	const isExpired = method.status === 'EXPIRED';
	// Shared by the visible title and the row menu's accessible name, so the two
	// cannot drift.
	const described = method.card?.last4
		? t('paymentMethods.cardLabel', { brand: method.card.brand ?? 'card', last4: method.card.last4 })
		: method.id;

	return (
		<PortalRow
			icon={<CreditCard />}
			title={described}
			meta={expiry ? t('paymentMethods.expires', { expiry }) : undefined}
			trailing={
				<>
					{isExpired && <Chip label={t('paymentMethods.expired')} variant='failed' />}
					{method.is_default && <Chip label={t('paymentMethods.default')} variant='success' />}
					<Chip label={t(`paymentProviders.${method.provider}`, method.provider)} variant='default' />
					<DropdownMenu
						align='end'
						trigger={
							<button
								type='button'
								aria-label={t('paymentMethods.rowActions', { method: described })}
								className='rounded-md p-1.5 text-content-tertiary transition-colors hover:text-content'>
								<MoreHorizontal className='h-4 w-4' />
							</button>
						}
						options={[
							{
								label: t('paymentMethods.setDefault'),
								icon: <Star className='w-4 h-4' />,
								disabled: method.is_default || !canSetDefault || isExpired || isBusy,
								// Kept visible and explained rather than hidden: a missing item leaves
								// the customer wondering whether the portal can do this at all.
								disabledReason: method.is_default
									? t('paymentMethods.alreadyDefault')
									: !canSetDefault
										? t('paymentMethods.setDefaultUnsupported')
										: isExpired
											? t('paymentMethods.expiredCannotDefault')
											: undefined,
								onSelect: () => onSetDefault(method),
							},
							{
								label: t('paymentMethods.remove'),
								icon: <Trash2 className='w-4 h-4' />,
								disabled: isBusy,
								onSelect: () => onDelete(method),
							},
						]}
					/>
				</>
			}
		/>
	);
};

const ProviderGroup = ({ group, children }: { group: ProviderSavedPaymentMethods; children: React.ReactNode }) => {
	const { t } = useTranslation('customer-portal');

	if (group.error) {
		return (
			<div className='flex items-start gap-2 px-5 py-3.5'>
				<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-danger' />
				<div>
					<p className='text-sm text-content'>{t('paymentMethods.providerUnavailable')}</p>
					<p className='mt-0.5 text-xs text-content-tertiary'>{group.error.message}</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

/**
 * Saved payment methods, with provider tabs and attribution.
 */
const PaymentMethodsWidget = ({ label }: PaymentMethodsWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const {
		supports,
		providersFor,
		defaultProviderFor,
		isLoading: integrationsLoading,
		isError: integrationsError,
	} = usePortalIntegrations();
	const [pendingDelete, setPendingDelete] = useState<SavedPaymentMethod | null>(null);
	const [setupUrl, setSetupUrl] = useState<string | null>(null);
	const [rawSelectedFilter, setSelectedFilter] = useState<PaymentGatewayType | 'all'>('all');
	const queryClient = useQueryClient();

	const canManage = supports('payment_method_management');
	// Capability is per provider: in a mixed-provider portal a global flag would
	// offer Set as default on a provider that cannot do it, and the call would fail.
	const setDefaultProviders = providersFor('set_default_method');
	const manageProviders = providersFor('payment_method_management');

	// If the selected provider drops out of manageProviders (e.g. it was disabled
	// after this widget mounted), fall back to "all" for this render instead of
	// leaving the Add button wired to a provider that no longer exists.
	const selectedFilter = rawSelectedFilter !== 'all' && !manageProviders.includes(rawSelectedFilter) ? 'all' : rawSelectedFilter;

	const { data, isLoading, isError } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canManage,
	});

	const { mutate: addMethod, isPending: isAdding } = useMutation({
		mutationFn: (provider: PaymentGatewayType) =>
			CustomerPortalApi.addPaymentMethod({
				payment_provider: provider,
				success_url: portalReturnUrl(),
				cancel_url: portalReturnUrl(),
			}),
		onSuccess: async (response) => {
			// A provider that vaults server-to-server returns type 'none' — there is
			// nothing to redirect to, so refresh instead of waiting for a return trip.
			if (response.action.type === 'redirect' && response.action.url) {
				// A new tab, not this one: navigating away would unmount the portal, so a
				// customer who abandons the provider's page has nothing to come back to.
				// The link is shown as well, because the open runs in an async callback
				// rather than the click and a popup blocker can stop it. Both paths refuse
				// a non-http(s) scheme — the URL is an unconstrained API string.
				setSetupUrl(response.action.url);
				openPaymentUrl(response.action.url);
				return;
			}
			toast.success(t('paymentMethods.added'));
			await refetchPortalQueries(['portal-payment-methods']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.addPaymentMethod')),
	});

	const { mutate: setDefault, isPending: isSettingDefault } = useMutation({
		mutationFn: (method: SavedPaymentMethod) =>
			CustomerPortalApi.setDefaultPaymentMethod({ payment_provider: method.provider, payment_method_id: method.id }),
		onSuccess: (updated) => {
			toast.success(t('paymentMethods.defaultUpdated'));
			// The response is the gateway re-read after the write, so refetching here
			// would only ask the same question twice.
			queryClient.setQueryData(portalPaymentMethodsQueryKey, updated);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.setDefaultPaymentMethod')),
	});

	const { mutate: deleteMethod, isPending: isDeleting } = useMutation({
		mutationFn: (method: SavedPaymentMethod) =>
			CustomerPortalApi.deletePaymentMethod({ payment_provider: method.provider, payment_method_id: method.id }),
		onSuccess: (updated) => {
			toast.success(t('paymentMethods.removed'));
			setPendingDelete(null);
			queryClient.setQueryData(portalPaymentMethodsQueryKey, updated);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.deletePaymentMethod')),
	});

	const groups = data?.providers ?? [];
	const totalCount = groups.reduce((acc, g) => acc + g.items.length, 0);
	const hasAnyMethod = totalCount > 0;
	const isBusy = isSettingDefault || isDeleting;
	const defaultAddProvider = defaultProviderFor('payment_method_management');

	// An integrations failure is not the same as a provider that cannot manage
	// methods — saying "not available" would state something we do not know.
	if (integrationsError) {
		return (
			<PortalSection icon={<CreditCard />} title={label ?? t('paymentMethods.title')}>
				<EmptyState icon={<AlertTriangle />} title={t('paymentMethods.providerUnavailable')} description={t('paymentMethods.retryHint')} />
			</PortalSection>
		);
	}

	if (!integrationsLoading && !canManage) {
		return (
			<PortalSection icon={<CreditCard />} title={label ?? t('paymentMethods.title')}>
				<EmptyState
					icon={<CreditCard />}
					title={t('paymentMethods.unsupportedTitle')}
					description={t('paymentMethods.unsupportedDescription')}
				/>
			</PortalSection>
		);
	}

	const renderAddButton = () => {
		if (selectedFilter !== 'all') {
			return (
				<Button size='sm' onClick={() => addMethod(selectedFilter)} isLoading={isAdding} prefixIcon={<Plus />}>
					{t('paymentMethods.add')}
				</Button>
			);
		}

		if (manageProviders.length > 1) {
			return (
				<DropdownMenu
					align='end'
					trigger={
						<Button size='sm' isLoading={isAdding} prefixIcon={<Plus />}>
							{t('paymentMethods.add')}
						</Button>
					}
					options={manageProviders.map((provider) => ({
						label: t('paymentMethods.addForProvider', { provider: t(`paymentProviders.${provider}`, provider) }),
						onSelect: () => addMethod(provider),
					}))}
				/>
			);
		}

		if (defaultAddProvider) {
			return (
				<Button size='sm' onClick={() => addMethod(defaultAddProvider)} isLoading={isAdding} prefixIcon={<Plus />}>
					{t('paymentMethods.add')}
				</Button>
			);
		}

		return null;
	};

	const renderFilterDropdown = () => {
		if (!canManage || manageProviders.length <= 1) {
			return null;
		}

		const currentLabel =
			selectedFilter === 'all'
				? `${t('paymentMethods.allProviders', 'All providers')} (${totalCount})`
				: `${t(`paymentProviders.${selectedFilter}`, selectedFilter)} (${groups.find((g) => g.provider === selectedFilter)?.items.length ?? 0})`;

		return (
			<DropdownMenu
				align='end'
				trigger={
					<Button
						variant='outline'
						size='sm'
						className='h-8 text-xs font-normal text-content-secondary hover:text-content'
						suffixIcon={<ChevronDown className='size-3.5 opacity-70' />}>
						{currentLabel}
					</Button>
				}
				options={[
					{
						label: `${t('paymentMethods.allProviders', 'All providers')} (${totalCount})`,
						onSelect: () => setSelectedFilter('all'),
					},
					...manageProviders.map((provider) => {
						const count = groups.find((g) => g.provider === provider)?.items.length ?? 0;
						return {
							label: `${t(`paymentProviders.${provider}`, provider)} (${count})`,
							onSelect: () => setSelectedFilter(provider),
						};
					}),
				]}
			/>
		);
	};

	const renderHeaderActions = () => {
		const filterDropdown = renderFilterDropdown();
		const addButton = renderAddButton();

		if (!filterDropdown && !addButton) return null;

		return (
			<div className='flex items-center gap-2'>
				{filterDropdown}
				{addButton}
			</div>
		);
	};

	return (
		<PortalSection
			flush
			icon={<CreditCard />}
			title={label ?? t('paymentMethods.title')}
			description={t('paymentMethods.description')}
			action={renderHeaderActions()}>
			<CheckoutLinkDialog url={setupUrl} purpose='setup' onOpenChange={(open) => !open && setSetupUrl(null)} />
			<Dialog
				isOpen={pendingDelete !== null}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				title={t('paymentMethods.removeTitle')}
				description={t('paymentMethods.removeConfirm')}>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={() => setPendingDelete(null)} disabled={isDeleting}>
						{t('paymentMethods.cancel')}
					</Button>
					<Button variant='destructive' onClick={() => pendingDelete && deleteMethod(pendingDelete)} isLoading={isDeleting}>
						{t('paymentMethods.remove')}
					</Button>
				</div>
			</Dialog>

			{isLoading || integrationsLoading ? (
				<div className='animate-pulse space-y-3 px-5 py-4'>
					{[1, 2].map((i) => (
						<div key={i} className='h-12 rounded bg-surface-subtle'></div>
					))}
				</div>
			) : isError ? (
				<EmptyState icon={<AlertTriangle />} title={t('errors.loadPaymentMethods')} description={t('paymentMethods.retryHint')} />
			) : selectedFilter !== 'all' ? (
				(() => {
					const activeGroup = groups.find((g) => g.provider === selectedFilter);
					if (activeGroup?.error) {
						return <ProviderGroup group={activeGroup}>{null}</ProviderGroup>;
					}
					if (!activeGroup || activeGroup.items.length === 0) {
						const providerName = t(`paymentProviders.${selectedFilter}`, selectedFilter);
						return (
							<EmptyState
								icon={<CreditCard />}
								title={t('paymentMethods.providerEmptyTitle', { provider: providerName })}
								description={t('paymentMethods.providerEmptyDescription', { provider: providerName })}
								action={{
									label: t('paymentMethods.addForProvider', { provider: providerName }),
									onClick: () => addMethod(selectedFilter),
								}}
							/>
						);
					}
					return (
						<PortalRows>
							{activeGroup.items.map((method) => (
								<MethodRow
									key={`${activeGroup.provider}:${method.id}`}
									method={method}
									canSetDefault={setDefaultProviders.includes(activeGroup.provider)}
									onSetDefault={setDefault}
									onDelete={setPendingDelete}
									isBusy={isBusy}
								/>
							))}
						</PortalRows>
					);
				})()
			) : hasAnyMethod || groups.some((g) => g.error) ? (
				<PortalRows>
					{groups.map((group) => (
						<ProviderGroup key={group.provider} group={group}>
							{group.items.map((method) => (
								<MethodRow
									key={`${group.provider}:${method.id}`}
									method={method}
									canSetDefault={setDefaultProviders.includes(group.provider)}
									onSetDefault={setDefault}
									onDelete={setPendingDelete}
									isBusy={isBusy}
								/>
							))}
						</ProviderGroup>
					))}
				</PortalRows>
			) : (
				<EmptyState icon={<CreditCard />} title={t('paymentMethods.emptyTitle')} description={t('paymentMethods.emptyDescription')} />
			)}
		</PortalSection>
	);
};

export default PaymentMethodsWidget;
