import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Page } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import CreateLicenseDialog from './CreateLicenseDialog';

// ponytail: create is a dialog (matches Coupons); this route just opens it over the list so
// a direct link to /licenses/create still works, rather than duplicating the form as a page.
const CreateLicense = () => {
	const { t } = useTranslation('catalog');
	const navigate = useNavigate();
	const [open, setOpen] = useState(true);

	return (
		<Page heading={t('licenses.createDialog.title')}>
			<CreateLicenseDialog
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) navigate(RouteNames.licenses);
				}}
				onSuccess={() => {}}
			/>
		</Page>
	);
};

export default CreateLicense;
