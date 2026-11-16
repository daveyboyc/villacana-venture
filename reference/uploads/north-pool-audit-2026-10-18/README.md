# North-pool private comparison artifacts — 18 October 2026

Public baseline e043c0e; private baseline b134735. See the [public audit report](https://github.com/daveyboyc/villacana-venture/blob/task/north-pool-alignment-audit/docs/reviews/north-pool-alignment-audit/README.md) for methods, measurements and source limits.

- Open `index.html` locally for map overlays; each PNG can also be inspected on GitHub.
- Open `photo-comparisons.html` with both repos checked out as siblings for source/render pairs. Every photographic comparison is `not-comparable`; the captured cameras are uncalibrated.
- `esri-context.png` and `esri-courtyard.png`: unchanged georeferenced Esri source with projected registry plans, pool, roof projections and street/path lines.
- `google-satellite-overlay.png`: one global similarity, no local warping; C controls and V held-out checks.
- `esri-landmarks.png` and `google-landmarks.png`: distributed control and validation locations across the site. Surrounding landmarks are context only.
- `measurements.json`: reproducible measured results and hashes of sources actually used.

Independent actual-image review accepted broad alignment and no geometry move. It rejected two initial pool picks on deck/rim blur; final points are tentative transitions, not proof of water-edge agreement. Source registration RMS0.69m fitted /1.92m held out is not absolute map accuracy. No hidden ground divisions or widths are certified.

Contact sheets were regenerated after correcting IMG2202's subject: the private36/34 entry is in Elena, distinct from IMG2363's lawn gateway. Reference pixels and derived overlays remain in this private repo, under uploads/ so they are not mistaken for new source references by the public catalogue generator.
