import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js';
import EnvironmentApi from '@/api/EnvironmentApi';
import { Button, OptionCards, PageLoader, type OptionCard } from '@/components/atoms';
import { useBrand } from '@/config/branding';
import { RouteNames } from '@/core/routes/Routes';
import supabase from '@/core/services/supbase/config';
import { ENVIRONMENT_TYPE, type Environment } from '@/models/Environment';
import sideBg from '../../../assets/side.png';
import sideBgDark from '../../../assets/sidedark.png';

type Decision = 'approve' | 'deny';

// Either one of our own messages (a translation key) or the reason Supabase gave.
type Problem = { key: string } | { message: string };

// Stands where the app's name goes while the title is translated, so the name
// can then be put back as an element of its own.
const NAME_SLOT = '\uE000';

const hostOf = (uri: string) => {
	try {
		return new URL(uri).host;
	} catch {
		return uri;
	}
};

/**
 * Remembers which environment an app works in.
 *
 * It is saved on the user's own Supabase record as
 * user_metadata.mcp_environments[<app id>]. Supabase copies that record into
 * the token it gives the app, the MCP server reads the environment from there,
 * and the API checks on every call that it belongs to the user's tenant.
 */
const saveEnvironmentChoice = async (appId: string, environmentId: string) => {
	const { data: userData, error: userError } = await supabase.auth.getUser();
	if (userError || !userData?.user) throw new Error(userError?.message);
	const saved = userData.user.user_metadata?.mcp_environments;
	let choices: Record<string, string> = saved && typeof saved === 'object' ? { ...saved } : {};

	// Every new connection adds an entry, and all of them travel inside the
	// token, so entries for apps that are no longer connected are dropped.
	const { data: grants } = await supabase.auth.oauth.listGrants();
	if (Array.isArray(grants)) {
		const connected = new Set(grants.map((grant: { client?: { id?: string } }) => grant.client?.id));
		choices = Object.fromEntries(Object.entries(choices).filter(([id]) => connected.has(id)));
	}

	const { error } = await supabase.auth.updateUser({ data: { mcp_environments: { ...choices, [appId]: environmentId } } });
	if (error) throw new Error(error.message);
};

/**
 * Where Supabase sends the browser when an app (Claude Code, for example) asks
 * to act for a Flexprice user. The user sees who is asking and approves or
 * refuses, and Supabase then returns the browser to the app.
 *
 * Public route. It checks the Supabase session itself, because only that
 * session can approve the request.
 */
