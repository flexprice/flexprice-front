import { BaseModel } from './base';
import { Decimal } from 'decimal.js';

export interface PriceUnit extends BaseModel {
	id: string;
	name: string;
	code: string;
	symbol: string;
	base_currency: string;
	conversion_rate: Decimal;
	precision: number;
	environment_id: string;
}
