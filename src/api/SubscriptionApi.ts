import { AxiosClient } from '@/core/axios/verbs';
import { Subscription, SubscriptionPhase, SubscriptionUsage } from '@/models/Subscription';
import { AddSubscriptionPhasePayload, GetSubscriptionPreviewResponse } from '@/types/dto/Subscription';
import {
	GetSubscriptionDetailsPayload,
	PauseSubscriptionPayload,
	ResumeSubscriptionPayload,
	SubscriptionPauseResponse,
	SubscriptionResumeResponse,
} from '@/types/dto';

class SubscriptionApi {
	private static baseUrl = '/subscriptions';

	public static async getSubscriptionUsage(id: string): Promise<SubscriptionUsage> {
		return await AxiosClient.post(`${this.baseUrl}/usage`, { subscription_id: id });
	}

	public static async getSubscriptionInvoicesPreview({
		subscription_id,
		period_end,
		period_start,
	}: GetSubscriptionDetailsPayload): Promise<GetSubscriptionPreviewResponse> {
		return await AxiosClient.post<GetSubscriptionPreviewResponse>('/invoices/preview', {
			subscription_id: subscription_id,
			period_end: period_end,
			period_start: period_start,
		});
	}

	static async getSubscriptionById(id: string): Promise<Subscription> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}

	static async pauseSubscription(id: string, payload: PauseSubscriptionPayload): Promise<SubscriptionPauseResponse> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/pause`, payload);
	}

	static async resumeSubscription(id: string, payload: ResumeSubscriptionPayload): Promise<SubscriptionResumeResponse> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/resume`, payload);
	}

	static async cancelSubscription(id: string): Promise<void> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/cancel`);
	}

	static async addSubscriptionPhase(id: string, payload: AddSubscriptionPhasePayload): Promise<SubscriptionPhase> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/phases`, {
			phase: payload,
		});
	}
}

export default SubscriptionApi;
