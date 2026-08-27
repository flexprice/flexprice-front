import { BsThreeDots } from 'react-icons/bs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Tooltip } from '@/components/atoms';
import { Copy, EyeOff, Pencil } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/common/helper_functions';

interface EditActionConfig {
	enabled?: boolean;
	/** RBAC-style gating: item stays visible but inert, with a tooltip explaining why. Prefer this over `enabled: false` for permission checks so the menu doesn't reflow. */
	disabled?: boolean;
	disabledReason?: string;
	path?: string;
	onClick?: () => void;
	text?: string;
	icon?: React.ReactNode;
}

interface ArchiveActionConfig {
	enabled?: boolean;
	disabled?: boolean;
	disabledReason?: string;
	text?: string;
	icon?: React.ReactNode;
}

interface CustomAction {
	text: string;
	icon?: React.ReactNode;
	onClick: () => void;
	enabled?: boolean;
	disabled?: boolean;
	disabledReason?: string;
}

interface CopyIdActionConfig {
	enabled?: boolean;
	/** e.g. "Plan" — renders the menu label/toast as "Copy Plan ID" via the copyId i18n keys. Omit for the generic "Copy ID" label. */
	entityType?: string;
	label?: string;
}

interface ActionProps {
	id: string;
	deleteMutationFn: (id: string) => Promise<void>;
	refetchQueryKey: string;
	entityName: string;
	triggerIcon?: React.ReactNode;
	/** Accessible name for the menu trigger. Defaults to a generic "Row actions"; pass a specific
	 * label (e.g. "Actions for Acme Corp") so screen readers and E2E role selectors can tell rows apart. */
	ariaLabel?: string;
	edit?: EditActionConfig;
	archive?: ArchiveActionConfig;
	customActions?: CustomAction[];
	/** Opt-in "Copy ID" menu item, rendered first. Omit to leave the menu unchanged. */
	copyId?: CopyIdActionConfig;
	disableToast?: boolean;
	// Legacy props for backward compatibility
	row?: unknown;
	editPath?: string;
	onEdit?: () => void;
	isArchiveDisabled?: boolean;
	isEditDisabled?: boolean;
	archiveText?: string;
	editText?: string;
	archiveIcon?: React.ReactNode;
	editIcon?: React.ReactNode;
}

