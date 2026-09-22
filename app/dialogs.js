function categoryRadios(selected,exclude='') {
  return '<div class="radio-list" aria-label="Cílová kategorie">'+state.formSections.filter(s=>s.key!==exclude).map(s=>'<label class="radio-row"><input type="radio" name="target-category" data-transfer-target value="'+s.key+'" '+(selected===s.key?'checked':'')+'/>'+svg(s.icon||'folderOutline')+'<span>'+escapeHtml(s.title)+'<small class="muted small" style="display:block">'+s.page+'. strana PDF</small></span></label>').join('')+'</div>';
}
function iconPicker(selected='buildingOutline') {
  return '<p class="small bold">Ikona</p><div class="icon-picker">'+['buildingOutline','roomOutline','stairsOutline','yardOutline','lightOutline','meterOutline','imageOutline','checklistOutline','folderOutline','home'].map((name,i)=>'<label aria-label="Ikona '+(i+1)+'"><input type="radio" name="object-icon" value="'+name+'" '+(name===selected?'checked':'')+'/>'+svg(name)+'</label>').join('')+'</div>';
}
function demoPassword(id,label) {
  return outlinedField(id,label,'••••','readonly autocomplete="off" aria-description="Vizuální ukázka. Nezadávejte skutečné heslo."');
}
function dialogContents() {
  const confirm=(action,text,extra='')=>'<button class="button '+(action==='history-delete-confirm'?'button--danger':'')+'" data-action="'+action+'" '+extra+'>'+text+'</button>';
  if(state.dialog==='login')return modal(demo.technician.name,demoPassword('demo-password','Heslo'),confirm('login','Přihlásit','data-testid="login-button"'),'badge');
  if(state.dialog==='transfer') {
    const item=managedItem(state.movingItem),source=state.formSections.find(s=>s.items.some(i=>i.key===item.key));
    return modal('Přesunout objekt','<p class="supporting">'+escapeHtml(item.label)+'\nZ kategorie: '+escapeHtml(source.title)+'\n\nVyberte cílovou kategorii:</p>'+categoryRadios('',source.key)+'<p class="small muted">Objekt se přidá na konec cílové kategorie a převezme její stranu PDF. Rozpracované kontroly a hotové protokoly se nemění.</p><p class="dialog-error" role="alert"></p>',confirm('confirm-transfer','Přesunout','disabled'));
  }
  if(state.dialog==='rename'||state.dialog==='add-item') {
    const item=state.dialog==='rename'?managedItem(state.editingItem):null,source=state.formSections.find(s=>s.items.some(i=>i.key===item?.key))||state.formSections[0];
    return modal(item?'Upravit objekt':'Nový objekt',outlinedField('object-name','Název objektu / co se kontroluje',item?.label||'','data-rename-item minlength="2" maxlength="80"')+'<h3>Vyberte kategorii objektu</h3>'+categoryRadios(source?.key)+iconPicker(item?.icon)+'<p class="small muted">Změna platí pouze pro nové kontroly. Existující záznamy se nemění.</p><p class="dialog-error" role="alert"></p>',confirm('confirm-rename','Uložit'),item?.icon||'buildingOutline');
  }
  if(state.dialog==='category-editor') {
    const section=state.formSections.find(s=>s.key===state.editingCategory);
    return modal(section?'Upravit kategorii':'Nová kategorie',outlinedField('category-name','Název kategorie',section?.title||'','data-category-name minlength="2" maxlength="60"')+'<p class="small bold">Strana PDF</p><div class="row">'+[1,2].map(page=>'<label class="radio-row"><input type="radio" name="pdf-page" value="'+page+'" '+(page===(section?.page||1)?'checked':'')+'/>'+page+'. strana</label>').join('')+'</div>'+iconPicker(section?.icon||'folderOutline')+'<p class="dialog-error" role="alert"></p>',confirm('confirm-category','Uložit'),'folderOutline');
  }
  if(state.dialog==='remove-template')return modal(state.removing.kind==='category'?'Smazat kategorii?':'Smazat objekt?','<p class="supporting">'+escapeHtml(state.removing.label)+'\n\nPoložka se přesune do koše a přestane se nabízet v nových kontrolách. Rozpracované kontroly a hotové protokoly zůstanou zachované.</p>',confirm('confirm-remove-template','Smazat'),'trashOutline');
  if(state.dialog==='history-delete') {
    const selected=demo.history.filter(i=>state.historySelection.includes(i.id));
    return modal('Smazat '+protocolCountLabel(selected.length)+'?','<p class="supporting">Smažou se právě vybrané protokoly.</p><div class="delete-preview">'+selected.map(i=>'<div class="ellipsis">• '+escapeHtml(i.protocol)+' – '+escapeHtml(i.address)+'</div>').join('')+'</div><p class="small text-danger">Odstraní se také odpovědi, fotografie a PDF tohoto protokolu.</p>',confirm('history-delete-confirm','Smazat natrvalo'),'trashOutline');
  }
  if(state.dialog==='history-date')return modal('Smazat od data',outlinedField('delete-date','Datum včetně',state.historyDeleteFromDate,'data-history-date',{type:'date'})+'<p class="small">V dalším kroku se zobrazí přesný seznam protokolů.</p>',confirm('history-date-confirm','Pokračovat',state.historyDeleteFromDate?'':'disabled'));
  if(state.dialog==='history-house-filter'||state.dialog==='history-date-filter') {
    const house=state.dialog==='history-house-filter',values=house?[...new Set(demo.history.map(i=>i.address))]:[...new Set(demo.history.map(i=>i.iso.slice(0,7)))];
    return modal(house?'Vybrat dům':'Vybrat období','<div class="radio-list">'+['',...values].map(v=>'<label class="radio-row"><input type="radio" name="history-filter" value="'+escapeHtml(v)+'" '+(v===(house?state.historyHouse:state.historyMonth)?'checked':'')+'/>'+escapeHtml(v||(house?'Všechny domy':'Všechna data'))+'</label>').join('')+'</div>',confirm('history-filter-confirm','Použít'));
  }
  if(state.dialog==='without-photo')return modal('Uložit bez fotografie?','<p class="supporting">U vyplněného měřidla není fotografie. Chcete pokračovat bez fotografie celého měřidla?</p>',confirm('confirm-without-photo','Uložit bez fotografie'));
  if(state.dialog==='finish')return modal('Dokončit kontrolu?','<p class="supporting">'+(inspectionStats().total-inspectionStats().completed)+' položek není hotových. Vraťte se do formuláře a doplňte chybějící údaje.</p>','');
  if(state.dialog==='discard-photo')return modal('Zahodit změny fotografie?','<p class="supporting">Neuložené změny popisu a označení se zahodí.</p>',confirm('discard-photo','Zahodit a vrátit se'));
  if(state.dialog==='remove-photo')return modal('Odstranit fotografii?','<p class="supporting">Odstranit fotografii '+escapeHtml(state.removingPhoto)+' z rozpracované kontroly?</p>',confirm('confirm-remove-photo','Odstranit'),'trashOutline');
  if(state.dialog==='inspection-date'||state.dialog==='inspection-time') {
    const date=state.dialog==='inspection-date';
    return modal(date?'Datum kontroly':'Čas kontroly',outlinedField('inspection-datetime',date?'Datum':'Čas',date?state.inspectionDate:state.inspectionTime,'data-inspection-datetime',{type:date?'date':'time'}),confirm('confirm-inspection-datetime','OK'));
  }
  if(state.dialog==='add-technician'||state.dialog==='edit-technician')return modal(state.dialog==='add-technician'?'Nový technik':'Upravit technika',outlinedField('technician-name','Jméno technika',state.dialog==='edit-technician'?demo.technician.name:'','maxlength="80"')+demoPassword('technician-pass','Heslo')+demoPassword('technician-pass-repeat','Heslo znovu')+'<p class="small">Odstraněním se účet skryje z aktivního seznamu. Auditní identita a hotové protokoly zůstanou zachované.</p>',confirm('native-only','Uložit'));
  if(state.dialog==='password')return modal('Změnit heslo','<p class="supporting">Nejprve ověříme současné heslo. Nové heslo musí mít alespoň 4 znaky.</p>'+demoPassword('current-password','Současné heslo')+demoPassword('new-password','Nové heslo')+demoPassword('repeat-password','Nové heslo znovu'),confirm('native-only','Uložit nové heslo'),'password');
  if(state.dialog==='document-menu')return modal('Možnosti protokolu','<button class="button button--outlined" data-action="share">'+svg('share')+'Sdílet PDF</button><button class="button button--outlined" data-action="download">'+svg('download')+'Uložit PDF</button>','');
  if(state.dialog==='native-only')return modal(state.nativeTitle||'Android funkce','<p class="supporting">Tato veřejná ukázka používá pouze fiktivní data. '+escapeHtml(state.nativeDetail||'Systémové služby, oprávnění a skutečné ukládání souborů jsou dostupné v nainstalované Android aplikaci.')+'</p>','');
  return '';
}
