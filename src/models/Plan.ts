import { BaseModel, Metadata } from './base';
import type { Price } from './Price';

export interface Plan extends BaseModel {
	readonly description: string;
	readonly lookup_key: string;
	readonly name: string;
	readonly metadata?: Metadata;
	readonly display_order?: number;
	/** Present when the list/search request expands `prices`. */
	readonly prices?: Price[];
}
