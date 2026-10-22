(() => {
  const pack=JSON.parse(document.querySelector('#pack-data').textContent), rollout=JSON.parse(document.querySelector('#rollout-data').textContent);
  const features=new Map(pack.features.map(f=>[f.id,f])),sources=new Map(pack.sources.map(s=>[s.id,s]));
  const colors={A:'#e29d25',B:'#1a8c93',T:'#be4869',J:'#765db1'};
  let source=pack.sources[0],selected=pack.features[0],filter='all';
  const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const readable=s=>s.replaceAll('-',' ');
  function view(id){for(const node of document.querySelectorAll('.view'))node.hidden=node.id!==id;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===id));}
  function detail(){
    const f=selected,box=$('#feature-detail');box.replaceChildren(el('div',f.id+' / SOURCE GROUP '+f.scene,'id'),el('h2',f.name),el('span',readable(f.modelStatus),'status '+f.modelStatus),el('p',f.observed),el('strong','Still unknown'),el('p',f.unknown),el('small','Follow-up: '+f.followUp));
    for(const id of f.evidence){const b=el('button','Inspect '+id);b.onclick=()=>choose(f.id,id);box.append(b);}
    const copy=el('button','Copy component reference');copy.className='copy-reference';copy.onclick=async()=>{const reference={pack:pack.id,feature:f,sources:pack.sources.filter(s=>f.evidence.includes(s.id)).map(s=>({id:s.id,path:s.path,sha256:s.sha256,width:s.width,height:s.height,locators:s.observations.filter(o=>o.feature===f.id)})),placementStatus:'unapproved'};const text=JSON.stringify(reference,null,2);try{await navigator.clipboard.writeText(text);copy.textContent='Component reference copied';}catch{const fallback=el('textarea');fallback.value=text;fallback.readOnly=true;fallback.setAttribute('aria-label','Component reference for manual copying');box.append(fallback);fallback.select();}};box.append(copy);
  }
  function choose(id,sourceId){selected=features.get(id);if(sourceId)source=sources.get(sourceId);else if(!source.observations.some(o=>o.feature===id))source=sources.get(selected.evidence[0]);render();history.replaceState(null,'','#feature='+id+'&source='+encodeURIComponent(source.id));}
  function render(){
    $('#source-title').textContent=source.scene+' / '+source.title+' · '+source.id;$('#source-note').textContent=source.note;
    $('#source-original').href='../../photos-ref/'+source.id;$('#map-link').href='../../?view=map&photo='+encodeURIComponent(source.id);
    for(const b of document.querySelectorAll('[data-source]'))b.setAttribute('aria-pressed',String(b.dataset.source===source.id));
    const canvas=svg('svg',{viewBox:`0 0 ${source.width} ${source.height}`,role:'img','aria-label':'Numbered source annotation for '+source.id});
    canvas.append(svg('rect',{width:source.width,height:source.height,fill:'#fbfaf6'}),svg('image',{href:'../../photos-ref/'+source.id,width:source.width,height:source.height,class:'source-photo'}));
    for(const o of source.observations){
      const f=features.get(o.feature),c=colors[f.scene]||'#135e56',[x1,y1,x2,y2]=o.bbox,[x,y]=o.label;
      const g=svg('g',{'data-feature':f.id,class:'annotation'+(selected.id===f.id?' selected':''),role:'button',tabindex:0,'aria-label':f.id+' '+f.name});
      g.append(svg('title',{}));g.firstChild.textContent=f.name;
      g.append(svg('rect',{x:x1,y:y1,width:x2-x1,height:y2-y1,fill:'none',stroke:c,'stroke-width':4,'stroke-dasharray':'12 8',class:'locator'}));
      if(o.polyline)g.append(svg('polyline',{points:o.polyline.map(p=>p.join(',')).join(' '),fill:'none',stroke:c,'stroke-width':6,class:'source-trace'}));
      g.append(svg('rect',{x:x-35,y:y-23,width:70,height:46,rx:12,fill:c,stroke:'white','stroke-width':3}));
      const t=svg('text',{x,y:y+11,'text-anchor':'middle','font-family':'sans-serif','font-weight':'bold','font-size':29,fill:'white'});t.textContent=f.id;g.append(t);
      g.onclick=()=>choose(f.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(f.id);}};canvas.append(g);
    }
    $('#photo-svg').replaceChildren(canvas);detail();const list=$('#feature-buttons');list.replaceChildren();
    for(const f of pack.features.filter(f=>filter==='all'||f.modelStatus===filter)){const b=el('button');b.dataset.feature=f.id;b.append(el('span',f.id),document.createTextNode(f.name));b.setAttribute('aria-pressed',String(f.id===selected.id));b.onclick=()=>choose(f.id);list.append(b);}
  }
  $('#scope').textContent=pack.scope;
  $('#diagram-warning').textContent=pack.diagramNotes||'Author source-specific drawings before geometry. Missing diagrams remain marked pending; no dimensions or hidden connections are inferred.';
  $('#scene-summary').textContent='Source groups '+[...new Set(pack.features.map(f=>f.scene))].join(', ')+' remain distinct until their physical relationships are established.';
  for(const text of [pack.sources.length+' inspected source sheets',pack.features.length+' numbered components',pack.areas.length+' areas partially covered','Placement unapproved'])$('#metrics').append(el('strong',text));
  for(const s of pack.sources){const b=el('button',s.scene+' / '+s.id.replace('.jpg',''));b.dataset.source=s.id;b.onclick=()=>{source=s;selected=features.get(s.observations[0].feature);render();};$('#source-tabs').append(b);}
  for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
  $('#trace-toggle').onclick=e=>{const active=$('.photo-board').classList.toggle('trace-mode');e.target.setAttribute('aria-pressed',String(active));e.target.textContent=active?'Show source photo':'Trace only';};
  $('#labels-toggle').onclick=e=>{const hidden=$('.photo-board').classList.toggle('labels-off');e.target.setAttribute('aria-pressed',String(!hidden));e.target.textContent=hidden?'Labels off':'Labels on';};
  $('#status-filter').onchange=e=>{filter=e.target.value;render();};
  if(pack.modelSnapshot){$('#game-image').src=pack.modelSnapshot.image;$('#model-link').href=pack.modelSnapshot.url;$('#model-snapshot-note').textContent='Draft snapshot '+pack.modelSnapshot.revision.slice(0,7)+'. Camera differs from the source; this is not a calibrated match.';}else{$('#game-image').closest('details').hidden=true;}
  $('#rollout-summary').textContent=rollout.annotatedSources+' distinct sources have numbered annotations. Every area still needs a complete inventory; source annotation does not complete an area.';
  for(const f of pack.features){const tr=el('tr');tr.dataset.feature=f.id;tr.tabIndex=0;for(const v of [f.id,f.name,f.observed,readable(f.modelStatus),f.unknown])tr.append(el('td',v));tr.onclick=()=>{choose(f.id);view('photo');};tr.onkeydown=e=>{if(e.key==='Enter'){choose(f.id);view('photo');}};$('#checklist-body').append(tr);}
  for(const value of pack.criticalChecks)$('#critical-checks').append(el('li',value));for(const value of pack.exclusions)$('#exclusions').append(el('li',value));
  const table=el('table'),head=el('thead'),row=el('tr');for(const v of ['Wave','Area','References','Pilot sources','State'])row.append(el('th',v));head.append(row);table.append(head);const body=el('tbody');for(const a of rollout.areas){const r=el('tr');for(const v of [a.wave,a.name,a.references,a.annotatedSources.length,a.status])r.append(el('td',v));body.append(r);}table.append(body);$('#rollout-table').append(table);
  const hash=new URLSearchParams(location.hash.slice(1));if(features.has(hash.get('feature'))){selected=features.get(hash.get('feature'));source=sources.get(hash.get('source'))||sources.get(selected.evidence[0]);}render();
})();
