import { NODE_ENV, NodeEnv } from '@/types';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { InfoIcon, XIcon } from 'lucide-react';

const isProd = NODE_ENV === NodeEnv.PROD;
const LAST_DISMISSED_VERSION = 'lastDismissedVersion';

export default function useVersionCheck(intervalMs = 5 * 60 * 1000) {
	const currentVersion = __APP_VERSION__;

	useEffect(() => {
		if (!isProd) {
			console.log(`[VersionCheck] Skipped in dev mode mode mode is ${NODE_ENV}`);
			return;
		}

		const refreshIfNewBuild = async () => {
			try {
				const res = await fetch(`/meta.json?t=${Date.now()}`, { cache: 'no-cache' });
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				const meta = await res.json();
				const latestVersion = meta.versionId;
				const dismissedVersion = localStorage.getItem(LAST_DISMISSED_VERSION);
				const timestamp = new Date().toISOString();
				if (latestVersion !== currentVersion) {
					if (dismissedVersion === latestVersion) {
						console.info(`[VersionCheck][${timestamp}] Dismissed version: ${latestVersion}`);
						return;
					}

					console.info(`[VersionCheck][${timestamp}] New version detected. Current: ${currentVersion}, Latest: ${latestVersion}`);
					toast(
						(t) => (
							<div className='bg-white border-gray-200 w-80'>
								{/* Header */}
								<div className='flex items-center justify-between mb-3'>
									<div className='flex items-center gap-3'>
										<div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
											<InfoIcon className='w-4 h-4 text-blue-600' />
										</div>
										<h3 className='text-lg font-regular text-gray-900'>New version available</h3>
									</div>
									<button onClick={() => toast.dismiss(t.id)} className='text-gray-400 hover:text-gray-600 transition-colors'>
										<XIcon className='w-5 h-5' />
									</button>
								</div>

								{/* Body */}
								<p className='text-sm text-gray-600 mb-4'>A new software version is available for download.</p>

								{/* Action Buttons */}
								<div className='flex gap-3 justify-end'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => {
											localStorage.setItem(LAST_DISMISSED_VERSION, latestVersion);
											toast.dismiss(t.id);
										}}>
										Not now
									</Button>
									<Button
										variant='default'
										size='sm'
										onClick={() => {
											toast.dismiss(t.id);
											window.location.reload();
										}}>
										Update
									</Button>
								</div>
							</div>
						),
						{
							duration: Infinity,
							id: 'version-check-notification',
							position: 'bottom-right',
						},
					);
				} else {
					console.debug(`[VersionCheck][${timestamp}] App is up-to-date. Version: ${currentVersion}`);
				}
			} catch (err) {
				console.error('Error checking version', err);
			}
		};

		// Run immediately
		refreshIfNewBuild();

		// Set interval
		const intervalId = setInterval(refreshIfNewBuild, intervalMs);
		return () => clearInterval(intervalId);
	}, [intervalMs]);
}
