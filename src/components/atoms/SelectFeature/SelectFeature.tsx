import { SelectOption } from '@/components/atoms/Select';
import AsyncSearchableSelect from '@/components/atoms/Select/AsyncSearchableSelect';
import { cn } from '@/lib/utils';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import FeatureApi from '@/api/FeatureApi';
import { useQuery } from '@tanstack/react-query';
import { Gauge, Settings2, SquareCheckBig, Wrench } from 'lucide-react';
import { FC, useMemo } from 'react';
import { ENTITY_STATUS } from '@/models/base';
import { useTranslation } from 'react-i18next';

interface Props {
	onChange: (value: Feature) => void;
	value?: string;
	error?: string;
	label?: string;
	placeholder?: string;
	description?: string;
	className?: string;
	disabledFeatures?: string[];
	featureTypes?: FEATURE_TYPE[];
	/** Popover side positioning - where the dropdown appears relative to the trigger */
	popoverSide?: 'top' | 'bottom' | 'left' | 'right';
	/** Popover align positioning */
	popoverAlign?: 'start' | 'center' | 'end';
}

export const getFeatureIcon = (featureType: string) => {
	const className = 'size-4 opacity-80 text-muted-foreground';
	if (featureType === FEATURE_TYPE.BOOLEAN) {
		return <SquareCheckBig className={className} />;
	} else if (featureType === FEATURE_TYPE.METERED) {
		return <Gauge className={className} />;
	} else if (featureType === FEATURE_TYPE.STATIC) {
		return <Wrench className={className} />;
	} else if (featureType === FEATURE_TYPE.CONFIG) {
		return <Settings2 className={className} />;
	}
};

const SelectFeature: FC<Props> = ({
	onChange,
	value,
	error,
	label: labelProp,
	placeholder: placeholderProp,
	description,
	className,
	disabledFeatures,
	featureTypes = [FEATURE_TYPE.METERED, FEATURE_TYPE.BOOLEAN, FEATURE_TYPE.STATIC, FEATURE_TYPE.CONFIG],
	popoverSide = 'bottom',
	popoverAlign = 'start',
}) => {
	const { t } = useTranslation('common');
	const label = labelProp ?? t('features.title');
	const placeholder = placeholderProp ?? t('features.selectFeature');
	// Fetch the selected feature if value is provided (for initial display)
	const { data: selectedFeatureData, isLoading: isLoadingSelected } = useQuery({
		queryKey: ['fetchFeatureById', value],
		queryFn: () => (value ? FeatureApi.getFeatureById(value) : null),
		enabled: !!value,
		staleTime: 30000,
	});

	// Create search function that queries backend
	const searchFeatures = async (query: string): Promise<Array<SelectOption & { data: Feature }>> => {
		const response = await FeatureApi.listFeatures({
			status: ENTITY_STATUS.PUBLISHED,
			limit: 50,
			name_contains: query || undefined,
		});

		// Filter by feature types
		const filteredFeatures = response.items.filter((feature: Feature) => featureTypes.includes(feature.type));

		// Map to SelectOption format with Feature data
		return filteredFeatures
			.map((feature: Feature) => ({
				value: feature.id,
				label: feature.name,
				description: feature.description,
				suffixIcon: getFeatureIcon(feature.type),
				disabled: disabledFeatures?.includes(feature.id),
				data: feature,
			}))
			.sort((a, b) => {
				if (a.disabled && !b.disabled) return 1;
				if (!a.disabled && b.disabled) return -1;
				return 0;
			});
	};

	// Current value as Feature object (for AsyncSearchableSelect)
	const currentValue = useMemo<Feature | undefined>(() => {
		if (selectedFeatureData && value) {
			return selectedFeatureData;
		}
		return undefined;
	}, [selectedFeatureData, value]);

	// Extractors for Feature objects
	const extractors = {
		valueExtractor: (feature: Feature) => feature.id,
		labelExtractor: (feature: Feature) => feature.name,
		descriptionExtractor: (feature: Feature) => feature.description,
	};

	// Handle loading state for initial feature fetch
	if (value && isLoadingSelected) {
		return <div className={cn('min-w-[200px]')}></div>;
	}

	return (
		<div className={cn('min-w-[200px]')}>
			<AsyncSearchableSelect<Feature>
				search={{
					searchFn: searchFeatures,
					debounceTime: 300,
					placeholder: t('features.searchPlaceholder'),
				}}
				extractors={extractors}
				display={{
					placeholder,
					label,
					description,
					error,
					className,
					side: popoverSide,
					align: popoverAlign,
				}}
				options={{
					noOptionsText: t('features.noFeaturesAddedYet'),
					emptyText: t('features.noneFound'),
					hideSelectedTick: true,
				}}
				value={currentValue}
				onChange={(feature) => {
					if (feature) {
						onChange(feature);
					}
					// If feature is undefined (deselected), we don't call onChange
					// to maintain backward compatibility with the original behavior
				}}
			/>
		</div>
	);
};

export default SelectFeature;
