import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // Scoped to storybook-system only: avoids react-docgen crashing on
  // existing codebase files (e.g. ServiceAccounts.tsx ObjectMethod bug)
  // and prevents the upstream Input.stories.tsx missing-default-export error.
  stories: [
    "../src/components/storybook-system/**/*.mdx",
    "../src/components/storybook-system/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    // Disable react-docgen to prevent crashes on ObjectMethod patterns
    // in existing codebase files outside the storybook-system scope.
    reactDocgen: false,
  },
};
export default config;
