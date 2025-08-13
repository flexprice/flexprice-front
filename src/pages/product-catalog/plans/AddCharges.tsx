import { useParams } from 'react-router-dom';
import EntityChargesPage from '@/components/organisms/EntityChargesPage';
import { PRICE_ENTITY_TYPE } from '@/models/Price';

const AddChargesPage = () => {
	const { planId } = useParams<{ planId: string }>();

	return <EntityChargesPage entityType={PRICE_ENTITY_TYPE.PLAN} entityId={planId!} entityName='Plan' />;
};

export default AddChargesPage;
