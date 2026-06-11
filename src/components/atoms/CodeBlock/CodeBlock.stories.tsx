import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
	title: 'Atoms/CodeBlock',
	component: CodeBlock,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScriptExample: Story = {
	args: {
		language: 'tsx',
		code: `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Storybook'));`,
	},
};