const OAuthConsent = () => {
	const { t } = useTranslation(['auth', 'settings']);
	const { logo, name: brandName } = useBrand();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const authorizationId = searchParams.get('authorization_id');

	const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
	const [environments, setEnvironments] = useState<Environment[]>([]);
	const [environmentId, setEnvironmentId] = useState<string | null>(null);
	const [problem, setProblem] = useState<Problem | null>(() => {
		if (!authorizationId) return { key: 'oauthConsent.missingRequest' };
		// Self-hosted runs without Supabase, so there is nothing to approve with.
		if (!supabase.auth?.oauth) return { key: 'oauthConsent.unavailable' };
		return null;
	});
	const [decisionProblem, setDecisionProblem] = useState<Problem | null>(null);
	const [pending, setPending] = useState<Decision | null>(null);

	useEffect(() => {
		const oauth = supabase.auth?.oauth;
		if (!authorizationId || !oauth) return;

		let cancelled = false;
		const load = async () => {
			const { data: sessionData } = await supabase.auth.getSession();
			if (cancelled) return;
			if (!sessionData?.session) {
				const returnTo = encodeURIComponent(location.pathname + location.search);
				navigate(`${RouteNames.auth}?redirect=${returnTo}`, { replace: true });
				return;
			}

			const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
			if (cancelled) return;
			if (error || !data) {
				setProblem(error?.message ? { message: error.message } : { key: 'oauthConsent.loadFailed' });
				return;
			}
			// No details means the user approved this app before, and Supabase has
			// already decided where the browser goes.
			if (!('authorization_id' in data)) {
				window.location.assign(data.redirect_url);
				return;
			}
			// Stored first, so the request can still be refused if environments fail to load.
			setDetails(data);

			// getAllEnvironments returns an empty list on failure; retry once after a short pause.
			let available = (await EnvironmentApi.getAllEnvironments()).environments;
			if (cancelled) return;
			if (!available?.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				if (cancelled) return;
				available = (await EnvironmentApi.getAllEnvironments()).environments;
				if (cancelled) return;
			}
			if (!available?.length) {
				setProblem({ key: 'oauthConsent.noEnvironments' });
				return;
			}
			// Start on the environment the dashboard is on, so the app sees what the user sees.
			const active = EnvironmentApi.getActiveEnvironmentId();
			setEnvironments(available);
			setEnvironmentId(available.some((environment) => environment.id === active) ? active : available[0].id);
		};
		load().catch(() => {
			if (!cancelled) setProblem({ key: 'oauthConsent.loadFailed' });
		});

		return () => {
			cancelled = true;
		};
	}, [authorizationId, location.pathname, location.search, navigate]);

	const decide = async (decision: Decision) => {
		// Refusing doesn't need an environment.
		if (!authorizationId || !details || (decision === 'approve' && !environmentId)) return;
		setPending(decision);
		setDecisionProblem(null);
		try {
			// Saved first: the token is issued right after the approval, and it has
			// to carry the choice.
			if (decision === 'approve' && environmentId) await saveEnvironmentChoice(details.client.id, environmentId);

			// skipBrowserRedirect: this page does the navigation itself, so a
			// failure can be shown here instead of leaving a blank tab.
			const { data, error } =
				decision === 'approve'
					? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
					: await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
			if (error || !data?.redirect_url) {
				setDecisionProblem(error?.message ? { message: error.message } : { key: 'oauthConsent.decisionFailed' });
				setPending(null);
				return;
			}
			window.location.assign(data.redirect_url);
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			setDecisionProblem(message ? { message } : { key: 'oauthConsent.decisionFailed' });
			setPending(null);
		}
	};

	// Sign out fully, SSO token included (else /auth skips to the dashboard), and return here after login.
	const signInAgain = async () => {
		await supabase.auth.signOut({ scope: 'local' });
		localStorage.removeItem('token');
		const returnTo = encodeURIComponent(location.pathname + location.search);
		navigate(`${RouteNames.auth}?redirect=${returnTo}`, { replace: true });
	};

	const text = (p: Problem) => ('key' in p ? t(p.key) : p.message);

	// Still loading, or on the way to the login page or back to the app.
	if (!problem && (!details || !environmentId)) return <PageLoader />;

	const [titleStart, titleEnd] = t('oauthConsent.title', { client: NAME_SLOT }).split(NAME_SLOT);

	// Each environment carries its type, in the words the dashboard uses for it.
	const environmentOptions: OptionCard<string>[] = environments.map((environment) => ({
		value: environment.id,
		label: environment.name,
		suffix:
			environment.type === ENVIRONMENT_TYPE.PRODUCTION
				? t('settings:environment.types.production')
				: t('settings:environment.types.sandbox'),
	}));

	return (
		<div className='fixed inset-0 z-50'>
			<div
				aria-hidden
				className='absolute inset-0 bg-cover bg-center bg-no-repeat dark:hidden'
				style={{ backgroundImage: `url(${sideBg})` }}
			/>
			<div
				aria-hidden
				className='absolute inset-0 hidden bg-cover bg-center bg-no-repeat dark:block'
				style={{ backgroundImage: `url(${sideBgDark})` }}
			/>
			<div className='absolute inset-0 bg-surface/30' aria-hidden />
			{/* Unlike the email verification card, this one can be taller than the window
			    (one row per environment). So this layer scrolls and the one inside it
			    centres; centring the scrolling layer itself would cut off the card's top. */}
			<div className='absolute inset-0 overflow-y-auto'>
				<div className='flex min-h-full items-center justify-center p-4'>
					<div className='w-full max-w-[480px] rounded-2xl bg-surface p-8 shadow-lg'>
						<div className='mb-6 flex justify-center'>
							<img src={logo} alt={brandName} className='h-12' />
						</div>

						{problem || !details || !environmentId ? (
							<>
								<div className='space-y-2 text-center text-sm'>
									<p role='alert' className='font-medium text-danger'>
										{problem && text(problem)}
									</p>
									{!details && <p className='text-content-zinc-muted'>{t('oauthConsent.startAgain')}</p>}
								</div>
								{/* The request loaded but its environments didn't: sign in again, or refuse it. */}
								{details && (
									<div className='mt-8'>
										{decisionProblem && (
											<p role='alert' className='mb-4 text-center text-sm text-danger'>
												{text(decisionProblem)}
											</p>
										)}
										<div className='flex gap-3'>
											<Button
												variant='outline'
												className='h-10 flex-1 rounded-lg'
												onClick={() => decide('deny')}
												disabled={pending !== null}
												isLoading={pending === 'deny'}>
												{t('oauthConsent.deny')}
											</Button>
											<Button className='h-10 flex-1 rounded-lg' onClick={signInAgain} disabled={pending !== null}>
												{t('oauthConsent.signInAgain')}
											</Button>
										</div>
									</div>
								)}
							</>
						) : (
							<>
								{/* The app's name is one piece, so a title too long for a single line breaks
								    before the name and not in the middle of it. A name longer than a line
								    still wraps, into even lines. */}
								<h1 className='text-balance break-words text-center text-2xl font-semibold text-content-zinc-bold'>
									{titleStart}
									<span className='inline-block max-w-full'>{details.client.name}</span>
									{titleEnd}
								</h1>
								<p className='mt-4 text-center text-sm text-content-zinc-tertiary'>
									{t('oauthConsent.access', { client: details.client.name, brandName })}
								</p>

								{/* Every environment is on the page, with nothing hidden in a scrolling
								    box: the one already chosen has to be seen before authorizing. */}
								<OptionCards
									className='mt-6'
									label={t('oauthConsent.environment')}
									orientation='vertical'
									options={environmentOptions}
									value={environmentId}
									onChange={setEnvironmentId}
									disabled={pending !== null}
								/>

								<div className='mt-5 space-y-1 break-words text-center text-sm text-content-zinc-muted'>
									<p>{t('oauthConsent.signedInAs', { email: details.user.email })}</p>
									<p>{t('oauthConsent.returnsTo', { host: hostOf(details.redirect_uri) })}</p>
								</div>

								{decisionProblem && (
									<p role='alert' className='mt-4 text-center text-sm text-danger'>
										{text(decisionProblem)}
									</p>
								)}

								<div className='mt-8 flex gap-3'>
									<Button
										variant='outline'
										className='h-10 flex-1 rounded-lg'
										onClick={() => decide('deny')}
										disabled={pending !== null}
										isLoading={pending === 'deny'}>
										{t('oauthConsent.deny')}
									</Button>
									<Button
										className='h-10 flex-1 rounded-lg'
										onClick={() => decide('approve')}
										disabled={pending !== null}
										isLoading={pending === 'approve'}>
										{t('oauthConsent.authorize')}
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default OAuthConsent;
