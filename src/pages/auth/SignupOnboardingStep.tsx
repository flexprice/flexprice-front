import { useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import validator from 'validator';
import { Button, Input, Select, SelectOption } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';

const SIGNUP_ONBOARDING_STORAGE_KEY = 'flexprice_signup_onboarding';

/** Validates URL using validator.js. Allows example.com, https://example.com. Rejects "abc", "abcd dch.com" (spaces). Empty is valid (optional field). */
const isValidUrl = (s: string): boolean => {
	const trimmed = s.trim();
	if (!trimmed) return true;
	// Reject strings with spaces (e.g. "abcd dch.com")
	if (/\s/.test(trimmed)) return false;
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	return validator.isURL(withProtocol, {
		require_protocol: false,
		require_valid_protocol: true,
		protocols: ['http', 'https'],
		require_tld: true,
		allow_underscores: false,
	});
};

// Radix Select does not allow empty string for Select.Item; use a sentinel for "no selection"
const SELECT_PLACEHOLDER_VALUE = '__placeholder__';

const teamSizeOptions: SelectOption[] = [
	{ value: SELECT_PLACEHOLDER_VALUE, label: 'Team size' },
	{ value: '1-10', label: '1-10' },
	{ value: '11-20', label: '11-20' },
	{ value: '21-50', label: '21-50' },
	{ value: '50+', label: '50+' },
];

const referralSourceOptions: SelectOption[] = [
	{ value: SELECT_PLACEHOLDER_VALUE, label: 'Where did you hear about us?' },
	{ value: 'LinkedIn', label: 'LinkedIn' },
	{ value: 'X', label: 'X (Formerly Twitter)' },
	{ value: 'Blogs', label: 'Blogs' },
	{ value: 'ChatGPT / Perplexity / Gemini', label: 'ChatGPT / Perplexity / Gemini' },
	{ value: 'HackerNews', label: 'HackerNews' },
	{ value: 'Product Hunt', label: 'Product Hunt' },
];

const pricingTypeOptions: SelectOption[] = [
	{ value: SELECT_PLACEHOLDER_VALUE, label: 'How do you price today?' },
	{ value: 'Usage-Based', label: 'Usage-Based' },
	{ value: 'Subscription', label: 'Subscription' },
	{ value: 'Hybrid Pricing', label: 'Hybrid Pricing' },
	{ value: 'Others', label: 'Others' },
];

interface SignupOnboardingStepProps {
	email: string;
	onComplete?: () => void;
}

const SignupOnboardingStep: React.FC<SignupOnboardingStepProps> = ({ email, onComplete }) => {
	const navigate = useNavigate();
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

	const isValidTeamSize = teamSize && teamSize !== SELECT_PLACEHOLDER_VALUE;
	const isValidReferral = referralSource && referralSource !== SELECT_PLACEHOLDER_VALUE;
	const isValidPricingType = pricingType && pricingType !== SELECT_PLACEHOLDER_VALUE;

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
		} else if (trimmedOrgName.toLowerCase() === 'flexprice') {
			next.orgName = "Oops! That's us. Please enter your organization name instead.";
			toast("Oops! That's us — enter your organization name instead.", { icon: '😅' });
		}
		if (!isValidReferral) next.referralSource = 'Please select how you found us';
		const trimmedOrgUrl = orgUrl.trim();
		if (trimmedOrgUrl && !isValidUrl(trimmedOrgUrl)) {
			next.orgUrl = 'Please enter a valid URL';
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const saveToStorage = () => {
		try {
			const data = {
				email,
				orgName: orgName.trim() || undefined,
				orgUrl: orgUrl.trim() || undefined,
				role: role.trim() || undefined,
				teamSize: isValidTeamSize ? teamSize : undefined,
				referralSource: isValidReferral ? referralSource : undefined,
				pricingType: isValidPricingType ? pricingType : undefined,
				completedAt: new Date().toISOString(),
			};
			localStorage.setItem(SIGNUP_ONBOARDING_STORAGE_KEY, JSON.stringify(data));
		} catch {
			// ignore
		}
	};

	const goToVerifyEmail = () => {
		if (!validate()) return;
		saveToStorage();
		onComplete?.();
		navigate(`${RouteNames.verifyEmail}?email=${encodeURIComponent(email)}&new=true`, { replace: true });
	};

	return (
		<>
			<p className='text-center text-gray-600 mb-6'>Help us understand your needs better</p>
			<div className='space-y-4'>
				<div className='space-y-1'>
					<label className='block text-sm font-medium text-zinc break-words text-zinc-950' htmlFor='signup-org-name'>
						Organization name <span className='text-destructive'>*</span>
					</label>
					<Input
						id='signup-org-name'
						placeholder='Enter your organization name'
						value={orgName}
						onChange={(v) => setOrgName(v)}
						required
						error={errors.orgName}
					/>
				</div>
				<Input
					label='Organization URL'
					placeholder='e.g. https://google.com'
					value={orgUrl}
					onChange={(v) => {
						setOrgUrl(v);
						if (errors.orgUrl) validateOrgUrl(v);
					}}
					onBlur={() => validateOrgUrl(orgUrl)}
					type='text'
					description='Enter your organization’s website link'
					error={errors.orgUrl}
				/>

				<Input
					label='What role do you perform in your organization?'
					placeholder='Your role'
					value={role}
					onChange={(v) => setRole(v)}
					required
					error={errors.role}
				/>
				<Select
					label="What's your team size?"
					options={teamSizeOptions}
					value={teamSize || SELECT_PLACEHOLDER_VALUE}
					onChange={(v) => setTeamSize(v === SELECT_PLACEHOLDER_VALUE ? '' : v)}
					placeholderValue={SELECT_PLACEHOLDER_VALUE}
					required={false}
				/>
				<Select
					label='What pricing model are you choosing for Flexprice?'
					options={pricingTypeOptions}
					value={pricingType || SELECT_PLACEHOLDER_VALUE}
					onChange={(v) => setPricingType(v === SELECT_PLACEHOLDER_VALUE ? '' : v)}
					placeholderValue={SELECT_PLACEHOLDER_VALUE}
					required={false}
				/>
				<Select
					label='How did you find us?'
					options={referralSourceOptions}
					value={referralSource || SELECT_PLACEHOLDER_VALUE}
					onChange={(v) => setReferralSource(v === SELECT_PLACEHOLDER_VALUE ? '' : v)}
					placeholderValue={SELECT_PLACEHOLDER_VALUE}
					required
					error={errors.referralSource}
				/>
			</div>
			<div className='mt-8'>
				<Button onClick={goToVerifyEmail} className='w-full !mt-6 h-11'>
					Continue
				</Button>
			</div>
		</>
	);
};

export default SignupOnboardingStep;
