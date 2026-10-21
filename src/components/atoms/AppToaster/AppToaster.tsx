import { Toaster } from 'react-hot-toast';
import { appToastOptions } from './appToastOptions';

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
