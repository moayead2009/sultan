# Source Profile Asset Register

Date: 2026-09-19

## Source integrity

Phase 2 source imagery was extracted from the approved V2 company-profile sources. No full PDF page is used as a website graphic, and no AI-generated replacement or AI upscaling is used.

- `Solutions-Gate-Company-Profile-English-2026.pdf`
  - SHA-256: `ddd8885a4a37bb93f10265edfb169062392425d4638745c990eaa4e638e4f986`
- `Solutions-Gate-Company-Profile-Arabic-2026.pdf`
  - SHA-256: `9681c28c0ce091f7e8bbdc7dd75f81c0cd81d2f1d893fe88774c0c9d4f063533`

The English source contains separable embedded raster imagery suitable for clean extraction. Embedded CMYK raster assets were normalized to sRGB and optimized to WebP/AVIF production derivatives. The Arabic source was visually checked for equivalent brand/content context; it is not used as a source of full-page screenshots.

## Imported CMS-manageable assets

| Repository asset | Source page | Web derivative | SHA-256 | Intended CMS use |
| --- | ---: | --- | --- | --- |
| `public/uploads/source-profile/logo-mark.webp` | EN p.1 | 315×260 WebP | `3759b38dd1fb47b6c278a3466a0179122b481304e688292fa3ea476c76675564` | Primary/alternate logo, favicon |
| `public/uploads/source-profile/event-hero.avif` | EN p.2 | 500×396 AVIF | `740213d76746ba622b6b0abed5d3de33b2d22a1eac3f5c0a43c0541ac03bbfab` | Home/About/Services/Contact hero/intro, default OG |
| `public/uploads/source-profile/promotional-gifts.avif` | EN p.6 | 420×339 AVIF | `7610bdcd06261c206dffa35ec3c891bf9fce447a0438873b309193885e3d3aa3` | Promotional Gifts service |
| `public/uploads/source-profile/uniforms.avif` | EN p.7 | 420×342 AVIF | `91017d327e26f8551871736d6d78090b991c327a0c8729e77a5195aa1ba10928` | Uniforms service |
| `public/uploads/source-profile/signage-wayfinding.avif` | EN p.8 | 420×332 AVIF | `1b5c5d682320c936ca70e0f0acdf624896d39e7122d7423c327d03ded822d1f3` | Signage service and suitable company/clients-page intro visual |
| `public/uploads/source-profile/print-digital.avif` | EN p.9 | 420×336 AVIF | `ab4f4b8e509a0c46285f19e1ea274bda2df150ca11635afe5eef9310eb2e2684` | Print & Digital service, identity/value visual |
| `public/uploads/source-profile/technology-immersive.avif` | EN p.11 | 386×420 AVIF | `13d735c36417ff708175e8257588bb1d47a8d769cf47611a904afb938e03416c` | Interactive technology service and technology sections |
| `public/uploads/source-profile/theater-hall.avif` | EN p.13 | 420×273 AVIF | `e2ec9c2dd307d8e898ce26974f56eef07330295fa1880d5f21e3ebdfd2c7cb4c` | Conference management/capabilities/theater gallery |
| `public/uploads/source-profile/theater-stage.avif` | EN p.13 | 420×266 AVIF | `60cea52dc3234b521a00c746db12d36ebcca6e62f9b966d67d820f53d9f43a97` | Theater/opening/project-index hero/theater gallery |
| `public/uploads/source-profile/leadership-sultan.avif` | EN p.18 | 420×420 AVIF | `fef6b483397d4775b2c15c013092c7910254c87640d630f4be95eb23f381a0a9` | Executive leadership record |

Every imported file is seeded as a `MediaAsset`, receives separately authored EN/AR alt text and source provenance captions, and is attached through canonical CMS relations plus `MediaUsage`. Editors can replace these assets later without changing public components.

## Intentionally not published as website assets

- EN p.3 Work Cycle diagram: rebuilt as semantic HTML/CMS content.
- EN p.12 metrics layout: rebuilt as semantic HTML/CMS content; claims remain disabled pending owner reconfirmation.
- EN pp.14–15 project/work collages: tracked as source reference only. The collages visibly contain organizations/project identifiers whose exact project names/details are not source-safe enough to publish as named project records.
- EN p.16 capability table: rebuilt as semantic HTML/CMS content; unresolved English premium-tier label remains gated.
- EN p.17 strategic-client logo grid: not imported into public Client records. Individual identity/spelling/public-display approval remains explicitly gated.
- EN p.19 contact cards: rebuilt as semantic contact data/UI.

This register implements the V2 rule that useful supplied imagery is used where source-supported while uncertain client/project identities are not exposed.
