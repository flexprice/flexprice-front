// src/pages/auth/BrandTemplate.tsx
import React from 'react';
import { config } from '@/config/config';
import { AUTH_TEMPLATE } from '@/config/authTemplates';
import { AuthTab } from './authTabs';
import FlexpriceDefault from './templates/FlexpriceDefault/FlexpriceDefault';
import Template2 from './templates/Template2/Template2';
import { Slot } from '@/brand/Slot';

interface BrandTemplateProps {
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const BrandTemplate: React.FC<BrandTemplateProps> = ({ currentTab, switchTab }) => {
	const { authPage } = config;

	const template =
		authPage.template === AUTH_TEMPLATE.TEMPLATE_2 ? (
			<Template2 config={authPage.config} currentTab={currentTab} switchTab={switchTab} />
		) : (
			<FlexpriceDefault currentTab={currentTab} switchTab={switchTab} />
		);

	return <Slot name='auth.page' currentTab={currentTab} switchTab={switchTab} fallback={template} />;
};

export default BrandTemplate;
