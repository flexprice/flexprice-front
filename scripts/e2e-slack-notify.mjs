/**
 * Posts a Playwright run summary to Slack.
 *
 * Silence is the default: a passing run sends nothing, because a channel that
 * receives a green tick every thirty minutes is a channel nobody reads. Only a
 * failing run — or the first pass after a failing one — is worth an interruption.
 *
 * Slack is the notification layer, never the source of truth. Every message links
 * back to the workflow run, whose HTML report and traces carry the actual detail.
 *
 * Usage:
 *   node scripts/e2e-slack-notify.mjs --status failure --context "PR #123"
 *
 * Environment:
 *   SLACK_WEBHOOK_URL   required; the message is skipped (not failed) when unset,
 *                       so a fork or a repo without Slack wired up still goes green.
 *   GITHUB_SERVER_URL / GITHUB_REPOSITORY / GITHUB_RUN_ID   used to link the run.
 */

import fs from 'node:fs';

const RESULTS_PATH = 'playwright-report/results.json';
const MAX_FAILURES_LISTED = 5;

/** Strips the colour codes Playwright writes into assertion output — noise in Slack. */
const ANSI_PATTERN = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

function arg(name, fallback = '') {
	const index = process.argv.indexOf(`--${name}`);
	return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

/**
 * Walks the reporter's nested suites and returns every test case.
 *
 * `journey` is the describe-block ancestry — "Create customer @critical" — and
 * `title` the case itself, because an engineer reading the alert wants to know which
 * workflow broke before which assertion did.
 */
function collectTests(suites, ancestry = []) {
	const tests = [];
	for (const suite of suites ?? []) {
		const path = suite.title ? [...ancestry, suite.title] : ancestry;
		for (const spec of suite.specs ?? []) {
			for (const testCase of spec.tests ?? []) {
				tests.push({
					journey: path.filter(Boolean).join(' › '),
					title: spec.title,
					file: suite.file ?? spec.file ?? '',
					line: spec.line,
					project: testCase.projectName ?? '',
					status: testCase.status,
					results: testCase.results ?? [],
				});
			}
		}
		tests.push(...collectTests(suite.suites, path));
	}
	return tests;
}

/** The last attempt is the one whose artifacts survive, so diagnostics come from it. */
function finalResult(test) {
	return test.results[test.results.length - 1] ?? {};
}

function clean(text) {
	return (text ?? '').replace(ANSI_PATTERN, '').trim();
}

function truncate(text, max) {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Pulls the assertion's expected and actual out of Playwright's error text.
 *
 * Playwright formats assertion failures with `Expected:` / `Received:` lines, which
 * is the part an engineer actually needs; the surrounding stack is noise in Slack and
 * is one click away in the report regardless. Falls back to the first line for errors
 * that are not assertions (a navigation timeout, a thrown setup error).
 */
function describeFailure(test) {
	const message = clean(finalResult(test).error?.message);
	if (!message) return { summary: 'no error message captured' };

	const lines = message.split('\n');
	const expected = message.match(/^\s*Expected:?\s*(.+)$/m)?.[1]?.trim();

	// Playwright reports the actual value as `Received:` for value assertions, but as
	// a trailing `Error:` line for presence ones ("element(s) not found"). Take
	// whichever is present, ignoring the leading `Error: expect(...)` banner.
	const received =
		message.match(/^\s*(?:Received|Actual):?\s*(.+)$/m)?.[1]?.trim() ??
		lines
			.slice(1)
			.find((line) => /^Error:\s*\S/.test(line.trim()))
			?.replace(/^Error:\s*/, '')
			.trim();

	// The locator is the single most useful line when a selector stops matching.
	const locator = message.match(/^\s*Locator:?\s*(.+)$/m)?.[1]?.trim();

	return {
		summary: truncate(lines[0], 200),
		expected: expected ? truncate(expected, 180) : undefined,
		received: received ? truncate(received, 180) : undefined,
		locator: locator ? truncate(locator, 180) : undefined,
	};
}

/**
 * Which diagnostics were captured for this failure.
 *
 * GitHub exposes artifacts per run, not per file, so there is no honest deep link to
 * an individual trace — naming what exists and linking the run is the accurate thing
 * to offer.
 */
function artifactInventory(test) {
	const names = new Set((finalResult(test).attachments ?? []).map((a) => a.name));
	const labels = [
		['trace', '🔍 trace'],
		['screenshot', '📸 screenshot'],
		['video', '🎥 video'],
		['error-context', '📄 error context'],
	]
		.filter(([name]) => names.has(name))
		.map(([, label]) => label);
	return labels;
}

/** `file:line` of the assertion that failed — the closest thing the JSON has to a step. */
function failureLocation(test) {
	const location = finalResult(test).errorLocation;
	if (location?.file) {
		const relative = location.file.replace(`${process.cwd()}/`, '');
		return `${relative}:${location.line ?? '?'}`;
	}
	return `${test.file}${test.line ? `:${test.line}` : ''}`;
}

function section(text) {
	return { type: 'section', text: { type: 'mrkdwn', text } };
}

function contextBlock(text) {
	return { type: 'context', elements: [{ type: 'mrkdwn', text }] };
}

async function post(webhook, payload) {
	const response = await fetch(webhook, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		// Never fail the workflow over a notification — the test result is what matters.
		console.error(`Slack notification failed: ${response.status} ${await response.text()}`);
		return;
	}
	console.log('Slack notification sent.');
}

async function main() {
	const webhook = process.env.SLACK_WEBHOOK_URL;
	if (!webhook) {
		console.log('SLACK_WEBHOOK_URL not set — skipping Slack notification.');
		return;
	}

	const status = arg('status', 'failure');
	const context = arg('context', process.env.GITHUB_WORKFLOW ?? 'E2E');
	const environment = arg('environment', process.env.E2E_BASE_URL ?? 'unknown');

	const runUrl =
		process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
			? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
			: null;

	if (status === 'recovered') {
		await post(webhook, {
			text: `UI checks recovered — ${context}`,
			blocks: [
				section(`*✅ UI checks recovered*\n\n*Suite:* ${context}\n*Environment:* ${environment}`),
				...(runUrl ? [contextBlock(`<${runUrl}|View run>`)] : []),
			],
		});
		return;
	}

	let report;
	try {
		report = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
	} catch {
		// The run died before the reporter could write — still worth an alert, because
		// a crashed suite is indistinguishable from a broken app to everyone downstream.
		await post(webhook, {
			text: `UI checks did not complete — ${context}`,
			blocks: [
				section(
					`*🚨 UI checks did not complete*\n\n*Suite:* ${context}\n*Environment:* ${environment}\n\nNo \`${RESULTS_PATH}\` was written — the run crashed before reporting.`,
				),
				...(runUrl ? [contextBlock(`<${runUrl}|View run>`)] : []),
			],
		});
		return;
	}

	const stats = report.stats ?? {};
	const failures = collectTests(report.suites).filter((t) => t.status === 'unexpected');

	if (failures.length === 0 && (stats.unexpected ?? 0) === 0) {
		console.log('No failures — skipping Slack notification.');
		return;
	}

	const listed = failures.slice(0, MAX_FAILURES_LISTED);
	const overflow = failures.length - listed.length;

	const failureBlocks = listed.flatMap((test) => {
		const failure = describeFailure(test);
		const artifacts = artifactInventory(test);

		const lines = [`*${test.journey || 'Test'}*`, `Failed: ${test.title}`, `\`${failureLocation(test)}\``];

		if (failure.locator) lines.push(`*Locator* — \`${failure.locator}\``);

		if (failure.expected || failure.received) {
			if (failure.expected) lines.push(`*Expected* — ${failure.expected}`);
			if (failure.received) lines.push(`*Actual* — ${failure.received}`);
		} else {
			lines.push(`> ${failure.summary}`);
		}

		const blocks = [section(lines.join('\n'))];
		const trailer = [test.project && `project: \`${test.project}\``, artifacts.length > 0 && artifacts.join('  ')]
			.filter(Boolean)
			.join('  ·  ');
		if (trailer) blocks.push(contextBlock(trailer));
		return blocks;
	});

	// Branch and pull request are what tell someone whether this is their problem.
	const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
	const provenance = [branch && `branch \`${branch}\``, process.env.GITHUB_SHA && `commit \`${process.env.GITHUB_SHA.slice(0, 7)}\``]
		.filter(Boolean)
		.join('  ·  ');

	await post(webhook, {
		text: `UI regression detected — ${context}`,
		blocks: [
			{ type: 'header', text: { type: 'plain_text', text: '🚨 UI regression detected', emoji: true } },
			{
				type: 'section',
				fields: [
					{ type: 'mrkdwn', text: `*Suite*\n${context}` },
					{ type: 'mrkdwn', text: `*Environment*\n${environment}` },
					{
						type: 'mrkdwn',
						text: `*Result*\n${stats.unexpected ?? failures.length} failed · ${stats.expected ?? 0} passed · ${stats.flaky ?? 0} flaky`,
					},
					{ type: 'mrkdwn', text: `*Skipped*\n${stats.skipped ?? 0}` },
				],
			},
			...(provenance ? [contextBlock(provenance)] : []),
			{ type: 'divider' },
			...failureBlocks,
			...(overflow > 0 ? [contextBlock(`…and ${overflow} more failure${overflow === 1 ? '' : 's'}.`)] : []),
			...(runUrl
				? [
						{
							type: 'actions',
							elements: [
								{
									type: 'button',
									text: { type: 'plain_text', text: 'Open run', emoji: true },
									url: runUrl,
									style: 'danger',
								},
							],
						},
						contextBlock('Traces, screenshots and video are attached to the run as artifacts.'),
					]
				: []),
		],
	});
}

await main();
