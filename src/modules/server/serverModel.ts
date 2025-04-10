import { readFile, writeFile } from 'fs/promises'

export type ServerModel = {
	id: number;
	guildId: string;
	channelId: string;
	messageId: string;
	address: string;
	name: string;
	password: string;
	index?: number;
}

export const getServers = async () => {
	const serversRaw = await readFile('./servers.json', 'utf-8')
	const servers: ServerModel[] = JSON.parse(serversRaw);
	return servers.sort((a, b) => a.id - b.id);
}

export const setServers = async (servers: ServerModel[]) => {
	await writeFile('./servers.json', JSON.stringify(servers, null, 2), 'utf-8')
}
