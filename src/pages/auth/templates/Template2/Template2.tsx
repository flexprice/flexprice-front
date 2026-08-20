import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { Template2Config } from '@/config/authTemplates';
import { AuthTab } from '../../authTabs';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import LoginForm from '../../LoginForm';
import SignupForm from '../../SignupForm';
import ForgotPasswordForm from '../../ForgotPasswordForm';
import ResetPasswordForm from '../../ResetPasswordForm';
import { config as appConfig } from '@/config/config';
import SplitIslandLayout from '@/layouts/SplitIslandLayout';

interface Template2Props {
	config: Template2Config;
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const Template2: React.FC<Template2Props> = ({ config, currentTab, switchTab }) => {
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const signupEnabled = appConfig.platform.signup.enabled;

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

	const rightPanelStyle: React.CSSProperties = config.loginBgImage
		? { backgroundImage: `url(${config.loginBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: { backgroundColor: '#0f0f0f' };

	return (
		<SplitIslandLayout
			left={
				<div className='flex min-h-0 flex-1 flex-col'>
					<div className='flex flex-1 items-center justify-center overflow-y-auto'>
						<div className='mx-auto flex w-[65%] max-w-xl flex-col justify-center py-10 lg:py-0'>
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
			right={
				<div className='absolute inset-0' style={rightPanelStyle}>
					<div className='absolute inset-0 flex flex-col items-start justify-center px-28'>
						<img src={config.landingLogo || logo} alt={name} className='mb-6 h-12 w-auto' />
						{config.tagline && (
							<p className='text-6xl font-medium leading-tight text-white' style={{ maxWidth: '36rem' }}>
								{config.tagline}
							</p>
						)}
					</div>
				</div>
			}
		/>
	);
};

export default Template2;
