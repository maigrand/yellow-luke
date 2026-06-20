import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";
import {
	getTextChannelPlayersConfig,
	TextChannelPlayersState,
	upsertTextChannelPlayersConfig,
	setTextChannelPlayersServerIds,
} from "@/modules/textChannelPlayers/textChannelPlayersModel";
import {
	findInvalidPluralPlaceholders,
	PLAYERS_PLACEHOLDER
} from "@/modules/textChannelPlayers/pluralize";
import {getServers} from "@/modules/server/serverModel";

export const TEXT_CHANNEL_PLAYERS_SERVERS_CUSTOM_ID = 'mtextchannelplayers_servers'
const SELECT_MENU_MAX_OPTIONS = 25

export const textChannelPlayers = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral
	})

	const guildId = interaction.guildId!
	const state = interaction.options.getString('state', true) as TextChannelPlayersState
	const selectedChannel = interaction.options.getChannel('channel')
	const template = interaction.options.getString('template')
	const currentConfig = await getTextChannelPlayersConfig(guildId)

	if (state === 'off') {
		await upsertTextChannelPlayersConfig({
			guildId,
			enabled: false,
			channelId: currentConfig?.channelId ?? null,
			template: currentConfig?.template ?? `Players: ${PLAYERS_PLACEHOLDER}`,
			lastName: currentConfig?.lastName,
			serverIds: currentConfig?.serverIds,
		})
		await interaction.editReply('Обновление названия канала выключено для этой гильдии.')
		return
	}

	const channelId = selectedChannel?.id ?? currentConfig?.channelId
	const nextTemplate = template ?? currentConfig?.template

	if (!channelId || !nextTemplate) {
		await interaction.editReply('Для включения укажи channel и template.')
		return
	}

	if (!nextTemplate.includes(PLAYERS_PLACEHOLDER)) {
		await interaction.editReply(`Template должен содержать ${PLAYERS_PLACEHOLDER}.`)
		return
	}

	const invalidPluralPlaceholders = findInvalidPluralPlaceholders(nextTemplate)
	if (invalidPluralPlaceholders.length > 0) {
		await interaction.editReply(
			`Неверный plural-плейсхолдер: ${invalidPluralPlaceholders.join(', ')}. ` +
			`Формат: %p:<одна>:<две>:<пять>%, например %p:й:я:ев%.`
		)
		return
	}

	const channel = await interaction.guild!.channels.fetch(channelId)
	if (!channel?.isTextBased()) {
		await interaction.editReply('Выбранный канал не найден или не является текстовым.')
		return
	}

	await upsertTextChannelPlayersConfig({
		guildId,
		enabled: true,
		channelId,
		template: nextTemplate,
		lastName: currentConfig?.lastName,
		serverIds: currentConfig?.serverIds,
	})

	const guildServers = (await getServers())
		.filter((server) => server.guildId === guildId)
		.slice(0, SELECT_MENU_MAX_OPTIONS)

	if (guildServers.length === 0) {
		await interaction.editReply(
			`Обновление включено: ${channel} -> "${nextTemplate}". ` +
			`В гильдии нет добавленных серверов — игроки считаются как 0.`
		)
		return
	}

	const currentServerIds = currentConfig?.serverIds ?? []
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(TEXT_CHANNEL_PLAYERS_SERVERS_CUSTOM_ID)
		.setPlaceholder('Выбери серверы (пусто = все серверы гильдии)')
		.setMinValues(0)
		.setMaxValues(guildServers.length)
		.addOptions(guildServers.map((server) => ({
			label: server.name.slice(0, 100),
			value: String(server.id),
			default: currentServerIds.includes(server.id),
		})))

	await interaction.editReply({
		content: `Обновление включено: ${channel} -> "${nextTemplate}".\n` +
			`Выбери серверы для подсчёта (пусто = все серверы гильдии):`,
		components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)],
	})
}

export const textChannelPlayersServersSelect = async (interaction: StringSelectMenuInteraction) => {
	await interaction.deferUpdate()

	const guildId = interaction.guildId!
	const serverIds = interaction.values.map((value) => Number(value))
	await setTextChannelPlayersServerIds(guildId, serverIds)

	const guildServers = await getServers()
	const selectedNames = guildServers
		.filter((server) => server.guildId === guildId && serverIds.includes(server.id))
		.map((server) => server.name)

	const message = serverIds.length === 0
		? 'Считаем игроков по всем серверам гильдии.'
		: `Выбраны серверы: ${selectedNames.join(', ')}.`

	await interaction.editReply({
		content: message,
		components: [],
	})
}
