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

import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { join } from 'path'
import { existsSync } from 'fs'
import { readdir } from 'fs/promises'
import preact from '@preact/preset-vite'
import magicalSvg from 'vite-plugin-magical-svg'
import licensePlugin from 'rollup-plugin-license'

import { baseLicensePath, finishLicense, renderLicense } from './build/license'
import transform from './build/transform'
import manifest from './build/manifest'
import pack from './build/pack'

function finalizeBuild (): Plugin {
	return {
		enforce: 'post',
		name: 'finalize-build',
		generateBundle: function (_opts, bundle) {
			bundle['src/popup/index.html'].fileName = 'popup.html'
			if (bundle['src/background.html']) bundle['src/background.html'].fileName = 'background.html'
		},
	}
}

function tweakConfig (): Plugin {
	return {
		name: 'pdb-config-tweak',
		config: (cfg) => {
			if (cfg.build?.watch) {
				if (!cfg.build.rollupOptions) cfg.build.rollupOptions = {}
				cfg.build.rollupOptions.output = {
					entryFileNames: 'assets/[name].js',
					chunkFileNames: 'assets/[name].chk.js',
					assetFileNames: 'assets/[name].[ext]',
				}

				cfg.build.cssMinify = false
				cfg.build.minify = false
			}
		},
	}
}

const input: Record<string, string> = {
	extension: join(__dirname, 'src', 'index.ts'),
	wrapper: join(__dirname, 'src', 'wrapper.ts'),
	runtime: join(__dirname, 'src', 'runtime.ts'),
	worker: join(__dirname, 'src', 'worker.ts'),
	popup: join(__dirname, 'src', 'popup', 'index.html'),
	'styles/pdblib': join(__dirname, '..', 'pronouns', 'styles.css'),
}

const modulesDir = join(__dirname, 'src', 'modules')
for (const dir of await readdir(modulesDir)) {
	const stylesheet = join(modulesDir, dir, 'style.css')
	if (existsSync(stylesheet)) input[`styles/${dir}`] = stylesheet
}

if (process.env.PDB_BROWSER_TARGET === 'firefox') {
	delete input.worker
	delete input.runtime
	input.background = join(__dirname, 'src', 'background.html')
}

const outDir = process.env.PDB_BROWSER_TARGET === 'firefox' ? 'dist/firefox' : 'dist/chrome'

export default defineConfig({
	build: {
		target: 'es2020',
		outDir: outDir,
		assetsInlineLimit: 0,
		rollupOptions: { input: input },
		modulePreload: { polyfill: false },
	},
	envPrefix: [ 'VITE', 'PDB' ],
	plugins: [
		preact(),
		transform(),
		magicalSvg({ target: 'preact' }),
		licensePlugin({
			thirdParty: {
				includePrivate: false,
				allow: '(MIT OR Apache-2.0 OR MPL-2.0 OR CC0-1.0)',
				output: {
					file: join(__dirname, outDir, baseLicensePath),
					template: renderLicense,
				},
			},
		}),
		finishLicense(),
		finalizeBuild(),
		tweakConfig(),
		manifest(),
		pack(),
	],
})
