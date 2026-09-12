/**
 * Posts a Playwright run summary to Slack.
 *
 * A failing run gets the full breakdown: which journey, which assertion, what was
 * expected, which artifacts exist. A passing run gets one line naming the flows that
 * ran and nothing else — enough to confirm the suite is alive without turning the
 * channel into a wall of green ticks nobody reads.
 *
 * The scheduled monitor is the exception and still stays silent while green: a tick
 * every thirty minutes is noise, so it passes --status recovered only on the
 * transition back from a failure.
 *
 * Slack is the notification layer, never the source of truth. Every message links
 * back to the workflow run, whose HTML report and traces carry the actual detail.
 *
 * Usage:
 *   node scripts/e2e-slack-notify.mjs --status failure --context "PR #123"
 *   node scripts/e2e-slack-notify.mjs --status success --context "Post-deploy smoke"
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

/**
 * The human-facing name of each flow that ran, for the success line.
 *
 * Playwright's JSON nests describe blocks under a file-level suite, so the ancestry
 * reads "e2e/journeys/wallet/x.spec.ts › Wallet creation and alert thresholds". The
 * file segment is an implementation detail to anyone reading Slack, and the `@critical`
 * grep tags are for selecting tests, not for describing them — both are dropped so the
 * message reads as "Wallet creation and alert thresholds worked well".
 */
function flowNames(tests) {
	const names = new Set();
	for (const test of tests) {
		const segment = test.journey
			.split(' › ')
			.map((part) => part.trim())
			.find((part) => part && !part.includes('/') && !part.endsWith('.spec.ts'));
		if (!segment) continue;
		const label = segment.replace(/@\S+/g, '').replace(/\s+/g, ' ').trim();
		if (label) names.add(label);
	}
	return [...names];
}

/** "a", "a and b", "a, b and c" — a list that reads as a sentence. */
function listPhrase(items) {
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function section(text) {
	return { type: 'section', text: { type: 'mrkdwn', text } };
}

function contextBlock(text) {
	return { type: 'context', elements: [{ type: 'mrkdwn', text }] };
}

/**
 * Never fails the workflow over a notification — the test result is what matters.
 *
 * That has to cover a rejected request, not just an error response: a DNS failure,
 * a connection reset or a malformed webhook URL makes fetch throw, and an uncaught
 * throw here reaches the top-level await and exits non-zero. The step that reports
 * a failure would then itself fail, turning a red suite into a red suite plus a
 * confusing script error — and on the monitor, a Slack outage alone would keep the
 * workflow red long after the app recovered.
 */
async function post(webhook, payload) {
	let response;
	try {
		response = await fetch(webhook, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			// A hung socket would otherwise hold the job open to its own timeout; the
			// notification is never worth more than a few seconds of a run.
			signal: AbortSignal.timeout(10_000),
		});
	} catch (error) {
		console.error(`Slack notification could not be sent: ${error instanceof Error ? error.message : String(error)}`);
		return;
	}

	if (!response.ok) {
		console.error(`Slack notification failed: ${response.status} ${await response.text().catch(() => '')}`);
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
	const tests = collectTests(report.suites);
	const failures = tests.filter((t) => t.status === 'unexpected');

	if (failures.length === 0 && (stats.unexpected ?? 0) === 0) {
		// The monitor deliberately stays quiet while green — it runs on a timer, so a tick
		// every half hour is exactly the noise that gets a channel muted. Everything else
		// gets one line confirming which flows ran, which is also the only signal that the
		// suite is still running at all rather than silently skipping.
		if (status !== 'success') {
			console.log('No failures — skipping Slack notification.');
			return;
		}

		const flows = flowNames(tests.filter((t) => t.status === 'expected'));
		const subject = flows.length > 0 ? listPhrase(flows) : context;
		const verb = flows.length > 1 ? 'flows worked well' : 'flow worked well';
		const counts = `${stats.expected ?? 0} passed${stats.flaky ? ` · ${stats.flaky} flaky` : ''}${stats.skipped ? ` · ${stats.skipped} skipped` : ''}`;
		const line = `✅ *${subject}* ${verb} on ${environment} — ${counts}${runUrl ? ` · <${runUrl}|view run>` : ''}`;

		await post(webhook, { text: `${subject} ${verb} — ${context}`, blocks: [section(line)] });
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
