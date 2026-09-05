import { useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { setRuntimeCredentials, clearRuntimeCredentials } from '@/core/axios/config';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Customer } from '@/models';
import { Loader } from '@/components/atoms';
import { PortalHeader } from '@/components/customer-portal';
import { PortalConfigProvider, usePortalConfig } from '@/context/PortalConfigContext';
import SectionContent from '@/components/customer-portal/SectionContent';
import useCheckoutReturn from '@/components/customer-portal/useCheckoutReturn';
import { portalInvoicesQueryKey } from '@/components/customer-portal/queryKeys';
import { isCustomerVisible } from '@/components/customer-portal/invoiceStatus';
import { SectionConfig } from '@/types/dto/PortalConfig';
import { cn } from '@/lib/utils';

/**
 * Customer Portal Page
 *
 * Out-of-auth-scope page (similar to Stripe's customer portal).
 * Auth is purely via the session token in the URL — no JWT, no env ID.
 *
 * Layout, theming, and sections are all driven by the PortalConfig fetched
 * from GET /v1/settings/customer_portal_config. Falls back to DEFAULT_PORTAL_CONFIG.
 */
interface CustomerPortalProps {
	token: string;
}

/** Query parameter remembering which section tab is open. */
const SECTION_PARAM = 'section';

// ─── Inner component — consumes PortalConfigContext ───────────────────────────

const CustomerPortalInner = () => {
	const { t } = useTranslation('customer-portal');
	const { config } = usePortalConfig();
	// Resolves a checkout the customer has just been redirected back from.
	useCheckoutReturn();

	const {
		data: customerData,
		isLoading: customerLoading,
		isError: customerError,
		error,
	} = useQuery<Customer>({
		queryKey: ['portal-customer'],
		queryFn: () => CustomerPortalApi.getCustomer(),
		retry: 1,
		staleTime: 0,
		gcTime: 0,
	});

	useEffect(() => {
		if (customerError) {
			const err = error as { error?: { message?: string }; message?: string };
			toast.error(err?.error?.message || err?.message || t('errors.fetchCustomer'));
		}
	}, [customerError, error, t]);

	// Pre-fetch wallets + invoices using the same query keys as the widgets
	// (React Query deduplicates — zero extra API calls)
	const { data: walletsData } = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	const { data: invoicesData } = useQuery({
		queryKey: portalInvoicesQueryKey,
		queryFn: () => CustomerPortalApi.getInvoices({ limit: 100, offset: 0 }),
	});

	// Hide a section only when ALL its enabled tabs depend on a single data source
	// that has loaded and returned empty. While loading (data === undefined), always show.
	const isSectionVisible = useCallback(
		(section: SectionConfig): boolean => {
			const enabledTypes = section.tabs.filter((t) => t.enabled).map((t) => t.type);
			const walletTypes = new Set(['wallet_balance', 'wallet_transactions']);
			const invoiceTypes = new Set(['invoices']);

			const allWallet = enabledTypes.length > 0 && enabledTypes.every((t) => walletTypes.has(t));
			const allInvoice = enabledTypes.length > 0 && enabledTypes.every((t) => invoiceTypes.has(t));

			if (allWallet && walletsData !== undefined && walletsData.length === 0) return false;
			// Counted the same way the tab lists them, or a customer with nothing but
			// drafts gets an Invoices tab that opens onto an empty list.
			if (allInvoice && invoicesData !== undefined && (invoicesData.items ?? []).filter(isCustomerVisible).length === 0) return false;

			return true;
		},
		[walletsData, invoicesData],
	);

	// Derive visible, sorted sections — filtered by data availability
	const visibleSections = useMemo(
		() => [...config.sections.filter((s) => s.enabled && isSectionVisible(s))].sort((a, b) => a.order - b.order),
		[config.sections, isSectionVisible],
	);

	// Held in the URL, not component state: a reload — which customers do after
	// paying — dropped them back on the first section regardless of where they
	// were. Deriving it also removes the need to reset when the chosen section
	// stops being visible (e.g. its data comes back empty); an id that no longer
	// matches simply falls through to the first visible one.
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedSectionId = searchParams.get(SECTION_PARAM);

	const activeSection = useMemo(
		() => visibleSections.find((s) => s.id === requestedSectionId) ?? visibleSections[0],
		[requestedSectionId, visibleSections],
	);

	const selectSection = useCallback(
		(id: string) => {
			const next = new URLSearchParams(searchParams);
			next.set(SECTION_PARAM, id);
			// Replace: switching tabs should not stack up history the back button
			// then has to walk through.
			setSearchParams(next, { replace: true });
		},
		[searchParams, setSearchParams],
	);

	if (customerLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-surface-subtle'>
				<Loader />
			</div>
		);
	}

	if (customerError || !customerData) return null;

	return (
		<div className='min-h-screen bg-surface-subtle'>
			<PortalHeader customer={customerData} />

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
				{/* Navigation, not a card: the bordered, padded container gave the tab bar
				    the same weight as the sections below it and left it floating on its
				    own. Only the active item carries a background now. */}
				<div className='mb-6 border-b border-line'>
					<div className='-mb-px flex items-center gap-1 pb-2'>
						{visibleSections.map((section) => {
							const isActive = activeSection?.id === section.id;
							return (
								<button
									key={section.id}
									onClick={() => selectSection(section.id)}
									className={cn(
										'rounded-md px-4 py-2 text-sm font-medium transition-colors',
										isActive ? 'bg-surface-subtle text-content' : 'text-content-secondary hover:bg-surface-subtle hover:text-content',
									)}>
									{section.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Active Section Content */}
				{activeSection && <SectionContent key={activeSection.id} section={activeSection} />}

				{/* Footer */}
				<div className='mt-12 border-t border-line pt-6 text-center'>
					<p className='text-xs text-content-tertiary'>
						{t('footer.poweredBy')}{' '}
						<a
							href='https://flexprice.io'
							target='_blank'
							rel='noopener noreferrer'
							className='text-content-secondary transition-colors hover:text-content'>
							{t('footer.brand')}
						</a>
					</p>
				</div>
			</motion.div>
		</div>
	);
};

// ─── Outer wrapper — sets up runtime credentials + context provider ───────────

const CustomerPortal = ({ token }: CustomerPortalProps) => {
	useEffect(() => {
		setRuntimeCredentials({ sessionToken: token });
		return () => clearRuntimeCredentials();
	}, [token]);

	return (
		<PortalConfigProvider token={token}>
			<CustomerPortalInner />
		</PortalConfigProvider>
	);
};

export default CustomerPortal;
