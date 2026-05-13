import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Page, AddButton, Card, CardHeader, Loader, Button, Input, ShortPagination, Dialog } from '@/components/atoms';
import { FlatTabs, FlexpriceTable } from '@/components/molecules';
import { UserApi } from '@/api/UserApi';
import { User } from '@/models';
import toast from 'react-hot-toast';
import { ColumnData } from '@/components/molecules/Table/Table';
import { AlertTriangle, Copy, Download, Eye, EyeOff, Info, Link2, Lock, Mail } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import type { HttpRejectedError } from '@/core/axios/types';

const MEMBERS_QUERY_KEY = ['settings-team-members'];
const MEMBERS_PAGE_SIZE = 20;

function getRoleDisplay(_user: User): string {
	// Roles not supported yet; every user is admin
	// TODO: Add support when rbac roles are supported for user accounts as well.
	return 'Admin';
}

/** API error shape when add user fails (e.g. user limit reached, duplicate email) */
function getAddUserErrorMessage(err: Error): string {
	const c = (err as HttpRejectedError).cause;
	const raw = c != null ? c : err;
	const e = raw as { error?: { internal_error?: string; message?: string }; message?: string };
	const internal = e?.error?.internal_error ?? '';
	const msg = e?.error?.message ?? e?.message ?? '';
	if (typeof internal === 'string' && internal.toLowerCase().includes('user limit')) {
		return 'User limit reached for this organization.';
	}
	if (typeof msg === 'string' && (msg.toLowerCase().includes('limit reached') || msg.toLowerCase().includes('maximum'))) {
		return 'User limit reached for this organization.';
	}
	if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
		return 'A user with this email already exists!';
	}
	if (typeof msg === 'string' && msg.length) return msg;
	return err.message || 'Failed to add user';
}

