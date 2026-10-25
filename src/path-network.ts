import { asset } from './asset';
import type { Vec2 } from './types';

type RecordRow = {
  id: string; kind: string; name: string; areas?: string[]; axis?: Vec2[]; outline?: Vec2[];
  inventory?: {sources:string[];inventoryComplete:boolean;limits:string} | null;
  nextTask?: {id:string;url:string} | null;
  observed?: string; unknowns?: string[];
  sources?: string[]; sourceId?: string; location?: Vec2 | null;
  states?: { source: string; identity: string; model: string; placement: string; runtime: string };
  modelContext?: {id:string; placement:{status:string; blockers:string[]}; photoVerification:string}[];
  sourceCoverage?: string; nextAction?: string; [key: string]: unknown;
};
type Network = { scope: string; totals: Record<string, number | null>; records: RecordRow[] };
const NS = 'http://www.w3.org/2000/svg';
function make<K extends keyof HTMLElementTagNameMap>(tag: K, parent: Element, text = '') {
  const node = document.createElement(tag); node.textContent = text; parent.append(node); return node;
}

/** Inventory overlay in the canonical map; never used as collision or model geometry. */
export async function pathNetwork(world: SVGGElement, focus: (points: Vec2[]) => void) {
  const response = await fetch(asset('/path-network.json'));
  if (!response.ok) throw Error('Path network unavailable');
  const data = await response.json() as Network;
  const button = document.querySelector<HTMLButtonElement>('#path-network-toggle')!;
  const panel = make('section', document.querySelector('#map-page')!);
  panel.id = 'path-network'; panel.hidden = true; panel.setAttribute('aria-label', 'Path network inventory');
  const head = make('header', panel);
  make('h2', head, 'Path network');
  const close = make('button', head, 'Close'); close.type = 'button';
  make('p', panel, 'Source inventory · full resort survey remains open. Unknown edges and portals are not confirmed public routes.');
  const summary = make('p', panel);
  summary.textContent = `${data.totals.areas} areas · ${data.totals.sources} sources (${data.totals.uninspectedSources} awaiting feature inspection) · ${data.totals.tunnelCandidates} tunnel candidates (unique count unresolved)`;
  const legend = make('p', panel); legend.className = 'network-legend';
  legend.textContent = '— blue: imported route axis · - - amber: registry outline, physical boundary unresolved. Neither is a photo-traced path edge. Portals without placement have no map pin.';
  const search = make('input', panel); search.type = 'search'; search.placeholder = 'Find route, tunnel, source or gap'; search.setAttribute('aria-label', 'Search path network'); search.id = 'network-search';
  const area = make('select', panel); area.setAttribute('aria-label', 'Network area'); area.id = 'network-area';
  area.add(new Option('All areas', ''));
  const areas = data.records.filter(r => r.kind === 'path-area-coverage');
  for (const row of areas) area.add(new Option(row.name, row.areas![0]));
  const filters = make('div', panel); filters.className = 'network-filters';
  const enabled = new Map<string, HTMLInputElement>();
  for (const [kind, label, on] of [
    ['path-observation', 'Photo-traced features', true],
    ['path-evidence-gap', 'Evidence requests', true],
    ['path-route', 'Paths and edges', true], ['path-tunnel', 'Tunnels', true],
    ['path-boundary', 'Buildings / registry outlines', false],
    ['path-model-fragment', 'Walls and openings · model context', false],
    ['path-source-accounting', 'Photo coverage', false], ['path-area-coverage', 'Missing or uncertain', true],
  ] as const) {
    const container = make('label', filters), input = make('input', container);
    input.type = 'checkbox'; input.checked = on; container.append(document.createTextNode(label));
    enabled.set(kind, input); input.addEventListener('change', render);
  }
  const count = make('p', panel); count.id = 'network-count'; count.setAttribute('role', 'status');
  const results = make('div', panel); results.id = 'network-results';
  const detail = make('div', panel); detail.id = 'network-detail'; detail.setAttribute('aria-live', 'polite');
  const layer = document.createElementNS(NS, 'g'); layer.id = 'path-network-overlay'; world.append(layer);
  let selected: RecordRow | undefined;
  const highlight = document.createElementNS(NS, 'g'); world.append(highlight);
  function points(row: RecordRow) { return row.axis ?? row.outline ?? []; }
  function draw(row: RecordRow, parent: SVGGElement, selected = false) {
    const ps = points(row); if (!ps.length) return;
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('d', 'M' + ps.map(p => p.join(' ')).join('L') + (row.outline ? 'Z' : ''));
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', selected ? '#c33268' : row.outline ? '#a46610' : '#14668c');
    line.setAttribute('stroke-width', selected ? '5' : '2'); line.setAttribute('vector-effect', 'non-scaling-stroke');
    if (row.outline) line.setAttribute('stroke-dasharray', '5 4');
    if (selected) line.setAttribute('pointer-events', 'none');
    else {
      line.setAttribute('tabindex', '0'); line.setAttribute('role', 'button'); line.setAttribute('aria-label', row.name);
      line.addEventListener('pointerdown', e => e.stopPropagation());
      line.addEventListener('click', e => { e.stopPropagation(); select(row); });
      line.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(row); } });
      const title = document.createElementNS(NS, 'title'); title.textContent = row.name; line.append(title);
    }
    parent.append(line);
  }
  function select(row: RecordRow, move = true) {
    selected = row; detail.replaceChildren(); highlight.replaceChildren();
    make('h3', detail, row.name); make('code', detail, row.id);
    if (row.kind==='path-observation') make('p', detail, 'Photo-pixel observation · not registered in world metres.');
    make('p', detail, points(row).length ? 'Imported map context; physical placement remains unreviewed.' : 'Location unresolved · no defensible map pin.');
    if (row.observed) make('p', detail, row.observed);
    if (typeof row.accessObservation==='string') make('p', detail, row.accessObservation);
    if (row.sourceObservations) make('p', detail, String(row.identityNote));
    if (row.unknowns?.length) make('p', detail, 'Unresolved: '+row.unknowns.join(' '));
    if (row.states) {
      const dl = make('dl', detail);
      for (const [key, state] of Object.entries(row.states)) { make('dt', dl, key); make('dd', dl, state); }
    }
    if(row.inventory){make('p',detail,`${row.inventory.inventoryComplete?'Inventory complete for declared available sources':'Inventory review incomplete or stale'} · ${row.inventory.sources.length} source records. World placement and physical map completion remain separate.`);make('p',detail,row.inventory.limits);}
    if (row.sourceCoverage) make('p', detail, `Source coverage: ${row.sourceCoverage} · ${row.sourceCount} sources / ${row.uninspectedSources} uninspected for feature accounting.`);
    for (const model of row.modelContext ?? []) {
      make('p', detail, `Existing model ${model.id}: placement ${model.placement.status}; photo diagnostics ${model.photoVerification}.`);
      for (const blocker of model.placement.blockers) make('p', detail, blocker);
    }
    if(row.nextTask){const task=make('a',detail,'Next task: '+row.nextTask.id);task.href=row.nextTask.url;task.target='_blank';task.rel='noopener';}
    make('p', detail, row.nextAction ?? 'Inspect full sources and reconcile topology before tracing physical boundaries.');
    if (typeof row.drawing === 'string') {
      const drawing = make('a', detail, 'Compare photo → drawing → current game');
      drawing.href = asset(row.drawing); drawing.target = '_blank'; drawing.rel = 'noopener';
    }
    for (const id of row.sources ?? (row.sourceId ? [row.sourceId] : [])) {
      if (id==='map:ground') {
        const aerial=make('a', detail, 'Open georeferenced aerial'); aerial.href=asset('/map/ground.jpg'); aerial.target='_blank'; aerial.rel='noopener'; continue;
      }
      const photo = make('button', detail, 'Open source ' + id);
      photo.addEventListener('click', () => { show(false); window.dispatchEvent(new CustomEvent('reference-open', { detail: id })); });
    }
    if (points(row).length) {
      const overview = make('button', detail, 'Compare in Overview');
      overview.addEventListener('click', () => {
        const url = new URL(location.href);
        for (const key of ['photo','study','place','at','look']) url.searchParams.delete(key);
        window.history.replaceState(null, '', url);
        const p = points(row)[0];
        window.dispatchEvent(new CustomEvent('reference-selected', {detail:{id:row.id,label:row.name,point:p,camera:null}}));
        window.dispatchEvent(new CustomEvent('reference-view', {detail:'overview'}));
      });
      draw(row, highlight, true); if (move) focus(points(row));
    }
    const raw = make('details', detail); make('summary', raw, 'Full inventory record'); make('pre', raw, JSON.stringify(row, null, 2));
    panel.scrollTop = detail.offsetTop - head.offsetHeight - 12;
    const url = new URL(location.href); url.searchParams.set('feature', row.id); window.history.replaceState(null, '', url);
  }
  function render() {
    results.replaceChildren(); layer.replaceChildren();
    const terms = search.value.toLowerCase().trim().split(/\s+/);
    const rows = data.records.filter(row => enabled.get(row.kind)?.checked &&
      (!area.value || row.areas?.includes(area.value)) && terms.every(term => JSON.stringify(row).toLowerCase().includes(term)));
    count.textContent = `${rows.length} records · ${data.totals.sourcePixelTraces ?? 0} source-pixel traces · ${data.totals.tracedSides} traced path sides / ${Number(data.totals.segments) * 2} imported segment sides`;
    for (const row of rows) {
      const item = make('button', results, row.name + (row.kind === 'path-tunnel' ? ' · portals unresolved' : row.sourceCoverage ? ' · ' + row.sourceCoverage : ''));
      item.dataset.networkId = row.id; item.addEventListener('click', () => select(row)); draw(row, layer);
    }
    if (!rows.length) make('p', results, 'No records match these filters. Try another area or enable another layer.');
  }
  function show(on: boolean) {
    panel.hidden = !on; layer.style.display = on ? '' : 'none'; highlight.style.display = on ? '' : 'none';
    button.setAttribute('aria-pressed', String(on)); document.body.classList.toggle('network-open', on);
    const url = new URL(location.href); if (on) url.searchParams.set('network','1'); else url.searchParams.delete('network');
    window.history.replaceState(null, '', url);
    if (on) document.querySelector<HTMLDetailsElement>('#map-options')!.open = false;
  }
  button.addEventListener('click', () => show(panel.hidden)); close.addEventListener('click', () => show(false));
  search.addEventListener('input', render); area.addEventListener('change', render);
  const restore = () => {
    const url = new URL(location.href); show(url.searchParams.get('network') === '1');
    const row = data.records.find(r => r.id === url.searchParams.get('feature'));
    if (row && row !== selected) select(row, false);
  };
  window.addEventListener('popstate', restore);
  // Opening a source uses the existing photo panel, retaining the selected network feature.
  document.querySelector('#app-photo-toggle')!.addEventListener('click', () => show(false));
  render(); restore();
}
