import { BaseModel, Metadata } from './base';

export enum ADDON_TYPE {
	ONETIME = 'onetime',
	MULTIPLE = 'multiple',
}

interface Addon extends BaseModel {
	readonly name: string;
	readonly description: string;
	readonly lookup_key: string;
	readonly type: ADDON_TYPE;
	readonly metadata: Metadata;
}

export default Addon;
