import { AxiosClient } from '@/core/axios/verbs';
import { PaginationType } from '@/models/Pagination';
import { generateQueryParams } from '@/utils/common/api_helper';
import { CreditGrant } from '@/models/CreditGrant';

interface GetGrantCreditResponse {
	items: CreditGrant[];
	pagination: PaginationType;
}

interface GetCreditGrantRequest extends PaginationType {
	subscription_ids?: string[];
	status?: string;
	sort?: string;
	expand?: string;
	order?: string;
}

class CreditGrantApi {
	private static baseUrl = '/creditgrants';

	public static async createCreditGrant(data: Partial<CreditGrant>) {
		return AxiosClient.post<CreditGrant, Partial<CreditGrant>>(this.baseUrl, data);
	}

	public static async getGrantCredit(data: GetCreditGrantRequest) {
		const url = generateQueryParams(this.baseUrl, data);
		return await AxiosClient.get<GetGrantCreditResponse>(url);
	}

	public static async updateCreditGrant(subscription_id: string, data: Partial<CreditGrant>) {
		return await AxiosClient.put<CreditGrant, Partial<CreditGrant>>(`${this.baseUrl}/${subscription_id}`, data);
	}

	public static async deleteCreditGrant(subscription_id: string) {
		return await AxiosClient.delete<CreditGrant>(`${this.baseUrl}/${subscription_id}`);
	}
}

export default CreditGrantApi;
