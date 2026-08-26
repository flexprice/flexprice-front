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
import SplitIslandLayout from '@/layouts/SplitIslandLayout';
import { cn } from '@/lib/utils';

const SLACK_COMMUNITY_URL = 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-3lglk6d7l-MNuKTOhxLyphYHEGOcnVmg';

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
		<SplitIslandLayout
			flushStart
			left={
				<div className='flex min-h-0 flex-1 flex-col'>
					<a
						href={SLACK_COMMUNITY_URL}
						target='_blank'
						rel='noopener noreferrer'
						className={cn(
							'flex w-full shrink-0 items-center justify-center gap-2.5 bg-surface-shell/85 px-4 py-2.5 text-[0.9375rem] font-medium text-content-secondary backdrop-blur-md transition-colors hover:bg-surface-shell dark:bg-surface-subtle/50',
							'mt-[var(--fp-shell-inset)]',
							'max-lg:mx-4 max-lg:w-auto max-lg:rounded-[var(--fp-radius-shell)] max-lg:border max-lg:border-line-subtle',
							'lg:rounded-none lg:border-y lg:border-s lg:border-e-0 lg:border-line-subtle',
							'dark:border-white/10',
						)}>
						<span className='truncate'>{t('slackBanner', { brandName: name })}</span>
						<img src='/assets/logo/slack-logo.png' alt={t('images.slackLogoAlt')} className='h-4 w-auto shrink-0' />
					</a>
					<div className='flex flex-1 items-center justify-center overflow-y-auto'>
						<div className='mx-auto flex w-[88%] max-w-xl flex-col justify-center py-10 sm:w-[70%] lg:w-[55%] lg:py-0'>
							<div className='mb-4 flex justify-center'>
								<img src={logo} alt={`${name} Logo`} className='h-12' />
							</div>
							{signupEnabled && currentTab === AuthTab.SIGNUP && (
								<>
									<h2 className='mb-2 text-center text-3xl font-medium text-content-heading'>{t('createAccount.heading')}</h2>
									<p className='mb-10 text-center text-content-tertiary'>{t('createAccount.subheading', { brandName: name })}</p>
									<div className='mb-6'>
										<RegionSelector />
									</div>
								</>
							)}
							{(currentTab === AuthTab.LOGIN || (!signupEnabled && currentTab === AuthTab.SIGNUP)) && (
								<>
									<h2 className='mb-3 text-center text-3xl font-medium text-content-heading'>{t('login.heading')}</h2>
									<p className='mb-10 text-center text-content-tertiary'>{t('login.subheading')}</p>
									<div className='mb-6'>
										<RegionSelector />
									</div>
								</>
							)}
							{currentTab === AuthTab.FORGOT_PASSWORD && (
								<>
									<h2 className='mb-2 text-center text-3xl font-medium text-content-heading'>{t('forgotPassword.heading')}</h2>
									<p className='mb-8 text-center text-content-tertiary'>{t('forgotPassword.subheading')}</p>
								</>
							)}
							{currentTab === AuthTab.RESET_PASSWORD && (
								<>
									<h2 className='mb-2 text-center text-3xl font-medium text-content-heading'>{t('resetPassword.heading')}</h2>
									<p className='mb-8 text-center text-content-tertiary'>{t('resetPassword.subheading')}</p>
								</>
							)}
							{renderForm()}
							<div className='mt-6 flex justify-start'>
								<LocaleSelector />
							</div>
						</div>
					</div>
				</div>
			}
			right={<LandingSection />}
		/>
	);
};

export default FlexpriceDefault;
