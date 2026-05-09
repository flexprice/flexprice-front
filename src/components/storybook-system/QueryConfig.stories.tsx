import type { Meta, StoryObj } from '@storybook/react';
import { createQueryClient, createQueryConfig, QUERY_PRESETS } from './queryConfig';

/**
 * QueryConfigDocs documents the reusable TanStack Query cache presets and shows
 * how call sites can override staleTime or gcTime declaratively.
 */
const QueryConfigDocs = ({ preset }: { preset: keyof typeof QUERY_PRESETS }) => {
	const config = createQueryConfig(preset);
	const client = createQueryClient();
	const defaultOptions = client.getDefaultOptions().queries;

	return (
		<div className='w-[520px] rounded-[6px] border border-zinc-200 bg-white p-4'>
			<h3 className='text-sm font-semibold text-[#18181B]'>TanStack Query cache preset</h3>
			<dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
				<div>
					<dt className='text-zinc-500'>Preset</dt>
					<dd className='font-medium'>{preset}</dd>
				</div>
				<div>
					<dt className='text-zinc-500'>staleTime</dt>
					<dd className='font-medium'>{Number(config.staleTime).toLocaleString()} ms</dd>
				</div>
				<div>
					<dt className='text-zinc-500'>gcTime</dt>
					<dd className='font-medium'>{Number(config.gcTime).toLocaleString()} ms</dd>
				</div>
				<div>
					<dt className='text-zinc-500'>Override example</dt>
					<dd className='font-medium'>createQueryConfig('{preset}', {'{ staleTime: 0 }'})</dd>
				</div>
				<div className='col-span-2 rounded-[6px] bg-zinc-50 p-3'>
					<dt className='text-zinc-500'>Global QueryClient default</dt>
					<dd className='font-medium'>
						staleTime {Number(defaultOptions?.staleTime).toLocaleString()} ms, gcTime {Number(defaultOptions?.gcTime).toLocaleString()} ms
					</dd>
				</div>
			</dl>
		</div>
	);
};

const meta = {
	title: 'FlexPrice/Advanced/QueryConfig',
	component: QueryConfigDocs,
	parameters: { layout: 'centered' },
	argTypes: {
		preset: { control: 'select', options: ['REALTIME', 'DEFAULT', 'STATIC'] },
	},
	args: {
		preset: 'DEFAULT',
	},
} satisfies Meta<typeof QueryConfigDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-4'>
			<QueryConfigDocs preset='REALTIME' />
			<QueryConfigDocs preset='DEFAULT' />
			<QueryConfigDocs preset='STATIC' />
		</div>
	),
};
