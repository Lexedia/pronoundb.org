# PronounDB
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71TSDF)<br>
[![License](https://img.shields.io/github/license/cyyynthia/pronoundb.org.svg?style=flat-square)](https://github.com/cyyynthia/pronoundb.org/blob/mistress/LICENSE)

An extension that lets people know each other's pronouns on various places of the Internet, so mistakes are less
likely to happen. Link your accounts, set your pronouns and magically fellow PronounDB users will know your pronouns.
Simple, efficient. Check it out at https://pronoundb.org!

The extension aims to inject that piece of information in a discrete way, that matches with the website you're looking
at and finds a balance between ease to find and doing too much.

## Supported services
 - GitHub
 - Discord (Web)
   - Exists as a [plugin](https://github.com/cyyynthia/pronoundb-powercord) for [Powercord](https://powercord.dev)
 - Twitch
 - Twitter

**Support coming soon:tm: for:**
 - GitLab
 - Reddit
 - Mastodon

Want to see another service supported? Shoot an issue!

## Structure
 - The backend is built using [fastify](https://fastify.io)
 - The frontend is built using [preact](https://preactjs.com) and bundled with [webpack](https://webpack.js.org)
 - The extension is bundled using [microbundle](https://github.com/developit/microbundle)
 - Data is stored using [mongodb](https://mongodb.com)
 - May contains stains of coffee and a few cookie crumbs :whistle:

## FAQ
### Is is possible to add support for customized pronouns?
It's possible, but I won't add it. The reason for this is that this creates an attack vector for people with malicious
intents, to go and start mocking on communities (reality is that communities who'd want and benefit from a "custom"
field are mocked too often).

I'd need to start moderating the platform, which would require a team of moderators looking into people's linked
accounts and pronouns which sounds invasive to me. So to avoid any form of abuse, the only option will remain "Other"
in the pronouns picker.

### How about neo-pronouns support?
TL;DR: Too much things to consider, and there are too many neo-pronouns to have proper support.

[Original issue](https://github.com/cyyynthia/pronoundb.org/issues/3)

Support for neo-pronouns was suggested, but after discussing the conclusion was that supporting them would bring more
downsides than it'd solve problems. One of the major issue is the amount of neo-pronouns out there, which makes building
a complete list near impossible, and the pronoun selector would be gigantic and need UX tweaks.

A proposal was to only support the most common/popular ones, but the issue with that is that defining how common/popular
a neo-pronoun is is complicated, and could be seen as unfair. I also considered unfair to only support a few neo-pronouns,
and tell people going by unlisted ones "sorry, your pronouns aren't popular enough". This sounds super harsh and
definitely not something people may want to be confronted with.

Another proposal was to let people input a custom set of pronouns themselves, but I rejected this proposal for the
reasons listed above.

As a final decision, it was considered acceptable to let people use "Other" when going by neo-pronouns, and have an
additional option which explicitly tells people they can feel free to ask the person about their pronouns. This
decision may, in the future, be revised if there's popular demand or if I randomly decide to.
