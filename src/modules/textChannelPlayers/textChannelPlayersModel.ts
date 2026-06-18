import {readFile, writeFile} from 'fs/promises'

const FILE_PATH = './textChannelPlayers.json'

export type TextChannelPlayersState = 'on' | 'off'

export type TextChannelPlayersConfig = {
	guildId: string;
	enabled: boolean;
	channelId: string | null;
	template: string;
	lastName?: string;
}

export const getTextChannelPlayersConfigs = async () => {
	try {
		const configsRaw = await readFile(FILE_PATH, 'utf-8')
		return JSON.parse(configsRaw) as TextChannelPlayersConfig[]
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return []
		}
		throw error
	}
}

export const setTextChannelPlayersConfigs = async (configs: TextChannelPlayersConfig[]) => {
	await writeFile(FILE_PATH, JSON.stringify(configs, null, 2), 'utf-8')
}

export const getTextChannelPlayersConfig = async (guildId: string) => {
	const configs = await getTextChannelPlayersConfigs()
	return configs.find((config) => config.guildId === guildId)
}

export const upsertTextChannelPlayersConfig = async (config: TextChannelPlayersConfig) => {
	const configs = await getTextChannelPlayersConfigs()
	await setTextChannelPlayersConfigs([
		...configs.filter((item) => item.guildId !== config.guildId),
		config,
	])
}

export const setTextChannelPlayersLastName = async (guildId: string, lastName: string) => {
	const configs = await getTextChannelPlayersConfigs()
	const config = configs.find((item) => item.guildId === guildId)
	if (!config) {
		return
	}
	config.lastName = lastName
	await setTextChannelPlayersConfigs(configs)
}
