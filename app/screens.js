function loginScreen() {
  return `<section class="screen" data-screen="login">${topBar('Přihlášení',DESIGN_EDITION,{logout:false,theme:false})}<main class="scroll"><div class="content login-content">
    ${brandPanel({title:'Vítejte zpět',supporting:'Vyberte svůj účet. Kontroly i dokumenty zůstávají bezpečně v tomto telefonu.',status:'Offline provoz'})}
    <h2 style="font-size:22px;line-height:28px">Technici</h2>
    ${futureCard(`<div class="card-pad"><span class="icon-surface">${svg('badge')}</span><div class="flex-1"><h3>${demo.technician.name}</h3><p>Technik</p></div>${svg('lock')}</div>`,{tone:'secondary',button:true,attrs:'data-action="open-login" data-testid="technician-card"',classes:'account-card'})}
  </div></main></section>`;
}
function dashboardHero() {
  return `<section class="brand-panel"><svg class="brand-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M58 22V90M70 10V90M82 28V90M7 90H93"/></svg>
    <div class="brand-row"><img class="brand-icon" src="../assets/app-icon.svg" alt="Ikona DSO"/><div class="brand-copy"><p class="eyebrow">${DESIGN_EDITION}</p><h1>Digitální Správa Objektů</h1><p>${demo.technician.name} · Technik</p></div></div>
    ${pill('1 rozpracovaná','primary','drafts')}</section>`;
}
function draftSummary() {
  const draft = state.inspectionId === 'draft' ? state : savedInspections.get('draft');
  const stats = inspectionStats(draft);
  return {...demo.draft,completed:stats.completed,total:stats.total,photos:draft.photos.length,defects:stats.defects};
}
function dashboardTile({route,title,supporting,badge,iconName,tone,badgeTone=tone}) {
  return futureCard(`<div class="card-pad"><div class="row row--between row--top"><span class="icon-surface" style="--icon-color:var(--${tone})">${svg(iconName)}</span>${badge!=null ? pill(String(badge),badgeTone) : ''}</div><div><div class="row row--between"><h3>${title}</h3>${svg('arrow')}</div><p class="supporting">${supporting}</p></div></div>`,{tone,button:true,attrs:`data-route="${route}"`,classes:'dashboard-tile'});
}
function dashboardScreen() {
  const d = draftSummary();
  return `<section class="screen" data-screen="dashboard">${topBar('DSO',DESIGN_EDITION)}<main class="scroll"><div class="content dashboard-content">${dashboardHero()}
    ${futureCard(`<div class="continue-card stack"><div class="row"><div class="flex-1"><p class="label">Pokračovat v poslední kontrole</p><h3 class="ellipsis">${d.address}</h3><p class="small muted">${d.completed}/${d.total} hotovo · uloženo 22. 9. 14:26</p></div><span class="icon-surface">${svg('arrow')}</span></div><div class="progress"><span style="--progress:${d.completed/d.total*100}%"></span></div></div>`,{tone:'tertiary',button:true,attrs:'data-action="open-draft"'})}
    ${sectionHeader('Přehled','Vše důležité po ruce','Nová kontrola, rozpracovaná práce i archiv bez zbytečného hledání.')}
    <div class="dashboard-grid">
    ${dashboardTile({route:'work',title:'Práce',supporting:'1 po termínu',badge:3,iconName:'work',tone:'primary',badgeTone:'error'})}
    ${dashboardTile({route:'drafts',title:'Rozpracované',supporting:'Bezpečně uložené kontroly',badge:1,iconName:'drafts',tone:'tertiary'})}
    ${dashboardTile({route:'history',title:'Historie',supporting:'Uzavřené protokoly a PDF',badge:demo.history.length,iconName:'history',tone:'secondary'})}
    ${dashboardTile({route:'settings',title:'Nastavení',supporting:'Objekty, účty a bezpečnost',iconName:'settings',tone:'outline'})}
    </div></div></main></section>`;
}
function workScreen() {
  return mainShell({title:'Místní šetření',active:'work',content:`${sectionHeader('Nová kontrola','Domy podle termínu','Vyberte objekt. Další kontrolu lze zahájit, i když jiná ještě zůstává rozpracovaná.')}
    ${outlinedField('work-search','Vyhledat podle ulice nebo čísla',state.workQuery,'data-work-search placeholder="Např. V nebo Vi" autocomplete="off"',{icon:'search',trailing:'<button class="icon-button field-trailing" data-action="clear-search" aria-label="Vymazat hledání" '+(!state.workQuery?'hidden':'')+'>'+svg('close')+'</button>'})}
    <div id="work-results" class="stack" style="gap:12px">${workResults()}</div>`});
}
function workResults() {
  const buildings = demo.buildings.filter(b => PreviewModel.matchesBuilding(b,state.workQuery));
  return `<span class="sr-only" role="status">Zobrazeno ${buildings.length} z ${demo.buildings.length}</span>${buildings.map(b=>futureCard(`<div class="card-pad"><div class="row row--top" style="gap:12px"><span class="icon-surface" style="--icon-color:var(--${b.tone})">${svg('buildingOutline','icon icon--large')}</span><div class="flex-1 stack stack--small"><h3>${b.address}</h3>${pill(b.due,b.tone)}</div></div><button class="button button--wide" data-action="start-inspection" data-building="${b.id}">${svg('play')}Zahájit kontrolu</button></div>`,{tone:b.tone,classes:'building-card'})).join('') || '<p class="supporting">Žádný odpovídající dům. Zkuste jiný začátek ulice nebo čísla.</p>'}`;
}
function draftsScreen() {
  const d=draftSummary(), progress=Math.round(d.completed/d.total*100);
  const card=futureCard(`<div class="card-pad stack"><div class="row row--between row--top"><div class="flex-1"><h3>${d.address}</h3><p class="small muted">${d.protocol} · 22. 9. 2026</p></div><span class="draft-continue">Pokračovat ${svg('arrow','icon icon--small')}</span></div>
    <div class="progress-row"><div class="progress-meta"><span>${d.completed}/${d.total} položek hotovo</span><span style="color:var(--primary)">${progress} %</span></div><div class="progress"><span style="--progress:${progress}%"></span></div></div>
    <div class="metric-row"><span class="metric">${svg('error','icon icon--small')}${d.defects} závady</span><span class="metric">${svg('camera','icon icon--small')}${d.photos} foto</span><span class="metric" style="margin-left:auto">${svg('clock','icon icon--small')}Uloženo ${d.saved}</span></div></div>`,{tone:'tertiary',button:true,attrs:'data-action="open-draft"'});
  return mainShell({title:'Rozpracované',active:'drafts',content:sectionHeader('Živá práce','1 otevřená kontrola','Každá změna se průběžně a odolně ukládá v telefonu.')+card});
}
function filteredHistory() {
  const q=PreviewModel.normalize(state.historyQuery);
  return demo.history.filter(item=>(!q||PreviewModel.normalize(item.address+' '+item.protocol).includes(q))&&(!state.historyHouse||item.address===state.historyHouse)&&(!state.historyMonth||item.iso.startsWith(state.historyMonth)));
}
function historyCard(item) {
  const expanded=state.historyExpanded.includes(item.id);
  return futureCard(`<div class="card-pad stack"><div class="row row--top">
    ${state.historyDeleteMode ? '<input type="checkbox" data-history-select="'+item.id+'" aria-label="Vybrat protokol '+item.protocol+'" '+(state.historySelection.includes(item.id)?'checked':'')+'/>' : ''}
    <div class="flex-1"><h3>${item.address}</h3><p class="small muted">${item.protocol} · ${item.date}</p></div>${pill('Hotovo','tertiary','shield')}</div>
    <div class="row"><button class="button flex-1" data-route="pdf" data-doc="${item.id}">${svg('file')}Otevřít kompletní PDF</button><button class="icon-button" data-action="document-menu" data-key="${item.id}" aria-label="Možnosti protokolu">${svg('menu')}</button></div>
    <button class="button button--text" style="align-self:flex-start" data-action="history-expand" data-key="${item.id}">${svg(expanded?'up':'down')}Další dokumenty (2)</button>
    ${expanded?'<div class="two-columns"><button class="button button--outlined" data-route="pdf" data-doc="'+item.id+'">Protokol PDF</button><button class="button button--outlined" data-route="pdf" data-doc="'+item.id+'">Fotolist PDF</button></div>':''}
    <hr class="divider"/><button class="button button--text" style="justify-content:flex-start" data-action="revision" data-key="${item.id}">${svg('pen')}Vytvořit opravu jako novou revizi</button></div>`,{tone:'secondary',classes:'history-card'});
}
function historyScreen() {
  const items=filteredHistory();
  return mainShell({title:'Historie',active:'history',content:`
    ${sectionHeader('Dokumenty','Archiv protokolů','Zobrazují se pouze hotové a ukončené kontroly.')}
    ${futureCard(`<div class="delete-card"><div class="delete-card__header">${svg('trashOutline','icon icon--compact')}<h3>Smazat protokoly</h3><button class="button button--outlined button--compact" data-action="history-delete-mode">${svg('checklist','icon icon--small')}${state.historyDeleteMode?'Zrušit':'Vybrat'}</button></div><div class="delete-card__meta"><span>Jednotlivě nebo podle data</span><button class="button button--text button--compact" data-action="history-delete-from-date">${svg('date','icon icon--small')}Od data</button></div>${state.historyDeleteMode?'<div class="delete-card__actions"><button class="button button--outlined button--compact" data-action="history-select-visible">Vše</button><button class="button button--danger button--compact" data-action="history-delete-open" '+(!state.historySelection.length?'disabled':'')+'>Smazat ('+state.historySelection.length+')</button></div>':''}</div>`,{tone:'error'})}
    ${futureCard('<div class="search-card">'+outlinedField('history-search','Hledat adresu nebo číslo protokolu',state.historyQuery,'data-action="history-search"',{icon:'search'})+'<div class="filter-row"><button class="filter-chip" data-action="history-house-filter">'+escapeHtml(state.historyHouse||'Všechny domy')+svg('down','icon icon--small')+'</button><button class="filter-chip" data-action="history-date-filter">'+escapeHtml(state.historyMonth||'Všechna data')+svg('down','icon icon--small')+'</button></div></div>',{tone:'secondary'})}
    ${pill('Zobrazeno '+items.length+' z '+demo.history.length,'secondary','filter')}
    ${items.map(historyCard).join('')||'<p class="supporting">Nic jsme nenašli. Zkuste upravit hledaný text.</p>'}`});
}
const settingsItems = [
  ['Aktivní účty','peopleOutline','accounts'],['Domy','buildingOutline','buildings'],
  ['Export a import','backupOutline','backup'],['Fotografie','imageOutline','photo-settings'],
  ['Kontrola dat','shieldOutline','integrity'],['Kategorie a objekty','checklistOutline','categories'],
  ['Telefon','phoneOutline','device'],['Tisk','printOutline','print'],['Upozornění','bellOutline','notifications'],
  ['Změnit heslo','password','password'],
];
function settingsScreen() {
  return mainShell({title:'Nastavení',active:'settings',classes:'settings-content',content:`
    ${sectionHeader('Centrum správy','Nastavení aplikace','Účty, objekty, bezpečné zálohy i tisk jsou přehledně na jednom místě.')}
    <button class="button button--wide" data-action="add-technician">${svg('addPerson')}Přidat technika</button>
    <div class="menu-grid">${settingsItems.map(([title,icon,route])=>menuTile(title,icon,route==='password'?'data-action="password"':'data-route="'+route+'"')).join('')}</div>`});
}
function notificationToggle(key,title,detail) {
  const n=state.notifications;
  return `<label class="outlined-card setting-row"><span><strong>${title}</strong><small>${detail}</small></span><input class="switch" data-notification-toggle="${key}" type="checkbox" aria-label="${title}" ${n[key]?'checked':''} ${key!=='enabled'&&!n.enabled?'disabled':''}/></label>`;
}
function notificationsScreen() {
  const n=state.notifications;
  const numeric=(key,title,min,max,support)=>outlinedField('notification-'+key,title,n[key]??'',`data-notification-input="${key}" min="${min}" max="${max}" inputmode="numeric"`,{type:'number',support});
  return mainShell({title:'Upozornění',active:'settings',content:`
    ${sectionHeader('Plán kontrol','Upozornění na termíny','DSO kontroluje termíny lokálně přibližně jednou denně. Nepoužívá cloud ani neposílá adresy mimo telefon.')}
    <section class="info-card"><h3>Stav upozornění</h3><p class="supporting">${n.enabled?'Upozornění jsou zapnutá. Denní přesun kategorií v '+String(state.savedNotifications.rolloverHour).padStart(2,'0')+':'+String(state.savedNotifications.rolloverMinute).padStart(2,'0')+'.':'Upozornění jsou vypnutá.'}</p></section>
    ${notificationToggle('enabled','Upozornění zapnuta','Hlavní přepínač všech upozornění na kontroly.')}
    ${notificationToggle('tomorrow','1 den před kontrolou','Připomene objekty s termínem následující den.')}
    ${notificationToggle('today','V den kontroly','Upozorní na objekty, jejichž kontrola je naplánovaná na dnešek.')}
    ${notificationToggle('overdue','Prošlé kontroly','Upozorní na aktivní objekty po termínu.')}
    <section class="outlined-card notification-settings"><h3>Přesné nastavení</h3>
      ${numeric('leadDays','Kolik dnů předem',1,30,'1 až 30 dnů')}
      <div class="two-columns">${numeric('hour','Hodina',0,23,'0–23')}${numeric('minute','Minuta',0,59,'0–59')}</div>
      <h3 style="font-size:14px">Denní přesun kategorií</h3><p class="small muted">V tomto čase se položky přesunou ze zítřka do dneška a z dneška do prošlých.</p>
      <div class="two-columns">${numeric('rolloverHour','Hodina přesunu',0,23,'0–23, výchozí 06')}${numeric('rolloverMinute','Minuta přesunu',0,59,'0–59')}</div>
      ${numeric('repeatDays','Opakovat propadlé po dnech',1,30,'1 = denně, maximum 30')}
      ${numeric('limit','Kolik objektů zobrazit v notifikaci',1,8,'1 až 8; další budou uvedeny souhrnně')}
      <button class="button button--wide button--small" data-action="save-notifications" ${state.notificationDirty?'':'disabled'}>Uložit nastavení upozornění</button>
      ${notificationToggle('lockScreen','Adresy na zamčené obrazovce','Po vypnutí Android skryje adresy, dokud telefon neodemknete.')}
      ${notificationToggle('repeatRead','Přečtené připomenout další den','Nesplněné položky se další den znovu připomenou.')}
      <button class="button button--outlined button--small" data-action="test-notification">Zobrazit testovací upozornění</button>
      <button class="button button--outlined button--small" data-action="android-settings">Zvuk, vibrace a priorita v Androidu</button>
      <button class="button button--text" data-action="reset-notifications">Obnovit výchozí nastavení</button>
      <p class="small muted">Klepnutí na upozornění otevře seznam restů. Kontrola zůstane v seznamu do dokončení; označení jako přečtené pouze ztiší připomínku.</p>
    </section>
    <div class="row"><span class="status-pill" style="--pill:var(--error)">3</span><h2 style="font-size:22px">Aktuální resty</h2></div>
    <p class="small muted">Klepnutím na dům jej otevřete v Práce.</p>
    ${demo.buildings.map(b=>'<button class="outlined-card reminder-row" data-action="open-reminder" data-building="'+b.id+'"><span class="dot" style="background:var(--'+b.tone+')"></span><span class="flex-1"><strong>'+b.address+'</strong><small>Interval kontroly: 30 dní</small></span>'+pill(b.due,b.tone)+'</button>').join('')}
    <p class="small muted">Nový objekt bez dokončené kontroly se počítá jako nový záznam. Cyklus kontrol začne až po dokončení první kontroly.</p>
    <button class="button button--outlined" data-action="android-settings">Otevřít nastavení upozornění v Androidu</button>`});
}

