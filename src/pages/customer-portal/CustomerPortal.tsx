import { useEffect, useMemo, useState, useCallback } from 'react';
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
import { portalInvoicesQueryKey } from '@/components/customer-portal/queryKeys';
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

// ─── Inner component — consumes PortalConfigContext ───────────────────────────

const CustomerPortalInner = () => {
	const { t } = useTranslation('customer-portal');
	const { config } = usePortalConfig();
	const hasTheme = !!config.theme;

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
			if (allInvoice && invoicesData !== undefined && (invoicesData.items?.length ?? 0) === 0) return false;

			return true;
		},
		[walletsData, invoicesData],
	);

	// Derive visible, sorted sections — filtered by data availability
	const visibleSections = useMemo(
		() => [...config.sections.filter((s) => s.enabled && isSectionVisible(s))].sort((a, b) => a.order - b.order),
		[config.sections, isSectionVisible],
	);

	const [activeSectionId, setActiveSectionId] = useState<string>('');

	// If the active section gets hidden (e.g. invoices data empty), fall back to first visible
	useEffect(() => {
		if (activeSectionId && !visibleSections.find((s) => s.id === activeSectionId)) {
			setActiveSectionId('');
		}
	}, [activeSectionId, visibleSections]);

	const activeSection = useMemo(() => {
		if (activeSectionId) return visibleSections.find((s) => s.id === activeSectionId);
		return visibleSections[0];
	}, [activeSectionId, visibleSections]);

	if (customerLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center' style={hasTheme ? { backgroundColor: 'var(--portal-bg)' } : undefined}>
				<Loader />
			</div>
		);
	}

	if (customerError || !customerData) return null;

	return (
		<div
			className={hasTheme ? 'min-h-screen' : 'min-h-screen bg-[#fafafa]'}
			style={hasTheme ? { backgroundColor: 'var(--portal-bg)' } : undefined}>
			<PortalHeader customer={customerData} />

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
				{/* Top-level Section Tab Bar */}
				<div className='mb-6'>
					<div
						className='flex space-x-1 rounded-[6px] p-1 w-fit'
						style={
							hasTheme
								? { backgroundColor: 'var(--portal-surface)', border: '1px solid var(--portal-border)' }
								: { backgroundColor: 'white', border: '1px solid #E9E9E9' }
						}>
						{visibleSections.map((section) => {
							const isActive = activeSection?.id === section.id;
							return (
								<button
									key={section.id}
									onClick={() => setActiveSectionId(section.id)}
									className={cn(
										'px-4 py-2 text-sm font-medium rounded-[6px] transition-colors',
										!hasTheme && (isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'),
									)}
									style={
										hasTheme
											? isActive
												? { backgroundColor: 'var(--portal-primary)', color: 'white' }
												: { color: 'var(--portal-text-secondary, #71717a)' }
											: undefined
									}>
									{section.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Active Section Content */}
				{activeSection && <SectionContent key={activeSection.id} section={activeSection} />}

				{/* Footer */}
				<div className='mt-12 pt-6 text-center' style={{ borderTop: `1px solid ${hasTheme ? 'var(--portal-border)' : '#E9E9E9'}` }}>
					<p className='text-xs text-zinc-400'>
						{t('footer.poweredBy')}{' '}
						<a
							href='https://flexprice.io'
							target='_blank'
							rel='noopener noreferrer'
							className='text-zinc-500 hover:text-zinc-700 transition-colors'>
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
