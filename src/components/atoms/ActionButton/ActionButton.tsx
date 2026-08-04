import { BsThreeDots } from 'react-icons/bs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from '@/components/atoms';
import { Copy, EyeOff, Pencil } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { copyToClipboard } from '@/utils/common/helper_functions';

interface EditActionConfig {
	enabled?: boolean;
	path?: string;
	onClick?: () => void;
	text?: string;
	icon?: React.ReactNode;
}

interface ArchiveActionConfig {
	enabled?: boolean;
	/** When true, the menu item is visible but not clickable. */
	disabled?: boolean;
	text?: string;
	icon?: React.ReactNode;
	/** Optional title/tooltip when disabled */
	disabledReason?: string;
}

interface CustomAction {
	text: string;
	icon?: React.ReactNode;
	onClick: () => void;
	enabled?: boolean;
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
	refetchQueryKey: string | string[];
	entityName: string;
	triggerIcon?: React.ReactNode;
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

	return (
		<>
			<div data-interactive='true' onClick={handleClick}>
				<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
					<DropdownMenuTrigger asChild>
						<button>{trigger}</button>
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
						{editConfig.enabled !== false && (
							<DropdownMenuItem
								onSelect={(event) => {
									event.preventDefault();
									setIsOpen(false);
									if (editConfig.onClick) {
										editConfig.onClick();
									} else if (editConfig.path) {
										navigate(editConfig.path);
									}
								}}
								className='flex gap-2 items-center w-full cursor-pointer'>
								{editConfig.icon || <Pencil />}
								<span>{editActionText}</span>
							</DropdownMenuItem>
						)}
						{archiveConfig.enabled !== false && (
							<DropdownMenuItem
								disabled={archiveConfig.disabled}
								title={archiveConfig.disabled ? archiveConfig.disabledReason : undefined}
								onSelect={(event) => {
									event.preventDefault();
									if (archiveConfig.disabled) return;
									setIsOpen(false);
									setIsDialogOpen(true);
								}}
								className='flex gap-2 items-center w-full cursor-pointer'>
								{archiveConfig.icon || <EyeOff />}
								<span>{archiveActionText}</span>
							</DropdownMenuItem>
						)}
						{customActions?.map(
							(action, index) =>
								action.enabled !== false && (
									<DropdownMenuItem
										key={index}
										onSelect={(event) => {
											event.preventDefault();
											setIsOpen(false);
											action.onClick();
										}}
										className='flex gap-2 items-center w-full cursor-pointer'>
										{action.icon}
										<span>{action.text}</span>
									</DropdownMenuItem>
								),
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Dialog
				title={
					<span className='text-lg font-normal text-gray-800'>
						{t('actionButton.confirmActionOnEntityPrefix', { action: confirmArchiveVerb })}{' '}
						<span className='font-semibold text-gray-900'>{entityName}</span>?
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