const ActionButton: FC<ActionProps> = ({
	id,
	deleteMutationFn,
	refetchQueryKey,
	entityName,
	triggerIcon,
	ariaLabel,
	edit,
	archive,
	customActions,
	copyId,
	disableToast = false,
	// Legacy props
	editPath,
	onEdit,
	isArchiveDisabled,
	isEditDisabled,
	archiveText,
	editText,
	archiveIcon,
	editIcon,
	row: _row,
}) => {
	const { t } = useTranslation('common');
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();

	// Consolidate props: use new config objects if provided, otherwise fall back to legacy props
	const editConfig: EditActionConfig = edit || {
		enabled: !isEditDisabled,
		path: editPath,
		onClick: onEdit,
		text: editText,
		icon: editIcon,
	};

	const archiveConfig: ArchiveActionConfig = archive || {
		enabled: !isArchiveDisabled,
		text: archiveText,
		icon: archiveIcon,
	};

	const archiveActionText = archiveConfig.text || t('actions.archive');
	const editActionText = editConfig.text || t('actions.edit');
	const usesDefaultArchiveLabel = archive?.text === undefined && archiveText === undefined;
	const confirmArchiveVerb = archiveActionText.toLowerCase();

	const { mutate: deleteEntity } = useMutation({
		mutationFn: deleteMutationFn,
		onSuccess: async () => {
			if (!disableToast) {
				toast.success(
					usesDefaultArchiveLabel ? t('toast.archiveSuccess', { entity: entityName }) : t('toast.updateSuccess', { entity: entityName }),
				);
			}
			await refetchQueries(refetchQueryKey);
		},
		onError: (err: Error) => {
			if (!disableToast) {
				const message = err?.message;
				toast.error(
					message ||
						(usesDefaultArchiveLabel
							? t('actionButton.archiveFailed', { entity: entityName })
							: t('actionButton.actionFailedGeneric', { entity: entityName })),
				);
			}
		},
	});

	const handleClick = (e: React.MouseEvent) => {
		// Prevent event from bubbling up to parent elements
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	const defaultTriggerIcon = <BsThreeDots className='text-base size-4' />;
	const trigger = triggerIcon || defaultTriggerIcon;

	const renderMenuItem = ({
		key,
		icon,
		text,
		disabled,
		disabledReason,
		onSelect,
	}: {
		key: React.Key;
		icon?: React.ReactNode;
		text?: string;
		disabled?: boolean;
		disabledReason?: string;
		onSelect: () => void;
	}) => {
		const item = (
			<DropdownMenuItem
				key={key}
				aria-disabled={disabled}
				onSelect={(event) => {
					event.preventDefault();
					if (disabled) return;
					onSelect();
				}}
				className={cn('flex gap-2 items-center w-full cursor-pointer', disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent')}>
				{icon}
				<span>{text}</span>
			</DropdownMenuItem>
		);

		if (!disabled || !disabledReason) return item;

		// Tooltip wraps the item directly (asChild merges its trigger props into it) rather than
		// adding a wrapping <span> — keeping `disabled` off Radix's own prop keeps the item in the
		// menu's roving-focus/collection structure and reachable by arrow-key nav; the select itself
		// is blocked in onSelect above instead of via Radix's disabled state.
		return (
			<Tooltip key={key} content={disabledReason}>
				{item}
			</Tooltip>
		);
	};

	return (
		<>
			<div data-interactive='true' onClick={handleClick}>
				<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
					<DropdownMenuTrigger asChild>
						<button type='button' aria-label={ariaLabel || t('actions.rowActions')}>
							{trigger}
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						{copyId && copyId.enabled !== false && (
							<DropdownMenuItem
								onSelect={(event) => {
									event.preventDefault();
									setIsOpen(false);
									void copyToClipboard(
										id,
										copyId.entityType ? t('copyId.toastWithType', { type: copyId.entityType }) : t('copyId.toastFallback'),
									);
								}}
								className='flex gap-2 items-center w-full cursor-pointer'>
								<Copy />
								<span>{copyId.label || t('copyId.genericLabel')}</span>
							</DropdownMenuItem>
						)}
						{editConfig.enabled !== false &&
							renderMenuItem({
								// eslint-disable-next-line i18next/no-literal-string -- React key identifier, not UI text
								key: 'edit',
								icon: editConfig.icon || <Pencil />,
								text: editActionText,
								disabled: editConfig.disabled,
								disabledReason: editConfig.disabledReason,
								onSelect: () => {
									setIsOpen(false);
									if (editConfig.onClick) {
										editConfig.onClick();
									} else if (editConfig.path) {
										navigate(editConfig.path);
									}
								},
							})}
						{archiveConfig.enabled !== false &&
							renderMenuItem({
								// eslint-disable-next-line i18next/no-literal-string -- React key identifier, not UI text
								key: 'archive',
								icon: archiveConfig.icon || <EyeOff />,
								text: archiveActionText,
								disabled: archiveConfig.disabled,
								disabledReason: archiveConfig.disabledReason,
								onSelect: () => {
									setIsOpen(false);
									setIsDialogOpen(true);
								},
							})}
						{customActions?.map(
							(action, index) =>
								action.enabled !== false &&
								renderMenuItem({
									key: index,
									icon: action.icon,
									text: action.text,
									disabled: action.disabled,
									disabledReason: action.disabledReason,
									onSelect: () => {
										setIsOpen(false);
										action.onClick();
									},
								}),
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Dialog
				title={
					<span className='text-lg font-normal text-content-heading'>
						{t('actionButton.confirmActionOnEntityPrefix', { action: confirmArchiveVerb })}{' '}
						<span className='font-semibold text-content'>{entityName}</span>?
					</span>
				}
				titleClassName='w-[90%]'
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={() => setIsDialogOpen(false)}>
							{t('actions.cancel')}
						</Button>
						<Button
							onClick={() => {
								setIsDialogOpen(false);
								deleteEntity(id);
							}}>
							{archiveActionText}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default ActionButton;
