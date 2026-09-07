import { FC, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Info, Trash2 } from 'lucide-react';
import {
	Button,
	Checkbox,
	DateRangePicker,
	DateTimePicker,
	Dialog,
	Divider,
	FormHeader,
	Input,
	Loader,
	Page,
	Select,
	Spacer,
	Textarea,
	Toggle,
} from '@/components/atoms';
import { InvoiceLineItemTable } from '@/components/molecules';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { getPaymentStatusChip, getStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import InvoiceApi from '@/api/InvoiceApi';
import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import {
	ExecuteInvoiceModifyPayload,
	INVOICE_MODIFY_LINE_ITEM_ACTION,
	InvoiceModifyAddLineItem,
	InvoiceModifyUpdateLineItem,
	LineItemRow,
	UpdateInvoicePayload,
} from '@/types/dto';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { refetchInvoiceQueries } from '@/core/services/tanstack/queryKeys';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import formatDate, { formatBillingPeriod } from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';

interface MetadataRow {
	key: string;
	value: string;
}

/** The line-item operations a save must execute through the modify endpoint. */
interface LineItemOps {
	removes: string[];
	updates: { line_item_id: string; update: InvoiceModifyUpdateLineItem }[];
	adds: InvoiceModifyAddLineItem[];
}

/** The API client only type-asserts, so normalize loosely-typed fields before binding them to inputs. */
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asIsoDate = (value: unknown): string => (typeof value === 'string' && value && !isNaN(new Date(value).getTime()) ? value : '');

// Line item descriptions live in metadata.description (billing engine + PDF convention).
const lineItemDescription = (li: Invoice['line_items'][number]): string => asString(li.metadata?.description);

const toLineItemRows = (invoice: Invoice): LineItemRow[] =>
	(invoice.line_items ?? []).map((li) => ({
		id: li.id,
		display_name: li.display_name ?? '',
		quantity: String(li.quantity ?? '1'),
		amount: String(li.amount ?? '0'),
		description: lineItemDescription(li),
		period_start: asIsoDate(li.period_start),
		period_end: asIsoDate(li.period_end),
	}));

// Runtime guard for the parts of the response this page dereferences; the API
// client only type-asserts, so a malformed payload would otherwise crash `.map`.
const invoiceEditResponseSchema = z.object({
	line_items: z.array(z.object({ id: z.string() }).passthrough()).nullish(),
	metadata: z.record(z.unknown()).nullish(),
});

const parseInvoiceForEdit = (invoice: Invoice): Invoice => {
	invoiceEditResponseSchema.parse(invoice);
	return invoice;
};

// Backend only accepts updates for invoices in these statuses.
const EDITABLE_STATUSES: string[] = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.FINALIZED];

/** Payment statuses that allow voiding an invoice (matches backend allowedPaymentStatuses). */
const VOIDABLE_PAYMENT_STATUSES = [
	PAYMENT_STATUS.PENDING,
	PAYMENT_STATUS.FAILED,
	PAYMENT_STATUS.SUCCEEDED,
	PAYMENT_STATUS.PARTIALLY_REFUNDED,
	PAYMENT_STATUS.OVERPAID,
];

const toMetadataRows = (invoice: Invoice): MetadataRow[] => {
	const entries = Object.entries(invoice.metadata ?? {}).filter(([, value]) => typeof value === 'string');
	return entries.map(([key, value]) => ({ key, value: value as string }));
};

const rowsToMetadata = (rows: MetadataRow[]): Record<string, string> => {
	const metadata: Record<string, string> = {};
	rows.forEach(({ key, value }) => {
		if (key.trim()) metadata[key.trim()] = value;
	});
	return metadata;
};

const isValidUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

/** Fires the load-error toast once from an effect so renders stay side-effect free. */
const LoadErrorNotice: FC<{ message: string }> = ({ message }) => {
	useEffect(() => {
		toast.error(message);
	}, [message]);
	return null;
};

