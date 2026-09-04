import { Customer } from '@/models';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePortalConfig } from '@/context/PortalConfigContext';
import { isColorDark } from '@/components/customer-portal/portalTheme';
import { cn } from '@/lib/utils';

interface PortalHeaderProps {
	customer: Customer;
	tenantName?: string;
}

const PortalHeader = ({ customer, tenantName }: PortalHeaderProps) => {
	const { t } = useTranslation('customer-portal');
	const { config } = usePortalConfig();
	const theme = config.theme;
	// The avatar's own background is the tenant color, not a themed surface token, so it needs
	// its own light/dark check — a light primary_color (e.g. #ffffff) must not get white text.
	const avatarTextIsLight = theme?.primary_color ? isColorDark(theme.primary_color) : false;

	const initials =
		customer.name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || t('header.defaultInitials');

	return (
		<div className='border-b border-line bg-surface'>
			<div className='mx-auto max-w-6xl px-4 py-6 sm:px-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						{/* The avatar is the one place the tenant's accent still applies directly:
						    it is branding rather than a surface, so it does not go through the
						    neutral tokens the rest of the portal reads. */}
						<div
							className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-subtle'
							style={theme?.primary_color ? { backgroundColor: theme.primary_color } : undefined}>
							<span
							className={cn(
								'text-lg font-medium',
								theme?.primary_color ? (avatarTextIsLight ? 'text-white' : 'text-content') : 'text-content-secondary',
							)}>
							{initials}
						</span>
						</div>

						<div>
							<h1 className='text-xl font-medium text-content'>{customer.name}</h1>
							{customer.email && <p className='text-sm text-content-secondary'>{customer.email}</p>}
						</div>
					</div>

					{tenantName && (
						<div className='hidden items-center gap-2 text-content-tertiary sm:flex'>
							<Building2 className='h-4 w-4' />
							<span className='text-sm'>{tenantName}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PortalHeader;
