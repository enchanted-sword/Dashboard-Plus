const key = 'lastSeenNoTagPromptTsKey'

export const main = async () => window.localStorage.setItem(key, Number.MAX_SAFE_INTEGER);

export const clean = async () => window.localStorage.setItem(key, 0);