const EditInvoicePage: FC = () => {
	const { t, i18n } = useTranslation(['billing', 'common']);
	const { invoiceId } = useParams<{ invoiceId: string }>();
	const navigate = useNavigate();
	const { updateBreadcrumb } = useBreadcrumbsStore();

	const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
	const [pdfUrl, setPdfUrl] = useState('');
	const [metadataRows, setMetadataRows] = useState<MetadataRow[]>([]);
	const [applyDiscount, setApplyDiscount] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState('');
	const [invoiceStatus, setInvoiceStatus] = useState('');
	const [lineItemRows, setLineItemRows] = useState<LineItemRow[]>([]);
	const [removedLineItemIds, setRemovedLineItemIds] = useState<string[]>([]);
	// Rows render as a read-only table; clicking one expands it into an inline editor.
	// The snapshot backs Cancel; isNew rows are discarded on Cancel instead of restored.
	const [rowEditor, setRowEditor] = useState<{ index: number; snapshot: LineItemRow; isNew: boolean } | null>(null);
	// Matches the invoice preview: zero-amount rows are hidden until toggled on.
	const [showZeroCharges, setShowZeroCharges] = useState(false);
	const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);

	const {
		data: invoice,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['invoiceEdit', invoiceId],
		queryFn: async () => parseInvoiceForEdit(await InvoiceApi.getInvoiceById(invoiceId!)),
		enabled: !!invoiceId,
	});

	// Seed the form whenever a fresh invoice is loaded.
	useEffect(() => {
		if (!invoice) return;
		setDueDate(invoice.due_date ? new Date(invoice.due_date) : undefined);
		setPdfUrl(invoice.invoice_pdf_url ?? '');
		setMetadataRows(toMetadataRows(invoice));
		setApplyDiscount(false);
		setPaymentStatus(invoice.payment_status ?? '');
		setInvoiceStatus(invoice.invoice_status ?? '');
		setLineItemRows(toLineItemRows(invoice));
		setRemovedLineItemIds([]);
		setRowEditor(null);
	}, [invoice]);

	useEffect(() => {
		if (invoice?.invoice_number && invoiceId) {
			updateBreadcrumb(2, invoice.invoice_number, `${RouteNames.invoices}/${invoiceId}`);
		}
	}, [invoice?.invoice_number, invoiceId, updateBreadcrumb]);

	const isEditable = !!invoice && EDITABLE_STATUSES.includes(invoice.invoice_status);
	// Saving a finalized invoice voids it and recreates it as a draft carrying all
	// current + changed data; the save button asks for confirmation first.
	const isFinalized = invoice?.invoice_status === INVOICE_STATUS.FINALIZED;

	const originalDueDateMs = useMemo(() => (invoice?.due_date ? new Date(invoice.due_date).getTime() : undefined), [invoice]);
	const dueDateChanged = !!invoice && dueDate?.getTime() !== originalDueDateMs;
	const pdfUrlChanged = !!invoice && pdfUrl.trim() !== (invoice.invoice_pdf_url ?? '');
	const metadataChanged = useMemo(() => {
		if (!invoice) return false;
		return JSON.stringify(rowsToMetadata(metadataRows)) !== JSON.stringify(rowsToMetadata(toMetadataRows(invoice)));
	}, [invoice, metadataRows]);

	// The payment endpoint only accepts transitions away from PENDING/FAILED
	// (SUCCEEDED can only move to OVERPAID, which happens via payments, not here).
	const isPaymentStatusEditable =
		isEditable && (invoice?.payment_status === PAYMENT_STATUS.PENDING || invoice?.payment_status === PAYMENT_STATUS.FAILED);
	const paymentStatusChanged = !!invoice && isPaymentStatusEditable && !!paymentStatus && paymentStatus !== invoice.payment_status;

	// Invoice status transitions mirror the backend rules: voiding needs an editable
	// invoice with a voidable payment status; finalizing needs a DRAFT with FAILED payment.
	const canVoid =
		isEditable &&
		!!invoice?.payment_status &&
		VOIDABLE_PAYMENT_STATUSES.includes(invoice.payment_status as PAYMENT_STATUS) &&
		invoice.invoice_status !== INVOICE_STATUS.VOIDED;
	const canFinalize = invoice?.invoice_status === INVOICE_STATUS.DRAFT && invoice?.payment_status === PAYMENT_STATUS.FAILED;
	const isInvoiceStatusEditable = canVoid || canFinalize;
	const invoiceStatusChanged = !!invoice && !!invoiceStatus && invoiceStatus !== invoice.invoice_status;

	// Line-item edits go exclusively through POST /invoices/:id/modify/execute.
	// For FINALIZED invoices the backend voids the current invoice and applies the
	// edits to a new draft copy — same endpoints, same responses.
	const lineItemOps = useMemo<LineItemOps>(() => {
		if (!invoice || !EDITABLE_STATUSES.includes(invoice.invoice_status)) return { removes: [], updates: [], adds: [] };
		const originalById = new Map((invoice.line_items ?? []).map((li) => [li.id, li]));
		const removes = removedLineItemIds.filter((id) => originalById.has(id));
		const updates: LineItemOps['updates'] = [];
		const adds: InvoiceModifyAddLineItem[] = [];
		lineItemRows.forEach((row) => {
			if (!row.id) {
				// A new row counts once the user typed anything meaningful into it.
				if (row.display_name.trim() !== '' || parseFloat(row.amount || '0') !== 0) {
					adds.push({
						display_name: row.display_name.trim(),
						amount: row.amount || '0',
						quantity: row.quantity || '1',
						description: row.description.trim() || undefined,
						period_start: row.period_start || undefined,
						period_end: row.period_end || undefined,
					});
				}
				return;
			}
			const original = originalById.get(row.id);
			if (!original) return;
			// Built incrementally, then narrowed to the at-least-one-field type by the length guard below.
			const update: Partial<InvoiceModifyAddLineItem> = {};
			if (row.display_name !== (original.display_name ?? '')) update.display_name = row.display_name;
			if (row.amount !== String(original.amount ?? '0')) update.amount = row.amount;
			if (row.quantity !== String(original.quantity ?? '1')) update.quantity = row.quantity;
			if (row.description !== lineItemDescription(original)) update.description = row.description;
			if (row.period_start !== asIsoDate(original.period_start)) update.period_start = row.period_start;
			if (row.period_end !== asIsoDate(original.period_end)) update.period_end = row.period_end;
			if (Object.keys(update).length > 0) updates.push({ line_item_id: row.id, update: update as InvoiceModifyUpdateLineItem });
		});
		return { removes, updates, adds };
	}, [invoice, lineItemRows, removedLineItemIds]);

	const lineItemsChanged = lineItemOps.removes.length > 0 || lineItemOps.updates.length > 0 || lineItemOps.adds.length > 0;

	const hasChanges =
		dueDateChanged || pdfUrlChanged || metadataChanged || applyDiscount || paymentStatusChanged || lineItemsChanged || invoiceStatusChanged;

	const { mutate: updateInvoice, isPending } = useMutation({
		mutationFn: async ({
			payload,
			nextPaymentStatus,
			ops,
			nextInvoiceStatus,
		}: {
			payload: UpdateInvoicePayload | null;
			nextPaymentStatus: string | null;
			ops: LineItemOps | null;
			nextInvoiceStatus: string | null;
		}) => {
			// A finalized save voids the invoice and recreates it as a draft; every response
			// carries the invoice the operation actually landed on, so chain later calls (and
			// the success navigation) to that id. For drafts the id never changes — no-op.
			let targetId = invoiceId!;
			if (payload) {
				const updated = await InvoiceApi.updateInvoice(targetId, payload);
				targetId = updated?.id ?? targetId;
			}
			if (nextPaymentStatus) await InvoiceApi.updateInvoicePaymentStatus(targetId, { payment_status: nextPaymentStatus });
			if (ops) {
				if (ops.removes.length > 0) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.REMOVE, line_item_ids: ops.removes },
					};
					const resp = await InvoiceApi.modifyInvoice(targetId, payload);
					targetId = resp?.invoice?.id ?? targetId;
				}
				// One update per call: the backend versions each edit individually.
				for (const { line_item_id, update } of ops.updates) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.UPDATE, line_item_id, update },
					};
					const resp = await InvoiceApi.modifyInvoice(targetId, payload);
					targetId = resp?.invoice?.id ?? targetId;
				}
				if (ops.adds.length > 0) {
					const payload: ExecuteInvoiceModifyPayload = {
						type: 'line_item',
						line_item_params: { action: INVOICE_MODIFY_LINE_ITEM_ACTION.ADD, items: ops.adds },
					};
					const resp = await InvoiceApi.modifyInvoice(targetId, payload);
					targetId = resp?.invoice?.id ?? targetId;
				}
			}
			// Status transition runs last: line-item edits must land while the invoice is
			// still editable, and a finalize must see the finished draft.
			if (nextInvoiceStatus === INVOICE_STATUS.VOIDED) {
				await InvoiceApi.voidInvoice(targetId);
			} else if (nextInvoiceStatus === INVOICE_STATUS.FINALIZED) {
				await InvoiceApi.finalizeInvoice(targetId);
			}
			return targetId;
		},
		onSuccess: (targetId: string) => {
			toast.success(t('invoices.edit.toast.updateSuccess'));
			void refetchInvoiceQueries();
			void refetchQueries(['invoiceEdit', invoiceId!]);
			// After a finalized save this is the newly created draft; for drafts it is unchanged.
			navigate(`${RouteNames.invoices}/${targetId ?? invoiceId}`);
		},
		onError: (error: Error) => {
			if (isFinalized) {
				// The void-and-recreate flow failed: keep the user's edits so they can
				// fix and retry — reseeding from the server would wipe the form.
				toast.error(error.message || t('invoices.edit.toast.updateFailed'));
				return;
			}
			// A partial save may have persisted earlier operations (e.g. a removal before a
			// failed update); reset the form baseline from server state so a retry can't replay them.
			void refetchInvoiceQueries();
			void refetchQueries(['invoiceEdit', invoiceId!]);
			toast.error(error.message || t('invoices.edit.toast.updateFailed'));
		},
	});

	/** Validates the form and builds the save arguments; returns null (with a toast) when invalid or empty. */
	const buildSaveArgs = () => {
		if (!invoice || !hasChanges || isPending) return null;

		const payload: UpdateInvoicePayload = {};
		if (dueDateChanged && dueDate) {
			if (dueDate.getTime() < Date.now()) {
				toast.error(t('invoices.edit.dueDatePast'));
				return null;
			}
			payload.due_date = dueDate.toISOString();
		}
		if (pdfUrlChanged) {
			const trimmed = pdfUrl.trim();
			if (trimmed && !isValidUrl(trimmed)) {
				toast.error(t('invoices.edit.pdfUrlInvalid'));
				return null;
			}
			payload.invoice_pdf_url = trimmed;
		}
		if (metadataChanged) {
			payload.metadata = rowsToMetadata(metadataRows);
		}
		if (applyDiscount && isEditable) {
			payload.apply_discount = true;
		}

		if (lineItemsChanged) {
			const invalidRow = lineItemRows.some((row) => {
				const touched = !row.id || lineItemOps.updates.some((u) => u.line_item_id === row.id);
				if (!touched) return false;
				if (!row.id && row.display_name.trim() === '' && parseFloat(row.amount || '0') === 0) return false;
				const amount = parseFloat(row.amount);
				const quantity = parseFloat(row.quantity);
				return row.display_name.trim() === '' || isNaN(amount) || amount < 0 || isNaN(quantity) || quantity < 0;
			});
			if (invalidRow) {
				toast.error(t('invoices.edit.lineItemInvalid'));
				return null;
			}
		}

		const nextInvoiceStatus = invoiceStatusChanged ? invoiceStatus : null;
		// Voiding discards the invoice — combining it with line-item or discount edits
		// (which would void-and-recreate a finalized invoice first) makes no sense.
		if (nextInvoiceStatus === INVOICE_STATUS.VOIDED && (lineItemsChanged || applyDiscount)) {
			toast.error(t('invoices.edit.voidWithEditsError'));
			return null;
		}

		const invoicePayload = Object.keys(payload).length > 0 ? payload : null;
		const nextPaymentStatus = paymentStatusChanged ? paymentStatus : null;
		const ops = lineItemsChanged ? lineItemOps : null;
		if (!invoicePayload && !nextPaymentStatus && !ops && !nextInvoiceStatus) return null;

		return { payload: invoicePayload, nextPaymentStatus, ops, nextInvoiceStatus };
	};

	const handleSave = () => {
		const args = buildSaveArgs();
		if (!args) return;
		// Financial edits void a finalized invoice and recreate it as a draft — confirm first.
		// Plain field/status changes on a finalized invoice save directly.
		if (isFinalized && (args.ops || args.payload?.apply_discount)) {
			setIsVoidConfirmOpen(true);
			return;
		}
		updateInvoice(args);
	};

	const handleVoidConfirmProceed = () => {
		const args = buildSaveArgs();
		setIsVoidConfirmOpen(false);
		if (args) updateInvoice(args);
	};

	const handleCancel = () => {
		navigate(`${RouteNames.invoices}/${invoiceId}`);
	};

	const handleMetadataChange = (index: number, field: keyof MetadataRow, value: string) => {
		setMetadataRows((prev) => {
			const rows = [...prev];
			rows[index] = { ...rows[index], [field]: value };
			return rows;
		});
	};

	const handleLineItemChange = (index: number, field: 'display_name' | 'quantity' | 'amount' | 'description', value: string) => {
		setLineItemRows((prev) => {
			const rows = [...prev];
			rows[index] = { ...rows[index], [field]: value };
			return rows;
		});
	};

	const handleLineItemPeriodChange = (index: number, dates: { startDate?: Date; endDate?: Date }) => {
		setLineItemRows((prev) => {
			const rows = [...prev];
			rows[index] = {
				...rows[index],
				period_start: dates.startDate ? dates.startDate.toISOString() : '',
				period_end: dates.endDate ? dates.endDate.toISOString() : '',
			};
			return rows;
		});
	};

	const handleRemoveLineItemRow = (index: number) => {
		setLineItemRows((prev) => {
			const row = prev[index];
			if (row?.id) setRemovedLineItemIds((ids) => (ids.includes(row.id!) ? ids : [...ids, row.id!]));
			return prev.filter((_, i) => i !== index);
		});
		// Indices shift after a removal, so any open editor would point at the wrong row.
		setRowEditor(null);
	};

	// Opening a row (or switching rows) keeps whatever was typed in the previous editor —
	// only an explicit Cancel restores its snapshot.
	const handleOpenRowEditor = (index: number) => {
		setRowEditor({ index, snapshot: { ...lineItemRows[index] }, isNew: false });
	};

	const handleAddLineItem = () => {
		const blank: LineItemRow = { display_name: '', quantity: '1', amount: '0', description: '', period_start: '', period_end: '' };
		setRowEditor({ index: lineItemRows.length, snapshot: { ...blank }, isNew: true });
		setLineItemRows((prev) => [...prev, blank]);
	};

	// The row being edited and unsaved new rows always stay visible so they can't
	// vanish mid-edit; everything else follows the zero-charges toggle.
	const isRowVisible = (row: LineItemRow, index: number): boolean =>
		showZeroCharges || rowEditor?.index === index || !row.id || Number(row.amount || '0') !== 0;

	const hiddenZeroChargeCount = lineItemRows.filter((row, index) => !isRowVisible(row, index)).length;

	const handleRowEditorCancel = () => {
		if (!rowEditor) return;
		if (rowEditor.isNew) {
			setLineItemRows((prev) => prev.filter((_, i) => i !== rowEditor.index));
		} else {
			setLineItemRows((prev) => prev.map((row, i) => (i === rowEditor.index ? rowEditor.snapshot : row)));
		}
		setRowEditor(null);
	};

	if (isLoading) return <Loader />;

	if (isError || !invoice) {
		return <LoadErrorNotice message={t('invoices.edit.toast.loadError')} />;
	}

	const na = t('common:labels.na');
	const readonlyLabelClass = 'text-content-zinc text-sm font-medium';
	const readonlyValueClass = 'text-content-zinc-muted text-sm';

	return (
		<Page documentTitle={t('invoices.edit.pageTitle')} heading={t('invoices.edit.pageTitle')}>
			<div className='space-y-6'>
				<Dialog
					isOpen={isVoidConfirmOpen}
					onOpenChange={setIsVoidConfirmOpen}
					title={t('invoices.edit.voidConfirm.title')}
					description={t('invoices.edit.voidConfirm.description')}>
					<div className='mt-6 flex justify-end gap-3'>
						<Button variant='outline' onClick={() => setIsVoidConfirmOpen(false)}>
							{t('common:actions.cancel')}
						</Button>
						<Button onClick={handleVoidConfirmProceed} disabled={isPending}>
							{t('invoices.edit.voidConfirm.proceed')}
						</Button>
					</div>
				</Dialog>
				<div className='rounded-xl border border-line bg-transparent p-6'>
					{/* read-only invoice context */}
					<div className='p-4'>
						<FormHeader className='!mb-0' title={t('invoices.edit.detailsTitle')} variant='sub-header' titleClassName='font-semibold' />
						<Spacer className='!my-6' />
						<div className='w-full grid grid-cols-4 gap-4'>
							<p className={readonlyLabelClass}>{t('invoices.edit.invoiceNumber')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.customer')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.issueDate')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.currency')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 mt-1'>
							<p className={readonlyValueClass}>{invoice.invoice_number || na}</p>
							<RedirectCell redirectUrl={`${RouteNames.customers}/${invoice.customer_id}`}>
								<p className={readonlyValueClass}>{invoice.customer?.name || na}</p>
							</RedirectCell>
							<p className={readonlyValueClass}>{invoice.issue_date ? formatDate(invoice.issue_date, i18n.language) : na}</p>
							<p className={cn(readonlyValueClass, 'uppercase')}>{invoice.currency || na}</p>
						</div>
						<Spacer className='!my-4' />
						<div className='w-full grid grid-cols-4 gap-4'>
							<p className={readonlyLabelClass}>{t('invoices.edit.status')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.paymentStatus')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 mt-1'>
							<div>{getStatusChip(invoice.invoice_status ?? '', t)}</div>
							<div>{getPaymentStatusChip(invoice.payment_status ?? '', t)}</div>
						</div>
						<Spacer className='!my-4' />
						<div className='w-full grid grid-cols-4 gap-4'>
							<p className={cn(readonlyLabelClass, 'col-span-2')}>{t('invoices.edit.description')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.periodStart')}</p>
							<p className={readonlyLabelClass}>{t('invoices.edit.periodEnd')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 mt-1'>
							<p className={cn(readonlyValueClass, 'col-span-2 break-words')}>{invoice.description || na}</p>
							<p className={readonlyValueClass}>{invoice.period_start ? formatDate(invoice.period_start, i18n.language) : na}</p>
							<p className={readonlyValueClass}>{invoice.period_end ? formatDate(invoice.period_end, i18n.language) : na}</p>
						</div>
					</div>

					{!isEditable && (
						<div className='mx-4 mb-2 rounded-lg border border-line bg-muted/40 p-4'>
							<p className='text-sm text-content-zinc-muted'>{t('invoices.edit.notEditable')}</p>
						</div>
					)}

					<Divider className='my-4' />

					{/* editable fields */}
					<div className='p-4'>
						<FormHeader title={t('invoices.edit.editableTitle')} variant='sub-header' titleClassName='font-semibold' />
						<div className='mt-6 grid grid-cols-2 gap-6 max-w-3xl'>
							<DateTimePicker
								title={t('invoices.edit.dueDate')}
								date={dueDate}
								setDate={setDueDate}
								placeholder={t('invoices.edit.dueDatePlaceholder')}
								disabled={!isEditable}
							/>
							<Input
								label={t('invoices.edit.pdfUrl')}
								value={pdfUrl}
								onChange={setPdfUrl}
								placeholder={t('invoices.edit.pdfUrlPlaceholder')}
								description={t('invoices.edit.pdfUrlHint')}
								disabled={!isEditable}
							/>
							<Select
								label={t('invoices.edit.paymentStatus')}
								value={paymentStatus}
								options={[
									{ value: PAYMENT_STATUS.PENDING, label: t('invoices.details.paymentStatusModal.pendingLabel') },
									{ value: PAYMENT_STATUS.SUCCEEDED, label: t('invoices.details.paymentStatusModal.succeededLabel') },
									{ value: PAYMENT_STATUS.FAILED, label: t('invoices.details.paymentStatusModal.failedLabel') },
								]}
								onChange={setPaymentStatus}
								disabled={!isPaymentStatusEditable}
								description={!isPaymentStatusEditable && isEditable ? t('invoices.edit.paymentStatusLockedHint') : undefined}
							/>
							<Select
								label={t('invoices.edit.invoiceStatus')}
								value={invoiceStatus}
								options={[
									{
										value: INVOICE_STATUS.DRAFT,
										label: t('invoices.status.draft'),
										disabled: invoice.invoice_status !== INVOICE_STATUS.DRAFT,
									},
									{
										value: INVOICE_STATUS.FINALIZED,
										label: t('invoices.status.finalized'),
										disabled: invoice.invoice_status !== INVOICE_STATUS.FINALIZED && !canFinalize,
									},
									{
										value: INVOICE_STATUS.VOIDED,
										label: t('invoices.status.void'),
										disabled: !canVoid,
									},
								]}
								onChange={setInvoiceStatus}
								disabled={!isInvoiceStatusEditable}
								description={
									isInvoiceStatusEditable
										? invoiceStatus === INVOICE_STATUS.VOIDED && invoiceStatusChanged
											? t('invoices.edit.voidOnSaveHint')
											: undefined
										: isEditable
											? t('invoices.edit.invoiceStatusLockedHint')
											: undefined
								}
							/>
						</div>
						{isEditable && (
							<div
								className={cn(
									'mt-6 max-w-3xl rounded-lg border p-4 transition-colors',
									applyDiscount ? 'border-primary bg-muted/40' : 'border-line hover:bg-muted/20',
								)}>
								<Checkbox
									id='apply-discount'
									checked={applyDiscount}
									onCheckedChange={(checked) => setApplyDiscount(!!checked)}
									label={t('invoices.edit.applyDiscount')}
									description={t('invoices.edit.applyDiscountDescription')}
								/>
							</div>
						)}
					</div>

					<Divider className='my-4' />

					{/* line items — editable for drafts and finalized invoices through the invoice modify API.
					    Rows read as an invoice table; clicking a row expands it into an inline editor. */}
					{isEditable ? (
						<div className='p-4'>
							{isFinalized && (
								<div className='mb-4 flex items-start gap-2.5 rounded-lg border border-line bg-muted/40 px-4 py-3'>
									<Info className='mt-0.5 size-4 shrink-0 text-content-zinc-muted' />
									<p className='text-sm text-content-zinc-muted'>{t('invoices.edit.finalizedEditHint')}</p>
								</div>
							)}
							<div className='flex items-start justify-between gap-4'>
								<FormHeader
									title={t('invoices.edit.lineItemsTitle')}
									subtitle={t('invoices.edit.manualEditHint')}
									variant='sub-header'
									titleClassName='font-semibold'
									subtitleClassName='!mt-1 text-sm text-content-zinc-muted'
								/>
								<Toggle
									checked={showZeroCharges}
									onChange={setShowZeroCharges}
									label={t('invoices.details.showZeroCharges')}
									className='shrink-0'
								/>
							</div>
							<div className='mt-4 overflow-hidden rounded-lg border border-line'>
								<div className='overflow-x-auto'>
									<table className='w-full border-collapse'>
										<thead>
											<tr className='border-b border-line'>
												<th className='py-2.5 px-4 text-start text-xs font-medium uppercase tracking-wide text-content-zinc-muted'>
													{t('invoices.edit.itemColumn')}
												</th>
												<th className='py-2.5 px-4 text-end text-xs font-medium uppercase tracking-wide text-content-zinc-muted'>
													{t('createInvoice.quantity')}
												</th>
												<th className='py-2.5 px-4 text-end text-xs font-medium uppercase tracking-wide text-content-zinc-muted'>
													{t('createInvoice.amount')}
												</th>
												<th className='py-2.5 px-4 text-start text-xs font-medium uppercase tracking-wide text-content-zinc-muted'>
													{t('invoices.edit.servicePeriod')}
												</th>
												<th className='w-12' />
											</tr>
										</thead>
										<tbody>
											{lineItemRows.length === 0 && (
												<tr>
													<td colSpan={5} className='py-6 px-4 text-center text-sm text-content-zinc-muted'>
														{t('invoices.edit.noLineItems')}
													</td>
												</tr>
											)}
											{lineItemRows.map((row, index) =>
												!isRowVisible(row, index) ? null : rowEditor?.index === index ? (
													<tr key={row.id ?? `new-${index}`} className='border-b border-line-subtle bg-muted/20'>
														<td colSpan={5} className='p-4'>
															<div className='max-w-3xl'>
																<div className='grid grid-cols-2 gap-4'>
																	<Input
																		label={t('createInvoice.itemName')}
																		value={row.display_name}
																		onChange={(value) => handleLineItemChange(index, 'display_name', value)}
																		placeholder={t('createInvoice.itemNamePlaceholder')}
																	/>
																	<Input
																		label={t('invoices.edit.description')}
																		value={row.description}
																		onChange={(value) => handleLineItemChange(index, 'description', value)}
																		placeholder={t('invoices.edit.lineItemDescriptionPlaceholder')}
																	/>
																	<Input
																		label={t('createInvoice.quantity')}
																		value={row.quantity}
																		onChange={(value) => handleLineItemChange(index, 'quantity', value)}
																		variant='integer'
																		placeholder='1'
																	/>
																	<Input
																		label={t('createInvoice.amount')}
																		value={row.amount}
																		onChange={(value) => handleLineItemChange(index, 'amount', value)}
																		variant='formatted-number'
																		placeholder={t('creditNotes.amountPlaceholder')}
																	/>
																	<DateRangePicker
																		title={t('invoices.edit.servicePeriod')}
																		startDate={row.period_start ? new Date(row.period_start) : undefined}
																		endDate={row.period_end ? new Date(row.period_end) : undefined}
																		onChange={(dates) => handleLineItemPeriodChange(index, dates)}
																	/>
																</div>
																<div className='mt-4 flex items-center justify-between'>
																	<Button
																		variant='ghost'
																		className='text-content-zinc-muted'
																		onClick={() => handleRemoveLineItemRow(index)}>
																		<Trash2 className='me-2 size-4' />
																		{t('invoices.edit.removeLineItem')}
																	</Button>
																	<div className='flex gap-3'>
																		<Button variant='outline' onClick={handleRowEditorCancel}>
																			{t('common:actions.cancel')}
																		</Button>
																		<Button onClick={() => setRowEditor(null)}>{t('common:actions.done')}</Button>
																	</div>
																</div>
															</div>
														</td>
													</tr>
												) : (
													<tr
														key={row.id ?? `new-${index}`}
														tabIndex={0}
														className='group cursor-pointer border-b border-line-subtle hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none'
														onClick={() => handleOpenRowEditor(index)}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.preventDefault();
																handleOpenRowEditor(index);
															}
														}}>
														<td className='py-3 px-4'>
															<p className='text-sm text-content'>
																{row.display_name || (
																	<span className='italic text-content-zinc-muted'>{t('invoices.edit.newLineItem')}</span>
																)}
															</p>
															{row.description && <p className='mt-0.5 text-xs text-content-zinc-muted'>{row.description}</p>}
														</td>
														<td className='py-3 px-4 text-end text-sm text-content'>{row.quantity || '1'}</td>
														<td className='py-3 px-4 text-end text-sm text-content'>
															{getCurrencySymbol(invoice.currency ?? '')}
															{row.amount || '0'}
														</td>
														<td className='py-3 px-4 text-sm text-content-zinc-muted'>
															{row.period_start && row.period_end ? formatBillingPeriod(row.period_start, row.period_end) : na}
														</td>
														<td className='py-3 px-2 text-end'>
															<Button
																variant='ghost'
																className='size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
																aria-label={t('invoices.edit.removeLineItem')}
																onClick={(e) => {
																	e.stopPropagation();
																	handleRemoveLineItemRow(index);
																}}>
																<Trash2 className='size-4' />
															</Button>
														</td>
													</tr>
												),
											)}
											{hiddenZeroChargeCount > 0 && (
												<tr>
													<td colSpan={5} className='py-2.5 px-4 text-center text-xs text-content-zinc-muted'>
														{t('invoices.edit.zeroChargesHidden', { hidden: hiddenZeroChargeCount })}
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
								<div className='px-2 py-1.5'>
									<AddChargesButton onClick={handleAddLineItem} label={t('createInvoice.addLineItem')} />
								</div>
							</div>
						</div>
					) : (
						<div className='px-4 pb-4'>
							<p className='text-sm text-content-zinc-muted mb-2'>{t('invoices.edit.lineItemsDraftOnlyNote')}</p>
							<InvoiceLineItemTable
								title={t('invoices.edit.lineItemsTitle')}
								data={invoice.line_items ?? []}
								subtotal={invoice.subtotal}
								total={invoice.total}
								total_prepaid_credits_applied={invoice.total_prepaid_credits_applied}
								discount={invoice.total_discount}
								total_tax={invoice.total_tax}
								amount_paid={invoice.amount_paid}
								overpaid_amount={invoice.overpaid_amount}
								amount_remaining={Number(invoice.amount_remaining)}
								amount_due={invoice.amount_due}
								currency={invoice.currency}
								invoiceType={invoice.invoice_type as INVOICE_TYPE}
							/>
						</div>
					)}

					<Divider className='my-4' />

					{/* metadata */}
					<div className='p-4'>
						<FormHeader title={t('invoices.edit.metadata')} variant='sub-header' titleClassName='font-semibold' />
						<div className='mt-6 flex flex-col gap-4 max-w-3xl'>
							{metadataRows.map((row, index) => (
								<div key={index} className='flex gap-2 items-start'>
									<div className='flex-[3] min-w-0'>
										<Input
											placeholder={t('common:form.key')}
											value={row.key}
											onChange={(value) => handleMetadataChange(index, 'key', value)}
											disabled={!isEditable}
										/>
									</div>
									<div className='flex-[5] min-w-0'>
										<Textarea
											placeholder={t('common:form.value')}
											value={row.value}
											onChange={(value) => handleMetadataChange(index, 'value', value)}
											textAreaClassName='min-h-6 h-6 rounded-md'
											className='rounded-md'
											disabled={!isEditable}
										/>
									</div>
									<Button
										variant='ghost'
										className='size-10'
										onClick={() => setMetadataRows((prev) => prev.filter((_, i) => i !== index))}
										disabled={!isEditable}
										aria-label={t('common:form.remove')}>
										<Trash2 className='size-5' />
									</Button>
								</div>
							))}
							{isEditable && (
								<div>
									<AddChargesButton
										onClick={() => setMetadataRows((prev) => [...prev, { key: '', value: '' }])}
										label={t('common:form.addAnotherItem')}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='flex justify-end p-4'>
					<Button variant='outline' className='mr-4' onClick={handleCancel}>
						{t('common:actions.cancel')}
					</Button>
					{isEditable && (
						<Button onClick={handleSave} disabled={!hasChanges || isPending}>
							{isPending ? t('invoices.edit.saving') : t('invoices.edit.saveChanges')}
						</Button>
					)}
				</div>
			</div>
		</Page>
	);
};

export default EditInvoicePage;
