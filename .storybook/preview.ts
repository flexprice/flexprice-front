import 'tailwindcss/tailwind.css';
import '../src/index.css';
import React from 'react';
import { MemoryRouter } from 'react-router';
import type { Preview } from '@storybook/react';
import ReactQueryProvider from '../src/core/services/tanstack/ReactQueryProvider';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		(Story, context) =>
			React.createElement(
				ReactQueryProvider,
				null,
				context.parameters.withRouter
					? React.createElement(MemoryRouter, { initialEntries: [context.parameters.initialRoute ?? '/home'] }, React.createElement(Story))
					: React.createElement(Story),
			),
	],
};

export default preview;
