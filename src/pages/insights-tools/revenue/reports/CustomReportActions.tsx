import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CustomReport, CustomReportDefinition } from '@/types/dto/Reports';
import SaveReportDialog from './SaveReportDialog';
import { useCustomReportMutations } from './useReports';

type Mode = 'create' | 'copy' | 'rename';

interface Props {
	custom?: CustomReport;
	definition?: CustomReportDefinition;
	dirty: boolean;
	onSaved: (id: string) => void;
	onDeleted: () => void;
}

const CustomReportActions = ({ custom, definition, dirty, onSaved, onDeleted }: Props) => {
	const { t } = useTranslation('settings', { keyPrefix: 'insightsTools.revenue.reports' });
	const { create, update, remove } = useCustomReportMutations();
	const [mode, setMode] = useState<Mode | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const open = (m: Mode) => {
		create.reset();
		update.reset();
		setMode(m);
	};
	const close = () => setMode(null);
	const submit = (name: string) => {
		if (mode === 'rename' && custom) {
			update.mutate({ id: custom.id, name, definition: custom.definition }, { onSuccess: close });
		} else if (definition) {
			create.mutate(
				{ name, definition },
				{
					onSuccess: (r) => {
						close();
						onSaved(r.id);
					},
				},
			);
		}
	};
	const active = mode === 'rename' ? update : create;
	const titles: Record<Mode, string> = { create: t('saveAsCustom'), copy: t('saveAsNew'), rename: t('rename') };
	const inlineError = !mode && (update.error ?? remove.error);

	return (
		<>
			{custom ? (
				<>
					<Button
						type='button'
						size='sm'
						disabled={!dirty || !definition || update.isPending}
						onClick={() =>
							definition && update.mutate({ id: custom.id, name: custom.name, definition }, { onSuccess: (r) => onSaved(r.id) })
						}>
						{t('save')}
						{dirty && <span role='img' aria-label={t('unsaved')} className='size-2 rounded-full bg-amber-500' />}
					</Button>
					<Button type='button' variant='outline' size='sm' disabled={!definition} onClick={() => open('copy')}>
						{t('saveAsNew')}
					</Button>
					<Button type='button' variant='outline' size='sm' onClick={() => open('rename')}>
						{t('rename')}
					</Button>
					<Button type='button' variant='outline' size='sm' disabled={remove.isPending} onClick={() => setConfirmDelete(true)}>
						{t('delete')}
					</Button>
				</>
			) : (
				<Button type='button' variant='outline' size='sm' disabled={!definition} onClick={() => open('create')}>
					{t('saveAsCustom')}
				</Button>
			)}
			{inlineError && (
				<span role='alert' className='text-xs text-red-600'>
					{(inlineError as Error).message}
				</span>
			)}
			<SaveReportDialog
				open={!!mode}
				title={mode ? titles[mode] : ''}
				initialName={mode === 'rename' ? (custom?.name ?? '') : mode === 'copy' ? t('copyName', { name: custom?.name ?? '' }) : ''}
				error={(active.error as Error | null)?.message}
				pending={active.isPending}
				onSubmit={submit}
				onClose={close}
			/>
			<AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
				<AlertDialogContent className='bg-surface'>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription>{t('deleteConfirmBody', { name: custom?.name })}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={() => custom && remove.mutate(custom.id, { onSuccess: onDeleted })}>
							{t('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default CustomReportActions;
