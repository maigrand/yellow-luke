export async function getAuthor(jkaResponse) {
    //console.log(jkaResponse)
}

export async function normalizeJkaString(string) {
    return string.replaceAll(/\^\d/g, "")
}