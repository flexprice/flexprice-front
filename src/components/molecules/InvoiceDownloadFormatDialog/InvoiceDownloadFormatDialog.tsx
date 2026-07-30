import Dialog from '@/components/atoms/Dialog/Dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface InvoiceDownloadFormatDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectPdf: () => void | Promise<void>;
	onSelectCsv: () => void | Promise<void>;
	isPdfPending?: boolean;
	isCsvPending?: boolean;
}

const InvoiceDownloadFormatDialog: FC<InvoiceDownloadFormatDialogProps> = ({
	open,
	onOpenChange,
	onSelectPdf,
	onSelectCsv,
	isPdfPending = false,
	isCsvPending = false,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const busy = isPdfPending || isCsvPending;

	const handlePdf = async () => {
		try {
			await onSelectPdf();
		} finally {
			onOpenChange(false);
		}
	};

	const handleCsv = async () => {
		try {
			await onSelectCsv();
		} finally {
			onOpenChange(false);
		}
	};

	return (
		<Dialog
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('invoices.details.downloadInvoice')}
			description={t('invoices.details.chooseFormat')}
			className='sm:max-w-md'>
			<div className='grid grid-cols-2 gap-3 w-full'>
				<button
					type='button'
					disabled={busy}
					onClick={() => void handlePdf()}
					className={cn(
						'flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200/90 bg-gradient-to-b from-white to-rose-50/40 px-4 py-8 text-center transition-all',
						'hover:border-rose-200 hover:from-rose-50/30 hover:to-rose-50/60 hover:shadow-sm',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}>
					<span
						className={cn(
							'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400/25 via-red-500/20 to-red-600/30 shadow-inner',
							'ring-1 ring-inset ring-red-500/15',
						)}>
						{isPdfPending ? (
							<Loader2 className='h-8 w-8 animate-spin text-red-600' aria-hidden />
						) : (
							<FaFilePdf className='h-10 w-10 text-[#EC1C24] drop-shadow-sm' aria-hidden />
						)}
					</span>
					<span className='text-sm font-medium text-zinc-900'>{t('invoices.details.downloadFormatPdf')}</span>
				</button>
				<button
					type='button'
					disabled={busy}
					onClick={() => void handleCsv()}
					className={cn(
						'flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200/90 bg-gradient-to-b from-white to-emerald-50/40 px-4 py-8 text-center transition-all',
						'hover:border-emerald-200 hover:from-emerald-50/30 hover:to-emerald-50/60 hover:shadow-sm',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}>
					<span
						className={cn(
							'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 via-teal-500/20 to-teal-600/30 shadow-inner',
							'ring-1 ring-inset ring-emerald-500/15',
						)}>
						{isCsvPending ? (
							<Loader2 className='h-8 w-8 animate-spin text-emerald-600' aria-hidden />
						) : (
							<FaFileExcel className='h-10 w-10 text-[#217346] drop-shadow-sm' aria-hidden />
						)}
					</span>
					<span className='text-sm font-medium text-zinc-900'>{t('invoices.details.downloadFormatCsv')}</span>
				</button>
			</div>
		</Dialog>
	);
};

export default InvoiceDownloadFormatDialog;
