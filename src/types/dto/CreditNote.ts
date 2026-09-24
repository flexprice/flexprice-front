import { Pagination, CreditNoteLineItem, CREDIT_NOTE_STATUS, CREDIT_NOTE_REASON, CREDIT_NOTE_TYPE, Metadata, CreditNote } from '@/models';
import { TaxApplied } from '@/models/Tax';
import { QueryFilter, TimeRangeFilter } from './base';

// API Payloads
export interface GetAllCreditNotesPayload extends QueryFilter, TimeRangeFilter {
	credit_note_ids?: string[];
	invoice_id?: string;
	credit_note_status?: CREDIT_NOTE_STATUS[];
	credit_note_type?: CREDIT_NOTE_TYPE;
}

// What a credit note would come to if it were issued now. The tax on a credit is only known
// once the engine has been asked, so the tenant sees this before committing.
export interface CreditNotePreviewResponse {
	readonly subtotal: string;
	readonly total_tax: string;
	readonly total_amount: string;
	readonly currency: string;
	readonly credit_note_type: CREDIT_NOTE_TYPE;
	readonly taxes?: TaxApplied[];
}

// A quote asks only what the amounts come to, so it carries no reason: the tenant sees the tax
// while the form is still being filled in.
export interface PreviewCreditNoteParams {
	invoice_id: string;
	line_items: CreateCreditNoteLineItemRequest[];
}

export interface CreateCreditNoteParams {
	credit_note_number?: string;
	invoice_id: string;
	memo?: string;
	reason: CREDIT_NOTE_REASON;
	metadata?: Metadata;
	line_items: CreateCreditNoteLineItemRequest[];
	idempotency_key?: string;
	process_credit_note?: boolean;
}

export interface CreateCreditNoteLineItemRequest {
	invoice_line_item_id: string;
	display_name?: string;
	amount: number;
	metadata?: Metadata;
}

export interface ProcessDraftCreditNoteParams {
	credit_note_id: string;
}

export interface VoidCreditNoteParams {
	credit_note_id: string;
	reason?: string;
}

// API Responses
export interface ListCreditNotesResponse {
	items: CreditNote[];
	pagination: Pagination;
}

// Export model types for convenience
export type { CreditNote, CreditNoteLineItem };
export { CREDIT_NOTE_STATUS as CreditNoteStatus, CREDIT_NOTE_REASON as CreditNoteReason, CREDIT_NOTE_TYPE };
