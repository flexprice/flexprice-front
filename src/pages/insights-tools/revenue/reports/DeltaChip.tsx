import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/atoms';
import { DeltaDisplay } from './reportMath';

const DeltaChip = ({ display }: { display: DeltaDisplay | null }) => {
	const { t } = useTranslation('settings');
	if (!display) return null;
	const label = display.kind === 'new' ? t('insightsTools.revenue.reports.new') : display.label;
	return <Chip label={label} variant={display.tone} />;
};

export default DeltaChip;
