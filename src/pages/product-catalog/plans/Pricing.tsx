import { Page, AddButton } from '@/components/atoms';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import toast from 'react-hot-toast';
import { ApiDocsContent, PlanDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useTranslation } from 'react-i18next';
import { PricingContainer } from '@/pricing';
import { PlanType } from '@/constants/planTypes';

export { PlanType };

function PricingWidgetCanvas({ children }: { children: ReactNode }) {
	return (
		<div className='pricing-preview-canvas w-full overflow-x-hidden rounded-[var(--fp-radius-lg)] border border-line'>
			<div className='px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-16'>{children}</div>
		</div>
	);
}

/**
 * Dashboard pricing page — thin wrapper around the shared, exportable pricing widget
 * (`@/pricing`). All fetching, filtering and rendering lives in `PricingContainer`; this page
 * only supplies the dashboard chrome (Page heading, API docs, empty-state) and wires
 * dashboard-specific navigation.
 */
const PricingPage = () => {
	const { t } = useTranslation(['catalog']);
	const navigate = useNavigate();
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const renderEmpty = () => (
		<div className='pricing-preview-canvas flex min-h-[min(56vh,36rem)] w-full flex-col overflow-x-hidden rounded-[var(--fp-radius-lg)] border border-line'>
			<div className='flex flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-8 sm:py-12 md:px-10 md:py-16'>
				<p className='text-[1.25rem] font-medium leading-normal text-content-secondary'>{t('catalog:plans.pricing.noWidget')}</p>
				<p className='mt-2 max-w-md text-[1rem] font-normal leading-normal text-content-subtle'>
					{t('catalog:plans.pricing.noWidgetHint')}
				</p>
			</div>
		</div>
	);

	return (
		<>
			<PricingContainer
				onSelectPlan={(planId) => navigate(`${RouteNames.plan}/${planId}`)}
				getFeatureHref={(featureId) => `${RouteNames.featureDetails}/${featureId}`}
				renderEmpty={renderEmpty}
				onError={() => toast.error(t('catalog:plans.pricing.fetchError'))}>
				{({ status, filters, content }) => (
					<Page
						headingClassName='items-center'
						heading={t('plans.pricing.widgetsPageTitle')}
						headingCTA={status === 'empty' ? <AddButton onClick={() => setPlanDrawerOpen(true)} /> : filters}>
						<ApiDocsContent tags={API_DOCS_TAGS.PlansAndPrices} />
						{status === 'empty' ? content : <PricingWidgetCanvas>{content}</PricingWidgetCanvas>}
					</Page>
				)}
			</PricingContainer>
			<PlanDrawer open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlansPricingCard']} />
		</>
	);
};

export default PricingPage;
