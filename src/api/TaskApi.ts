import { AxiosClient } from '@/core/axios/verbs';
import { ImportTask } from '@/models/ImportTask';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PaginationType } from '@/models/Pagination';

interface AddTaskPayload {
	entity_type: string;
	file_type: string;
	file_url: string;
	task_type: string;
	file_name?: string;
	metadata?: Record<string, any>;
}

type GetTasksPayload = {
	created_by?: string;
	end_time?: string;
	expand?: string;
	limit?: number;
	offset?: number;
	order?: string;
	sort?: string;
	start_time?: string;
	status?: string;
	task_status?: string;
	task_type?: string;
};

type GetTasksResponse = {
	items: ImportTask[];
	pagination: PaginationType;
};

class TaskApi {
	private static baseUrl = '/tasks';

	public static async addTask(data: AddTaskPayload) {
		return await AxiosClient.post<ImportTask, AddTaskPayload>(`${this.baseUrl}`, data);
	}

	public static async getTaskById(id: string): Promise<ImportTask> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}

	public static async getAllTasks(payload: GetTasksPayload = {}): Promise<GetTasksResponse> {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get(url);
	}
}

export default TaskApi;
