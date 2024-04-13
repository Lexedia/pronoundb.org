/*
 * Copyright (c) Cynthia Rey et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { h } from '../utils/dom'

export type GradientDefinition = Array<{ c: string, o: string }>
type DecorationBorderSolid = { type: 'solid', color: string }
type DecorationGradient = {
	type: 'linear-gradient' | 'conic-gradient',
	angle: number
	colors: GradientDefinition
}

export type DecorationData = {
	name: string
	border: (el: Element) => string
	elements: {
		topLeft?: SVGElement
		bottomRight?: SVGElement
	}
	animation: {
		border?: string
		topLeft?: string
		bottomRight?: string
	}
}

let decorationsEnabled = true
chrome.storage.sync.get([ 'decorations' ], ({ decorations }) => (decorationsEnabled = decorations !== false))
chrome.storage.onChanged.addListener((changes) => (decorationsEnabled = changes.decorations.newValue !== false))

function definitionToColor (def: GradientDefinition) {
	return def.map(({ c, o }) => `${c} ${o}`).join(', ')
}

function getBorderColor (border: DecorationBorderSolid | DecorationGradient, width: number, height: number) {
	const a = width / 2
	const b = height / 2
	const c = Math.sqrt((a * a) + (b * b))

	const angleTL = -Math.acos(((b * b) + (c * c) - (a * a)) / (2 * b * c))
	const angleBR = angleTL + Math.PI

	switch (border.type) {
		case 'solid':
			return border.color
		case 'linear-gradient': {
			let angle = border.angle
			if (angle === -1) angle = angleTL

			const gradient = definitionToColor(border.colors)
			return `linear-gradient(${angle}rad, ${gradient})`
		}
		case 'conic-gradient': {
			let angle = border.angle
			if (angle === -1) angle = angleTL
			if (angle === -2) angle = angleBR

			const gradient = definitionToColor(border.colors)
			return `conic-gradient(from ${angle}rad at 50% 50%, ${gradient})`
		}
	}

	// @ts-expect-error
	return ''
}

function renderSvg (data: any) {
	return h(
		'svg',
		{ viewBox: data.v },
		...data.p.map((p: any) => h('path', { fill: p.c, d: p.d }))
	)
}

async function doFetch (id: string): Promise<DecorationData | null> {
	// Request is done by the background worker to avoid CSP issues.
	// Chromium does let us do the request regardless of the page's CSP, but Firefox doesn't.
	const res = await chrome.runtime.sendMessage({
		kind: 'decoration',
		decoration: id,
	})

	if (!res.success) {
		console.error('[PronounDB::fetch] Failed to fetch:', res.error)
		return null
	}

	return {
		name: res.data.name,
		border: (el: Element) => getBorderColor(res.data.border, el.clientWidth, el.clientHeight),
		elements: {
			topLeft: res.data.elements?.top_left && renderSvg(res.data.elements.top_left),
			bottomRight: res.data.elements?.bottom_right && renderSvg(res.data.elements.bottom_right),
		},
		animation: {
			border: res.data.animation?.border,
			topLeft: res.data.animation?.top_left,
			bottomRight: res.data.animation?.bottom_right,
		},
	}
}

const cache = new Map<string, Promise<DecorationData | null>>()
export function fetchDecoration (id: string): Promise<DecorationData | null> {
	if (!decorationsEnabled) return Promise.resolve(null)

	if (!cache.has(id)) {
		const promise = doFetch(id)
		cache.set(id, promise)
		return promise
	}

	return cache.get(id)!
}
