import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Button, Loader, NoDataCard, Chip } from '@/components/atoms';
import { DetailsCard } from '@/components/molecules';
import PriceUnitApi from '@/api/PriceUnitApi';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import PriceUnitDrawer from './components/PriceUnitDrawer';
import formatChips from '@/utils/common/format_chips';
import { ENTITY_STATUS } from '@/models/base';
import { RouteNames } from '@/core/routes/Routes';
import { EyeOff, Pencil } from 'lucide-react';

export const PriceUnitDetailsPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [priceUnit, setPriceUnit] = useState<PriceUnitResponse | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	useEffect(() => {
		const fetchPriceUnit = async () => {
			if (!id) return;
			try {
				setLoading(true);
				setError(null);
				const response = await PriceUnitApi.getById(id);
				setPriceUnit(response);
			} catch (err) {
				setError('Failed to fetch price unit details');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchPriceUnit();
	}, [id]);

	const handleEdit = () => {
		setIsDrawerOpen(true);
	};

	const handleDelete = async () => {
		if (!id) return;
		try {
			await PriceUnitApi.delete(id);
			navigate(RouteNames.priceUnits);
		} catch (err) {
			console.error('Failed to delete price unit:', err);
		}
	};

	const handleDrawerClose = () => {
		setIsDrawerOpen(false);
	};

	if (loading) {
		return <Loader />;
	}

	if (error || !priceUnit) {
		return (
			<Page>
				<NoDataCard
					title='Error'
					subtitle={error || 'Price unit not found'}
					cta={<Button onClick={() => navigate(RouteNames.priceUnits)}>Back</Button>}
				/>
			</Page>
		);
	}

	return (
		<Page
			heading='Price Unit Details'
			headingCTA={
				<>
					<Button onClick={() => handleEdit()} variant={'outline'}>
						<Pencil />
						Edit
					</Button>
					<Button onClick={() => handleDelete()} variant={'outline'}>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<DetailsCard
				data={[
					{
						label: 'Name',
						value: priceUnit.name,
					},
					{
						label: 'Code',
						value: priceUnit.code,
					},
					{
						label: 'Symbol',
						value: priceUnit.symbol,
					},
					{
						label: 'Base Currency',
						value: priceUnit.base_currency,
					},
					{
						label: 'Conversion Rate',
						value: priceUnit.conversion_rate.toString(),
					},
					{
						label: 'Precision',
						value: priceUnit.precision,
					},
					{
						label: 'Status',
						value: (
							<Chip variant={priceUnit.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} label={formatChips(priceUnit.status)} />
						),
					},
				]}
				variant='stacked'
			/>

			<PriceUnitDrawer open={isDrawerOpen} onOpenChange={handleDrawerClose} data={priceUnit} />
		</Page>
	);
};
