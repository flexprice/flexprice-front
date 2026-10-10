export enum AuthTab {
	LOGIN = 'login',
	SIGNUP = 'signup',
	FORGOT_PASSWORD = 'forgot-password',
	RESET_PASSWORD = 'reset-password',
}

/**
 * Dedicated path for the password-reset landing, and what the reset email's
 * `redirectTo` points at.
 *
 * A path rather than `?tab=reset-password` because the path is the only part of
 * the redirect that reliably survives the trip: a query string depends on the
 * Supabase project's Redirect URLs pattern being written to match it, and is
 * lost entirely whenever GoTrue falls back to the Site URL. Losing it used to
 * drop the user on `/` with a live recovery session, which signed them in and
 * never showed them the password form.
 *
 * Declared here rather than in `Routes.tsx` so `resolveAuthTab` can read it
 * without importing the router (which imports these pages back).
 * `RouteNames.resetPassword` re-exports it — route definitions and links should
 * use that, as they do for every other path.
 */
export const RESET_PASSWORD_PATH = '/auth/reset-password';
