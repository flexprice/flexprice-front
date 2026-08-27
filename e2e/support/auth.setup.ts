import { test as setup } from '@playwright/test';
import { requireTestUser, storageStatePath } from './env';
import { signInAndSaveState } from './signIn';

/**
 * Signs in once as the primary account and caches the browser state.
 *
 * Deliberately a UI login rather than a minted token: it is the one path that works
 * identically against a Supabase-backed deployment and a self-hosted one (AuthService
 * prefers a locally stored session in either), and it makes every run assert that the
 * login page still works before anything else is allowed to pass.
 */
setup('authenticate', async ({ page }) => {
	await signInAndSaveState(page, requireTestUser(), storageStatePath);
});
