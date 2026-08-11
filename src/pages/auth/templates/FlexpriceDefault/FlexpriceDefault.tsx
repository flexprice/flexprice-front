// src/pages/auth/templates/FlexpriceDefault/FlexpriceDefault.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { AuthTab } from '../../authTabs';
import LandingSection from './LandingSection';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import LoginForm from '../../LoginForm';
import SignupForm from '../../SignupForm';
import ForgotPasswordForm from '../../ForgotPasswordForm';
import ResetPasswordForm from '../../ResetPasswordForm';
import { config } from '@/config/config';

const SLACK_COMMUNITY_URL = 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ';

interface FlexpriceDefaultProps {
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const FlexpriceDefault: React.FC<FlexpriceDefaultProps> = ({ currentTab, switchTab }) => {
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const signupEnabled = config.platform.signup.enabled;

	const renderForm = () => {
		switch (currentTab) {
			case AuthTab.SIGNUP:
				return signupEnabled ? <SignupForm switchTab={switchTab} /> : <LoginForm switchTab={switchTab} />;
			case AuthTab.FORGOT_PASSWORD:
				return <ForgotPasswordForm switchTab={switchTab} />;
			case AuthTab.RESET_PASSWORD:
				return <ResetPasswordForm switchTab={switchTab} />;
			default:
				return <LoginForm switchTab={switchTab} />;
		}
	};

	/*
	 * Below `lg` this is a single column: the form takes the full width and the marketing panel is
	 * dropped entirely. It was previously forced to `!flex-row` at every size, which left the form
	 * 45% x 55% = ~25% of the viewport — a 77px-wide email field on a phone.
	 *
	 * The panel is hidden rather than stacked underneath. It is decorative social proof with an
	 * auto-scrolling carousel, and `hidden` also means a phone never downloads the 1.5MB background
	 * photograph it would never see.
	 */
	return (
		<div className='flex w-full min-h-screen bg-surface-canvas page !p-0 !flex-col lg:!flex-row'>
			<div className='w-full lg:w-[45%] flex flex-col'>
				<a
					href={SLACK_COMMUNITY_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='w-full h-[48px] flex items-center justify-center gap-2.5 cursor-pointer border-y border-line-subtle hover:opacity-90 transition-opacity'
					style={{
						background: 'linear-gradient(to right, rgb(var(--fp-banner-bg)), rgb(var(--fp-banner-bg-mid)), rgb(var(--fp-banner-bg)))',
					}}>
					<span className='text-[15px] font-medium text-content-secondary'>{t('slackBanner', { brandName: name })}</span>
					<img src='/assets/logo/slack-logo.png' alt={t('images.slackLogoAlt')} className='h-4 w-auto' />
				</a>
				<div className='flex-1 flex justify-center items-center pt-[10px]'>
					<div className='flex flex-col justify-center max-w-xl w-[88%] sm:w-[70%] lg:w-[55%] mx-auto py-10 lg:py-0'>
						<div className='flex justify-center mb-4'>
							<img src={logo} alt={`${name} Logo`} className='h-12' />
						</div>
						{signupEnabled && currentTab === AuthTab.SIGNUP && (
							<>
								<h2 className='text-3xl font-medium text-center text-content-heading mb-2'>{t('createAccount.heading')}</h2>
								<p className='text-center text-content-tertiary mb-10'>{t('createAccount.subheading', { brandName: name })}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{(currentTab === AuthTab.LOGIN || (!signupEnabled && currentTab === AuthTab.SIGNUP)) && (
							<>
								<h2 className='text-3xl font-medium text-center text-content-heading mb-3'>{t('login.heading')}</h2>
								<p className='text-center text-content-tertiary mb-10'>{t('login.subheading')}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.FORGOT_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-content-heading mb-2'>{t('forgotPassword.heading')}</h2>
								<p className='text-center text-content-tertiary mb-8'>{t('forgotPassword.subheading')}</p>
							</>
						)}
						{currentTab === AuthTab.RESET_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-content-heading mb-2'>{t('resetPassword.heading')}</h2>
								<p className='text-center text-content-tertiary mb-8'>{t('resetPassword.subheading')}</p>
							</>
						)}
						{renderForm()}
						<div className='mt-6 flex justify-start'>
							<LocaleSelector />
						</div>
					</div>
				</div>
			</div>
			<div className='hidden lg:flex w-[55%] min-h-screen'>
				<LandingSection />
			</div>
		</div>
	);
};

export default FlexpriceDefault;
