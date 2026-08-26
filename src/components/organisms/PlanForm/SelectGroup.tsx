import { FC, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchableSelect, SelectOption } from '@/components/atoms';
import { GroupApi } from '@/api/GroupApi';
import { GROUP_ENTITY_TYPE, Group } from '@/models/Group';
import { cn } from '@/lib/utils';

interface Props {
	onChange: (group: Group | null) => void;
	value?: string;
	error?: string;
	label?: string;
	placeholder?: string;
	description?: string;
	className?: string;
	entityType?: GROUP_ENTITY_TYPE;
	hiddenIfEmpty?: boolean;
	/** When false, option labels show only group name (no lookup_key). Default true. */
	showLookupKey?: boolean;
}

const SelectGroup: FC<Props> = ({
	onChange,
	value,
	error,
	label = 'Group',
	placeholder = 'Select a group (optional)',
	description,
	className,
	entityType = GROUP_ENTITY_TYPE.PRICE,
	hiddenIfEmpty = false,
	showLookupKey = true,
}) => {
	// Query for fetching groups (filtered by entity_type via payload)
	const {
		data: groupsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchGroups', { entity_type: entityType }],
		queryFn: () =>
			GroupApi.getGroupsByFilter({
				entity_type: entityType,
				limit: 100,
				offset: 0,
			}),
	});

	const groupOptions: SelectOption[] = useMemo(() => {
		if (!groupsData?.items) return [{ label: 'None', value: '' }];

		return [
			{ label: 'None', value: '' },
			...groupsData.items.map((group: Group) => ({
				label: showLookupKey ? `${group.name} (${group.lookup_key})` : group.name,
				value: group.id,
			})),
		];
	}, [groupsData, showLookupKey]);

	// Check if component should be hidden when empty
	const shouldHide = useMemo(() => {
		return hiddenIfEmpty && (!groupsData?.items || groupsData.items.length === 0);
	}, [hiddenIfEmpty, groupsData]);

	const handleGroupChange = useCallback(
		(selectedValue: string) => {
			if (selectedValue === '') {
				onChange(null);
			} else {
				const selectedGroup = groupsData?.items.find((group: Group) => group.id === selectedValue);
				if (selectedGroup) {
					onChange(selectedGroup);
				}
			}
		},
		[onChange, groupsData],
	);

	if (isLoading && !groupsData) {
		return <div className={cn('min-w-[12.5rem]', className)}></div>;
	}

	if (isError && !groupsData) {
		return <div className={cn('min-w-[12.5rem]', className)}></div>;
	}

	// Hide component if hiddenIfEmpty is true and no groups are available
	if (shouldHide) {
		return null;
	}

	return (
		<div className={cn('min-w-[12.5rem]', className)}>
			<SearchableSelect
				error={error}
				value={value || ''}
				onChange={handleGroupChange}
				options={groupOptions}
				placeholder={placeholder}
				label={label}
				description={description}
				searchPlaceholder='Search groups...'
				emptyText='No groups found'
				noOptionsText='No groups available'
			/>
		</div>
	);
};

export default SelectGroup;
