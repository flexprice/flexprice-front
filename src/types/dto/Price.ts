import { Price } from '@/models/Price';

export interface GetAllPricesResponse {
	prices: Price[];
	total: number;
	offset: number;
	limit: number;
}
