function managedItem(key) { return state.formSections.flatMap(s=>s.items).find(item=>item.key===key); }
function categoriesScreen() {
  return mainShell({title:'Kategorie a objekty',active:'settings',classes:'content--tight',content:`
    <section class="info-card"><div class="row">${svg('ruleOutline')}<h3>Seznam pro nové kontroly</h3></div><p>Všechny kategorie a objekty lze přidat, vypnout, upravit nebo smazat. Změny platí jen pro nové kontroly; existující kontroly používají svůj neměnný otisk.</p><p class="small">Verze 2.3.0${state.categoryVersion?'-admin-'+state.categoryVersion:''}</p></section>
    <div class="two-columns"><button class="button" data-action="add-category">${svg('addFolderOutline')}Přidat kategorii</button><button class="button" data-action="add-item">${svg('addTaskOutline')}Přidat objekt</button></div>
    <div class="two-columns"><button class="button button--outlined button--small" data-action="template-export">${svg('uploadOutline')}Export šablony</button><button class="button button--outlined button--small" data-action="template-import">${svg('downloadOutline')}Import šablony</button></div>
    ${state.formSections.map((section,index)=>`<section class="category-block" data-category="${section.key}" aria-label="${escapeHtml(section.title)}">
      <div class="outlined-card category-heading"><div class="row">${svg('folderOutline')}<div class="flex-1"><h3>${escapeHtml(section.title)}</h3><p class="tiny">${section.page}. strana PDF · ${section.items.length} objektů</p></div><input class="switch" type="checkbox" data-category-toggle="${section.key}" aria-label="Zapnout kategorii ${escapeHtml(section.title)}" ${section.enabled?'checked':''}/></div>
      <div class="order-actions"><button class="icon-button" data-action="move-category" data-key="${section.key}" data-direction="-1" aria-label="Posunout kategorii nahoru" ${index===0?'disabled':''}>${svg('up')}</button><button class="icon-button" data-action="move-category" data-key="${section.key}" data-direction="1" aria-label="Posunout kategorii dolů" ${index===state.formSections.length-1?'disabled':''}>${svg('down')}</button><button class="button button--text" data-action="edit-category" data-key="${section.key}">${svg('penOutline')}Upravit</button><button class="icon-button text-danger" data-action="remove-category" data-key="${section.key}" aria-label="Smazat kategorii">${svg('trashOutline')}</button></div></div>
      ${section.items.map(item=>{
        const siblings=section.items.filter(i=>i.page===item.page),position=siblings.findIndex(i=>i.key===item.key);
        return `<article class="outlined-card managed-item" data-managed-item="${item.key}"><div class="list-row">${svg(item.icon||'buildingOutline')}<div class="flex-1"><h3>${escapeHtml(item.label)}</h3><p class="supporting">${section.enabled&&item.enabled?'Zobrazeno v nových kontrolách':'Vypnuto v nových kontrolách'}</p></div><input class="switch" type="checkbox" data-item-toggle="${item.key}" aria-label="Zapnout objekt ${escapeHtml(item.label)}" ${item.enabled?'checked':''}/></div><hr class="divider"/>
        <div class="transfer-row"><button class="button button--text" data-action="transfer-item" data-key="${item.key}">Přesunout do kategorie</button></div>
        <div class="order-actions"><button class="icon-button" data-action="move-item" data-key="${item.key}" data-direction="-1" aria-label="Posunout objekt nahoru" ${position===0?'disabled':''}>${svg('up')}</button><button class="icon-button" data-action="move-item" data-key="${item.key}" data-direction="1" aria-label="Posunout objekt dolů" ${position===siblings.length-1?'disabled':''}>${svg('down')}</button><button class="button button--text" data-action="edit-item" data-key="${item.key}">${svg('penOutline')}Upravit</button><button class="icon-button text-danger" data-action="remove-item" data-key="${item.key}" aria-label="Smazat objekt">${svg('trashOutline')}</button></div></article>`;
      }).join('')}</section>`).join('')}
    ${state.trash.length?'<h3>Koš kategorií a objektů</h3>'+state.trash.map((entry,index)=>'<div class="outlined-card list-row"><span class="flex-1">'+escapeHtml(entry.data.title||entry.data.label)+'</span><button class="button button--text" data-action="restore-template" data-index="'+index+'">Obnovit</button></div>').join(''):''}`});
}
function photoSettingsScreen() {
  return mainShell({title:'Fotografie',active:'settings',classes:'settings-content',content:`
    ${sectionHeader('Fotografie','Ukládání do galerie','Volitelná kopie pro snadné otevření mimo DSO. Interní originál a auditní kopie aplikace zůstávají beze změny.')}
    <label class="outlined-card list-row">${svg('imageOutline')}<span class="flex-1"><strong>Ukládat upravené fotografie do galerie</strong><span class="supporting" style="display:block">Po potvrzení upravené fotografie z fotoaparátu se uloží také kopie do alba DSO v galerii telefonu. Fotografie vybrané z galerie se znovu nekopírují.</span></span><input class="switch" data-gallery-setting type="checkbox" aria-label="Ukládat upravené fotografie do galerie" ${state.galleryEnabled?'checked':''}/></label>
    <p class="small muted">Veřejná kopie v galerii může být viditelná jiným aplikacím nebo zahrnutá do automatického zálohování telefonu. Výchozí nastavení je vypnuté. Vypnutí nesmaže již uložené kopie.</p>`});
}
const sectionTiles={
  outside_information:['Informace vně','numberplates'],inside_information:['Informace uvnitř','roomOutline'],
  outside_inspection:['Venkovní obhlídka','buildingOutline'],waste:['Popelnice','trashOutline'],
  common_areas:['Společné prostory','stairsOutline'],yard:['Dvůr a zahrádka','yardOutline'],
  lighting:['Osvětlení','lightOutline'],other:['Ostatní','note'],meters:['Měřidla','meterOutline'],
};
function itemComplete(item,inspection=state) {
  return item.fields.every(f=>f.key==='name'||String(inspection.answers[item.key+':'+f.key]||'').trim());
}
function answerTone(field,value) {
  if(value==='Kotelna není v domě')return 'neutral';
  if(field.key==='defect')return value==='Ano'?'error':'good';
  return /^(Ne$|Není$|Nefunkční|Některá|Nejsou$|Poškozen|Neudržovan|Odložený|Otevřené)/.test(value)?'error':'good';
}
function inspectionStats(inspection=state) {
  const items=inspection.inspectionSections.filter(s=>s.enabled).flatMap(s=>s.items.filter(i=>i.enabled));
  return {total:items.length,completed:items.filter(i=>itemComplete(i,inspection)).length,defects:items.filter(i=>i.fields.some(f=>f.type==='choice'&&answerTone(f,inspection.answers[i.key+':'+f.key]||'')==='error')).length};
}
function inspectionField(item,field) {
  const key=item.key+':'+field.key,value=state.answers[key]||'';
  if(field.type==='choice')return '<fieldset class="answer-field"><legend>'+escapeHtml(field.label)+'</legend><div class="answer-row">'+field.options.map(option=>'<button class="answer '+(value===option?'is-selected':'')+'" aria-pressed="'+(value===option)+'" data-answer="'+key+'" data-tone="'+answerTone(field,option)+'" data-value="'+escapeHtml(option)+'">'+(value===option?svg(answerTone(field,option)==='error'?'error':'check','icon icon--small'):'')+escapeHtml(option)+'</button>').join('')+'</div></fieldset>';
  return outlinedField('field-'+item.key+'-'+field.key,field.label,value,'data-field="'+key+'" maxlength="160" autocomplete="off" autocapitalize="'+(item.meter?'characters':item.key.startsWith('waste.')?'none':'sentences')+'"',{type:field.type==='date'?'date':'text',multiline:item.key.startsWith('other.')});
}
function savedPhotoRow(photo) {
  return `<article class="saved-photo" data-photo-card="${photo.id}"><button class="photo-thumbnail" data-action="edit-photo" data-key="${photo.id}" aria-label="Upravit fotografii ${photo.id}"><img src="${photo.src}" alt="Ilustrační fotografie ${photo.id}" loading="lazy"/><span class="flex-1"><strong>${photo.id}</strong><span class="photo-caption" style="display:block">${escapeHtml(photo.description)||'Bez popisu'}</span><span class="tiny">Klepnutím otevřete a přiblížíte</span></span></button><button class="icon-button" data-action="remove-photo" data-key="${photo.id}" aria-label="Odstranit fotografii ${photo.id}">${svg('trashOutline')}</button></article>`;
}
function inspectionItem(item) {
  const photos=state.photos.filter(p=>p.itemKey===item.key),note=state.notes[item.key]||'';
  const hasData=item.fields.some(f=>state.answers[item.key+':'+f.key])||note;
  return futureCard(`<div class="card-pad stack" data-inspection-item="${item.key}"><div class="row"><h3 class="flex-1">${escapeHtml(item.label)}</h3>${hasData?'<button class="icon-button" data-action="reset-item" data-key="'+item.key+'" aria-label="Vymazat odpověď">'+svg('undo')+'</button>':''}</div>
    ${item.help?'<p class="small muted">'+escapeHtml(item.help)+'</p>':''}
    ${item.fields.map(f=>inspectionField(item,f)).join('')}
    ${item.meter?'<button class="button button--tonal button--wide" data-action="scan-meter" data-key="'+item.key+'">'+svg('scan')+'Načíst číslo a odečet čtečkou</button>':''}
    ${!item.key.startsWith('other.')?outlinedField('note-'+item.key,item.detail||'Poznámka',note,'data-note="'+item.key+'" maxlength="140" autocapitalize="sentences"',{multiline:true,trailing:'<button class="icon-button field-trailing" data-action="dictation" aria-label="Diktovat poznámku">'+svg('mic')+'</button>',support:note.length+'/140 znaků včetně mezer'}):''}
    <button class="button button--wide" data-action="add-photo" data-key="${item.key}">${svg('cameraOutline')}Přidat fotografii</button>
    ${photos.length?'<h3 style="font-size:14px;line-height:20px">Uložené fotografie</h3>'+photos.map(savedPhotoRow).join(''):''}</div>`,{tone:'outline'});
}
function currentInspectionScreen() {
  const sections=state.inspectionSections.filter(s=>s.enabled),stats=inspectionStats();
  const b=demo.buildings.find(b=>b.id===state.buildingId)||demo.buildings[0];
  const actions='<button class="icon-button" data-action="all-photos" aria-label="Všechny fotografie" '+(!state.photos.length?'disabled':'')+'>'+svg('imageOutline')+'</button><span class="saved-status">'+svg('check')+'Uloženo</span>';
  const header=topBar(b.street+' '+b.number,stats.completed+'/'+stats.total+' hotovo · '+stats.defects+' závad · '+state.photos.length+' foto',{back:true,theme:false,actions});
  const date=state.inspectionDate.split('-').reverse().map(Number).join('. ');
  const overview=`<div class="date-time"><button class="button button--outlined" data-action="inspection-date">${svg('date')}Datum kontroly: ${date}</button><button class="button button--outlined" data-action="inspection-time">${svg('clock')}Čas kontroly: ${state.inspectionTime}</button></div>
    <div class="stack inspection-overview">${sectionHeader('Průběh kontroly','Rychlá navigace','Vyberte část kontroly nebo videodokumentaci. Zpět se vrátíte do tohoto přehledu.')}
    <div class="menu-grid">${sections.map(s=>{const tile=sectionTiles[s.key]||[s.title,s.icon||'checklist'];return menuTile(tile[0],tile[1],'data-action="open-section" data-key="'+s.key+'"',s.items.filter(i=>i.enabled&&!itemComplete(i)).length);}).join('')}
    ${menuTile('Video dokumentace','videoOutline','data-action="video"')}</div></div>`;
  const form=sections.map(s=>{
    const items=s.items.filter(i=>i.enabled),done=items.filter(i=>itemComplete(i)).length,open=state.activeSection===s.key;
    return `<section class="inspection-section" data-inspection-section="${s.key}">${futureCard('<span>'+escapeHtml(s.title)+'</span>'+pill(done+'/'+items.length,done===items.length?'tertiary':'primary',done===items.length?'check':'clock')+svg(open?'up':'down'),{button:true,tone:done===items.length?'tertiary':'primary',attrs:'data-action="toggle-section" data-key="'+s.key+'" aria-expanded="'+open+'"',classes:'section-toggle'})}
      ${open?'<div class="stack section-body">'+items.map(inspectionItem).join('')+'</div>':''}</section>`;
  }).join('');
  return `<section class="screen" data-screen="inspection" data-overview="${state.inspectionOverview}">${header}<main class="scroll"><div class="content inspection-content">${state.inspectionOverview?overview:form}</div></main>
    ${state.inspectionOverview?'':'<footer class="inspection-footer"><div class="progress"><span style="--progress:'+stats.completed/Math.max(1,stats.total)*100+'%"></span></div><button class="button button--wide" data-action="finish-demo"><span>Dokončit kontrolu</span><small>'+Math.max(0,stats.total-stats.completed)+' položek není hotových</small></button></footer>'}</section>`;
}
function photoListScreen() {
  const photos=state.photoItemKey?state.photos.filter(p=>p.itemKey===state.photoItemKey):state.photos;
  return '<section class="screen" data-screen="photos">'+topBar('Fotografie','Fotodokumentace kontroly',{back:true,theme:false})+'<main class="scroll"><div class="content">'+photos.map(savedPhotoRow).join('')+'</div></main></section>';
}
function photoSourceScreen() {
  return '<section class="screen" data-screen="photo-source">'+topBar('Fotografie','Přidání fotodokumentace',{back:true,theme:false})+'<main class="scroll"><div class="content"><p>Vyberte způsob přidání fotografie.</p><button class="button button--wide" data-action="new-photo">'+svg('cameraOutline')+'Vyfotit</button><button class="button button--outlined button--wide" data-action="new-photo">'+svg('imageOutline')+'Vybrat více z telefonu</button></div></main></section>';
}
function photoMarks(photo) {
  const strokes=(photo.strokes||[]).map(points=>'<polyline points="'+points.map(p=>Number(p[0]).toFixed(2)+','+Number(p[1]).toFixed(2)).join(' ')+'" fill="none" stroke="#ff3b30" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  return (photo.marked?'<ellipse cx="63" cy="47" rx="15" ry="15" fill="none" stroke="#ff3b30" stroke-width="1.2"/>':'')+strokes;
}
function photoEditorScreen() {
  const photo=state.photoDraft;
  if(!photo)return photoListScreen();
  const existing=state.photos.some(p=>p.id===photo.id);
  return `<section class="screen" data-screen="photo-edit">${topBar(existing?'Kontrola fotografie '+photo.id:'Úprava fotografie','Originál zůstává vždy zachovaný',{back:true,theme:false})}
    <main class="photo-editor"><div class="photo-stage"><img src="${photo.src}" alt="Ilustrační snímek pro úpravu" style="transform:rotate(${photo.rotation||0}deg)"/><svg data-photo-canvas viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Označení fotografie">${photoMarks(photo)}</svg></div>
    <div class="photo-controls"><div class="photo-toolbar"><button class="filter-chip ${state.photoDrawing?'is-selected':''}" data-action="photo-mark">${svg('penOutline','icon icon--small')}${state.photoDrawing?'Tužka zapnutá':'Tužka'}</button><span class="tiny muted">${state.photoDrawing?'Kreslete jedním prstem · '+(photo.strokes?.length||0)+'/30 tahů':'Dvěma prsty přibližte a posuňte'}</span><button class="icon-button" data-action="photo-undo" aria-label="Zpět tah" ${photo.strokes?.length?'':'disabled'}>${svg('undo')}</button><button class="icon-button" data-action="photo-clear" aria-label="Smazat označení">${svg('trashOutline')}</button></div>
    ${outlinedField('photo-description','Popis fotografie',photo.description,'data-photo-description maxlength="1000"',{multiline:true})}
    <button class="button button--outlined" data-action="photo-rotate">${svg('rotate')}Otočit</button>
    <div class="two-columns photo-actions"><button class="button button--outlined" data-action="cancel-photo">${svg(existing?'back':'trashOutline')}${existing?'Zrušit':'Zahodit'}</button><button class="button" data-action="save-photo">${svg('tick')}${existing?'Uložit změny':'Použít'}</button></div></div></main></section>`;
}
