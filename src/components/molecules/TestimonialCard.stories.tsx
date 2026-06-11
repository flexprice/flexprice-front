import type { Meta, StoryObj } from '@storybook/react';
import TestimonialCard from './TestimonialCard/TestimonialCard';
import type { Testimonial } from '@/types';

const meta: Meta<typeof TestimonialCard> = {
	title: 'Molecules/TestimonialCard',
	component: TestimonialCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const testimonial: Testimonial = {
	companyName: 'Acme Inc.',
	companyTitleLogoUrl:
		"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='32' viewBox='0 0 120 32'%3E%3Crect width='120' height='32' rx='6' fill='%23092E44'/%3E%3Ctext x='16' y='21' fill='white' font-size='14' font-family='Arial'%3EACME%3C/text%3E%3C/svg%3E",
	dpUrl:
		"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='32' fill='%23E5E7EB'/%3E%3Ccircle cx='32' cy='26' r='10' fill='%239CA3AF'/%3E%3Cpath d='M16 54c4-10 12-15 16-15s12 5 16 15' fill='%239CA3AF'/%3E%3C/svg%3E",
	logoUrl: '',
	testimonial: 'Storybook makes it easy for our team to review UI states before they land in production.',
	name: 'Jordan Lee',
	designation: 'Head of Product',
	label: 'YC 25',
};

export const Default: Story = {
	args: {
		testimonial,
	},
};
