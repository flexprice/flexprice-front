import { RouterProvider } from 'react-router-dom';
import { MainRouter } from '@/core/routes/Routes';
import { UserProvider } from '@/hooks/UserContext';
import { Toaster } from 'react-hot-toast';
import { DocsProvider } from './context/DocsContext';
import ReactQueryProvider from './core/services/tanstack/ReactQueryProvider';
const App = () => {
	return (
		<ReactQueryProvider>
			<UserProvider>
				<DocsProvider>
					<RouterProvider router={MainRouter} />
				</DocsProvider>

				{/* Toast Notifications */}
				<Toaster
					toastOptions={{
						success: {
							iconTheme: {
								primary: '#5CA7A0',
								secondary: '#fff',
							},
						},
						error: {
							iconTheme: {
								primary: '#E76E50',
								secondary: '#fff',
							},
						},
					}}
					position='bottom-center'
				/>
				<div id='modal-root'></div>
			</UserProvider>
		</ReactQueryProvider>
	);
};

export default App;
