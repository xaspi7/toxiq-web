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
- The separately requested configurator lives in `configurator/`: React + TypeScript and an Electron shell. Keep the product profile section read-only. v0.4 includes the real USB CDC adapter and matching firmware in `firmware/`. Only native desktop uses USB; the browser remains explicitly a mock demo. Call a device connected only after protocol handshake and validated read; report successful writes only after flash acknowledgement and independent readback. Hardware testing on Adam's physical V0 remains separate from compilation/simulated tests. V0 has two buttons and no underglow; capability-based UI must reflect that.
- Adam requested a fresh desktop-app design on 2026-10-01: preserve the palette and identity, independently of the website's composition. Prioritize Windows, minimal copy, recognizable buttons/switches/fields and restrained functional icons/motion. Functional outlines, input frames and filled selected controls are authorized in this app; decorative cards and new gray surfaces are still excluded. Do not bring back slogans, website navigation or hardware-development explanations around the editor.
- Czech explanatory copy; English gamer headlines. Technical language stays clear and factual.
- Keep it dependency-free unless a concrete feature justifies a dependency.
- Preserve keyboard accessibility, visible focus, reduced-motion support and mobile layout.
- Before delivery run `npm run check`, `npm run build`, and browser QA of colorways, profile examples and theme links. Check narrow screens for overflow.
- For configurator changes also run `npm test` and verify editing, storage, import/export and mock connect/disconnect in the browser. Preserve local drafts if an import or device write fails.
- Do not publish to a public website unless Adam requests it. GitHub repository creation and committing the concept are authorized by the initial request.
