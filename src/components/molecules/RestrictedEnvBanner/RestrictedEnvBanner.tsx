import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useRestrictedEnvs, EnvRestrictionState } from '@/hooks/useRestrictedEnvs';
import useUser from '@/hooks/useUser';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
import ContactUsDialog from '../ContactUsDialog/ContactUsDialog';

function daysLeft(expiresAt: string): number {
	return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

const RestrictedEnvBanner: React.FC = () => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();
	const { getRestriction, isTenantRestricted } = useRestrictedEnvs();
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

	const tenantId = user?.tenant?.id ?? '';
	const envId = activeEnvironment?.id ?? '';
	const isProduction = activeEnvironment?.type === ENVIRONMENT_TYPE.PRODUCTION;

	if (!tenantId || !isTenantRestricted(tenantId)) {
		return null;
	}

	const restriction = getRestriction(envId);
	const isGracePeriod = restriction.state === EnvRestrictionState.GracePeriod && restriction.expiresAt;

	const envLabel = isProduction ? 'production account' : 'sandbox';

	if (isGracePeriod) {
		const days = daysLeft(restriction.expiresAt!);
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

	// Suspended
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
};

export default RestrictedEnvBanner;
