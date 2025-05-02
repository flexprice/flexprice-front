import { AxiosClient } from '@/core/axios/verbs';
import { ImportTask } from '@/models/ImportTask';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetTasksPayload, GetTasksResponse, AddTaskPayload } from '@/types/dto';

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
