import type { Meta, StoryObj } from '@storybook/react';
import { InfoIcon } from 'lucide-react';
import Button from '../Button/Button';
import Tooltip from './Tooltip';

/**
 * Contextual tooltip for providing hints or additional information on hover.
 * Default delay is 0ms — appears immediately on hover.
 */
const meta: Meta<typeof Tooltip> = {
	title: 'Atoms/Tooltip',
	component: Tooltip,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
		align: { control: 'select', options: ['start', 'center', 'end'] },
		delayDuration: { control: 'number' },
		avoidCollisions: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
	render: () => (
		<Tooltip content='This is a tooltip' side='top' delayDuration={0}>
			<Button variant='outline'>Hover me</Button>
		</Tooltip>
	),
};

/**
 * Each button has plenty of space on its target side.
 * avoidCollisions=false ensures the tooltip stays on the side you set —
 * it won't auto-flip to "top" even if near the viewport edge.
 */
export const AllSides: Story = {
	parameters: { layout: 'fullscreen' },
	render: () => (
		<div className='w-full h-screen grid grid-rows-3 grid-cols-3 place-items-center p-12'>
			{/* top-center */}
			<div />
			<div className='flex justify-center'>
				<Tooltip content='Top' side='top' delayDuration={0} avoidCollisions={false}>
					<Button variant='outline' size='sm'>
						Top
					</Button>
				</Tooltip>
			</div>
			<div />

			{/* middle row: left — center — right */}
			<div className='flex justify-end pr-8'>
				<Tooltip content='Left' side='left' delayDuration={0} avoidCollisions={false}>
					<Button variant='outline' size='sm'>
						Left
					</Button>
				</Tooltip>
			</div>
			<div className='text-xs text-muted-foreground text-center'>Hover each button to see the tooltip on the correct side</div>
			<div className='flex justify-start pl-8'>
				<Tooltip content='Right' side='right' delayDuration={0} avoidCollisions={false}>
					<Button variant='outline' size='sm'>
						Right
					</Button>
				</Tooltip>
			</div>

			{/* bottom-center */}
			<div />
			<div className='flex justify-center'>
				<Tooltip content='Bottom' side='bottom' delayDuration={0} avoidCollisions={false}>
					<Button variant='outline' size='sm'>
						Bottom
					</Button>
				</Tooltip>
			</div>
			<div />
		</div>
	),
};

export const Instant: Story = {
	render: () => (
		<Tooltip content='No delay — instant on hover' delayDuration={0}>
			<Button variant='outline'>Hover (instant)</Button>
		</Tooltip>
	),
};

export const WithDelay: Story = {
	render: () => (
		<div className='flex flex-col items-center gap-4'>
			<p className='text-xs text-muted-foreground'>Notice the 800ms wait before the tooltip appears</p>
			<Tooltip content='Delayed tooltip (800ms)' delayDuration={800}>
				<Button variant='outline'>Hover (delayed)</Button>
			</Tooltip>
		</div>
	),
};

export const RichContent: Story = {
	render: () => (
		<Tooltip
			content={
				<div className='space-y-1 max-w-[200px]'>
					<p className='font-medium'>Usage-based billing</p>
					<p className='text-xs opacity-80'>Charges are calculated based on actual usage each billing period.</p>
				</div>
			}
			side='right'
			delayDuration={0}
			avoidCollisions={false}>
			<span className='inline-flex items-center gap-1 cursor-help'>
				<InfoIcon size={16} className='text-muted-foreground' />
				<span className='text-sm underline decoration-dashed'>What is this?</span>
			</span>
		</Tooltip>
	),
};
