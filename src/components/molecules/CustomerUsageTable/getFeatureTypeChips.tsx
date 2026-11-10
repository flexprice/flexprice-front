import { Chip } from '@/components/atoms';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/featureIcon';
import { FEATURE_TYPE } from '@/models/Feature';
import i18n from 'i18next';

const CUSTOMERS_NS = 'customers';

export const getFeatureTypeChips = ({
	type,
	showIcon = false,
	showLabel = false,
}: {
	type: string;
	showIcon?: boolean;
	showLabel?: boolean;
}) => {
	const icon = getFeatureIcon(type);
	switch (type.toLocaleLowerCase()) {
		case FEATURE_TYPE.STATIC: {
			return (
				<Chip
					variant='default'
					icon={showIcon && icon}
					label={showLabel ? i18n.t('usageTable.featureTypes.static', { ns: CUSTOMERS_NS }) : undefined}
				/>
			);
		}
		case FEATURE_TYPE.METERED:
			return (
				<Chip
					textColor='rgb(var(--fp-chip-type-metered-text))'
					bgColor='rgb(var(--fp-chip-type-metered-bg))'
					icon={showIcon && icon}
					label={showLabel ? i18n.t('usageTable.featureTypes.metered', { ns: CUSTOMERS_NS }) : undefined}
				/>
			);
		case FEATURE_TYPE.BOOLEAN:
			return (
				<Chip
					textColor='rgb(var(--fp-chip-type-boolean-text))'
					bgColor='rgb(var(--fp-chip-type-boolean-bg))'
					icon={showIcon && icon}
					label={showLabel ? i18n.t('usageTable.featureTypes.boolean', { ns: CUSTOMERS_NS }) : undefined}
				/>
			);
		case FEATURE_TYPE.CONFIG:
			return (
				<Chip
					textColor='rgb(var(--fp-chip-type-config-text))'
					bgColor='rgb(var(--fp-chip-type-config-bg))'
					icon={showIcon && icon}
					label={showLabel ? i18n.t('usageTable.featureTypes.config', { ns: CUSTOMERS_NS, defaultValue: 'Config' }) : undefined}
				/>
			);
		default:
			return (
				<Chip
					textColor='rgb(var(--fp-chip-type-default-text))'
					bgColor='rgb(var(--fp-chip-type-default-bg))'
					icon={showIcon && icon}
					label={showLabel ? i18n.t('usageTable.featureTypes.dash', { ns: CUSTOMERS_NS }) : undefined}
				/>
			);
	}
};