function pdfScreen() {
  const document = demo.history.find(item => item.id === state.historyDocument) || demo.history[0];
  if (!document) return historyScreen();
  return `<section class="screen" data-screen="pdf">
    ${topBar('Náhled PDF', document.protocol, { back:true, theme:false })}
    <main class="scroll"><div class="content content--tight">
      <div class="row"><button class="button button--tonal button--small flex-1" data-action="download">${svg('download','icon icon--small')}Uložit</button><button class="button button--tonal button--small flex-1" data-action="share">${svg('share','icon icon--small')}Sdílet</button></div>
      <p class="tiny muted">Ilustrační náhled. Skutečné dvoustránkové PDF a fotolisty vytváří Android aplikace.</p><article class="pdf-page">
        <div class="pdf-head"><div><p class="eyebrow" style="color:#0b78f6">${DESIGN_EDITION}</p><h2>Protokol o kontrole objektu</h2><p class="tiny">${escapeHtml(document.protocol)} · ${escapeHtml(document.date)}</p></div><img src="../assets/app-icon.svg" alt="DSO" /></div>
        <div class="pdf-table"><div class="pdf-row"><span>Objekt</span><span>${escapeHtml(document.address)}</span></div><div class="pdf-row"><span>Technik</span><span>Ukázkový technik</span></div><div class="pdf-row"><span>Stav</span><span>Dokončeno</span></div><div class="pdf-row"><span>Závady</span><span>${document.defects} evidované položky</span></div></div>
        <h3 style="margin-top:22px">Souhrn kontroly</h3><p class="small">Kontrola společných prostor, technických zařízení a dokumentace objektu. Tento dokument obsahuje pouze smyšlená demonstrační data.</p>
        <div class="pdf-table"><div class="pdf-row"><span>Vstupní dveře</span><span>V pořádku</span></div><div class="pdf-row"><span>Domovní zvonky</span><span>Závada</span></div><div class="pdf-row"><span>Osvětlení chodby</span><span>V pořádku</span></div><div class="pdf-row"><span>Vodoměr</span><span>Odečet 01842,6 m³</span></div></div>
      </article>
    </div></main>
  </section>`;
}
