# TOXIQ website

The source of truth is TOXIQ Brand Manual v0.2, approved by Adam. The original manual is kept separately; it is not part of this public repository. Apply the approved rules below, and consult the original manual before changing the identity.

## Non-negotiable design rules

- No decorative information cards, rounded boxes, or generic dashboard cards.
- No decorative colored strips above, below, or beside content, including free-floating diagonal strips.
- No generic gray fills or gray UI surfaces. Use Black `#090A0C` and Off White `#F4F4F0`.
- A necessary functional frame or a new neutral color must be explicitly approved by Adam before introduction.
- Dark uses Toxic Lime `#B8FF31`; light uses Toxic Violet `#8F5CFF`. Never mix the two accents in one composition.
- Use typography, contrast, whitespace, signature Q, 3×2 arrangement, controlled cropping and meaningful large color fields.
- Preserve the approved wordmark and signature Q geometry. Assets are vectors extracted from the manual; recoloring is allowed only within the approved palette.
- Physical keys and real product underglow are exempt from the ban on decorative boxes/strips; they are physical product features.

## Product and implementation

- This is a concept. Do not invent shipping dates, production specs, battery life, confirmed pricing, checkout, or live hardware connectivity.
- This is a product page. The profile section shows read-only MOBA/FPS/Creator examples; do not turn it into a macro editor or a simulated typing utility.
- Public downloads are for the Windows Configurator. Keep V0 firmware, Arduino sketches, prototype flashing instructions and hardware-development notes in the repository/release documentation, outside the product page. Keep a concise preview label while the app is a prerelease.
- The separately requested configurator lives in `configurator/`: React + TypeScript and an Electron shell. Keep the product profile section read-only. v0.5 includes the real USB CDC adapter and matching firmware in `firmware/`. Only native desktop uses USB; the browser remains explicitly a mock demo. Call a device connected only after protocol handshake and validated read; report successful writes only after flash acknowledgement and independent readback. Hardware testing on Adam's physical V0 remains separate from compilation/simulated tests. V0 has two buttons and no underglow; capability-based UI must reflect that.
- Adam requested a fresh desktop-app design on 2026-10-01: preserve the palette and identity, independently of the website's composition. Prioritize Windows, minimal copy, recognizable buttons/switches/fields and restrained functional icons/motion. Functional outlines, input frames and filled selected controls are authorized in this app; decorative cards and new gray surfaces are still excluded. Do not bring back slogans, website navigation or hardware-development explanations around the editor.
- English is the default in the website and app, with a persistent EN/CZ switch (authorized on 2026-10-04). Technical language stays clear and factual.
- The approved website revision uses three pages: Home (`index.html`), Pad (`pad.html`), and App (`app.html`). Keep the home concise, navigation direct, and both colourways equally considered. Prioritize phone layouts and keep the main action near the introduction. No visitor-facing GitHub links; the Windows installer is served from the site's own downloads path.
- Restrained scroll-linked product and signature-Q motion is authorized. Preserve Q geometry, avoid scroll interception, and provide a static reduced-motion version.
- SVGs used as CSS masks must have a transparent background. `signature-q-mask.svg` preserves the approved Q paths without the manual's page background. Check masks and motion in WebKit as well as Chromium, including phone viewports and reduced motion.
- Safari phone motion uses native CSS scroll timelines with transform-only keyframes. Keep the mask on a static child and avoid per-scroll JavaScript writes, layout reads and product drop-shadow filters. Browsers without scroll timelines get a single entrance animation. The home also contains concise read-only key/action examples and a Windows-app preview (authorized on 2026-10-05); detail stays on Pad and App. Keep those home examples typographic, without imitation keycaps (Adam's correction on 2026-10-05). Preserve the original light app-preview treatment. Define the dark app window separately with an external outline and shadow, without changing image dimensions; use a lossless 2× screenshot of the actual Configurator.
- Keep it dependency-free unless a concrete feature justifies a dependency.
- Preserve keyboard accessibility, visible focus, reduced-motion support and mobile layout.
- Before delivery run `npm run check`, `npm run build`, and browser QA of colorways, profile examples and theme links. Check narrow screens for overflow.
- For configurator changes also run `npm test` and verify editing, storage, import/export and mock connect/disconnect in the browser. Preserve local drafts if an import or device write fails.
- Do not publish to a public website unless Adam requests it. GitHub repository creation and committing the concept are authorized by the initial request.
