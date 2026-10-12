# Paseo, beach, sea and Barraka outline pass

Checked online on 2026-10-12:

- [Barraka Beach official website and gallery](https://barrakabeach.com/): thatched-roof restaurant, red/burgundy awnings, shaded dining terrace, and loungers with straw parasols on sand. The virtual-tour position marks the outdoor seating area, not the building centre.
- [Estepona tourism](https://turismo.estepona.es/lugares/barraka-beach/): identifies Barraka on Villacana beach, accessed from Calle Fragata.
- [OpenStreetMap Senda Litoral](https://www.openstreetmap.org/way/1136517334), joined to [the eastern connector](https://www.openstreetmap.org/way/1156611374): the paseo route behind the restaurant and along the resort frontage. The existing project OSM extract supplies the geometry.

The restaurant roof matches Catastro building `6364501UF1366S_part8` on the existing georeferenced Esri aerial. Its surveyed footprint is reused verbatim; no duplicate building is added. The location is different from the OSM restaurant point, which sits in the outdoor seating area. The terrace outline is approximate, informed by that aerial comparison and official exterior photos.

The beach polygon and coastline come from the existing OSM map. A separate view extent frames the local frontage without introducing artificial edges into the sand or water. Shorelines change with season and survey date. The sea's outer rectangle is a display boundary, not a mapped natural feature. The local beach label is Villacana beach; the larger OSM polygon is tagged Playa de Guadalmansa and extends beyond this frontage.

`scripts/build_seafront.py` builds `skeleton.seafront`, shared by the blueprint and main-pool walk. The blueprint adds labelled outlines and a Seafront toggle; Whole block includes the sand and a strip of sea. The Seafront link (`slice.html?pool=main&view=seafront`) starts on a safe mapped paseo point with a wider view toward the restaurant and beach. The main-pool view replaces the former uniform ten-metre sand band with the mapped beach polygon and adds the paseo, restaurant roof and terrace outline.

The existing registry building count, pool outlines, props, and ground classification are preserved. The source photos remain reference material, not public assets.
