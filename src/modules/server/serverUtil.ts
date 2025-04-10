export const normalizeJkaString = (jkaString: string) => {
	return jkaString.replaceAll(/\^\d/g, "")
}

export const validateNickname = (nickname: string) => {
	let clientName = nickname
	if (clientName.includes("*")) {
		clientName = clientName.replaceAll("*", "\\*")
	}
	if (clientName.includes("_")) {
		clientName = clientName.replaceAll("_", "\\_")
	}
	if (clientName.includes("\"")) {
		clientName = clientName.replaceAll("\"", "")
	}
	if (clientName.includes("|")) {
		clientName = clientName.replaceAll("|", "\\|")
	}
	if (clientName.includes("discord.gg")) {
		clientName = clientName.replaceAll(/.+/g, "discord.gg")
	}
	return clientName
}
