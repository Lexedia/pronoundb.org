# PronounDB
[![License](https://img.shields.io/github/license/cyyynthia/pronoundb.org.svg?style=flat-square)](https://github.com/cyyynthia/pronoundb.org/blob/mistress/LICENSE)
[![Chat on Discord](https://img.shields.io/badge/chat-on%20discord-5865F2?style=flat-square)](https://discord.gg/VnxPeNHHpG)<br/>
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nblkbiljcjfemkfjnhoobnojjgjdmknf?logo=google-chrome&logoColor=white&style=flat-square)](https://chrome.google.com/webstore/detail/pronoundb/nblkbiljcjfemkfjnhoobnojjgjdmknf)
[![Mozilla Add-on](https://img.shields.io/amo/v/pronoundb?logo=firefox&logoColor=white&style=flat-square)](https://addons.mozilla.org/firefox/addon/pronoundb)
[![Edge Add-on](https://img.shields.io/badge/dynamic/json?label=edge%20add-on&prefix=v&color=fe7d37&logo=microsoftedge&logoColor=white&style=flat-square&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fjbgjogfdlgjohdacngknlohahhaiaodn)](https://microsoftedge.microsoft.com/addons/detail/jbgjogfdlgjohdacngknlohahhaiaodn)

Get people's pronouns right, all the time, without struggling

PronounDB is a browser extension that makes it easy for everyone to know and share pronouns. Link your accounts, set
your pronouns and just like magic all fellow PronounDB users know your pronouns. Simple, efficient. Check it out at
https://pronoundb.org!

You can find a list of supported platforms, and a quick preview of how the extension looks at
https://pronoundb.org/supported.

## Get the extension
 - [Chrome Web Store](https://chrome.google.com/webstore/detail/pronoundb/nblkbiljcjfemkfjnhoobnojjgjdmknf)
 - [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/pronoundb)
 (Android support coming soon, see [issue #10](https://github.com/cyyynthia/pronoundb.org/issues/10))
 - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/jbgjogfdlgjohdacngknlohahhaiaodn)

## Structure
 - The website (backend & frontend) is built with [astro](https://astro.build) and [tailwindcss](https://tailwindcss.com)
 - Data is stored using [postgresql](https://www.postgresql.org/)
 - May contains stains of coffee and a few cookie crumbs :whistle:

For more details about how it works internally, and for clues on how to get started with modifying the code, check
[HACKING.md](HACKING.md)

## FAQ
### Neo-pronouns support
For the time being, neo-pronouns are not supported by PronounDB. However, they might get added in the future.

In my [original statement](https://github.com/cyyynthia/pronoundb.org/blob/f8eaea19/README.md#faq), I stated that
they would not be something I'll be adding - this is (probably) no longer the case.

I'll be changing the way pronouns are internally handled and formatted soon:tm:, which should allow for this to happen.
I also revised some of my plans regarding internationalization and found some compromises there too.

### Custom pronouns
There won't be a way to use pronouns that aren't available in PronounDB. The only way would be to have a free text
input for people to type their pronouns in, which would require me to start moderating the platform for abusive
content which is a strict no from me.
