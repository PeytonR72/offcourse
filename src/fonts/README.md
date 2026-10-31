# Self-hosted type

- Silkscreen Regular: wordmark and percentage readout, from Google Fonts.
- DM Sans variable 400–700: reading and interface text, from Google Fonts.
- `silkscreen-og.ttf` is used only by the server-side social image renderer.

The browser loads two Latin WOFF2 files, about 44 KB combined. No third-party
font request is made at runtime. Both families use the SIL Open Font License;
the license texts are retained in `licenses/`.

Sources: [Silkscreen](https://fonts.google.com/specimen/Silkscreen) and
[DM Sans](https://fonts.google.com/specimen/DM+Sans).
