export enum NodeEnv {
	LOCAL = 'local',
	DEV = 'development',
	PROD = 'production',
	SELF_HOSTED = 'self-hosted',
}

export const NODE_ENV: NodeEnv = import.meta.env.VITE_ENVIRONMENT as NodeEnv;
