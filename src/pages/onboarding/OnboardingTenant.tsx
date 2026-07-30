import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button, Input, Loader, Select, SelectOption } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import TenantApi from '@/api/TenantApi';
import OnboardingApi from '@/api/OnboardingApi';
import { TenantMetadataKey, type Tenant } from '@/models';
import useUser from '@/hooks/useUser';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import flexpriceLogo from '../../../assets/comicon.png';

/** URL check without validator dep: optional empty; no spaces; http(s) with host containing a dot (TLD). */
const isValidUrl = (s: string): boolean => {
	const trimmed = s.trim();
	if (!trimmed) return true;
	if (/\s/.test(trimmed)) return false;
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const u = new URL(withProtocol);
		if (!['http:', 'https:'].includes(u.protocol)) return false;
		return u.hostname.includes('.') && !u.hostname.startsWith('.');
	} catch {
		return false;
	}
};

/** Banned substrings for organization names; extend as needed. */
const BANNED_ORG_NAME_WORDS = ['test', 'demo', 'flexprice'];

const teamSizeOptions: SelectOption[] = [
	{ value: '1-10', label: '1-10' },
	{ value: '11-20', label: '11-20' },
	{ value: '21-50', label: '21-50' },
	{ value: '50+', label: '50+' },
];

const referralSourceOptions: SelectOption[] = [
	{ value: 'LinkedIn', label: 'LinkedIn' },
	{ value: 'X', label: 'X (Formerly Twitter)' },
	{ value: 'Blogs', label: 'Blogs' },
	{ value: 'ChatGPT / Perplexity / Gemini', label: 'ChatGPT / Perplexity / Gemini' },
	{ value: 'HackerNews', label: 'HackerNews' },
	{ value: 'Product Hunt', label: 'Product Hunt' },
	{ value: 'Reddit', label: 'Reddit' },
];

const pricingTypeOptions: SelectOption[] = [
	{ value: 'Usage-Based', label: 'Usage-Based' },
	{ value: 'Subscription', label: 'Subscription' },
	{ value: 'Hybrid Pricing', label: 'Hybrid Pricing' },
	{ value: 'Others', label: 'Others' },
];

const roleOptions: SelectOption[] = [
	{ value: 'CEO / CTO / Founder', label: 'CEO / CTO / Founder' },
	{ value: 'Engineering', label: 'Engineering' },
	{ value: 'Product Manager', label: 'Product Manager' },
	{ value: 'Finance', label: 'Finance' },
	{ value: 'Other', label: 'Other' },
];

