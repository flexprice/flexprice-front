import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useRouteError } from 'react-router';
import { AlertCircle, ArrowLeft, Bug, Code, Github, Home, Linkedin, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { Link } from 'react-router';
import { config } from '@/config/config';
import toast from 'react-hot-toast';

interface ErrorInfo {
	componentStack?: string | null;
}

// Generate a unique error ID
const generateErrorId = () => `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

// Log error to console
const logError = (error: Error, info?: ErrorInfo, metadata?: Record<string, any>) => {
	const errorId = generateErrorId();

	console.error('[ErrorBoundary]', {
		error,
		componentStack: info?.componentStack,
		errorId,
		...metadata,
	});

	return errorId;
};

// Error Fallback UI Component
interface ErrorFallbackProps {
	error: Error | null;
	errorInfo?: ErrorInfo | null;
	errorId: string;
	resetError: () => void;
}

// Error Fallback UI Component
export const ErrorFallback = ({ error, errorInfo, errorId, resetError }: ErrorFallbackProps) => {
	const { t } = useTranslation('common');
	const [showDetails, setShowDetails] = useState(false);
	const [animateIcon, setAnimateIcon] = useState(true);
	const isDev = !config.app.isProd;

	const handleRefresh = () => {
		resetError();
		window.location.reload();
	};

	// Animation effect
	useEffect(() => {
		const timer = setTimeout(() => setAnimateIcon(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div
			className='min-h-screen w-full flex items-center justify-center bg-background px-6 py-12'
			role='alert'
			aria-labelledby='error-title'>
			<div className='max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
				{/* Left Side - Error Content */}
				<div className='flex flex-col items-center lg:items-start text-center lg:text-start'>
					<div className='mb-8 relative'>
						<div className='absolute inset-0 bg-blue-DEFAULT/10 rounded-full blur-2xl -z-10 scale-150'></div>
						<div className={`absolute -top-4 -right-4 ${animateIcon ? 'animate-bounce' : 'animate-pulse'}`}>
							<Bug size={32} className='text-blue-DEFAULT/80' />
						</div>
						<div className={animateIcon ? 'animate-pulse' : ''}>
							<AlertCircle size={120} strokeWidth={1.5} className='text-blue-DEFAULT' />
						</div>
					</div>

					<h1 id='error-title' className='text-4xl lg:text-5xl font-medium mb-6 tracking-tight' tabIndex={0}>
						{t('errorPage.title')}
					</h1>

					<p className='text-muted-foreground mb-8 text-lg max-w-lg' tabIndex={0}>
						{t('errorPage.description')}
					</p>

					{/* Error ID with copy button */}
					{errorId && (
						<div className='mb-8 w-full max-w-md'>
							<div className='flex items-center gap-2 bg-muted/20 border border-muted/30 rounded-lg overflow-hidden'>
								<div className='py-3 px-4 text-sm text-muted-foreground bg-muted/10'>{t('errorPage.errorIdLabel')}</div>
								<code className='text-sm font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground px-2'>
									{errorId}
								</code>
								<button
									onClick={() => {
										navigator.clipboard.writeText(errorId);
										toast.success(t('errorPage.errorIdCopied'), {
											duration: 2000,
											position: 'bottom-center',
											style: {
												borderRadius: '6px',
												background: '#333',
												color: '#fff',
											},
										});
									}}
									aria-label={t('errorPage.copyErrorIdAria')}
									title={t('errorPage.copyErrorIdTitle')}
									className='p-3 hover:bg-muted/30 transition-colors text-muted-foreground'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'>
										<rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
										<path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
									</svg>
								</button>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 w-full max-w-md'>
						<Button onClick={handleRefresh} className='flex-1 w-full' size='lg'>
							<RefreshCw size={20} className='animate-spin-once' />
							{t('errorPage.tryAgain')}
						</Button>

						<div className='flex gap-3 flex-1'>
							<Link to={RouteNames.home} className='flex-1'>
								<Button variant='outline' className='w-full' size='lg'>
									<Home size={18} />
									{t('errorPage.home')}
								</Button>
							</Link>

							<Button
								variant='outline'
								onClick={() => window.history.back()}
								className='flex-1'
								size='lg'
								aria-label={t('errorPage.goBackAria')}>
								<ArrowLeft size={18} />
								{t('errorPage.back')}
							</Button>
						</div>
					</div>
				</div>

				{/* Right Side - Support & Details */}
				<div className='bg-white/5 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-muted/10 h-fit'>
					<h2 className='text-xl font-medium mb-6 text-center'>{t('errorPage.getHelp')}</h2>

					{/* Contact Support Section */}
					<div className='grid grid-cols-2 gap-4 mb-8'>
						<a
							href={`mailto:support@flexprice.io?subject=Error Report: ${errorId}&body=Hello Support Team,%0A%0AI encountered an error with the following reference ID: ${errorId}%0A%0APage URL: ${encodeURIComponent(window.location.href)}%0A%0APlease help resolve this issue.%0A%0AThank you.`}
							className='flex flex-col items-center gap-3 p-4 rounded-lg border border-muted/20 hover:border-blue-DEFAULT/30 hover:bg-blue-DEFAULT/5 transition-all group'
							aria-label={t('errorPage.emailSupportAria')}>
							<div className='p-3 rounded-full bg-blue-DEFAULT/10 group-hover:bg-blue-DEFAULT/20 transition-colors'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='text-blue-DEFAULT'>
									<rect width='20' height='16' x='2' y='4' rx='2' />
									<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
								</svg>
							</div>
							<div className='text-center'>
								<div className='font-medium text-sm'>{t('errorPage.emailSupport')}</div>
								<div className='text-xs text-muted-foreground'>{t('errorPage.emailSupportSubtitle')}</div>
							</div>
						</a>

						<a
							href='https://join.slack.com/t/flexpricecommunity/shared_invite/zt-3gnc3stna-sHuXbRb7lwYJgCvEvnw2Jw'
							target='_blank'
							rel='noopener noreferrer'
							className='flex flex-col items-center gap-3 p-4 rounded-lg border border-muted/20 hover:border-blue-DEFAULT/30 hover:bg-blue-DEFAULT/5 transition-all group'
							aria-label={t('errorPage.slackAria')}>
							<div className='p-3 rounded-full bg-blue-DEFAULT/10 group-hover:bg-blue-DEFAULT/20 transition-colors'>
								<MessageSquare size={24} className='text-blue-DEFAULT' />
							</div>
							<div className='text-center'>
								<div className='font-medium text-sm'>{t('errorPage.slackCommunity')}</div>
								<div className='text-xs text-muted-foreground'>{t('errorPage.slackSubtitle')}</div>
							</div>
						</a>

						<a
							href='https://github.com/flexprice/flexprice-front/issues'
							target='_blank'
							rel='noopener noreferrer'
							className='flex flex-col items-center gap-3 p-4 rounded-lg border border-muted/20 hover:border-blue-DEFAULT/30 hover:bg-blue-DEFAULT/5 transition-all group'
							aria-label={t('errorPage.githubAria')}>
							<div className='p-3 rounded-full bg-blue-DEFAULT/10 group-hover:bg-blue-DEFAULT/20 transition-colors'>
								<Github size={24} className='text-blue-DEFAULT' />
							</div>
							<div className='text-center'>
								<div className='font-medium text-sm'>{t('errorPage.githubIssues')}</div>
								<div className='text-xs text-muted-foreground'>{t('errorPage.githubSubtitle')}</div>
							</div>
						</a>

						<a
							href='https://www.linkedin.com/company/flexpriceio/'
							target='_blank'
							rel='noopener noreferrer'
							className='flex flex-col items-center gap-3 p-4 rounded-lg border border-muted/20 hover:border-blue-DEFAULT/30 hover:bg-blue-DEFAULT/5 transition-all group'
							aria-label={t('errorPage.linkedinAria')}>
							<div className='p-3 rounded-full bg-blue-DEFAULT/10 group-hover:bg-blue-DEFAULT/20 transition-colors'>
								<Linkedin size={24} className='text-blue-DEFAULT' />
							</div>
							<div className='text-center'>
								<div className='font-medium text-sm'>{t('errorPage.linkedin')}</div>
								<div className='text-xs text-muted-foreground'>{t('errorPage.linkedinSubtitle')}</div>
							</div>
						</a>
					</div>

					{/* Developer Details (only in dev mode) */}
					{isDev && (
						<div className='w-full'>
							<button
								onClick={() => setShowDetails(!showDetails)}
								className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-blue-DEFAULT transition-colors w-full py-3 border-t border-muted/10'>
								<Code size={16} />
								{showDetails ? t('errorPage.hideDevDetails') : t('errorPage.showDevDetails')}
							</button>

							{showDetails && (
								<div className='mt-4 text-start overflow-auto max-h-80 space-y-4'>
									<div>
										<h3 className='text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2'>
											<span className='inline-block w-2 h-2 rounded-full bg-destructive'></span>
											{t('errorPage.errorMessage')}
										</h3>
										<p className='text-sm font-mono text-destructive p-3 bg-muted/10 rounded-md border border-muted/20'>{error?.message}</p>
									</div>

									{error?.stack && (
										<div>
											<h3 className='text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2'>
												<span className='inline-block w-2 h-2 rounded-full bg-blue-DEFAULT'></span>
												{t('errorPage.stackTrace')}
											</h3>
											<pre className='text-sm font-mono whitespace-pre-wrap overflow-auto p-3 bg-muted/10 rounded-md border border-muted/20 text-muted-foreground'>
												{error.stack}
											</pre>
										</div>
									)}

									{errorInfo?.componentStack && (
										<div>
											<h3 className='text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2'>
												<span className='inline-block w-2 h-2 rounded-full bg-blue-DEFAULT'></span>
												{t('errorPage.componentStack')}
											</h3>
											<pre className='text-sm font-mono whitespace-pre-wrap overflow-auto p-3 bg-muted/10 rounded-md border border-muted/20 text-muted-foreground'>
												{errorInfo.componentStack}
											</pre>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Keyboard accessibility tip */}
					<p className='text-xs text-muted-foreground text-center mt-6 opacity-70'>{t('errorPage.keyboardTip')}</p>
				</div>
			</div>
		</div>
	);
};

// Main ErrorBoundary Component
interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	name?: string;
}

export const ErrorBoundary = ({ children, fallback, onError, name = 'unnamed' }: ErrorBoundaryProps) => {
	const [errorId, setErrorId] = useState<string>('');

	const handleError = (error: Error, info: ErrorInfo) => {
		const generatedErrorId = logError(error, info, { boundary: name });
		setErrorId(generatedErrorId);
		onError?.(error, info);
	};

	return (
		<ReactErrorBoundary
			FallbackComponent={({ error, resetErrorBoundary }) =>
				fallback || <ErrorFallback error={error as Error} errorInfo={null} errorId={errorId} resetError={resetErrorBoundary} />
			}
			onReset={() => setErrorId('')}
			onError={(error: unknown, info: ErrorInfo) => handleError(error as Error, info)}>
			{children as ReactNode}
		</ReactErrorBoundary>
	);
};

// Router Error Element - Used with React Router's errorElement
export const RouterErrorElement = () => {
	const error = useRouteError() as Error;
	const errorId = logError(error);

	return <ErrorFallback error={error} errorId={errorId} resetError={() => (window.location.href = RouteNames.home)} />;
};

export default ErrorBoundary;
