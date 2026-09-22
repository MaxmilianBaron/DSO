function escapeHtml(value) { return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
const savedInspections=new Map();
state.inspectionId='draft';
function stashInspection() {
  savedInspections.set(state.inspectionId,PreviewModel.copy({
    inspectionSections:state.inspectionSections,answers:state.answers,notes:state.notes,photos:state.photos,
    buildingId:state.buildingId,activeSection:state.activeSection,inspectionIsDraft:state.inspectionIsDraft,
    inspectionDate:state.inspectionDate,inspectionTime:state.inspectionTime,
  }));
}
stashInspection();
function openInspection(buildingId,draft=false) {
  stashInspection();
  const id=draft?'draft':buildingId;
  if(savedInspections.has(id))Object.assign(state,PreviewModel.copy(savedInspections.get(id)));
  else Object.assign(state,{inspectionSections:PreviewModel.copy(state.formSections),answers:{},notes:{},photos:[],buildingId,activeSection:null,inspectionIsDraft:false,inspectionDate:'2026-09-22',inspectionTime:'14:26'});
  state.inspectionId=id;
  state.inspectionOverview=true;
  navigate('inspection');
}
function render({reset=false,anchor,position}={}) {
  const scrollTop=position??(reset?0:app.querySelector('.scroll')?.scrollTop||0);
  setTheme(state.theme);
  state.notificationDirty=PreviewModel.notificationsDirty(state.notifications,state.savedNotifications);
  const screens={login:loginScreen,dashboard:dashboardScreen,work:workScreen,drafts:draftsScreen,history:historyScreen,settings:settingsScreen,notifications:notificationsScreen,categories:categoriesScreen,'photo-settings':photoSettingsScreen,inspection:currentInspectionScreen,photos:photoListScreen,'photo-edit':photoEditorScreen,'photo-source':photoSourceScreen,pdf:pdfScreen,accounts:accountsScreen,buildings:buildingsScreen,backup:backupScreen,integrity:integrityScreen,device:deviceScreen,print:printScreen};
  app.innerHTML=(screens[state.route]||loginScreen)();
  app.querySelector('.screen').insertAdjacentHTML('beforeend','<div class="system-navigation" aria-hidden="true"></div>');
  const scroller=app.querySelector('.scroll');
  if(scroller)scroller.scrollTop=scrollTop;
  if(anchor&&scroller) {
    let element=app.querySelector(anchor);
    if(element&&getComputedStyle(element).display==='contents')element=element.firstElementChild;
    if(element)scroller.scrollTop=Math.max(0,element.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-12);
  }
  renderDialog();
}
function toast(message) {
  app.querySelector('.toast')?.remove();
  app.insertAdjacentHTML('beforeend','<div class="toast" role="status">'+escapeHtml(message)+'</div>');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>app.querySelector('.toast')?.remove(),3000);
}
function modal(title,body,actions,icon='') {
  return '<div class="dialog-backdrop" data-backdrop><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">'+(icon?svg(icon,'icon dialog-icon'):'')+'<h2 id="dialog-title">'+escapeHtml(title)+'</h2><div class="dialog-body">'+body+'</div><div class="dialog-actions"><button class="button button--text" data-action="dismiss-dialog">Zrušit</button>'+actions+'</div></section></div>';
}
function renderDialog() {
  const wasOpen=!!dialogRoot.firstElementChild;
  if(state.dialog&&!wasOpen)renderDialog.opener=document.activeElement;
  const content=dialogContents();
  dialogRoot.innerHTML=content;
  app.inert=!!content;
  if(content)dialogRoot.querySelector('input:not([readonly]),button')?.focus({preventScroll:true});
  else if(wasOpen&&renderDialog.opener?.isConnected)renderDialog.opener.focus({preventScroll:true});
}
function openDialog(name) { state.dialog=name; renderDialog(); }
function dismissDialog() { state.dialog=null; renderDialog(); }
function nativeOnly(title='Android funkce',detail='') { state.nativeTitle=title;state.nativeDetail=detail;openDialog('native-only'); }
function navigate(route) {
  if(route===state.route)return;
  state.previous.push({route:state.route,scrollTop:app.querySelector('.scroll')?.scrollTop||0});
  state.route=route;state.dialog=null;render({reset:true});
}
function photoChanged() { return state.photoDraft&&JSON.stringify(state.photoDraft)!==state.photoOriginal; }
function returnFromPhoto() {
  state.photoDraft=null;state.photoOriginal=null;state.photoDrawing=false;
  if(state.previous.at(-1)?.route==='photo-source')state.previous.pop();
  back(true);
}
function back(force=false) {
  if(state.route==='photo-edit'&&!force) {
    if(photoChanged()){openDialog('discard-photo');return;}
    returnFromPhoto();return;
  }
  if(state.route==='inspection'&&!state.inspectionOverview) { state.inspectionOverview=true;render({reset:true});return; }
  const previous=state.previous.pop();
  state.route=previous?.route||(state.route==='dashboard'?'login':'dashboard');
  state.dialog=null;render({position:previous?.scrollTop||0});
}
function protocolCountLabel(count) { return count===1?'1 protokol':count<=4?count+' protokoly':count+' protokolů'; }
function templateChanged(sections,anchor) {
  state.formSections=PreviewModel.validate(sections);state.categoryVersion++;state.dialog=null;render({anchor});toast('Šablona upravena pro nové kontroly');
}
function updateNotificationButton() {
  state.notificationDirty=PreviewModel.notificationsDirty(state.notifications,state.savedNotifications);
  const button=app.querySelector('[data-action="save-notifications"]');
  if(button)button.disabled=!state.notificationDirty;
}
function confirmItemEditor() {
  const label=dialogRoot.querySelector('[data-rename-item]').value.trim();
  const target=dialogRoot.querySelector('[data-transfer-target]:checked')?.value;
  const icon=dialogRoot.querySelector('[name="object-icon"]:checked')?.value||'buildingOutline';
  if(label.length<2||label.length>80||!target)throw new Error('Vyplňte název (2–80 znaků) a vyberte kategorii.');
  let next;
  let key=state.editingItem;
  if(state.dialog==='add-item') {
    if(state.formSections.flatMap(s=>s.items).some(i=>PreviewModel.normalize(i.label)===PreviewModel.normalize(label)))throw new Error('Objekt s tímto názvem už existuje.');
    next=PreviewModel.copy(state.formSections);
    const section=next.find(s=>s.key===target);
    key='custom.item_'+state.customSequence++;
    section.items.push({key,label,page:section.page,enabled:true,icon,detail:'Poznámka',fields:[{key:'state',label:'Stav',type:'choice',options:['Ano','Ne']}]});
  } else {
    next=PreviewModel.renameItem(state.formSections,key,label);
    next=PreviewModel.transferItem(next,key,target);
    next.flatMap(s=>s.items).find(i=>i.key===key).icon=icon;
  }
  templateChanged(next,'[data-managed-item="'+key+'"]');
}
function confirmCategoryEditor() {
  const title=dialogRoot.querySelector('[data-category-name]').value.trim();
  const page=Number(dialogRoot.querySelector('[name="pdf-page"]:checked').value);
  const icon=dialogRoot.querySelector('[name="object-icon"]:checked')?.value||'folderOutline';
  if(title.length<2||title.length>60)throw new Error('Název musí mít 2 až 60 znaků.');
  if(state.formSections.some(s=>s.key!==state.editingCategory&&PreviewModel.normalize(s.title)===PreviewModel.normalize(title)))throw new Error('Kategorie s tímto názvem už existuje.');
  const next=PreviewModel.copy(state.formSections);
  let section=next.find(s=>s.key===state.editingCategory);
  if(section) {
    if(section.page!==page)section.items.forEach(i=>i.page=page);
    Object.assign(section,{title,page,icon});
  } else {
    section={key:'custom_category_'+state.customSequence++,title,page,icon,enabled:true,items:[]};
    next.push(section);
  }
  templateChanged(next,'[data-category="'+section.key+'"]');
}
function beginPhoto(photo) {
  state.photoDraft=PreviewModel.copy({...photo,strokes:photo.strokes||[],rotation:photo.rotation||0});
  state.photoOriginal=JSON.stringify(state.photoDraft);
  state.photoDrawing=false;
  navigate('photo-edit');
}
document.addEventListener('click',event=>{
  if(!(event.target instanceof Element))return;
  if(event.target.matches('[data-backdrop]')){dismissDialog();return;}
  const route=event.target.closest('[data-route]');
  if(route){if(route.dataset.doc)state.historyDocument=route.dataset.doc;navigate(route.dataset.route);return;}
  const answer=event.target.closest('[data-answer]');
  if(answer){state.answers[answer.dataset.answer]=answer.dataset.value;render();return;}
  const target=event.target.closest('[data-action]');
  if(!target||target.disabled)return;
  const {action,key}=target.dataset;
  try {
    if(action==='theme'){setTheme(state.theme==='dark'?'light':'dark');render();}
    else if(action==='back')back();
    else if(action==='close')toast('Veřejnou ukázku lze zavřít v prohlížeči');
    else if(action==='logout'){stashInspection();state.previous=[];state.route='login';state.dialog=null;render({reset:true});}
    else if(action==='open-login')openDialog('login');
    else if(action==='dismiss-dialog')dismissDialog();
    else if(action==='login'){state.dialog=null;state.previous=[];state.route='dashboard';render({reset:true});}
    else if(['share','download','android-settings','native-only','dictation','template-export','template-import','revision','test-notification','building-editor','video'].includes(action)) {
      const title={share:'Sdílení PDF',download:'Uložení PDF',dictation:'Hlasová poznámka','template-export':'Export šablony','template-import':'Import šablony',revision:'Nová revize','test-notification':'Testovací upozornění','building-editor':'Správa domů',video:'Video dokumentace'}[action];
      nativeOnly(title||'Android funkce');
    }
    else if(['add-technician','edit-technician','password','document-menu'].includes(action))openDialog(action);
    else if(action==='clear-search'){state.workQuery='';render();app.querySelector('[data-work-search]').focus();}
    else if(action==='save-notifications'&&state.notificationDirty){state.savedNotifications=PreviewModel.copy(state.notifications);render();toast('Nastavení upozornění uloženo');}
    else if(action==='reset-notifications'){state.notifications=PreviewModel.defaultNotifications();state.savedNotifications=PreviewModel.defaultNotifications();render();}
    else if(action==='open-draft')openInspection('jablonova',true);
    else if(action==='start-inspection')openInspection(target.dataset.building);
    else if(action==='open-reminder'){const b=demo.buildings.find(b=>b.id===target.dataset.building);state.workQuery=b.street+' '+b.number;navigate('work');}
    else if(action==='move-category')templateChanged(PreviewModel.moveSection(state.formSections,key,Number(target.dataset.direction)),'[data-category="'+key+'"]');
    else if(action==='move-item')templateChanged(PreviewModel.moveItem(state.formSections,key,Number(target.dataset.direction)),'[data-managed-item="'+key+'"]');
    else if(action==='transfer-item'){state.movingItem=key;openDialog('transfer');}
    else if(action==='confirm-transfer')templateChanged(PreviewModel.transferItem(state.formSections,state.movingItem,dialogRoot.querySelector('[data-transfer-target]:checked').value),'[data-managed-item="'+state.movingItem+'"]');
    else if(action==='edit-item'){state.editingItem=key;openDialog('rename');}
    else if(action==='add-item'){state.editingItem=null;openDialog('add-item');}
    else if(action==='confirm-rename')confirmItemEditor();
    else if(action==='add-category'||action==='edit-category'){state.editingCategory=key||null;openDialog('category-editor');}
    else if(action==='confirm-category')confirmCategoryEditor();
    else if(action==='remove-item'||action==='remove-category'){state.removing={key,kind:action==='remove-category'?'category':'item',label:action==='remove-category'?state.formSections.find(s=>s.key===key).title:managedItem(key).label};openDialog('remove-template');}
    else if(action==='confirm-remove-template') {
      const next=PreviewModel.copy(state.formSections),r=state.removing;
      let entry;
      if(r.kind==='category'){const index=next.findIndex(s=>s.key===r.key);entry={kind:'category',index,data:next[index]};next.splice(index,1);}
      else {const section=next.find(s=>s.items.some(i=>i.key===r.key));const index=section.items.findIndex(i=>i.key===r.key);entry={kind:'item',category:section.key,index,data:section.items[index]};section.items.splice(index,1);}
      PreviewModel.validate(next);state.trash.push(entry);templateChanged(next);
    }
    else if(action==='restore-template') {
      const index=Number(target.dataset.index),entry=state.trash[index],next=PreviewModel.copy(state.formSections);
      if(entry.kind==='category')next.splice(Math.min(entry.index,next.length),0,PreviewModel.copy(entry.data));
      else {const section=next.find(s=>s.key===entry.category);if(!section)throw new Error('Nejprve obnovte původní kategorii.');section.items.splice(Math.min(entry.index,section.items.length),0,{...PreviewModel.copy(entry.data),page:section.page});}
      PreviewModel.validate(next);state.trash.splice(index,1);templateChanged(next);
    }
    else if(action==='open-section'||action==='toggle-section'){state.inspectionOverview=false;state.activeSection=action==='open-section'?key:state.activeSection===key?null:key;render({anchor:'[data-inspection-section="'+key+'"]'});}
    else if(action==='reset-item'){Object.keys(state.answers).filter(k=>k.startsWith(key+':')).forEach(k=>delete state.answers[k]);delete state.notes[key];render();}
    else if(action==='scan-meter'){state.answers[key+':serial']='DEMO-AB104';state.answers[key+':reading']='1842,6';render();toast('Ukázkový výsledek čtečky');}
    else if(action==='finish-demo') {
      const meters=state.inspectionSections.filter(s=>s.enabled).flatMap(s=>s.items).filter(i=>i.enabled&&i.meter&&i.fields.some(f=>state.answers[i.key+':'+f.key])&&!state.photos.some(p=>p.itemKey===i.key));
      openDialog(meters.length?'without-photo':'finish');
    }
    else if(action==='confirm-without-photo')openDialog('finish');
    else if(action==='inspection-date'||action==='inspection-time')openDialog(action);
    else if(action==='confirm-inspection-datetime') {
      const value=dialogRoot.querySelector('[data-inspection-datetime]').value;
      if(!value)throw new Error('Vyberte platnou hodnotu.');
      if(state.dialog==='inspection-date')state.inspectionDate=value;else state.inspectionTime=value;
      state.dialog=null;render();
    }
    else if(action==='all-photos'){state.photoItemKey=null;navigate('photos');}
    else if(action==='add-photo'){state.photoItemKey=key;navigate('photo-source');}
    else if(action==='edit-photo')beginPhoto(state.photos.find(p=>p.id===key));
    else if(action==='new-photo')beginPhoto({id:'F'+String(state.photoSequence++).padStart(3,'0'),itemKey:state.photoItemKey,src:'../assets/photos/inside-hallway.webp',description:'',marked:false});
    else if(action==='photo-mark'){state.photoDrawing=!state.photoDrawing;render();}
    else if(action==='photo-clear'){state.photoDraft.marked=false;state.photoDraft.strokes=[];render();}
    else if(action==='photo-undo'){state.photoDraft.strokes.pop();render();}
    else if(action==='photo-rotate'){state.photoDraft.rotation=((state.photoDraft.rotation||0)+90)%360;render();}
    else if(action==='cancel-photo'){if(photoChanged())openDialog('discard-photo');else returnFromPhoto();}
    else if(action==='discard-photo')returnFromPhoto();
    else if(action==='save-photo'){state.photos=PreviewModel.savePhoto(state.photos,state.photoDraft);returnFromPhoto();toast('Fotografie uložena');}
    else if(action==='remove-photo'){state.removingPhoto=key;openDialog('remove-photo');}
    else if(action==='confirm-remove-photo'){state.photos=state.photos.filter(p=>p.id!==state.removingPhoto);state.dialog=null;render();}
    else if(action==='history-expand'){state.historyExpanded=state.historyExpanded.includes(key)?state.historyExpanded.filter(id=>id!==key):[...state.historyExpanded,key];render();}
    else if(action==='history-delete-mode'){state.historyDeleteMode=!state.historyDeleteMode;if(!state.historyDeleteMode)state.historySelection=[];render();}
    else if(action==='history-select-visible'){state.historySelection=filteredHistory().map(i=>i.id);render();}
    else if(action==='history-delete-open'&&state.historySelection.length)openDialog('history-delete');
    else if(action==='history-delete-from-date')openDialog('history-date');
    else if(action==='history-date-confirm') {
      state.historySelection=state.historyDeleteFromDate?demo.history.filter(i=>i.iso>=state.historyDeleteFromDate).map(i=>i.id):[];
      if(state.historySelection.length)openDialog('history-delete');else {dismissDialog();toast('Od zvoleného data není žádný protokol');}
    }
    else if(action==='history-delete-confirm'){const ids=new Set(state.historySelection);demo.history=demo.history.filter(i=>!ids.has(i.id));state.historySelection=[];state.historyDeleteMode=false;state.dialog=null;render();toast('Vybrané ukázkové protokoly odstraněny');}
    else if(action==='history-house-filter'||action==='history-date-filter')openDialog(action);
    else if(action==='history-filter-confirm') {const value=dialogRoot.querySelector('[name="history-filter"]:checked')?.value||'';if(state.dialog==='history-house-filter')state.historyHouse=value;else state.historyMonth=value;state.dialog=null;render();}
  } catch(error) {
    const message=error instanceof Error?error.message:'Změnu nelze provést.';
    const output=dialogRoot.querySelector('.dialog-error');
    if(output)output.textContent=message;else toast(message);
  }
});
document.addEventListener('change',event=>{
  const t=event.target;
  if(!(t instanceof HTMLInputElement))return;
  if(t.matches('[data-history-select]')){const id=t.dataset.historySelect;state.historySelection=t.checked?[...new Set([...state.historySelection,id])]:state.historySelection.filter(i=>i!==id);render();}
  if(t.matches('[data-notification-toggle]')){state.notifications[t.dataset.notificationToggle]=t.checked;state.savedNotifications[t.dataset.notificationToggle]=t.checked;render();}
  if(t.matches('[data-gallery-setting]'))state.galleryEnabled=t.checked;
  if(t.matches('[data-transfer-target]')){const button=dialogRoot.querySelector('[data-action="confirm-transfer"]');if(button)button.disabled=false;}
  if(t.matches('[data-category-toggle],[data-item-toggle]')) {
    const next=PreviewModel.copy(state.formSections);
    const item=t.dataset.categoryToggle?next.find(s=>s.key===t.dataset.categoryToggle):next.flatMap(s=>s.items).find(i=>i.key===t.dataset.itemToggle);
    item.enabled=t.checked;
    try{templateChanged(next);}catch(error){t.checked=!t.checked;toast(error.message);}
  }
});
document.addEventListener('input',event=>{
  const t=event.target;
  if(!(t instanceof HTMLInputElement)&&!(t instanceof HTMLTextAreaElement))return;
  t.closest('.field')?.classList.toggle('is-empty',!t.value);
  if(t.matches('[data-field]'))state.answers[t.dataset.field]=t.value;
  if(t.matches('[data-note]')){state.notes[t.dataset.note]=t.value;t.closest('.field').parentElement.querySelector('.field-support').textContent=t.value.length+'/140 znaků včetně mezer';}
  if(t.matches('[data-photo-description]'))state.photoDraft.description=t.value;
  if(t.matches('[data-work-search]')){state.workQuery=t.value;app.querySelector('#work-results').innerHTML=workResults();app.querySelector('[data-action="clear-search"]').hidden=!t.value;}
  if(t.matches('[data-history-date]')){state.historyDeleteFromDate=t.value;dialogRoot.querySelector('[data-action="history-date-confirm"]').disabled=!t.value;}
  if(t.matches('[data-notification-input]')){state.notifications[t.dataset.notificationInput]=t.value===''?null:Number(t.value);updateNotificationButton();}
  if(t.matches('[data-action="history-search"]')){state.historyQuery=t.value;const position=t.selectionStart;render();const next=app.querySelector('[data-action="history-search"]');next.focus();next.setSelectionRange(position,position);}
  if(t.matches('[data-field],[data-note]')) {
    const stats=inspectionStats(),subtitle=app.querySelector('.topbar__title small');
    if(subtitle)subtitle.textContent=stats.completed+'/'+stats.total+' hotovo · '+stats.defects+' závad · '+state.photos.length+' foto';
    const footer=app.querySelector('.inspection-footer');
    if(footer){footer.querySelector('small').textContent=(stats.total-stats.completed)+' položek není hotových';footer.querySelector('.progress > span').style.setProperty('--progress',stats.completed/Math.max(1,stats.total)*100+'%');}
    for(const section of state.inspectionSections.filter(s=>s.enabled)) {
      const toggle=app.querySelector('[data-action="toggle-section"][data-key="'+section.key+'"]');
      if(!toggle)continue;
      const items=section.items.filter(i=>i.enabled),done=items.filter(i=>itemComplete(i)).length;
      toggle.querySelector('.status-pill').outerHTML=pill(done+'/'+items.length,done===items.length?'tertiary':'primary',done===items.length?'check':'clock');
    }
  }
});
let drawing=null;
function photoPoint(event,element) { const rect=element.getBoundingClientRect();return [Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))]; }
document.addEventListener('pointerdown',event=>{
  const canvas=event.target.closest?.('[data-photo-canvas]');
  if(!canvas||!state.photoDrawing||!state.photoDraft)return;
  if(state.photoDraft.strokes.length>=30){toast('Nejvýše 30 tahů v jedné úpravě');return;}
  drawing={id:event.pointerId,canvas,points:[photoPoint(event,canvas)]};
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});
document.addEventListener('pointermove',event=>{
  if(!drawing||drawing.id!==event.pointerId)return;
  if(drawing.points.length<1500)drawing.points.push(photoPoint(event,drawing.canvas));
  drawing.canvas.innerHTML=photoMarks({...state.photoDraft,strokes:[...state.photoDraft.strokes,drawing.points]});
});
document.addEventListener('pointerup',event=>{
  if(!drawing||drawing.id!==event.pointerId)return;
  drawing.points.push(photoPoint(event,drawing.canvas));state.photoDraft.strokes.push(drawing.points);drawing=null;render();
});
document.addEventListener('pointercancel',()=>{drawing=null;});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&state.dialog){event.preventDefault();dismissDialog();}
  if(event.key==='Tab'&&state.dialog) {
    const controls=[...dialogRoot.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea')].filter(e=>e.offsetParent!==null);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
render();
