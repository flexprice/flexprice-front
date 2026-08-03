import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Loader } from '@/components/atoms';
import { UpdateTenantDrawer } from '@/components/molecules';
import useUser from '@/hooks/useUser';
import { isAdminMember, type SettingsMember } from './memberUtils';

function getTenantInitials(name: string | undefined, fallback: string): string {
	return (
		name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || fallback
	);
}

const OrganizationInfoCard = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { user, loading } = useUser();
	const [editOpen, setEditOpen] = useState(false);

	const tenantName = user?.tenant?.name ?? t('organization.title');
	const initials = useMemo(() => getTenantInitials(user?.tenant?.name, 'OA'), [user?.tenant?.name]);
	const isAdmin = user ? isAdminMember(user as SettingsMember) : false;

	return (
		<Card variant='default' noPadding className='rounded-lg border border-line bg-surface p-5 shadow-none'>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex min-w-0 items-center gap-3'>
					<span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-avatar-navy text-sm font-semibold text-content-inverse'>
						{initials}
					</span>
					<div className='min-w-0'>
						<div className='flex items-center gap-1.5'>
							<h3 className='truncate text-base font-semibold text-content-zinc-bold'>{tenantName}</h3>
							{user ? (
								<UpdateTenantDrawer
									data={user}
									open={editOpen}
									onOpenChange={setEditOpen}
									trigger={
										<Button
											variant='ghost'
											size='icon'
											className='h-6 w-6 shrink-0 text-content-zinc-subtle hover:text-content-zinc-tertiary'
											aria-label={t('organization.editOrganization')}>
											<Pencil className='h-4 w-4' />
										</Button>
									}
								/>
							) : null}
						</div>
						{loading ? <Loader /> : user?.email ? <p className='text-sm text-content-zinc-muted'>{user.email}</p> : null}
					</div>
				</div>

				{!loading && user ? (
					<div className='flex shrink-0 flex-col items-end gap-1'>
						<Chip
							label={isAdmin ? t('members.roleAdmin') : t('members.roleMember')}
							variant={isAdmin ? 'success' : 'info'}
							className='rounded-full px-2.5 text-xs'
						/>
						{isAdmin ? <p className='text-sm text-content-zinc-muted'>{t('organization.workspaceOwner')}</p> : null}
					</div>
				) : null}
			</div>
		</Card>
	);
};

export default OrganizationInfoCard;
