import { useParams } from 'react-router-dom';
import EntityChargesPage from '@/components/organisms/EntityChargesPage';
import { PRICE_ENTITY_TYPE } from '@/models/Price';

const AddonChargesPage = () => {
	const { addonId } = useParams<{ addonId: string }>();

	return <EntityChargesPage entityType={PRICE_ENTITY_TYPE.ADDON} entityId={addonId!} entityName='Addon' />;
};

export default AddonChargesPage;
