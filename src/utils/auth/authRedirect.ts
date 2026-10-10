/**
 * Builds the absolute URL Supabase is told to send a user back to, for an email
 * link or an OAuth round trip.
 *
 * Every GoTrue call that sends an email has to be handed one of these
 * explicitly. Omitting it does *not* mean "wherever the user already is" —
 * GoTrue substitutes the project's Site URL, so a user who starts on one origin
 * receives a link pointing at another. That is not hypothetical here: the same
 * bundle is served from both region dashboards (see `config.regions`), from
 * Vercel preview deployments, and from localhost.
 *
 * The same substitution happens, silently and with no error returned to the
 * caller, when the URL is not in the Supabase project's **Redirect URLs**
 * allow-list. So building the URL correctly is only half of it: every origin
 * this app is served from must be listed there, or the link in the email will
 * still point somewhere else. See `.env.example` next to `VITE_SUPABASE_URL`.
 *
 * @param route A path from `RouteNames`, e.g. `RouteNames.signupConfirmation`.
 */
export function buildAuthRedirect(route: string): string {
	return `${window.location.origin}${route}`;
}
