# Catastro extract

Building footprints, building parts (with floors above ground), open-air pools and addresses (street names)
around Villacana, from the Spanish land registry's INSPIRE service.
Source: Dirección General del Catastro. Coordinates are EPSG:25830 (UTM zone 30N).
Downloaded 2026-10-11.

To refresh, for each of `BU.BUILDING`, `BU.BUILDINGPART`, `BU.OTHERCONSTRUCTION`:

```bash
curl -A "Mozilla/5.0" -o out.gml \
  "http://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx?service=wfs&version=2&request=getfeature&typenames=BU.BUILDINGPART&SRSname=EPSG::25830&bbox=315975,4036132,316498,4036676"
```

The service rejects requests without a browser user agent.

Addresses come from the sibling service, `wfsAD.aspx` with `typenames=AD.ADDRESS` and the same bounding box.
The box is wider than Villacana: it holds 40 pools, of which 5 are inside the Villacana block
(three small, the main pool, and the toddler pool beside it).
