# Path network baseline

_Generated from the reference graph inputs. Not a completed survey._

Canonical inspector: `/?view=map&network=1`. Source content tags, citations and legacy trust labels do not establish traced edges or placement approval.

## Counts

- areas: 14
- inventoryCompleteAreas: 0
- sourceObservations: 59
- sourcePixelTraces: 57
- sourcePixelLocators: 32
- sources: 414
- uninspectedSources: 344
- routes: 24
- segments: 173
- tracedSides: 0
- tunnelCandidates: 11
- confirmedUniqueTunnels: unresolved
- registryOutlines: 230

## Area gaps

| Area | Sources / uninspected | Routes | Tunnel candidates | Coverage |
| --- | --- | --- | --- | --- |
| North pool | 16 / 16 | 0 | 0 | uninspected |
| Middle pool | 32 / 32 | 0 | 0 | uninspected |
| South pool | 13 / 13 | 0 | 0 | uninspected |
| Main pool | 14 / 14 | 0 | 0 | uninspected |
| Calle Elena | 75 / 36 | 2 | 2 | partial |
| Calle Miguel de Cervantes | 60 / 32 | 1 | 1 | partial |
| Calle Pintor Dalí | 38 / 38 | 3 | 0 | uninspected |
| Pintor Picasso and the car park | 3 / 3 | 2 | 0 | uninspected |
| Loira, Bolivia, Alberto and Isabel | 1 / 1 | 4 | 6 | uninspected |
| Calle Eva | 24 / 24 | 2 | 0 | uninspected |
| Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo | 121 / 121 | 6 | 2 | uninspected |
| Barraka and the beach | 50 / 50 | 1 | 0 | uninspected |
| The paseo | 57 / 57 | 4 | 0 | uninspected |
| The whole resort | 21 / 21 | 0 | 0 | uninspected |

Inspection is scoped to its named area; inspecting a shared source for Elena does not complete another area. Source-pixel traces remain separate from registered map edges. Source totals deduplicate IDs globally; area totals overlap. Unknown intervals are not traced sides. Tunnel candidates may overlap; this is not a count of unique real tunnels. All portal positions and physical widths remain unresolved.

Registry outlines retain their original rings and hashes; they are not physical wall traces. Route junctions share exact imported coordinates only; intersections, near misses and dead ends need source review. Existing model discrepancies remain in the reference graph.

## Next work

Area inventories and their correction/evidence tasks are listed in QUEUE.md. A reviewed source scope does not close registration or model gaps. Complete source accounting in data/path_network.json only after full-source inspection, linking observations and retaining unusable/duplicate reasons and revisions. Do not infer unseen geometry. See docs/PATH_NETWORK_PRD.md for later tracing, drawing, runtime and release gates.
