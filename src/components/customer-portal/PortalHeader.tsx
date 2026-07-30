import { Customer } from '@/models';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePortalConfig } from '@/context/PortalConfigContext';

interface PortalHeaderProps {
	customer: Customer;
	tenantName?: string;
}

const PortalHeader = ({ customer, tenantName }: PortalHeaderProps) => {
	const { t } = useTranslation('customer-portal');
	const { config } = usePortalConfig();
	const hasTheme = !!config.theme;

	const initials =
		customer.name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || t('header.defaultInitials');

	return (
		<div
			style={{
				backgroundColor: hasTheme ? 'var(--portal-surface)' : 'white',
				borderBottom: `1px solid ${hasTheme ? 'var(--portal-border)' : '#E9E9E9'}`,
			}}>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						{/* Customer Avatar */}
						<div
							className='h-12 w-12 rounded-full flex items-center justify-center shrink-0'
							style={{
								backgroundColor: hasTheme ? 'var(--portal-primary)' : '#e4e4e7',
							}}>
							<span className='text-lg font-medium' style={{ color: hasTheme ? '#ffffff' : '#52525b' }}>
								{initials}
							</span>
						</div>

						<div>
							<h1 className='text-xl font-medium' style={{ color: hasTheme ? 'var(--portal-text-primary, #ffffff)' : '#09090b' }}>
								{customer.name}
							</h1>
							{customer.email && (
								<p className='text-sm' style={{ color: hasTheme ? 'var(--portal-text-secondary, #a5a5a5)' : '#71717a' }}>
									{customer.email}
								</p>
							)}
						</div>
					</div>

					{/* Tenant Branding */}
					{tenantName && (
						<div
							className='hidden sm:flex items-center gap-2'
							style={{ color: hasTheme ? 'var(--portal-text-secondary, #a5a5a5)' : '#a1a1aa' }}>
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
