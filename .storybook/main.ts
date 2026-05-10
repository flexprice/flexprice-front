import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: ['@storybook/addon-onboarding', '@storybook/addon-essentials', '@chromatic-com/storybook', '@storybook/addon-interactions'],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	typescript: {
		// Disable react-docgen to avoid parse errors on files with ObjectMethod patterns
		reactDocgen: false,
	},
};
export default config;
