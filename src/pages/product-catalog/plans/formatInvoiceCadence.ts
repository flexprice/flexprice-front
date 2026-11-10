import { INVOICE_CADENCE } from '@/models';

export const formatInvoiceCadence = (cadence: string): string => {
	switch (cadence.toUpperCase()) {
		case INVOICE_CADENCE.ADVANCE:
			return 'Advance';
		case INVOICE_CADENCE.ARREAR:
			return 'Arrear';
		default:
			return '--';
	}
};
