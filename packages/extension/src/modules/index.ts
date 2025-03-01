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

import type { ComponentType } from 'preact'

export type ExtensionModule = {
	id: string
	name: string
	color: string
	match: RegExp
	Icon: ComponentType<any>
	inject: () => void
}

const modules: ExtensionModule[] = []
const rawModules = import.meta.glob<ExtensionModule>('./**/main.ts', { eager: true })
for (const mdl in rawModules) {
	if (mdl in rawModules) {
		modules.push({ ...rawModules[mdl], id: mdl.slice(2, -8) })
	}
}

export async function getModule (loc?: string): Promise<ExtensionModule | null> {
	// ref: https://bugzilla.mozilla.org/show_bug.cgi?id=1711570
	const extension = typeof browser === 'undefined' ? chrome : browser

	if (!loc) {
		loc = location.href
		if (extension.tabs) {
			const [ tab ] = await extension.tabs.query({ active: true, currentWindow: true })
			// eslint-disable-next-line require-atomic-updates
			loc = tab.url!
		}
	}

	return modules.find((mdl) => mdl.match.test(loc!)) || null
}

export default modules
