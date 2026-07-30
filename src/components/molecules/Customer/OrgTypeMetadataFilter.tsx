import { cn } from '@/lib/utils';
import { CustomerOrgTypeFilterValue } from '@/constants/customerOrgTypeFilter';
import { useTranslation } from 'react-i18next';

interface OrgTypeMetadataFilterProps {
	value: CustomerOrgTypeFilterValue | null;
	onChange: (value: CustomerOrgTypeFilterValue | null) => void;
}

const OPTIONS: CustomerOrgTypeFilterValue[] = ['parent', 'child'];

const OrgTypeMetadataFilter = ({ value, onChange }: OrgTypeMetadataFilterProps) => {
	const { t } = useTranslation('customers');

	const handleSelect = (option: CustomerOrgTypeFilterValue) => {
		onChange(value === option ? null : option);
	};

	return (
		<div
			className='inline-flex items-center rounded-[7px] border border-input bg-background p-0.5'
			role='group'
			aria-label={t('list.orgTypeFilter.ariaLabel')}>
			{OPTIONS.map((option) => {
				const isSelected = value === option;
				return (
					<button
						key={option}
						type='button'
						onClick={() => handleSelect(option)}
						aria-pressed={isSelected}
						className={cn(
							'h-7 rounded-[6px] px-3 text-sm font-medium transition-colors',
							isSelected ? 'bg-[#092E44] text-white' : 'text-foreground hover:bg-accent hover:text-accent-foreground',
						)}>
						{t(`list.orgTypeFilter.${option}`)}
					</button>
				);
			})}
		</div>
	);
};

export default OrgTypeMetadataFilter;
