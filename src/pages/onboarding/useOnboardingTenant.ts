import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import TenantApi from '@/api/TenantApi';
import OnboardingApi from '@/api/OnboardingApi';
import { TenantMetadataKey } from '@/models';
import useUser from '@/hooks/useUser';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { findBannedOrgNameWord, type OnboardingFormErrors } from './onboardingConstants';

const useOnboardingTenant = () => {
	const navigate = useNavigate();
	const { t } = useTranslation('common');
	const { user, loading: userLoading } = useUser();
	const [orgName, setOrgName] = useState('');
	const [referralSource, setReferralSource] = useState('');
	const [errors, setErrors] = useState<OnboardingFormErrors>({});

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant-onboarding'],
		queryFn: () => TenantApi.getTenantById(user?.tenant?.id ?? ''),
		enabled: !!user?.tenant?.id,
	});

	const showFullScreenLoader = userLoading || (!!user?.tenant?.id && isTenantLoading);

	const { mutate: completeOnboarding, isPending } = useMutation({
		mutationFn: async () => {
			await TenantApi.updateTenant({
				name: orgName.trim(),
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
					onboarding_referral_source: referralSource,
				},
			});

			// Telemetry must not block dashboard navigation after a successful tenant update.
			void OnboardingApi.recordOnboardingData({
				orgName: orgName.trim(),
				orgUrl: '',
				website: '',
				role: '',
				teamSize: '',
				referralSource,
				pricingType: '',
				userEmail: user?.email || '',
				tenantId: user?.tenant?.id || '',
				timestamp: new Date().toISOString(),
			}).catch(() => undefined);
		},
		onSuccess: async () => {
			await Promise.all([refetchQueries('user'), refetchQueries('tenant-onboarding'), refetchQueries('tenant')]);
			toast.success(t('tenantSetup.successToast'));
			navigate(RouteNames.homeDashboard, { replace: true });
		},
		onError: (error: Error) => {
			toast.error(error.message || t('tenantSetup.completeFailed'));
		},
	});

	const validate = (): boolean => {
		const next: OnboardingFormErrors = {};
		const trimmedOrgName = orgName.trim();

		if (!trimmedOrgName) {
			next.orgName = t('tenantSetup.orgNameRequired');
		} else {
			const lowerName = trimmedOrgName.toLowerCase();
			if (lowerName === 'flexprice') {
				next.orgName = t('tenantSetup.orgNameIsFlexprice');
				toast(t('tenantSetup.orgNameIsFlexpriceToast'), { icon: '😅' });
			} else {
				const bannedMatch = findBannedOrgNameWord(trimmedOrgName);
				if (bannedMatch) {
					next.orgName = t('tenantSetup.orgNameBannedWord', { word: bannedMatch });
				}
			}
		}

		if (!referralSource) next.referralSource = t('tenantSetup.referralRequired');

		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleContinue = () => {
		if (!validate()) return;
		completeOnboarding();
	};

	return {
		t,
		orgName,
		setOrgName,
		referralSource,
		setReferralSource,
		errors,
		isPending,
		showFullScreenLoader,
		handleContinue,
	};
};

export default useOnboardingTenant;
