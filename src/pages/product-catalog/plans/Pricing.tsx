import { Page, AddButton } from '@/components/atoms';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import toast from 'react-hot-toast';
import { ApiDocsContent, PlanDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useTranslation } from 'react-i18next';
import { PricingContainer } from '@/pricing';
import { PlanType } from '@/constants/planTypes';

export { PlanType };

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
		<div className='flex flex-col items-center mt-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full mb-16'>
				{[1, 2, 3].map((index) => (
					<div
						key={index}
						className='min-h-[260px] w-full rounded-2xl border-2 border-dashed border-line-slate-strong bg-gradient-to-b from-surface to-surface-cool/90 p-6 shadow-sm'
					/>
				))}
			</div>
			<div className='flex flex-col items-center'>
				<h2 className='font-regular text-[16px] leading-normal text-content-tertiary text-center mb-8'>
					{t('catalog:plans.pricing.noWidget')}
				</h2>
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
						{content}
					</Page>
				)}
			</PricingContainer>
			<PlanDrawer open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlansPricingCard']} />
		</>
	);
};

export default PricingPage;
