import { css, h } from '../../utils/dom'
import { fetchPronouns } from '../../utils/fetch'
import { formatPronouns } from '../../utils/pronouns'

export const name = 'osu!'
export const color = '#F372AD'
export const match = /^https:\/\/osu\.ppy\.sh/
export { default as Icon } from 'simple-icons/icons/osu.svg'

async function handleChatMessage (node: HTMLElement) {
	const sender = node.querySelector('.chat-message-group__sender')

	const userId = sender?.querySelector('a')?.dataset.userId

	if (!userId) return

	const pronouns = await fetchPronouns('osu', userId)

	if (!pronouns || !pronouns.sets.en) return

	const el = h('span', { class: 'u-ellipsis-overflow' }, formatPronouns(pronouns.sets.en))

	sender.appendChild(el)
}

async function handleMutation (mutations: MutationRecord[]) {
	for (const { addedNodes } of mutations) {
		for (const node of addedNodes) {
			if (node instanceof HTMLElement) {
				if (node.classList.contains('chat-message-group')) {
					handleChatMessage(node)
					continue
				}

				if (node.classList.contains('user-card--card') && !('userId' in node.dataset)) {
					handleUserPopout(node)
					continue
				}

				if (node.classList.contains('profile-info__info')) {
					handleUserProfile(node)
					continue
				}
			}
		}
	}
}

async function handleUserPopout (node: HTMLElement) {
	const userId = node.querySelector<HTMLAnchorElement>('.user-card__username')?.href.split('/').pop()

	if (!userId) return

	const pronouns = await fetchPronouns('osu', userId)

	if (!pronouns || !pronouns.sets.en) return

	const usernameAnchor = node.querySelector('.user-card__username')

	if (!usernameAnchor) return

	const el = h('span', { class: 'user-card__pronouns', style: css({ marginLeft: '5px' }) }, `- ${formatPronouns(pronouns.sets.en)}`)

	usernameAnchor.parentElement!.insertBefore(el, usernameAnchor.nextSibling)
}

async function handleUserProfile (node: HTMLElement) {
	const userId = window.location.pathname.split('/').pop()

	if (!userId) return

	const profileInfo = node.querySelector('.profile-info__flag')

	if (!profileInfo) return

	const pronouns = await fetchPronouns('osu', userId)

	if (!pronouns || !pronouns.sets.en) return

	const el = h('span', { class: 'profile-info__pronouns profile-info__flag-text' }, `- ${formatPronouns(pronouns.sets.en)}`)

	profileInfo.appendChild(el)
}

export function inject () {
	document.querySelectorAll<HTMLElement>('.chat-message-group').forEach((node) => handleChatMessage(node))

	if (document.querySelector('.profile-info__info')) {
		handleUserProfile(document.querySelector('.profile-info__info')!)
	}

	const observer = new MutationObserver(handleMutation)

	observer.observe(document, { childList: true, subtree: true })
}
