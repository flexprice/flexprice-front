import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	GetAllCreditNotesPayload,
	CreateCreditNoteParams,
	ProcessDraftCreditNoteParams,
	VoidCreditNoteParams,
	ListCreditNotesResponse,
	CreditNote,
	CreditNotePreviewResponse,
	PreviewCreditNoteParams,
} from '@/types/dto';

class CreditNoteApi {
	private static baseUrl = '/creditnotes';

	/**
	 * Get all credit notes with optional filtering
	 * GET /creditnotes
	 */
	static async getCreditNotes(params: GetAllCreditNotesPayload = {}): Promise<ListCreditNotesResponse> {
		const url = generateQueryParams(this.baseUrl, params);
		return await AxiosClient.get<ListCreditNotesResponse>(url);
	}

	/**
	 * Get a specific credit note by ID
	 * GET /creditnotes/:id
	 */
	static async getCreditNoteById(creditNoteId: string): Promise<CreditNote> {
		return await AxiosClient.get<CreditNote>(`${this.baseUrl}/${creditNoteId}`);
	}

	/**
	 * Create a new credit note
	 * POST /creditnotes
	 */
	static async createCreditNote(params: CreateCreditNoteParams): Promise<CreditNote> {
		return await AxiosClient.post<CreditNote, CreateCreditNoteParams>(this.baseUrl, params);
	}

	/**
	 * Quote what a credit note would come to, tax included. Writes nothing.
	 * POST /creditnotes/preview
	 */
	static async previewCreditNote(params: PreviewCreditNoteParams): Promise<CreditNotePreviewResponse> {
		return await AxiosClient.post<CreditNotePreviewResponse, PreviewCreditNoteParams>(`${this.baseUrl}/preview`, params);
	}

	/**
	 * Finalize a draft credit note
	 * POST /creditnotes/:id/finalize
	 */
	static async finalizeCreditNote(params: ProcessDraftCreditNoteParams): Promise<CreditNote> {
		return await AxiosClient.post<CreditNote>(`${this.baseUrl}/${params.credit_note_id}/finalize`);
	}

	/**
	 * @deprecated Use finalizeCreditNote instead
	 * This method is kept for backward compatibility
	 */
	static async processDraftCreditNote(params: ProcessDraftCreditNoteParams): Promise<CreditNote> {
		return this.finalizeCreditNote(params);
	}

	/**
	 * Void a credit note
	 * POST /creditnotes/:id/void
	 */
	static async voidCreditNote(params: VoidCreditNoteParams): Promise<CreditNote> {
		const { credit_note_id, ...voidData } = params;
		return await AxiosClient.post<CreditNote>(`${this.baseUrl}/${credit_note_id}/void`, voidData);
	}

	/**
	 * Get credit notes for a specific invoice
	 * Convenience method using the list endpoint with invoice filter
	 */
	static async getCreditNotesByInvoice(invoiceId: string): Promise<ListCreditNotesResponse> {
		return await this.getCreditNotes({ invoice_id: invoiceId });
	}
}

export default CreditNoteApi;
