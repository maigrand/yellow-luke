export type RussianPluralForm = 'one' | 'few' | 'many'

export const PLAYERS_PLACEHOLDER = '%players%'

const PLURAL_PLACEHOLDER_PATTERN = /%p:([^%]*)%/g

export const getRussianPluralForm = (count: number): RussianPluralForm => {
	const absCount = Math.abs(count)
	const mod10 = absCount % 10
	const mod100 = absCount % 100
	if (mod10 === 1 && mod100 !== 11) {
		return 'one'
	}
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
		return 'few'
	}
	return 'many'
}

const pluralFormIndex = (form: RussianPluralForm): 0 | 1 | 2 => {
	if (form === 'one') {
		return 0
	}
	if (form === 'few') {
		return 1
	}
	return 2
}

export const renderTemplate = (template: string, players: number): string => {
	const form = getRussianPluralForm(players)
	const withPlurals = template.replace(PLURAL_PLACEHOLDER_PATTERN, (match, formsRaw: string) => {
		const forms = formsRaw.split(':')
		if (forms.length !== 3) {
			return match
		}
		return forms[pluralFormIndex(form)]
	})
	return withPlurals.replaceAll(PLAYERS_PLACEHOLDER, players.toString())
}

export const findInvalidPluralPlaceholders = (template: string): string[] => {
	const invalid: string[] = []
	for (const match of template.matchAll(PLURAL_PLACEHOLDER_PATTERN)) {
		const formsRaw = (match[1] ?? '')
		if (formsRaw.split(':').length !== 3) {
			invalid.push(match[0])
		}
	}
	return invalid
}
