import { RouterProvider } from 'react-router/dom';
import { MainRouter } from '@/core/routes/Routes';
import { UserProvider } from '@/hooks/UserContext';
import { DocsProvider } from './context/DocsContext';
import AppToaster from './components/atoms/AppToaster/AppToaster';
import ReactQueryProvider from './core/services/tanstack/ReactQueryProvider';
import useVersionCheck from '@/hooks/useVersionCheck';
import { PaddleProvider } from '@/core/paddle';

const App = () => {
	useVersionCheck();

	return (
		<ReactQueryProvider>
			<UserProvider>
				<PaddleProvider>
					<DocsProvider>
						<RouterProvider router={MainRouter} />
					</DocsProvider>

					<AppToaster />
					<div id='modal-root'></div>
				</PaddleProvider>
			</UserProvider>
		</ReactQueryProvider>
	);
};

export default App;