function MembersSection() {
	const [addOpen, setAddOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [addError, setAddError] = useState<string | null>(null);
	const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
	const [addedUserEmail, setAddedUserEmail] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

	const { limit, offset, page } = usePagination({
		initialLimit: MEMBERS_PAGE_SIZE,
		prefix: PAGINATION_PREFIX.SETTINGS_MEMBERS,
	});

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: [...MEMBERS_QUERY_KEY, page, limit, offset],
		queryFn: () => UserApi.getTenantMembers({ limit, offset }),
	});

	useEffect(() => {
		if (isError) toast.error('Failed to load members');
	}, [isError]);

	const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

	const createUser = useMutation({
		mutationFn: (payload: { type: 'user'; email: string }) => UserApi.addUserToTenant(payload),
		onSuccess: (res, variables) => {
			setAddOpen(false);
			setAddError(null);
			setAddedUserEmail(variables.email);
			setEmail('');
			setOneTimePassword(res.password);
			setShowPassword(false);
			setPasswordDialogOpen(true);
			refetchQueries(MEMBERS_QUERY_KEY);
		},
		onError: (err: Error) => {
			const message = getAddUserErrorMessage(err);
			setAddError(message);
			toast.error(message);
		},
	});

	const handleAddUser = () => {
		if (createUser.isPending) return;
		const trimmed = email.trim();
		setAddError(null);
		if (!trimmed) {
			toast.error('Enter an email address');
			return;
		}
		if (!isValidEmail(trimmed)) {
			toast.error('Please enter a valid email address');
			setAddError('Please enter a valid email address');
			return;
		}
		createUser.mutate({ type: 'user', email: trimmed });
	};

	const handleAddDialogOpenChange = (open: boolean) => {
		if (!open) setAddError(null);
		setAddOpen(open);
	};

	const handleCopyPassword = async () => {
		if (!oneTimePassword) return;
		try {
			await navigator.clipboard.writeText(oneTimePassword);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Could not copy to clipboard');
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
			toast.success('Login link copied – share it securely with the user.');
		} catch {
			toast.error('Could not copy to clipboard');
		}
	};

	const handleCopyAll = async () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const block = `Email: ${addedUserEmail}\nPassword: ${oneTimePassword}${loginUrl ? `\nLogin link: ${loginUrl}` : ''}`;
		try {
			await navigator.clipboard.writeText(block);
			toast.success('Credentials copied to clipboard.');
		} catch {
			toast.error('Could not copy to clipboard');
		}
	};

	const escapeCsvCell = (value: string) => {
		if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
		return value;
	};

	const handleDownloadCsv = () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const header = 'email,password,login_link';
		const row = [escapeCsvCell(addedUserEmail), escapeCsvCell(oneTimePassword), escapeCsvCell(loginUrl)];
		const csv = `${header}\r\n${row.join(',')}`;
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `flexprice-credentials-${addedUserEmail.replace(/@.*/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'user'}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success('Credentials downloaded.');
	};

	const handleClosePasswordDialog = () => {
		setOneTimePassword(null);
		setAddedUserEmail(null);
		setPasswordDialogOpen(false);
	};

	const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

	const members: User[] = data?.items ?? [];
	const totalMembers = data?.pagination?.total ?? 0;
	const columns: ColumnData<User>[] = [
		{ title: 'Email', fieldName: 'email' },
		{
			title: 'Role',
			render: (row) => {
				const role = getRoleDisplay(row);
				return <span className='inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'>{role}</span>;
			},
		},
	];

	return (
		<>
			<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
				<CardHeader
					title='Members'
					titleClassName='text-lg font-medium text-zinc-800'
					cta={<AddButton label='Add' variant='outline' onClick={() => setAddOpen(true)} />}
				/>
				{isLoading && <Loader />}
				{!isLoading && isError && (
					<div className='flex flex-col items-center justify-center gap-3 py-8 text-center'>
						<p className='text-sm text-red-700'>Failed to load members. Please try again.</p>
						<Button variant='outline' onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				)}
				{!isLoading && !isError && (
					<>
						<div className='border-t border-gray-100 pt-4 -mx-6 px-6'>
							<FlexpriceTable columns={columns} data={members} showEmptyRow />
							<div className='text-zinc-500'>
								<ShortPagination
									prefix={PAGINATION_PREFIX.SETTINGS_MEMBERS}
									unit='members'
									totalItems={totalMembers}
									pageSize={MEMBERS_PAGE_SIZE}
								/>
							</div>
						</div>
					</>
				)}
			</Card>

			{/* Add member dialog – premium minimal */}
			<Dialog
				isOpen={addOpen}
				onOpenChange={handleAddDialogOpenChange}
				title='Add member'
				description='Invite a new team member by email.'
				titleClassName='text-lg font-semibold text-zinc-900'
				descriptionClassName='text-sm text-zinc-500'
				className='sm:max-w-[425px] rounded-xl shadow-lg border border-gray-100'>
				<div className='space-y-3 mt-3'>
					{addError && (
						<div className='w-full flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-3 py-2' role='alert'>
							<AlertTriangle className='h-4 w-4 flex-shrink-0 text-red-600' />
							<span className='text-sm font-medium text-red-700 leading-relaxed'>{addError}</span>
						</div>
					)}
					<div>
						<label htmlFor='member-email' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
							Email
						</label>
						<div className='flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white'>
							<Mail className='h-4 w-4 text-zinc-400 flex-shrink-0 ml-3' />
							<Input
								id='member-email'
								type='email'
								placeholder='user@example.com'
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
							Add user
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Login credentials dialog – premium minimal */}
			<Dialog
				isOpen={passwordDialogOpen}
				onOpenChange={(open) => (open ? setPasswordDialogOpen(true) : handleClosePasswordDialog())}
				title='Login Credentials'
				description='Share these with the new user so they can sign in.'
				className='w-full max-w-[480px] rounded-xl shadow-lg border border-gray-100'>
				<div className='space-y-4 mt-3'>
					{/* Email row */}
					{addedUserEmail && (
						<div>
							<span className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>Email</span>
							<div className='mt-1 flex items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2 min-h-[40px]'>
								<Mail className='h-4 w-4 text-zinc-400 flex-shrink-0' />
								<span className='flex-1 min-w-0 truncate text-sm text-zinc-900'>{addedUserEmail}</span>
								<button
									type='button'
									onClick={() => {
										navigator.clipboard.writeText(addedUserEmail);
										toast.success('Email copied');
									}}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title='Copy email'
									aria-label='Copy email'>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					)}

					{/* Password row */}
					<div>
						<span className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>Password</span>
						<div className='mt-1 relative flex items-center rounded-md border border-gray-200 bg-zinc-50 px-3 py-2 min-h-[40px]'>
							<Lock className='h-4 w-4 text-zinc-400 flex-shrink-0' />
							<Input
								id='temp-password'
								readOnly
								type={showPassword ? 'text' : 'password'}
								value={oneTimePassword ?? ''}
								className='flex-1 border-0 bg-transparent font-mono text-sm text-zinc-900 py-0 pl-2 pr-24 focus-visible:ring-0 min-h-[24px]'
							/>
							<div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5'>
								<button
									type='button'
									onClick={togglePasswordVisibility}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title={showPassword ? 'Hide password' : 'Show password'}
									aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</button>
								<button
									type='button'
									onClick={handleCopyPassword}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title='Copy password'
									aria-label='Copy password'>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					</div>

					{/* Login link (magic link) */}
					{loginUrl && (
						<div className='border-t border-gray-100 pt-4'>
							<p className='text-xs text-zinc-500 mb-2'>One-click sign-in link – share this with the user.</p>
							<div className='flex items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2'>
								<Link2 className='h-4 w-4 text-zinc-400 flex-shrink-0' />
								<span className='flex-1 min-w-0 truncate text-sm text-zinc-600' title={loginUrl}>
									{loginUrl.length > 44 ? `${loginUrl.slice(0, 44)}…` : loginUrl}
								</span>
							</div>
						</div>
					)}

					{/* Actions: Download CSV, Copy all, Done */}
					<div className='flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4'>
						<Button onClick={handleCopyLoginLink} className='shrink-0'>
							<Link2 className='h-3.5 w-3.5 mr-1.5' />
							Copy login link
						</Button>
						<Button variant='outline' size='sm' onClick={handleDownloadCsv} className='shrink-0'>
							<Download className='h-3.5 w-3.5 mr-1.5' />
							Download CSV
						</Button>
						<Button variant='outline' size='sm' onClick={handleCopyAll} className='shrink-0'>
							<Copy className='h-3.5 w-3.5 mr-1.5' />
							Copy all
						</Button>
					</div>

					{/* Compact info */}
					<div className='flex flex-col gap-1.5 text-xs text-zinc-500'>
						<div className='flex items-center gap-2'>
							<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-amber-500' />
							<span>This password can be reset later.</span>
						</div>
						<div className='flex items-center gap-2'>
							<Info className='h-3.5 w-3.5 flex-shrink-0 text-sky-500' />
							<span>User can sign in with email/password or Google.</span>
						</div>
					</div>
				</div>
			</Dialog>
		</>
	);
}

const SettingsDashboard = () => {
	return (
		<Page heading='Settings' documentTitle='Settings' headingClassName='font-semibold text-2xl text-zinc-900'>
			<FlatTabs
				className='[&_.border-b]:border-gray-200'
				tabs={[
					{
						value: 'team',
						label: 'Team',
						content: <MembersSection />,
					},
				]}
				defaultValue='team'
			/>
		</Page>
	);
};

export default SettingsDashboard;