const OnboardingTenant = () => {
	const navigate = useNavigate();
	const { t } = useTranslation('common');
	const { user, loading: userLoading } = useUser();
	const [orgName, setOrgName] = useState('');
	const [orgUrl, setOrgUrl] = useState('');
	const [role, setRole] = useState('');
	const [teamSize, setTeamSize] = useState('');
	const [referralSource, setReferralSource] = useState('');
	const [pricingType, setPricingType] = useState('');
	const [errors, setErrors] = useState<{
		orgName?: string;
		orgUrl?: string;
		role?: string;
		teamSize?: string;
		referralSource?: string;
		pricingType?: string;
	}>({});

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant-onboarding'],
		queryFn: () => TenantApi.getTenantById(user?.tenant?.id ?? ''),
		enabled: !!user?.tenant?.id,
	});

	const showFullScreenLoader = userLoading || (!!user?.tenant?.id && isTenantLoading);

	useEffect(() => {
		if (!tenant) return;
		const url = (tenant.metadata as Record<string, string> | undefined)?.onboarding_org_url;
		if (url) setOrgUrl((u) => u || url);
	}, [tenant]);

	useEffect(() => {
		const completed =
			(user?.tenant as Tenant | undefined)?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED] === 'true' ||
			(tenant as Tenant | undefined)?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED] === 'true';
		if (completed) {
			navigate(RouteNames.homeDashboard, { replace: true });
		}
	}, [user?.tenant, tenant, navigate]);

	const isValidTeamSize = Boolean(teamSize);
	const isValidReferral = Boolean(referralSource);
	const isValidPricingType = Boolean(pricingType);
	const isValidRole = Boolean(role);

	const { mutate: completeOnboarding, isPending } = useMutation({
		mutationFn: async () => {
			await TenantApi.updateTenant({
				name: orgName.trim(),
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
					onboarding_role: isValidRole ? role : '',
					onboarding_team_size: isValidTeamSize ? teamSize : '',
					onboarding_referral_source: referralSource,
					onboarding_pricing_type: isValidPricingType ? pricingType : '',
					onboarding_org_url: orgUrl.trim(),
				},
			});
			await OnboardingApi.recordOnboardingData({
				orgName: orgName.trim(),
				orgUrl: orgUrl.trim(),
				website: orgUrl.trim(),
				role: isValidRole ? role : '',
				teamSize: isValidTeamSize ? teamSize : '',
				referralSource,
				pricingType: isValidPricingType ? pricingType : '',
				userEmail: user?.email || '',
				tenantId: user?.tenant?.id || '',
				timestamp: new Date().toISOString(),
			});
		},
		onSuccess: async () => {
			await Promise.all([refetchQueries('user'), refetchQueries('tenant-onboarding'), refetchQueries('tenant')]);
			toast.success("You're all set!");
			navigate(RouteNames.homeDashboard, { replace: true });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to complete onboarding. Please try again.');
		},
	});

	const validateOrgUrl = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) {
			setErrors((prev) => ({ ...prev, orgUrl: undefined }));
			return;
		}
		if (!isValidUrl(trimmed)) {
			setErrors((prev) => ({ ...prev, orgUrl: 'Please enter a valid URL' }));
		} else {
			setErrors((prev) => ({ ...prev, orgUrl: undefined }));
		}
	};

	const validate = () => {
		const next: typeof errors = {};
		const trimmedOrgName = orgName.trim();
		if (!trimmedOrgName) {
			next.orgName = 'Organization name is required';
		} else {
			const lowerName = trimmedOrgName.toLowerCase();
			if (lowerName === 'flexprice') {
				next.orgName = "Oops! That's us. Please enter your organization name instead.";
				toast("That's us, please enter your organization name.", { icon: '😅' });
			} else {
				const bannedMatch = BANNED_ORG_NAME_WORDS.find((word) => lowerName.includes(word.toLowerCase()));
				if (bannedMatch) {
					next.orgName = `Organization name cannot include the word “${bannedMatch}”. Please choose another name.`;
				}
			}
		}
		if (!isValidReferral) next.referralSource = 'Please select how you found us';
		const trimmedOrgUrl = orgUrl.trim();
		if (!trimmedOrgUrl) {
			next.orgUrl = 'Organization website is required';
		} else if (!isValidUrl(trimmedOrgUrl)) {
			next.orgUrl = 'Please enter a valid URL';
		}
		if (!isValidRole) next.role = 'Role is required';
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleContinue = () => {
		if (!validate()) return;
		completeOnboarding();
	};

	const onboardingBackdropClass = 'fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4';

	if (showFullScreenLoader) {
		return (
			<div
				className={onboardingBackdropClass}
				style={{
					backgroundImage: `url('/assets/onboarding.png')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}>
				<div className='absolute inset-0 bg-white/30' aria-hidden />
				<div
					className='relative flex min-h-[min(100vh,100dvh)] w-full flex-1 items-center justify-center'
					role='status'
					aria-busy='true'
					aria-label={t('tenantSetup.loadingWorkspaceAria')}>
					<Loader />
				</div>
			</div>
		);
	}

	return (
		<div
			className={onboardingBackdropClass}
			style={{
				backgroundImage: `url('/assets/onboarding.png')`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}>
			<div className='absolute inset-0 bg-white/30' aria-hidden />
			<div className='relative my-8 w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-lg'>
				<div className='mb-6 flex justify-center'>
					<img src={flexpriceLogo} alt={t('tenantSetup.flexpriceLogoAlt')} className='h-12' />
				</div>
				<h1 className='text-center text-2xl font-semibold text-zinc-900'>{t('tenantSetup.welcomeHeading')}</h1>
				<p className='mt-2 text-center text-sm text-zinc-500'>{t('tenantSetup.welcomeSubtext')}</p>
				<div className='mt-6 space-y-4'>
					<div className='space-y-1'>
						<label className='block text-sm font-medium text-zinc-900' htmlFor='onboarding-org-name'>
							{t('tenantSetup.orgNameLabel')} <span className='text-destructive'>*</span>
						</label>
						<Input
							id='onboarding-org-name'
							placeholder={t('tenantSetup.orgNamePlaceholder')}
							value={orgName}
							onChange={(v) => setOrgName(v)}
							required
							error={errors.orgName}
							className='rounded-lg border-zinc-200'
							disabled={isPending}
						/>
					</div>
					<div className='space-y-1'>
						<label className='block text-sm font-medium text-zinc-900' htmlFor='onboarding-org-url'>
							{t('tenantSetup.websiteUrlLabel')} <span className='text-destructive'>*</span>
						</label>
						<Input
							id='onboarding-org-url'
							placeholder={t('tenantSetup.websiteUrlPlaceholder')}
							value={orgUrl}
							onChange={(v) => {
								setOrgUrl(v);
								if (errors.orgUrl) validateOrgUrl(v);
							}}
							onBlur={() => validateOrgUrl(orgUrl)}
							type='text'
							description={t('tenantSetup.websiteUrlDescription')}
							error={errors.orgUrl}
							required
							className='rounded-lg border-zinc-200'
							disabled={isPending}
						/>
					</div>
					<Select
						label={t('tenantSetup.roleQuestion')}
						options={roleOptions}
						value={role}
						onChange={(v) => setRole(v)}
						placeholder={t('tenantSetup.rolePlaceholder')}
						required
						error={errors.role}
						disabled={isPending}
					/>
					<Select
						label={t('tenantSetup.teamSizeQuestion')}
						options={teamSizeOptions}
						value={teamSize}
						onChange={(v) => setTeamSize(v)}
						placeholder={t('tenantSetup.teamSizePlaceholder')}
						required={false}
						disabled={isPending}
					/>
					<Select
						label={t('tenantSetup.pricingModelQuestion')}
						options={pricingTypeOptions}
						value={pricingType}
						onChange={(v) => setPricingType(v)}
						placeholder={t('tenantSetup.pricingModelPlaceholder')}
						required={false}
						disabled={isPending}
					/>
					<Select
						label={t('tenantSetup.referralQuestion')}
						options={referralSourceOptions}
						value={referralSource}
						onChange={(v) => setReferralSource(v)}
						placeholder={t('tenantSetup.referralPlaceholder')}
						required
						error={errors.referralSource}
						disabled={isPending}
					/>
				</div>
				<div className='h-4' />
				<Button onClick={handleContinue} className='mt-2 h-11 w-full rounded-lg' isLoading={isPending} disabled={isPending}>
					{t('actions.continue')}
				</Button>
			</div>
		</div>
	);
};

export default OnboardingTenant;
