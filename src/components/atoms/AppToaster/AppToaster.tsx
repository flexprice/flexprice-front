import { Toaster } from 'react-hot-toast';

/** Shared toast config — used in App and Storybook. */
export const appToastOptions = {
	duration: 4000,
	style: {
		maxWidth: 'min(calc(100vw - 32px), 520px)',
		overflowWrap: 'break-word' as const,
	},
	success: {
		iconTheme: {
			// `primary` is the icon disc, `secondary` the glyph drawn on top of it. The glyph stays
			// white in both themes because it sits on the coloured disc, not on the toast surface.
			primary: 'rgb(var(--fp-toast-success))',
			secondary: '#fff',
		},
		className: 'whitespace-nowrap',
	},
	error: {
		iconTheme: {
			primary: 'rgb(var(--fp-toast-danger))',
			secondary: '#fff',
		},
		className: 'break-words',
	},
};

const AppToaster = () => (
	<Toaster
		toastOptions={appToastOptions}
		position='bottom-center'
		containerStyle={{
			bottom: '80px',
		}}
	/>
);

export default AppToaster;
