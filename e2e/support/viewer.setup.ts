import { test as setup } from '@playwright/test';
import { requireViewerUser, viewerStorageStatePath } from './env';
import { signInAndSaveState } from './signIn';

/** Signs in as the read-only account the RBAC comparison needs. */
setup('authenticate viewer', async ({ page }) => {
	await signInAndSaveState(page, requireViewerUser(), viewerStorageStatePath);
});
