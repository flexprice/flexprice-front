import { config } from '@/config/config';
import { ApiDocsSnippet } from '@/store/useApiDocsStore';

const API_DOCS_URL = 'https://raw.githubusercontent.com/flexprice/flexprice-docs/main/api-reference/openapi.json';

const resolveSchema = (schema: any, schemas: any): any => {
	if (!schema) return {};

	if (schema.$ref) {
		const refKey = schema.$ref.replace('#/components/schemas/', '');
		return schemas[refKey] || {};
	}

	return schema;
};

const generateExample = (schema: any): any => {
	if (!schema || typeof schema !== 'object') return {};

	if (schema.example) return schema.example;

	if (schema.type === 'object' && schema.properties) {
		return Object.fromEntries(Object.entries(schema.properties).map(([key, value]: [string, any]) => [key, generateExample(value)]));
	}

	if (schema.type === 'array' && schema.items) {
		return [generateExample(schema.items)];
	}

	if (schema.type === 'string') return '<string>';
	if (schema.type === 'integer') return 0;
	if (schema.type === 'boolean') return false;

	return {};
};

export const fetchAndExtractSnippetsByTags = async (tags: string[], json?: any): Promise<ApiDocsSnippet[]> => {
	try {
		let openApiJson: any = {};

		if (json) {
			openApiJson = json;
		} else {
			const response = await fetch(API_DOCS_URL);
			openApiJson = await response.json();
		}

		const baseUrl = config.api.baseUrl || openApiJson?.servers?.[0]?.url || '';
		const schemas = openApiJson?.components?.schemas || {};
		const snippets: ApiDocsSnippet[] = [];

		Object.entries(openApiJson.paths).forEach(([path, methods]: [string, any]) => {
			Object.entries(methods).forEach(([method, details]: [string, any]) => {
				if (!details.tags || !details.tags.some((tag: string) => tags.includes(tag))) return;

				const url = `${baseUrl}${path}`;
				let curlCommand = `curl --request ${method.toUpperCase()} \\\n  --url "${url}" \\\n`;

				let requestBodyExample = {};
				if (details?.requestBody?.content?.['application/json']) {
					const requestBodySchema = resolveSchema(details.requestBody.content['application/json'].schema, schemas);
					requestBodyExample = generateExample(requestBodySchema);
				}

				if (Object.keys(requestBodyExample).length > 0) {
					curlCommand += `  --header 'Content-Type: application/json' \\\n`;
					curlCommand += `  --data '${JSON.stringify(requestBodyExample, null, 2)
						.replace(/\n/g, '\n  ')
						.replace(/"([^"]+)":/g, '$1:')}'`;
				}

				const requestBodyJSON = JSON.stringify(requestBodyExample, null, 2);

				const pythonCommand = `import requests\n\nurl = "${url}"\nheaders = { "x-api-key": "<api-key>", "Content-Type": "application/json" }\ndata = ${requestBodyJSON}\nresponse = requests.${method}(url, headers=headers, json=data)\nprint(response.json())`;

				const javascriptCommand = `fetch("${url}", {\n  method: "${method.toUpperCase()}",\n  headers: { "x-api-key": "<api-key>", "Content-Type": "application/json" },\n  body: JSON.stringify(${requestBodyJSON})\n}).then(res => res.json()).then(console.log);`;

				const phpCommand = `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => "${url}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "${method.toUpperCase()}",\n  CURLOPT_HTTPHEADER => [ "x-api-key: <api-key>", "Content-Type: "application/json" ],\n  CURLOPT_POSTFIELDS => json_encode(${requestBodyJSON})\n]);\n$response = curl_exec($curl);\ncurl_close($curl);\necho $response;`;

				const javaCommand = `import java.net.http.*;\nimport java.net.URI;\n\nHttpClient client = HttpClient.newHttpClient();\nHttpRequest request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("x-api-key", "<api-key>")\n    .header("Content-Type", "application/json")\n    .method("${method.toUpperCase()}", HttpRequest.BodyPublishers.ofString(${requestBodyJSON}))\n    .build();\nHttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.body());`;

				const goCommand = `package main\n\nimport (\n    "fmt"\n    "strings"\n    "net/http"\n)\n\nfunc main() {\n    client := &http.Client{}\n    jsonStr := ${requestBodyJSON}\n    req, _ := http.NewRequest("${method.toUpperCase()}", "${url}", strings.NewReader(jsonStr))\n    req.Header.Add("x-api-key", "<api-key>")\n    req.Header.Add("Content-Type", "application/json")\n    resp, _ := client.Do(req)\n    defer resp.Body.Close()\n    fmt.Println(resp.Body)\n}`;

				const csharpCommand = `using System.Net.Http;\nusing System.Text;\n\nusing var client = new HttpClient();\nvar request = new HttpRequestMessage(HttpMethod.${method.toUpperCase()}, "${url}");\nrequest.Headers.Add("x-api-key", "<api-key>");\nrequest.Content = new StringContent(${requestBodyJSON}, Encoding.UTF8, "application/json");\nvar response = await client.SendAsync(request);\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`;

				const rubyCommand = `require 'net/http'\nrequire 'json'\n\nurl = URI("${url}")\nhttp = Net::HTTP.new(url.host, url.port)\nhttp.use_ssl = true\nrequest = Net::HTTP::${method[0].toUpperCase() + method.slice(1)}.new(url)\nrequest["x-api-key"] = "<api-key>"\nrequest["Content-Type"] = "application/json"\nrequest.body = ${requestBodyJSON}.to_json\nresponse = http.request(request)\nputs response.body`;

				const swiftCommand = `import Foundation\n\nlet url = URL(string: "${url}")!\nvar request = URLRequest(url: url)\nrequest.httpMethod = "${method.toUpperCase()}"\nrequest.addValue("<api-key>", forHTTPHeaderField: "x-api-key")\nrequest.addValue("application/json", forHTTPHeaderField: "Content-Type")\nrequest.httpBody = try? JSONSerialization.data(withJSONObject: ${requestBodyJSON}, options: [])\nlet task = URLSession.shared.dataTask(with: request) { data, response, error in\n    if let data = data {\n        print(String(data: data, encoding: .utf8)!)\n    }\n}\ntask.resume()`;

				snippets.push({
					label: details.summary || `${method.toUpperCase()} ${path}`,
					description: details.description || '',
					curl: curlCommand,
					Python: pythonCommand,
					JavaScript: javascriptCommand,
					PHP: phpCommand,
					Java: javaCommand,
					Go: goCommand,
					'C#': csharpCommand,
					Ruby: rubyCommand,
					Swift: swiftCommand,
				});
			});
		});

		return snippets;
	} catch (error) {
		console.error('❌ Error fetching OpenAPI JSON:', error);
		return [];
	}
};
