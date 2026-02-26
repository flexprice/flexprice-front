import React, { useState, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useRestrictedEnvs, EnvRestrictionState } from '@/hooks/useRestrictedEnvs';
import useUser from '@/hooks/useUser';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
import ContactUsDialog from '../ContactUsDialog/ContactUsDialog';

function daysLeft(expiresAt: string): number {
	return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

type RestrictionEntry = { envId: string; result: { state: EnvRestrictionState; expiresAt?: string } };

/** Pick which restricted env to show in the banner: prefer production, then suspended, then nearest expiry. */
function pickEnvToShow(
	entries: RestrictionEntry[],
	environments: Array<{ id: string; type: ENVIRONMENT_TYPE }> | undefined,
): (RestrictionEntry & { type: ENVIRONMENT_TYPE | undefined }) | null {
	if (entries.length === 0) return null;
	const envIdToType = (id: string) => environments?.find((e) => e.id === id)?.type;
	const withType = entries.map((e) => ({ ...e, type: envIdToType(e.envId) }));
	withType.sort((a, b) => {
		// Prefer production over sandbox
		const aProd = a.type === ENVIRONMENT_TYPE.PRODUCTION ? 1 : 0;
		const bProd = b.type === ENVIRONMENT_TYPE.PRODUCTION ? 1 : 0;
		if (bProd !== aProd) return bProd - aProd;
		// Then prefer suspended over grace
		const aSus = a.result.state === EnvRestrictionState.Suspended ? 1 : 0;
		const bSus = b.result.state === EnvRestrictionState.Suspended ? 1 : 0;
		if (bSus !== aSus) return bSus - aSus;
		// Then nearest expiry first
		const aExp = a.result.expiresAt ? new Date(a.result.expiresAt).getTime() : Infinity;
		const bExp = b.result.expiresAt ? new Date(b.result.expiresAt).getTime() : Infinity;
		return aExp - bExp;
	});
	return withType[0];
}

const RestrictedEnvBanner: React.FC = () => {
	const { user } = useUser();
	const { environments } = useEnvironment();
	const { isTenantRestricted, getRestrictionResultsForTenant } = useRestrictedEnvs();
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

	const tenantId = user?.tenant?.id ?? '';
	const tenantEntries = useMemo(() => getRestrictionResultsForTenant(tenantId), [tenantId, getRestrictionResultsForTenant]);
	const chosen = useMemo(() => pickEnvToShow(tenantEntries, environments), [tenantEntries, environments]);

	if (!tenantId || !isTenantRestricted(tenantId)) {
		return null;
	}

	if (!chosen) {
		return null;
	}

	const restriction = chosen.result;
	const isProduction = chosen.type === ENVIRONMENT_TYPE.PRODUCTION;
	const envLabel = isProduction ? 'production account' : 'sandbox';

	if (restriction.state === EnvRestrictionState.Active) {
		return null;
	}

	if (restriction.state === EnvRestrictionState.GracePeriod && restriction.expiresAt) {
		const days = daysLeft(restriction.expiresAt);
		return (
			<>
				<div
					className='w-full flex items-center justify-center border-b px-4 py-2'
					style={{
						background: 'linear-gradient(to right, #EEF4FF, #DDE7FF, #EEF4FF)',
						borderColor: '#E3ECFF',
					}}>
					<span className='text-sm' style={{ color: '#184FC7' }}>
						Your {envLabel} is active for the next {days} day{days !== 1 ? 's' : ''}. To continue after that,{' '}
						<button
							type='button'
							onClick={() => setIsContactDialogOpen(true)}
							className='inline-flex items-center gap-1 underline hover:opacity-80'
							style={{ color: '#184FC7' }}>
							contact us
							<ExternalLink className='h-3.5 w-3.5 shrink-0' aria-hidden />
						</button>
						.
					</span>
				</div>
				<ContactUsDialog isOpen={isContactDialogOpen} onOpenChange={setIsContactDialogOpen} />
			</>
		);
	}

	if (restriction.state === EnvRestrictionState.Suspended) {
		return (
			<>
				<div
					className='w-full flex items-center justify-center border-b px-4 py-2'
					style={{
						background: 'linear-gradient(to right, #FFEEEE, #FFEAEA, #FFEEEE)',
						borderColor: '#FFDDDD',
					}}>
					<span className='text-sm' style={{ color: '#C81B1B' }}>
						Your {envLabel} is temporarily closed. To continue,{' '}
						<button
							type='button'
							onClick={() => setIsContactDialogOpen(true)}
							className='inline-flex items-center gap-1 underline hover:opacity-80'
							style={{ color: '#C81B1B' }}>
							contact us
							<ExternalLink className='h-3.5 w-3.5 shrink-0' aria-hidden />
						</button>
						.
					</span>
				</div>
				<ContactUsDialog isOpen={isContactDialogOpen} onOpenChange={setIsContactDialogOpen} />
			</>
		);
	}

	return null;
};

export default RestrictedEnvBanner;
