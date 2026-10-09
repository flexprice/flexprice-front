import { useTranslation } from 'react-i18next';
import FxOverridesSection from '@/components/molecules/FxOverridesSection';
import { PAGINATION_PREFIX } from '@/hooks/usePagination';

interface Props {
	customerId: string;
	isArchived: boolean;
}

/** A customer's FX overrides; the pair is a free choice. */
const CustomerFxOverridesSection = ({ customerId, isArchived }: Props) => {
	const { t } = useTranslation('customers');
	return (
		<FxOverridesSection
			scope='customer'
			scopeId={customerId}
			paginationPrefix={PAGINATION_PREFIX.CUSTOMER_FX_OVERRIDES}
			emptyText={t('tabPanels.information.fxOverrides.empty')}
			readOnly={isArchived}
		/>
	);
};

export default CustomerFxOverridesSection;
