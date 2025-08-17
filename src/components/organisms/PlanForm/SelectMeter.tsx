import { SelectOption, SearchableSelect } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { Meter } from '@/models/Meter';
import { MeterApi } from '@/api/MeterApi';
import { useQuery } from '@tanstack/react-query';
import { FC } from 'react';

const fetchMeters = async () => {
	return await MeterApi.getAllActiveMeters();
};

interface Props {
	onChange: (value: Meter) => void;
	value?: string;
	error?: string;
	label?: string;
	placeholder?: string;
	description?: string;
	className?: string;
}

const SelectMeter: FC<Props> = ({
	onChange,
	value,
	error,
	label = 'Feature',
	placeholder = 'Select a metered feature',
	description,
	className,
}) => {
	const {
		data: metersData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchMeters1'],
		queryFn: fetchMeters,
	});

	if (isLoading) {
		return <div></div>;
	}

	if (isError) {
		return <div>Error</div>;
	}

	if (!metersData) {
		return <div>No meters found</div>;
	}

	const activeMeters: SelectOption[] = metersData.items.map((meter: Meter) => {
		return {
			label: meter.name,
			value: meter.id,
		};
	});

	return (
		<div className={cn('min-w-[200px]')}>
			<SearchableSelect
				className={className}
				error={error}
				value={value}
				onChange={(e: string) => onChange(metersData.items.find((meter: Meter) => meter.id === e) as Meter)}
				options={activeMeters}
				placeholder={placeholder}
				label={label}
				description={description}
			/>
		</div>
	);
};

export default SelectMeter;
