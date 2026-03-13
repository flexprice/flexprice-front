import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import LoginForm from './LoginForm';
import flexpriceLogo from '../../../assets/comicon.png';
import SignupForm from './SignupForm';
import SignupOnboardingStep from './SignupOnboardingStep';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import AuthService from '@/core/auth/AuthService';
import LandingSection from './LandingSection';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import { AuthTab } from './authTabs';

/** sessionStorage key for persisting "on onboarding step" email so it survives refresh */
export const SIGNUP_ONBOARDING_EMAIL_KEY = 'flexprice_signup_onboarding_email';

const AuthPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// Get current tab from URL or default to login
	const [currentTab, setCurrentTab] = useState<AuthTab>(AuthTab.LOGIN);
	// Show onboarding step when user lands with step=onboarding&email= (after email verification)
	const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		if (searchParams.get('tab') === AuthTab.RESET_PASSWORD) {
			return;
		}
		// Do not redirect to dashboard when user is on signup onboarding step (post email verification)
		const tab = searchParams.get('tab');
		const step = searchParams.get('step');
		if (tab === AuthTab.SIGNUP && step === 'onboarding') {
			return;
		}
		const fetchUser = async () => {
			const tokenStr = await AuthService.getAcessToken();
			if (tokenStr) {
				navigate('/');
			}
		};
		fetchUser();
	}, [location.search, navigate]);

	// Parse query parameters on component mount and tab changes; show onboarding when coming from email verification
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const tab = searchParams.get('tab');
		const step = searchParams.get('step');
		const email = searchParams.get('email');
		if (tab === AuthTab.SIGNUP || tab === AuthTab.FORGOT_PASSWORD || tab === AuthTab.RESET_PASSWORD) {
			setCurrentTab(tab as AuthTab);
			if (tab === AuthTab.SIGNUP && step === 'onboarding' && email) {
				setSignupSuccessEmail(decodeURIComponent(email));
			} else if (tab === AuthTab.SIGNUP) {
				setSignupSuccessEmail(null);
			} else {
				setSignupSuccessEmail(null);
			}
		} else {
			setCurrentTab(AuthTab.LOGIN);
			setSignupSuccessEmail(null);
		}
	}, [location]);

	// Change tab and update URL
	const switchTab = (tab: AuthTab) => {
		navigate(`/auth?tab=${tab}`);
	};

	// Render the appropriate form based on the current tab
	const renderForm = () => {
		switch (currentTab) {
			case AuthTab.SIGNUP:
				// After email verification, user is redirected here with step=onboarding&email=; show onboarding form
				if (signupSuccessEmail) {
					return <SignupOnboardingStep email={signupSuccessEmail} />;
				}
				return (
					<>
						<SignupForm switchTab={switchTab} />
					</>
				);

			case AuthTab.FORGOT_PASSWORD:
				return (
					<>
						<ForgotPasswordForm switchTab={switchTab} />
					</>
				);

			case AuthTab.RESET_PASSWORD:
				return (
					<>
						<ResetPasswordForm switchTab={switchTab} />
					</>
				);

			default: // Login case
				return (
					<>
						<LoginForm switchTab={switchTab} />
					</>
				);
		}
	};

	return (
		<div className='flex w-full min-h-screen bg-white page !p-0 !flex-row'>
			{/* Left side - Auth Form */}
			<div className='w-[45%] flex flex-col'>
				{/* Slack Community Strip - Absolute Top */}
				<a
					href='https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ'
					target='_blank'
					rel='noopener noreferrer'
					className='w-full h-[48px] flex items-center justify-center gap-2.5 cursor-pointer border-y border-gray-100 hover:opacity-90 transition-opacity'
					style={{
						background: 'linear-gradient(to right, #F7F7F7, #EDEDED, #F7F7F7)',
					}}>
					<span className='text-[15px] font-medium text-gray-700'>Join the Flexprice Community on Slack</span>
					<img src={'/assets/logo/slack-logo.png'} alt='Slack Logo' className='h-4 w-auto' />
				</a>

				{/* Form Container */}
				<div className='flex-1 flex justify-center items-center pt-[10px]'>
					<div className='flex flex-col justify-center max-w-xl w-[55%] mx-auto'>
						<div className='flex justify-center mb-4'>
							<img src={flexpriceLogo} alt='Flexprice Logo' className='h-12' />
						</div>

						{currentTab === AuthTab.SIGNUP && !signupSuccessEmail && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>Create your account</h2>
								<p className='text-center text-gray-600 mb-10'>Sign up to start using Flexprice.</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.SIGNUP && signupSuccessEmail && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>Welcome to Flexprice</h2>
							</>
						)}
						{currentTab === AuthTab.LOGIN && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-3'>Login to your account</h2>
								<p className='text-center text-gray-600 mb-10'>Let's get you back in.</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.FORGOT_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>Forgot your password?</h2>
								<p className='text-center text-gray-600 mb-8'>Enter your email to reset your password.</p>
							</>
						)}
						{currentTab === AuthTab.RESET_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>Set a new password</h2>
								<p className='text-center text-gray-600 mb-8'>Enter your new password below.</p>
							</>
						)}

						{renderForm()}
					</div>
				</div>
			</div>

			{/* Right side - Marketing Content */}
			<div className='w-[55%] min-h-screen flex'>
				<LandingSection />
			</div>
		</div>
	);
};

export default AuthPage;
