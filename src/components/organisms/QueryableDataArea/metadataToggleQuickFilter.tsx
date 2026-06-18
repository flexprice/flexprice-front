import { Button } from '@/components/atoms';
import { FilterCondition } from '@/types/common/QueryBuilder';
import {
	getActiveMetadataValue,
	updateMetadataToggleFilters,
	type MetadataToggleQuickFilterConfig,
	type MetadataToggleQuickFilterOption,
} from '@/utils/queryBuilder/metadataToggleFilters';
import { useCallback, useMemo } from 'react';

export type { MetadataToggleQuickFilterConfig, MetadataToggleQuickFilterOption };

/** Preset for customer parent/child org hierarchy via `metadata.org_type`. */
export const createOrgTypeMetadataToggleQuickFilter = (labels: {
	parent: string;
	child: string;
	all?: string;
}): MetadataToggleQuickFilterConfig => ({
	metadataKey: 'org_type',
	options: [
		{ value: 'parent', label: labels.parent },
		{ value: 'child', label: labels.child },
	],
	allLabel: labels.all,
});

interface MetadataToggleQuickFilterProps {
	config: MetadataToggleQuickFilterConfig;
	filters: FilterCondition[];
	setFilters: (filters: FilterCondition[] | ((prev: FilterCondition[]) => FilterCondition[])) => void;
}

export const MetadataToggleQuickFilter = ({ config, filters, setFilters }: MetadataToggleQuickFilterProps) => {
	const metadataKey = config.metadataKey ?? 'org_type';
	const allowedValues = useMemo(() => new Set(config.options.map((option) => option.value)), [config.options]);
	const activeValue = getActiveMetadataValue(filters, metadataKey, allowedValues);

	const onToggle = useCallback(
		(value: string) => {
			setFilters((prev) => updateMetadataToggleFilters(prev, config, value));
		},
		[config, setFilters],
	);

	const onClear = useCallback(() => {
		setFilters((prev) => updateMetadataToggleFilters(prev, config));
	}, [config, setFilters]);

	return (
		<div className='flex items-center gap-2' role='group' aria-label={config.allLabel ?? metadataKey}>
			{config.allLabel ? (
				<Button variant={activeValue == null ? 'default' : 'outline'} size='sm' aria-pressed={activeValue == null} onClick={onClear}>
					{config.allLabel}
				</Button>
			) : null}
			{config.options.map((option) => (
				<Button
					key={option.value}
					variant={activeValue === option.value ? 'default' : 'outline'}
					size='sm'
					aria-pressed={activeValue === option.value}
					onClick={() => onToggle(option.value)}>
					{option.label}
				</Button>
			))}
		</div>
	);
};
