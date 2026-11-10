import { Navigate } from 'react-router';
import { useUser } from '@/hooks/useUserContext';
import { TenantMetadataKey } from '@/models/Tenant';
import { RouteNames } from './Routes';

const DefaultRoute = () => {
	const { user } = useUser();
	const onboardingMetadata = user?.tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
	const onboardingCompleted = onboardingMetadata === 'true';
	return <Navigate to={onboardingCompleted ? RouteNames.homeDashboard : RouteNames.onboarding} />;
};

export default DefaultRoute;
