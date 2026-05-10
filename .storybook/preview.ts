import 'tailwindcss/tailwind.css';
import React from 'react';
import { MemoryRouter } from 'react-router';
import type { Preview } from '@storybook/react';

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
			context.parameters.withRouter
				? React.createElement(MemoryRouter, { initialEntries: [context.parameters.initialRoute ?? '/home'] }, React.createElement(Story))
				: React.createElement(Story),
	],
};

export default preview;
