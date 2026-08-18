import StatusChip, { getFeatureTypeTone } from '@/components/atoms/StatusChip';
import { FEATURE_TYPE } from '@/models/Feature';
import i18n from 'i18next';

const CUSTOMERS_NS = 'customers';

function getFeatureTypeLabel(type: string): string {
	switch (type.toLocaleLowerCase()) {
		case FEATURE_TYPE.STATIC:
			return i18n.t('usageTable.featureTypes.static', { ns: CUSTOMERS_NS });
		case FEATURE_TYPE.METERED:
			return i18n.t('usageTable.featureTypes.metered', { ns: CUSTOMERS_NS });
		case FEATURE_TYPE.BOOLEAN:
			return i18n.t('usageTable.featureTypes.boolean', { ns: CUSTOMERS_NS });
		case FEATURE_TYPE.CONFIG:
			return i18n.t('usageTable.featureTypes.config', { ns: CUSTOMERS_NS, defaultValue: 'Config' });
		default:
			return i18n.t('usageTable.featureTypes.dash', { ns: CUSTOMERS_NS });
	}
}

export const getFeatureTypeChips = ({ type }: { type: string; showIcon?: boolean; showLabel?: boolean }) => {
	return <StatusChip tone={getFeatureTypeTone(type)} label={getFeatureTypeLabel(type)} />;
};
