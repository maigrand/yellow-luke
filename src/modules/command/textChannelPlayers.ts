import {ChatInputCommandInteraction, MessageFlags} from "discord.js";
import {
	getTextChannelPlayersConfig,
	TextChannelPlayersState,
	upsertTextChannelPlayersConfig
} from "@/modules/textChannelPlayers/textChannelPlayersModel";

const PLAYERS_PLACEHOLDER = '%players%'

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
	})

	await interaction.editReply(`Обновление включено: ${channel} -> "${nextTemplate}".`)
}
