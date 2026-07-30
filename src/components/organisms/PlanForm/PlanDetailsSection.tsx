import { Input, Spacer, Textarea } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
	plan: Partial<Plan>;
	setPlanField: <K extends keyof Plan>(field: K, value: Plan[K]) => void;
	errors: Partial<Record<keyof Plan, string>>;
}

const PlanDetailsSection = ({ plan, setPlanField, errors }: Props) => {
	const { t } = useTranslation(['catalog', 'common']);
	// Track if user manually edited the lookup key to stop auto-generation
	const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(false);

	useEffect(() => {
		// Reset manual edit tracking when plan changes
		setIsLookupKeyManuallyEdited(false);
	}, [plan]);

	return (
		<div className='p-6  rounded-xl border border-[#E4E4E7]'>
			<Input
				placeholder={t('catalog:plans.drawer.namePlaceholder')}
				description={t('catalog:plans.drawer.nameHelp')}
				label={t('catalog:plans.drawer.planName')}
				value={plan.name}
				error={errors.name}
				onChange={(e) => {
					setPlanField('name', e);
					// Auto-generate lookup key from plan name, but only if user hasn't manually edited it
					if (!isLookupKeyManuallyEdited) {
						setPlanField('lookup_key', 'plan-' + e.replace(/\s/g, '-').toLowerCase());
					}
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('catalog:shared.lookupKey')}
				error={errors.lookup_key}
				onChange={(e) => {
					setPlanField('lookup_key', e);
					// Mark that user manually edited the lookup key, stop auto-generation
					setIsLookupKeyManuallyEdited(true);
				}}
				value={plan.lookup_key}
				placeholder={t('catalog:plans.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
			/>
			<Spacer height={'20px'} />
			<Textarea
				value={plan.description}
				onChange={(e) => setPlanField('description', e)}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:shared.description')}
				description={t('catalog:plans.drawer.purposeDescription')}
			/>
		</div>
	);
};

export default PlanDetailsSection;
