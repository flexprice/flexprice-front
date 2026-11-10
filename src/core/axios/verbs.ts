import axiosClient from './config';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

type DataObject = object;

/**
 * Removes null, undefined, and empty string from payload (so they are omitted from JSON).
 * Pass allowEmptyKeys to keep empty string for specific keys (e.g. group_id to clear a relation).
 */
const sanitizeData = <T extends DataObject>(data?: T, allowEmptyKeys?: string[]): Partial<T> | undefined => {
	if (!data) return undefined;

	return Object.entries(data).reduce<Partial<T>>((acc, [key, value]) => {
		const keepEmpty = allowEmptyKeys?.includes(key) && value === '';
		if (value !== undefined && (value !== '' || keepEmpty)) {
			acc[key as keyof T] = value;
		}
		return acc;
	}, {} as Partial<T>);
};

export class AxiosClient {
	private axiosInstance: AxiosInstance | null = null;

	constructor(axiosInstance?: AxiosInstance) {
		this.axiosInstance = axiosInstance || null;
	}

	private getClient(): AxiosInstance {
		return this.axiosInstance || axiosClient;
	}

	public async get<T>(url: string): Promise<T> {
		const response: AxiosResponse<T> = await this.getClient().get(url);
		return response as T;
	}

	// T is the expected response type, D is the type of the data being sent
	public async post<T, D extends DataObject = DataObject>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await this.getClient().post(url, sanitizedData, config);
		return response as T;
	}

	public async patch<T, D extends DataObject = DataObject>(url: string, data?: D): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await this.getClient().patch(url, sanitizedData);
		return response as T;
	}

	public async put<T, D extends DataObject = DataObject>(
		url: string,
		data?: D,
		config?: AxiosRequestConfig & { allowEmptyKeys?: string[] },
	): Promise<T> {
		const sanitizedData = sanitizeData(data, config?.allowEmptyKeys);
		const { allowEmptyKeys: _o, ...axiosConfig } = config || {};
		const response: AxiosResponse<T> = await this.getClient().put(
			url,
			sanitizedData,
			Object.keys(axiosConfig).length ? axiosConfig : undefined,
		);
		return response as T;
	}

	public async delete<T, D extends DataObject = DataObject>(url: string, data?: D): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await this.getClient().delete(url, { data: sanitizedData });
		return response as T;
	}

	// Static methods for backward compatibility (uses default axiosClient)
	public static async get<T>(url: string): Promise<T> {
		const response: AxiosResponse<T> = await axiosClient.get(url);
		return response as T;
	}

	public static async post<T, D extends DataObject = DataObject>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await axiosClient.post(url, sanitizedData, config);
		return response as T;
	}

	public static async patch<T, D extends DataObject = DataObject>(url: string, data?: D): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await axiosClient.patch(url, sanitizedData);
		return response as T;
	}

	public static async put<T, D extends DataObject = DataObject>(
		url: string,
		data?: D,
		config?: AxiosRequestConfig & { allowEmptyKeys?: string[] },
	): Promise<T> {
		const sanitizedData = sanitizeData(data, config?.allowEmptyKeys);
		const { allowEmptyKeys: _o, ...axiosConfig } = config || {};
		const response: AxiosResponse<T> = await axiosClient.put(url, sanitizedData, Object.keys(axiosConfig).length ? axiosConfig : undefined);
		return response as T;
	}

	public static async delete<T, D extends DataObject = DataObject>(url: string, data?: D): Promise<T> {
		const sanitizedData = sanitizeData(data);
		const response: AxiosResponse<T> = await axiosClient.delete(url, { data: sanitizedData });
		return response as T;
	}
}
