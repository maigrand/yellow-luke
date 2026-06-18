import {ChatInputCommandInteraction, EmbedBuilder, MessageFlags} from "discord.js";

export const help = async (interaction: ChatInputCommandInteraction) => {
	const embed = new EmbedBuilder()
		.setTitle('Команды бота')
		.addFields(
			{name: '/madd', value: 'Добавить сервер в мониторинг (создаёт embed в канале).\n`destination` — канал, `address` — `ip:port`, `name`, `password` (опц.).\nПример: `/madd destination:#status address:127.0.0.1:29070 name:My Server`', inline: false},
			{name: '/mlist', value: 'Показать список серверов гильдии.', inline: false},
			{name: '/medit', value: 'Изменить сервер (по `name`). Опции: `address`, `password`, `index` (позиция).\nПример: `/medit name:My Server password:secret`', inline: false},
			{name: '/mdel', value: 'Удалить сервер (по `name`).', inline: false},
			{name: '/mrebuild', value: 'Пересоздать все embed-сообщения мониторинга (например, после чистки канала).', inline: false},
			{name: '/mtextchannelplayers', value: 'Автопереименование канала с числом активных игроков.\n`state`: on/off, `channel`, `template` с `%players%`.\nПлюрализация: `%p:<одна>:<две>:<пять>%`.\nПример: `/mtextchannelplayers state:on channel:#игроки template:Ща играют: %players% джеда%p:й:я:ев%` → `1 джедай`, `3 джедая`, `5 джедаев`', inline: false},
			{name: '/mhelp', value: 'Показать эту справку.', inline: false},
		)

	await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral})
}
