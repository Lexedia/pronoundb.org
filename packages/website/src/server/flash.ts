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

import type { APIContext, AstroGlobal } from 'astro'

export type FlashMessage = keyof typeof FlashMessages

export const FlashMessages = <const>{
	// Success
	S_REGISTERED: 'Welcome!! Thank you for creating your PronounDB account. Start by setting your pronouns, and then consider linking your other accounts. Have a great stay!',
	S_PRONOUNS_UPDATED: 'Your pronouns have been updated. Changes might take up to a few minutes to propagate.',
	S_DECORATION_UPDATED: 'Your decoration has been updated. Changes might take up to a few minutes to propagate.',
	S_ACC_DELETED: 'Your account has been successfully deleted. Sorry to see you go!',

	// Error
	E_CSRF: 'Verification of the authenticity of the submission failed (CSRF check). Please try again.',
	E_EXPERIMENT_NOT_IN_BUCKET: 'This feature is experimental and you do not have been granted access yet.',

	E_OAUTH_GENERIC: 'An unknown error occurred while authenticating with the third party service.',
	E_OAUTH_FETCH: 'Could not fetch information about your external account.',
	E_OAUTH_10A_EXCHANGE: 'Could not initialize the authentication request with the third party.',
	E_ACCOUNT_EXISTS: 'This account already exists in our database. Did you mean to login?',
	E_ACCOUNT_NOT_FOUND: 'This account does not exist in our database. Did you mean to register?',
	E_ACCOUNT_TAKEN: 'This account has already been linked to another PronounDB account.',
	E_ONLY_ACCOUNT: 'You cannot unlink your only linked account. If you want to get rid of it, you must delete your account.',

	E_XLIVE_AUTHENTICATION: 'Could not authenticate with Xbox Live servers.',
	E_XLIVE_NO_ACCOUNT: 'There are no Xbox Live account associated to your Microsoft account.',
	E_XLIVE_UNAVAILABLE: 'Xbox Live is unavailable in your country.',
	E_XLIVE_CHILD: 'Your Xbox Live account cannot be processed unless it is added to a Family by an adult.',
	E_XLIVE_AUTHORIZATION: 'Could not request authorization from Xbox Live servers.',
	E_MC_AUTH: 'Could not authenticate with Minecraft authentication servers.',
	E_MC_NO_LICENSE: 'You do not have a Minecraft account associated with this Xbox Live account.',

	E_PRONOUNS_UNKNOWN_LOCALE: 'The locale specified is unknown.',
	E_PRONOUNS_UNKNOWN_SET: 'One of the sets you\'ve entered is unknown.',
	E_PRONOUNS_DUPLICATE_ENTRIES: 'One set have been entered multiple times.',
	E_PRONOUNS_INVALID_PLACEMENT: 'A set only available as 1st (and only) set has been specified as 2nd or 3rd set.',
	E_PRONOUNS_EXTRA_SETS: 'Invalid set order: constrains regarding set orders have not been respected.',

	E_DECORATION_UNKNOWN: 'The decoration you\'ve entered is invalid.',
	E_DECORATION_LOCKED: 'The decoration you\'ve selected is not available to you.',

	// External codes, may be used by intermediary infrastructure (e.g. nginx reverse proxy)
	X_TEMPORARILY_UNAVAILABLE: 'This is temporarily unavailable. Sorry for the inconvenience.',
}

export function handleFlash ({ cookies }: AstroGlobal) {
	const flashId = cookies.get('flash')?.value
	if (flashId) {
		cookies.delete('flash')
		const msg = FlashMessages[flashId as FlashMessage]
		return msg ? { id: flashId, message: msg } : void 0
	}

	return void 0
}

export function setFlash ({ cookies }: APIContext, flashId: FlashMessage) {
	cookies.set('flash', flashId, { path: '/', maxAge: 30, httpOnly: true, secure: import.meta.env.PROD })
}
