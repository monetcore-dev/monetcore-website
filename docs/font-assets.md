# Local font assets

Inter is used for body text, controls and navigation; Manrope for headings and brand typography. Both are supplied under the SIL Open Font License (OFL 1.1); the complete notices are retained beside the WOFF2 files in `app/fonts`.

The Latin variable upright subsets are served through `next/font/local`, with font-display swap, preloading and Next.js fallback metric adjustment. No build-time Google Fonts download, external browser font request or new runtime dependency is required. Only the upright subsets needed by this design are shipped; italic text uses browser synthesis.

Sources downloaded from registry.npmjs.org through npm pack, retaining npm integrity verification:

- `inter`: @fontsource-variable/inter@5.3.0; npm integrity `sha512-OupL48va4JNofb97w6NYeF9S7W/kHNKM0Er8Dem5nqi4jeOLrVJDoE8tZEpnMJmtkvNbB1EIPPwHcdkF6b1oUA==`.
- `manrope`: @fontsource-variable/manrope@5.3.0; npm integrity `sha512-6D5dgokHsWDDMtmXHznKa0hK229NN+1a4BLPmUCLqcO1Pw5EEhWY5RFt0AcXnVRAljFFPfRtLkJePQj6LSsV6g==`.
