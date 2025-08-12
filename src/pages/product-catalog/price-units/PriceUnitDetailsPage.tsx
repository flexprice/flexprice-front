import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from '@/components/atoms/Page';
import Card from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import NoDataCard from '@/components/atoms/NoDataCard';
import PriceUnitApi from '@/api/PriceUnitApi';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import formatDate from '@/utils/common/format_date';
import PriceUnitDrawer from './components/PriceUnitDrawer';

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
			navigate('/product-catalog/price-units');
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
					cta={<Button onClick={() => navigate('/product-catalog/price-units')}>Back to Price Units</Button>}
				/>
			</Page>
		);
	}

	return (
		<Page>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-2xl font-semibold'>Price Unit Details</h1>
				<div className='flex space-x-2'>
					<Button variant='ghost' onClick={() => navigate('/product-catalog/price-units')}>
						Back
					</Button>
					<Button onClick={handleEdit}>Edit</Button>
					<Button variant='ghost' onClick={handleDelete}>
						Delete
					</Button>
				</div>
			</div>

			<Card>
				<div className='grid grid-cols-2 gap-4 p-6'>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Name</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.name}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Code</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.code}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Symbol</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.symbol}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Base Currency</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.base_currency}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Conversion Rate</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.conversion_rate.toString()}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Precision</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.precision}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Status</h3>
						<p className='mt-1 text-sm text-gray-900'>{priceUnit.status}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Created At</h3>
						<p className='mt-1 text-sm text-gray-900'>{formatDate(priceUnit.created_at)}</p>
					</div>
					<div>
						<h3 className='text-sm font-medium text-gray-500'>Updated At</h3>
						<p className='mt-1 text-sm text-gray-900'>{formatDate(priceUnit.updated_at)}</p>
					</div>
				</div>
			</Card>

			<PriceUnitDrawer open={isDrawerOpen} onOpenChange={handleDrawerClose} data={priceUnit} />
		</Page>
	);
};
