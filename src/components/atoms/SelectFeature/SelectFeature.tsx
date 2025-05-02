import { SelectOption, Select } from '@/components/atoms';
import { cn } from '@/lib/utils';
import Feature, { FeatureType } from '@/models/Feature';
import FeatureApi from '@/api/FeatureApi';
import { useQuery } from '@tanstack/react-query';
import { Gauge, SquareCheckBig, Wrench } from 'lucide-react';
import { FC } from 'react';

const fetchFeatures = async () => {
	return await FeatureApi.getAllFeatures({
		status: 'published',
	});
};

interface Props {
	onChange: (value: Feature) => void;
	value?: string;
	error?: string;
	label?: string;
	placeholder?: string;
	description?: string;
	className?: string;
	disabledFeatures?: string[];
}

export const getFeatureIcon = (featureType: string) => {
	const className = 'size-4 opacity-80 text-muted-foreground';
	if (featureType === FeatureType.boolean) {
		return <SquareCheckBig className={className} />;
	} else if (featureType === FeatureType.metered) {
		return <Gauge className={className} />;
	} else if (featureType === FeatureType.static) {
		return <Wrench className={className} />;
	}
};

const SelectFeature: FC<Props> = ({
	onChange,
	value,
	error,
	label = 'Features',
	placeholder = 'Select feature',
	description,
	className,
	disabledFeatures,
}) => {
	const {
		data: featuresData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchFeatures1'],
		queryFn: fetchFeatures,
	});

	if (isLoading) {
		return <div></div>;
	}

	if (isError) {
		return <div>Error</div>;
	}

	if (!featuresData) {
		return <div>No Features found</div>;
	}

	const options = featuresData.items
		.map(
			(feature: Feature): SelectOption => ({
				value: feature.id,
				label: feature.name,
				suffixIcon: getFeatureIcon(feature.type),
				disabled: disabledFeatures?.includes(feature.id),
			}),
		)
		.sort((a, b) => {
			if (a.disabled && !b.disabled) return 1;
			if (!a.disabled && b.disabled) return -1;
			return 0;
		});

	return (
		<div className={cn('min-w-[200px]')}>
			<Select
				hideSelectedTick={true}
				className={className}
				error={error}
				value={value}
				noOptionsText='No features added yet'
				onChange={(e) => onChange(featuresData.items.find((feature) => feature.id === e) as Feature)}
				options={options}
				placeholder={placeholder}
				label={label}
				description={description}
			/>
		</div>
	);
};

export default SelectFeature;
