const PreviewModel = (() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const normalize = value => String(value).trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const matchesBuilding = (building, query) => {
    const prefix = normalize(query);
    return [building.street, building.number, `${building.street} ${building.number}`]
      .some(value => normalize(value).startsWith(prefix));
  };
  const yesNo = ['Ano', 'Ne'];
  const functional = ['Funkční', 'Nefunkční'];
  const condition = ['Nové', 'Zachovalé', 'Poškozené'];
  const maintained = ['Udržované', 'Neudržované', 'Odložený odpad'];
  const field = (key, label, options) => ({ key, label, options, type: 'choice' });
  const text = (key, label, type = 'text') => ({ key, label, type });
  const item = (key, label, page, fields = [field('state', 'Stav', yesNo)]) => ({ key, label, page, fields, enabled: true });
  const door = (key, label) => item(key, label, 1, [field('functionality', 'Funkčnost', functional), field('defect', 'Závady', ['Ne', 'Ano'])]);
  const one = (key, label, page, options) => item(key, label, page, [field('state', 'Stav', options)]);
  const section = (key, title, page, items) => ({ key, title, page, enabled: true, items });

  function createSections() {
    return [
      section('outside_information', 'Informace vně objektu', 1, [
        item('outside.house_number', 'Tabulka s č. p.', 1),
        item('outside.orientation_number', 'Tabulka s č. o.', 1),
        item('outside.snp2_board', 'Informační tabulka SNP2', 1),
        item('outside.cleaning_company_board', 'Informační tabulka úklidové firmy', 1),
      ]),
      section('inside_information', 'Informace uvnitř objektu', 1, [
        item('inside.sf_contacts', 'Kontakty SF', 1),
        item('inside.sf_notice', 'Oznámení SF v nástěnce', 1),
        one('inside.boiler_contact', 'Kontakt – kotelna', 1, [...yesNo, 'Kotelna není v domě']),
        item('inside.cleaning_record', 'Záznam o úklidu', 1, [field('present', 'Záznam je uveden', yesNo), text('last_date', 'Datum posledního úklidu', 'date')]),
      ]),
      section('outside_inspection', 'Venkovní obhlídka objektu', 1, [
        one('exterior.street_facade', 'Fasáda uliční', 1, ['Nepoškozené', 'Poškozené']),
        one('exterior.yard_facade', 'Fasáda dvorní', 1, ['Nepoškozené', 'Poškozené']),
        item('exterior.cultural_objects', 'Kulturní předměty (pamětní desky, busty...)', 1, [text('description', 'Popis')]),
        one('exterior.street_windows', 'Okna uliční', 1, ['Dobrá', 'Nepoškozená', 'Poškozená']),
        one('exterior.yard_windows', 'Okna dvorní', 1, ['Dobrá', 'Nepoškozená', 'Poškozená']),
        one('exterior.pavlace', 'Pavlače', 1, ['Dobré', 'Nepoškozené', 'Poškozené']),
        door('exterior.entrance_doors', 'Vchodové dveře (zámek, zavírač, nátěr)'),
        door('exterior.yard_doors', 'Dveře do dvora (zámek, zavírač, nátěr)'),
        door('exterior.common_doors', 'Dveře do společných prostor'),
        door('exterior.intercom', 'Zvonky, domácí telefony'),
        door('exterior.roof', 'Střecha'),
        door('exterior.bird_protection', 'Ochrana proti ptactvu'),
        door('exterior.drainage', 'Dešťové svody, gajgry, hromosvod'),
      ]),
      section('waste', 'Popelnice', 1, [
        item('waste.location_condition', 'Umístění popelnic / stav', 1, [text('location', 'Zapsat umístění'), field('defect', 'Závady', ['Ne', 'Ano'])]),
        item('waste.flats', 'Počet popelnic – byty', 1, [text('count', 'Počet')]),
        item('waste.sorted', 'Počet nádob – tříděný odpad', 1, [text('count', 'Počet')]),
        item('waste.non_residential', 'Počet popelnic – nebyty', 1, [text('count', 'Počet')]),
        one('waste.surroundings', 'Okolí popelnic', 1, ['Čisté', 'Odložený odpad']),
      ]),
      section('common_areas', 'Společné prostory', 1, [
        one('common.mat', 'Rohožka', 1, ['Není', 'Funkční', 'Poškozená']),
        item('common.mailboxes', 'Poštovní schránky', 1, [field('state', 'Stav', ['Nové', 'Funkční', 'Poškozené']), text('count', 'Kolik')]),
        one('common.paint', 'Malba', 1, condition),
        one('common.stairs', 'Schody', 2, ['Zachovalé', 'Poškozené']),
        one('common.railings', 'Zábradlí', 2, ['Zachovalé', 'Poškozené']),
        one('common.elevator', 'Výtah (světlo, stav kabiny)', 2, condition),
        item('common.attic', 'Půda', 2, [field('state', 'Stav', maintained), field('lights', 'Světla', functional)]),
        one('common.cellars', 'Sklepy', 2, maintained),
      ]),
      section('yard', 'Dvůr / zahrádka', 2, [
        one('yard.condition', 'Stav dvora', 2, ['Čistý', 'Neudržovaný', 'Odložený odpad']),
        one('yard.technical', 'Technický stav (povrch, dlažba, vlhkost)', 2, ['Zachovalý', 'Poškozený']),
        one('yard.greenery', 'Stav zeleně', 2, ['Udržovaná', 'Neudržovaná']),
        item('yard.buildings', 'Stavby na dvoře (garáže, NB)', 2, [field('condition', 'Stav', ['Zachovalé', 'Poškozené']), field('defect', 'Závady', ['Ne', 'Ano'])]),
      ]),
      section('lighting', 'Osvětlení', 2, [
        one('lighting.switches', 'Vypínače ve všech patrech', 2, ['Funkční', 'Poškozené']),
        one('lighting.lights', 'Světla ve všech patrech', 2, ['Všechna funkční', 'Některá světla nesvítí', 'Nefunkční komplet']),
        one('lighting.covers', 'Kryty na světlech ve všech patrech', 2, ['Jsou', 'Nejsou']),
        one('lighting.cellar_a', 'Sklep – osvětlení I', 2, ['Funkční', 'Nefunkční komplet', 'Některá světla nesvítí']),
        one('lighting.cellar_b', 'Sklep – osvětlení II', 2, ['Funkční', 'Nefunkční komplet', 'Některá světla nesvítí']),
        one('lighting.distribution_boards', 'Elektrické rozvaděče, zámky', 2, ['Funkční', 'Uzavřené', 'Otevřené']),
      ]),
      section('other', 'Ostatní', 2, [
        item('other.cleaning', 'Úklid (zábradlí, prach, okna, odložený odpad, podlahy)', 2, [text('description', 'Stručný popis')]),
        item('other.notes', 'Poznámky', 2, [text('notes', 'Poznámky')]),
      ]),
      section('meters', 'Měřidla', 2, ['water', 'electricity'].flatMap(type => Array.from({ length: 4 }, (_, i) => ({
        ...item(`meters.${type}_${i + 1}`, `${type === 'water' ? 'Vodoměr' : 'Elektroměr'} č. ${i + 1}`, 2,
          [text('name', 'Název měřidla'), text('serial', 'Číslo měřidla'), text('reading', 'Stav / odečet')]),
        meter: true,
      })))),
    ].map(s=>({...s,items:s.items.map(i=>{
      const details={ 'exterior.street_facade':'Kde, jak:', 'exterior.yard_facade':'Kde, jak:', 'exterior.street_windows':'Jak:', 'exterior.yard_windows':'Jak:', 'exterior.pavlace':'Jak:', 'waste.surroundings':'Popis:', 'common.paint':'Kde:', 'common.railings':'Kde:', 'yard.technical':'Jak:' };
      const detail=details[i.key]||(i.key.startsWith('lighting.')?'Kde:':i.fields.some(f=>f.key==='defect')&&i.key!=='exterior.roof'&&i.key!=='yard.buildings'?'Jaké:':'Poznámka');
      return {...i,detail,help:i.key==='exterior.cultural_objects'?'popis (foto detail i z dálky)':i.key==='lighting.cellar_b'?'Druhý samostatný řádek dle originálního formuláře.':''};
    })}));
  }

  function validate(sections) {
    const items = sections.flatMap(section => section.items);
    if (new Set(sections.map(section => section.key)).size !== sections.length || new Set(items.map(item => item.key)).size !== items.length) throw new Error('Kategorie a objekty musí být jednoznačné.');
    for (const page of [1, 2]) {
      const active = sections.filter(section => section.enabled).map(section => section.items.filter(item => item.enabled && item.page === page)).filter(items => items.length);
      if (active.length + active.flat().length > 40) throw new Error(`Na ${page}. straně PDF je příliš mnoho položek. Přesun nebyl proveden.`);
    }
    return sections;
  }

  function moveSection(sections, key, direction) {
    if (direction !== -1 && direction !== 1) throw new Error('Neplatný směr přesunu.');
    const next = copy(sections);
    const from = next.findIndex(section => section.key === key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= next.length) throw new Error('Kategorii už nelze posunout dál.');
    [next[from], next[to]] = [next[to], next[from]];
    return validate(next);
  }

  function transferItem(sections, key, targetKey) {
    const next = copy(sections);
    const source = next.find(section => section.items.some(item => item.key === key));
    const target = next.find(section => section.key === targetKey);
    if (!source || !target) throw new Error('Objekt nebo kategorie neexistuje.');
    if (source === target) return next;
    const moving = source.items.find(item => item.key === key);
    source.items = source.items.filter(item => item.key !== key);
    target.items.push({ ...moving, page: target.page });
    return validate(next);
  }

  function moveItem(sections, key, direction) {
    if (direction !== -1 && direction !== 1) throw new Error('Neplatný směr přesunu.');
    const next = copy(sections);
    const source = next.find(section => section.items.some(item => item.key === key));
    if (!source) throw new Error('Objekt neexistuje.');
    const from = source.items.findIndex(item => item.key === key);
    const indices = source.items.map((item, i) => item.page === source.items[from].page ? i : -1).filter(i => i >= 0);
    const to = indices[indices.indexOf(from) + direction];
    if (to === undefined) throw new Error('Objekt už nelze posunout dál.');
    [source.items[from], source.items[to]] = [source.items[to], source.items[from]];
    return next;
  }

  function renameItem(sections, key, label) {
    const name = String(label).trim();
    if (name.length < 2 || name.length > 120) throw new Error('Název musí mít 2 až 120 znaků.');
    const next = copy(sections);
    const items = next.flatMap(section => section.items);
    const item = items.find(item => item.key === key);
    if (!item) throw new Error('Objekt neexistuje.');
    if (items.some(other => other.key !== key && normalize(other.label) === normalize(name))) throw new Error('Objekt s tímto názvem už existuje.');
    item.label = name;
    return next;
  }

  function savePhoto(photos, draft) {
    const photo = { ...copy(draft), description: String(draft.description || '').slice(0, 1000) };
    return photos.some(item => item.id === photo.id)
      ? photos.map(item => item.id === photo.id ? photo : copy(item))
      : [...copy(photos), photo];
  }

  const defaultNotifications = () => ({ enabled:true, tomorrow:true, today:true, overdue:true, lockScreen:false, repeatRead:true, leadDays:1, hour:8, minute:0, rolloverHour:6, rolloverMinute:0, repeatDays:1, limit:5 });
  const notificationRanges = { leadDays:[1,30], hour:[0,23], minute:[0,59], rolloverHour:[0,23], rolloverMinute:[0,59], repeatDays:[1,30], limit:[1,8] };
  const validNotifications = values => Object.entries(notificationRanges).every(([key,[min,max]])=>Number.isInteger(values[key])&&values[key]>=min&&values[key]<=max);
  const notificationsDirty = (current,saved) => validNotifications(current)&&Object.keys(notificationRanges).some(key=>current[key]!==saved[key]);
  return { copy, normalize, matchesBuilding, createSections, validate, moveSection, transferItem, moveItem, renameItem, savePhoto, defaultNotifications, notificationsDirty };
})();

if (typeof module !== 'undefined') module.exports = PreviewModel;
