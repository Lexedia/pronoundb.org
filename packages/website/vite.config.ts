/*
 * Copyright (c) 2020-2022 Cynthia K. Rey, All rights reserved.
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
import { rename } from 'fs/promises'
import preact from '@preact/preset-vite'
import magicalSvg from 'vite-plugin-magical-svg'
import licensePlugin from 'rollup-plugin-license'
import sriPlugin from 'rollup-plugin-sri'

import { baseLicensePath, renderLicense, finishLicense } from '@pronoundb/shared/build.js'

function moveIndex (): Plugin {
  return {
    name: 'move-index',
    closeBundle: async () => {
      if (process.argv.includes('--ssr')) {
        await rename(join(__dirname, 'dist', 'index.html'), join(__dirname, 'server', 'index.html'))
      }
    },
  }
}

export default defineConfig({
  publicDir: process.argv.includes('--ssr') ? '_' : 'public',
  optimizeDeps: { include: [ '@pronoundb/shared/platforms.js' ] },
  build: {
    assetsInlineLimit: 0,
    outDir: process.argv.includes('--ssr') ? 'server' : 'dist',
  },
  server: {
    hmr: { port: 8080 },
    fs: { allow: [ '..' ] },
  },
  plugins: [
    preact(),
    magicalSvg({ target: 'preact' }),
    licensePlugin({
      thirdParty: process.argv.includes('--ssr')
        ? void 0
        : {
          includePrivate: false,
          allow: '(MIT OR Apache-2.0 OR MPL-2.0 OR CC0-1.0)',
          output: {
            file: join(__dirname, baseLicensePath),
            template: renderLicense,
          },
        },
    }),
    finishLicense({ workingDirectory: __dirname }),
    {
      ...sriPlugin({ publicPath: '/', algorithms: [ 'sha256', 'sha512' ] }),
      enforce: 'post',
    },
    moveIndex(),
  ],
})
