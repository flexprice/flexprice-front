import { Chip } from '@/components/atoms';
import { DeltaDisplay } from './reportMath';

const DeltaChip = ({ display }: { display: DeltaDisplay | null }) => {
	if (!display) return null;
	return <Chip label={display.label} variant={display.tone} />;
};

export default DeltaChip;
