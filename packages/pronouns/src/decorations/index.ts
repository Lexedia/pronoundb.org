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

import { type DecorationBorder, type DecorationData, fetchDecoration, type SvgDefinition } from './http.js'

export type DecorationElement = SvgDefinition

export type BorderRenderer = (width: number, height: number) => string

export type Decoration = {
	name: string
	border: {
		color: string
		renderer: BorderRenderer
	}
	elements: {
		topLeft: DecorationElement | undefined
		bottomRight: DecorationElement | undefined
	}
	animation: {
		border: string | undefined
		topLeft: string | undefined
		bottomRight: string | undefined
	}
}

function renderBorder (border: DecorationBorder, width: number, height: number): string {
	if (border.type === 'solid') {
		return border.color
	}

	if (border.type === 'linear-gradient' || border.type === 'conic-gradient') {
		let angle = `${border.angle}deg`

		if (border.angle < 0) {
			const multiplier = -(border.angle + 1)

			if (width === height) {
				// Fast path - good ol' 45 deg
				angle = `${-45 + (90 * multiplier)}deg`
			} else {
				// Slow path using trigonometry
				const a = width >> 1
				const b = height >> 1
				const c = Math.sqrt((a * a) + (b * b))

				const radiants = -Math.acos(((b * b) + (c * c) - (a * a)) / (2 * b * c))
				angle = `${radiants + (Math.PI * (multiplier >> 1))}rad`
			}
		}

		const gradient = border.colors.map(({ c, o }) => `${c} ${o}`).join(', ')
		return border.type === 'linear-gradient'
			? `linear-gradient(${angle}, ${gradient})`
			: `conic-gradient(from ${angle} at 50% 50%, ${gradient})`
	}

	return ''
}

export function renderDecoration (decoration: DecorationData): Decoration | null {
	// Implementations are expected to ignore unsupported decoration formats
	if (decoration.version > 1) return null

	return {
		name: decoration.name,
		border: {
			color: renderBorder(decoration.border, 1, 1),
			renderer: renderBorder.bind(null, decoration.border),
		},
		elements: {
			topLeft: decoration.elements?.top_left,
			bottomRight: decoration.elements?.bottom_right,
		},
		animation: {
			border: decoration.animation?.border,
			topLeft: decoration.animation?.top_left,
			bottomRight: decoration.animation?.bottom_right,
		},
	}
}

export async function getDecoration (decoration: string): Promise<Decoration | null> {
	const data = await fetchDecoration(decoration)
	return data ? renderDecoration(data) : null
}

export async function getDecorationExtension (decoration: string): Promise<Decoration | null> {
	const res = await chrome.runtime.sendMessage({ kind: 'decoration', decoration: decoration })
	if (!res.success) throw new Error(res.error)

	const data = res.data as DecorationData | null
	return data ? renderDecoration(data) : null
}

export {
	type DecorationBorder,
	type SvgElement,
	type SvgDefinition,
	type DecorationData,
} from './http.js'
