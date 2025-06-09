export const generateQueryParams = (baseUrl: string, params: Record<string, any>): string => {
	const queryParams = Object.keys(params)
		.filter((key) => key && params[key])
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
		.join('&');

	return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
};
