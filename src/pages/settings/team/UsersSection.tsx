import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ColumnData } from '@/components/molecules/Table/Table';
import { AlertTriangle, Copy, Download, Eye, EyeOff, Info, Link2, Lock, Mail, Trash2 } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import type { HttpRejectedError } from '@/core/axios/types';
import { formatDateShort } from '@/utils/common/helper_functions';
import {
	Card,
	CardHeader,
	Loader,
	Button,
	Input,
	Dialog,
	Chip,
	ShortPaginationControls,
	AddButton,
	ActionButton,
} from '@/components/atoms';
import { FlexpriceTable, OptionFilterPopover, type OptionFilterGroup } from '@/components/molecules';
import { useTranslation } from 'react-i18next';
import useUser from '@/hooks/useUser';
import { UserApi } from '@/api/UserApi';
import { useTenantMembers } from './useTenantMembers';
import {
	canRemoveMember,
	filterMembers,
	getMemberJoinedDate,
	getRemoveMemberDisabledReason,
	isAdminMember,
	isPendingMember,
	membersHaveStatus,
	type MemberRoleFilter,
	type MemberStatusFilter,
	type SettingsMember,
} from './memberUtils';
import { settingsQueryKeys } from '../queryKeys';

function UsersSection() {
	const { t } = useTranslation(['settings', 'common']);
	const { user: currentUser } = useUser();
	const { members, totalMembers, isLoading, isError, refetch, pageSize, createUser } = useTenantMembers();

	const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>('all');
	const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all');
	const [page, setPage] = useState(1);
	const [userDialogOpen, setUserDialogOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [addError, setAddError] = useState<string | null>(null);
	const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
	const [addedUserEmail, setAddedUserEmail] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

	const showMemberStatus = useMemo(() => membersHaveStatus(members as SettingsMember[]), [members]);

	const activeFilterCount = (roleFilter !== 'all' ? 1 : 0) + (showMemberStatus && statusFilter !== 'all' ? 1 : 0);

	const filteredMembers = useMemo(
		() => filterMembers(members as SettingsMember[], roleFilter, statusFilter),
		[members, roleFilter, statusFilter],
	);

	const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
	const showPagination = totalPages > 1 || page > 1;

	const memberFilterGroups = useMemo((): OptionFilterGroup[] => {
		const groups: OptionFilterGroup[] = [
			{
				id: 'role',
				label: t('members.filters.role'),
				value: roleFilter,
				onChange: (value: string) => setRoleFilter(value as MemberRoleFilter),
				options: [
					{ value: 'all' as const, label: t('members.filters.all') },
					{ value: 'admin' as const, label: t('members.roleAdmin') },
					{ value: 'member' as const, label: t('members.roleMember') },
				],
			},
		];

		if (showMemberStatus) {
			groups.push({
				id: 'status',
				label: t('members.filters.status'),
				value: statusFilter,
				onChange: (value: string) => setStatusFilter(value as MemberStatusFilter),
				options: [
					{ value: 'all' as const, label: t('members.filters.all') },
					{ value: 'joined' as const, label: t('members.filters.joined') },
					{ value: 'pending' as const, label: t('members.filters.pending') },
				],
			});
		}

		return groups;
	}, [roleFilter, showMemberStatus, statusFilter, t]);

	const paginatedMembers = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredMembers.slice(start, start + pageSize);
	}, [filteredMembers, page, pageSize]);

	useEffect(() => {
		setPage(1);
	}, [roleFilter, statusFilter]);

	useEffect(() => {
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

	useEffect(() => {
		if (isError) toast.error(t('members.errors.failedToLoadUsers'));
	}, [isError, t]);

	const getAddUserErrorMessage = (err: Error): string => {
		const c = (err as HttpRejectedError).cause;
		const raw = c != null ? c : err;
		const e = raw as { error?: { internal_error?: string; message?: string }; message?: string };
		const internal = e?.error?.internal_error ?? '';
		const msg = e?.error?.message ?? e?.message ?? '';
		if (typeof internal === 'string' && internal.toLowerCase().includes('user limit')) {
			return t('members.errors.userLimitReached');
		}
		if (typeof msg === 'string' && (msg.toLowerCase().includes('limit reached') || msg.toLowerCase().includes('maximum'))) {
			return t('members.errors.userLimitReached');
		}
		if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
			return t('members.errors.userAlreadyExists');
		}
		if (typeof msg === 'string' && msg.length) return msg;
		return err.message || t('members.errors.failedToAddUser');
	};

	const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

	const openInviteDialog = () => {
		setAddError(null);
		setEmail('');
		setUserDialogOpen(true);
	};

	const closeUserDialog = () => {
		setAddError(null);
		setUserDialogOpen(false);
	};

	const handleAddUser = () => {
		if (createUser.isPending) return;
		const trimmed = email.trim();
		setAddError(null);
		if (!trimmed) {
			toast.error(t('members.errors.enterEmail'));
			return;
		}
		if (!isValidEmail(trimmed)) {
			toast.error(t('members.errors.emailInvalid'));
			setAddError(t('members.errors.emailInvalid'));
			return;
		}
		createUser.mutate(
			{ type: 'user', email: trimmed },
			{
				onSuccess: (res, variables) => {
					closeUserDialog();
					setEmail('');
					setAddedUserEmail(variables.email);
					setOneTimePassword(res.password);
					setShowPassword(false);
					setPasswordDialogOpen(true);
				},
				onError: (err: Error) => {
					const message = getAddUserErrorMessage(err);
					setAddError(message);
					toast.error(message);
				},
			},
		);
	};

	const handleCopyPassword = async () => {
		if (!oneTimePassword) return;
		try {
			await navigator.clipboard.writeText(oneTimePassword);
			toast.success(t('common:toast.copySuccess'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const loginUrl =
		addedUserEmail && oneTimePassword
			? `${window.location.origin}${RouteNames.auth}?email=${encodeURIComponent(addedUserEmail)}&password=${encodeURIComponent(oneTimePassword)}`
			: '';

	const handleCopyLoginLink = async () => {
		if (!loginUrl) return;
		try {
			await navigator.clipboard.writeText(loginUrl);
			toast.success(t('members.errors.loginLinkCopied'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const handleCopyAll = async () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const lines = [
			t('members.credentials.copyBlockEmailLine', { email: addedUserEmail }),
			t('members.credentials.copyBlockPasswordLine', { password: oneTimePassword }),
		];
		if (loginUrl) lines.push(t('members.credentials.copyBlockLoginLine', { url: loginUrl }));
		try {
			await navigator.clipboard.writeText(lines.join('\n'));
			toast.success(t('members.errors.credentialsCopied'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const escapeCsvCell = (value: string) => {
		if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
		return value;
	};

	const handleDownloadCsv = () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const header = t('members.credentials.csvHeader');
		const row = [escapeCsvCell(addedUserEmail), escapeCsvCell(oneTimePassword), escapeCsvCell(loginUrl)];
		const csv = `${header}\r\n${row.join(',')}`;
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `flexprice-credentials-${addedUserEmail.replace(/@.*/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'user'}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success(t('members.errors.credentialsDownloaded'));
	};

	const handleClosePasswordDialog = () => {
		setOneTimePassword(null);
		setAddedUserEmail(null);
		setPasswordDialogOpen(false);
	};

	const columns: ColumnData<SettingsMember>[] = [
		{ title: t('members.columns.email'), fieldName: 'email' },
		{
			title: t('members.columns.role'),
			render: (row) => {
				const isAdmin = isAdminMember(row);
				return <Chip label={isAdmin ? t('members.roleAdmin') : t('members.roleMember')} variant={isAdmin ? 'success' : 'info'} />;
			},
		},
		{
			title: t('members.columns.joined'),
			render: (row) => {
				if (showMemberStatus && isPendingMember(row)) {
					return <Chip label={t('members.joinedPending')} variant='warning' />;
				}
				const joinedDate = getMemberJoinedDate(row);
				return <span className='text-sm text-zinc-600'>{joinedDate ? formatDateShort(joinedDate) : '—'}</span>;
			},
		},
		{
			fieldVariant: 'interactive',
			width: 48,
			align: 'right',
			render: (row) => {
				const removeAllowed = canRemoveMember(row, totalMembers, currentUser?.id);
				const disabledReason = getRemoveMemberDisabledReason(row, totalMembers, currentUser?.id, {
					lastUser: t('members.remove.disabledLastUser'),
					self: t('members.remove.disabledSelf'),
				});

				return (
					<ActionButton
						id={row.id}
						entityName={row.email || row.name || row.id}
						disableToast
						deleteMutationFn={async (id) => {
							try {
								await UserApi.removeUserFromTenant(id);
								toast.success(t('members.remove.success'));
							} catch (err) {
								const message = (err as Error)?.message || t('members.remove.failed');
								toast.error(message);
								throw err;
							}
						}}
						refetchQueryKey={[...settingsQueryKeys.teamMembersRoot()]}
						edit={{ enabled: false }}
						copyId={{ entityType: 'User' }}
						archive={{
							enabled: true,
							disabled: !removeAllowed,
							disabledReason: disabledReason ?? undefined,
							text: t('members.actions.remove'),
							icon: <Trash2 className='h-4 w-4' />,
						}}
					/>
				);
			},
		},
	];

	return (
		<>
			<Card variant='default' className='rounded-xl border border-gray-200 bg-white shadow-sm'>
				<CardHeader
					title={t('members.cardTitle')}
					titleClassName='text-lg font-semibold text-zinc-900'
					cta={
						<div className='flex items-center gap-2'>
							<OptionFilterPopover
								ariaLabel={t('members.filters.title')}
								groups={memberFilterGroups}
								activeFilterCount={activeFilterCount}
							/>
							<AddButton label={t('members.actions.invite')} onClick={openInviteDialog} />
						</div>
					}
				/>
				{isLoading && <Loader />}
				{!isLoading && isError && (
					<div className='flex flex-col items-center justify-center gap-3 py-8 text-center'>
						<p className='text-sm text-red-700'>{t('members.errors.loadError')}</p>
						<Button variant='outline' onClick={() => refetch()}>
							{t('common:actions.retry')}
						</Button>
					</div>
				)}
				{!isLoading && !isError && (
					<div className='-mx-6 border-t border-gray-100 px-6 pt-2'>
						<FlexpriceTable columns={columns} data={paginatedMembers} showEmptyRow />
						{showPagination ? (
							<ShortPaginationControls
								page={page}
								onPageChange={setPage}
								unit={t('members.unitUsers', { count: filteredMembers.length })}
								totalItems={filteredMembers.length}
								pageSize={pageSize}
							/>
						) : (
							<div className='border-t border-gray-100 py-4'>
								<span className='text-sm text-zinc-500'>{t('members.usersCount', { count: filteredMembers.length })}</span>
							</div>
						)}
					</div>
				)}
			</Card>

			<Dialog
				isOpen={userDialogOpen}
				onOpenChange={(open) => {
					if (!open) closeUserDialog();
					else setUserDialogOpen(true);
				}}
				title={t('members.addMember.title')}
				description={t('members.addMember.description')}
				titleClassName='text-lg font-semibold text-zinc-900'
				descriptionClassName='text-sm text-zinc-500'
				className='rounded-xl border border-gray-100 shadow-lg sm:max-w-[425px]'>
				<div className='mt-3 space-y-3'>
					{addError && (
						<div className='flex w-full items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-3 py-2' role='alert'>
							<AlertTriangle className='h-4 w-4 flex-shrink-0 text-red-600' />
							<span className='text-sm font-medium leading-relaxed text-red-700'>{addError}</span>
						</div>
					)}
					<div>
						<label htmlFor='member-email' className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500'>
							{t('members.addMember.emailLabel')}
						</label>
						<div className='mb-4 flex items-center gap-2 rounded-md border border-gray-200 bg-white'>
							<Mail className='ml-3 h-4 w-4 flex-shrink-0 text-zinc-400' />
							<Input
								id='member-email'
								type='email'
								placeholder={t('members.addMember.emailPlaceholder')}
								value={email}
								onChange={(value) => setEmail(value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddUser();
									}
								}}
								autoFocus
								className='border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
							/>
						</div>
					</div>
					<div className='flex justify-end'>
						<Button onClick={handleAddUser} disabled={createUser.isPending} isLoading={createUser.isPending}>
							{t('members.addMember.addUser')}
						</Button>
					</div>
				</div>
			</Dialog>

			<Dialog
				isOpen={passwordDialogOpen}
				onOpenChange={(open) => (open ? setPasswordDialogOpen(true) : handleClosePasswordDialog())}
				title={t('members.credentials.title')}
				description={t('members.credentials.description')}
				className='w-full max-w-[480px] rounded-xl border border-gray-100 shadow-lg'>
				<div className='mt-3 space-y-4'>
					{addedUserEmail && (
						<div>
							<span className='text-xs font-medium uppercase tracking-wide text-zinc-500'>{t('members.addMember.emailLabel')}</span>
							<div className='mt-1 flex min-h-[40px] items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2'>
								<Mail className='h-4 w-4 flex-shrink-0 text-zinc-400' />
								<span className='min-w-0 flex-1 truncate text-sm text-zinc-900'>{addedUserEmail}</span>
								<button
									type='button'
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(addedUserEmail);
											toast.success(t('members.credentials.emailCopied'));
										} catch {
											toast.error(t('members.errors.copyFailed'));
										}
									}}
									className='rounded p-1.5 text-zinc-500 hover:text-zinc-700'
									title={t('members.credentials.copyEmail')}
									aria-label={t('members.credentials.copyEmail')}>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					)}

					<div>
						<span className='text-xs font-medium uppercase tracking-wide text-zinc-500'>{t('members.credentials.password')}</span>
						<div className='relative mt-1 flex min-h-[40px] items-center rounded-md border border-gray-200 bg-zinc-50 px-3 py-2'>
							<Lock className='h-4 w-4 flex-shrink-0 text-zinc-400' />
							<Input
								id='temp-password'
								readOnly
								type={showPassword ? 'text' : 'password'}
								value={oneTimePassword ?? ''}
								className='min-h-[24px] flex-1 border-0 bg-transparent py-0 pl-2 pr-24 font-mono text-sm text-zinc-900 focus-visible:ring-0'
							/>
							<div className='absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5'>
								<button
									type='button'
									onClick={() => setShowPassword((prev) => !prev)}
									className='rounded p-1.5 text-zinc-500 hover:text-zinc-700'
									title={showPassword ? t('members.credentials.hidePassword') : t('members.credentials.showPassword')}
									aria-label={showPassword ? t('members.credentials.hidePassword') : t('members.credentials.showPassword')}>
									{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</button>
								<button
									type='button'
									onClick={handleCopyPassword}
									className='rounded p-1.5 text-zinc-500 hover:text-zinc-700'
									title={t('members.credentials.copyPassword')}
									aria-label={t('members.credentials.copyPassword')}>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					</div>

					{loginUrl && (
						<div className='border-t border-gray-100 pt-4'>
							<p className='mb-2 text-xs text-zinc-500'>{t('members.credentials.oneClickHint')}</p>
							<div className='flex items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2'>
								<Link2 className='h-4 w-4 flex-shrink-0 text-zinc-400' />
								<span className='min-w-0 flex-1 truncate text-sm text-zinc-600' title={loginUrl}>
									{loginUrl.length > 44 ? `${loginUrl.slice(0, 44)}…` : loginUrl}
								</span>
							</div>
						</div>
					)}

					<div className='flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4'>
						<Button onClick={handleCopyLoginLink} className='shrink-0'>
							<Link2 className='mr-1.5 h-3.5 w-3.5' />
							{t('members.credentials.copyLoginLink')}
						</Button>
						<Button variant='outline' size='sm' onClick={handleDownloadCsv} className='shrink-0'>
							<Download className='mr-1.5 h-3.5 w-3.5' />
							{t('members.credentials.downloadCsv')}
						</Button>
						<Button variant='outline' size='sm' onClick={handleCopyAll} className='shrink-0'>
							<Copy className='mr-1.5 h-3.5 w-3.5' />
							{t('members.credentials.copyAll')}
						</Button>
					</div>

					<div className='flex flex-col gap-1.5 text-xs text-zinc-500'>
						<div className='flex items-center gap-2'>
							<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-amber-500' />
							<span>{t('members.credentials.passwordResetNote')}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Info className='h-3.5 w-3.5 flex-shrink-0 text-sky-500' />
							<span>{t('members.credentials.signInMethodsNote')}</span>
						</div>
					</div>
				</div>
			</Dialog>
		</>
	);
}

export default UsersSection;
