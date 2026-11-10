import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { config } from '@/config/config';

/**
 * Query parameter naming the tenant whose identity provider should handle the
 * login, e.g. /login?sso=tenant_abc123.
 *
 * SSO is configured per tenant, so the browser has to say which tenant it means
 * before anyone has authenticated. Until email-domain discovery exists, that
 * comes from the link a tenant's administrator hands to its users rather than
 * from anything typed at the login page — an end user has no reason to know a
 * tenant ID, and asking them to paste one would be worse than a bookmark.
 */
export const SSO_TENANT_PARAM = 'sso';

/**
 * sessionStorage key marking that this browser tab started an SSO login.
 *
 * The callback stores whatever token it is handed, and it is a public route: without this, anyone
 * could send a victim `/auth/callback#token=<attacker's token>` and have the victim's dashboard
 * adopt the attacker's session, so everything the victim then did would happen in the attacker's
 * account. Requiring a marker this tab set itself means a fragment arriving unprompted is refused.
 *
 * sessionStorage rather than localStorage: it is per tab and cleared when the tab closes, so an
 * abandoned login does not leave the callback armed indefinitely.
 */
export const SSO_PENDING_KEY = 'saml_login_pending';

/**
 * sessionStorage key holding the nonce for the login in progress.
 *
 * The tenant marker proves a login to this tenant began, but every login to that tenant carries
 * the same value, so it cannot distinguish one attempt from another. The nonce can: it is generated
 * per sign-in, travels to the identity provider as SAML RelayState, comes back with the assertion,
 * and is compared here. A token from any other login — including an attacker's, mid-flow — does not
 * carry it.
 *
 * Kept to well under the 80 bytes the SAML profile allows RelayState (SAMLProfiles 3.6.3.1);
 * identity providers may reject or truncate anything longer.
 */
export const SSO_STATE_KEY = 'saml_login_state';

/** Random, unguessable, and short enough for RelayState. */
function newLoginNonce(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

interface SamlSigninProps {
	tenantId: string;
}

/**
 * Entry point for SAML single sign-on.
 *
 * A full page navigation, not a fetch: the browser must follow the redirect to
 * the identity provider and carry its session cookies there, and it is the
 * browser the identity provider posts the assertion back through. An XHR would
 * break both halves of that.
 */
const SamlSignin = ({ tenantId }: SamlSigninProps) => {
	const { t } = useTranslation('auth');
	const [isStarting, setIsStarting] = useState(false);

	const handleSamlLogin = async () => {
		const base = config.api.baseUrl.replace(/\/$/, '');
		const loginUrl = `${base}/auth/saml/${encodeURIComponent(tenantId)}/login`;

		// Ask before navigating. The endpoint answers 404 when SSO is not live for
		// this tenant — not configured, not enabled, or not yet approved — and a
		// bare navigation would land the browser on the API's JSON error body with
		// no way back. `manual` keeps the browser from following the redirect on
		// this request, so a live endpoint is reported as an opaque response
		// rather than being consumed here.
		setIsStarting(true);
		try {
			const probe = await fetch(loginUrl, { method: 'GET', redirect: 'manual' });
			if (probe.status === 404) {
				toast.error(t('sso.notAvailable'));
				return;
			}
		} catch {
			// A network or CORS failure says nothing about whether SSO works, so
			// fall through to the navigation rather than refusing a login that
			// might well succeed.
		} finally {
			setIsStarting(false);
		}

		// Mark that this tab started the flow, so the callback can tell a token it
		// asked for from one someone sent it, and which login it belongs to.
		const nonce = newLoginNonce();
		sessionStorage.setItem(SSO_PENDING_KEY, tenantId);
		sessionStorage.setItem(SSO_STATE_KEY, nonce);

		// Deliberately a full page navigation: the browser must carry its own
		// session to the identity provider, and it is the browser the assertion is
		// posted back through. The nonce rides along as SAML RelayState and is
		// handed back at the callback.
		window.location.href = `${loginUrl}?state=${encodeURIComponent(nonce)}`;
	};

	return (
		<div>
			<Button
				onClick={handleSamlLogin}
				variant='outline'
				isLoading={isStarting}
				className='w-full mb-6 flex items-center justify-center gap-2 h-11'>
				{t('buttons.continueWithSso')}
			</Button>
		</div>
	);
};

export default SamlSignin;
