import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { integrationCatalogSpecs, type Integration, type IntegrationCatalogSpec } from './integrationsData';

const CATALOG = 'insightsTools.integrations.catalog';

type SectionBlock = { title: string; paragraphs: string[] };

function mapSpecToIntegration(
	t: (key: string, options?: { returnObjects?: boolean }) => unknown,
	spec: IntegrationCatalogSpec,
): Integration {
	const base = `${CATALOG}.${spec.id}`;
	const name = String(t(`${base}.name`));
	const description = String(t(`${base}.description`));

	const tags = spec.tagKeys.map((k) => String(t(`${CATALOG}.tags.${k}`)));

	let info: Integration['info'];
	if (spec.sectionKeys?.length) {
		info = spec.sectionKeys.map((sectionKey) => {
			const sectionPath = `${base}.sections.${sectionKey}`;
			const block = t(sectionPath, { returnObjects: true }) as SectionBlock;
			return {
				title: String(block?.title ?? ''),
				description: Array.isArray(block?.paragraphs) ? block.paragraphs.map(String) : [],
			};
		});
	}

	return {
		id: spec.id,
		name,
		description,
		logo: spec.logo,
		logoDark: spec.logoDark,
		tags,
		tagKeys: [...spec.tagKeys],
		websiteUrl: spec.websiteUrl,
		docsUrl: spec.docsUrl,
		premium: spec.premium,
		type: spec.type,
		accountId: spec.accountId,
		mode: spec.modeKey ? String(t(`${CATALOG}.mode.${spec.modeKey}`)) : undefined,
		apiKey: spec.apiKey,
		installedAt: spec.installedAt,
		info,
	};
}

export function useIntegrationsCatalog(): Integration[] {
	const { t } = useTranslation('settings');
	return useMemo(() => integrationCatalogSpecs.map((spec) => mapSpecToIntegration(t, spec)), [t]);
}
