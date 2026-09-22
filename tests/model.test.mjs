import test from 'node:test';
import assert from 'node:assert/strict';
import model from '../app/model.js';
const find = (sections, key) => sections.flatMap(section => section.items).find(item => item.key === key);

test('approved template: 9 categories, 54 unique objects, valid PDF capacity', () => {
  const sections = model.createSections();
  assert.equal(sections.length, 9);
  assert.deepEqual(sections.map(section => section.items.length), [4,4,13,5,8,4,6,2,8]);
  assert.equal(model.validate(sections), sections);
});
test('category move includes its whole block, preserving existing snapshots', () => {
  const sections = model.createSections();
  const snapshot = model.copy(sections);
  const moved = model.moveSection(sections, 'waste', -1);
  assert.deepEqual(moved[2], sections[3]);
  assert.deepEqual(moved[3], sections[2]);
  assert.deepEqual(sections, snapshot);
});
test('category boundaries and invalid direction are rejected', () => {
  const sections = model.createSections();
  assert.throws(() => model.moveSection(sections, sections[0].key, -1));
  assert.throws(() => model.moveSection(sections, sections.at(-1).key, 1));
  assert.throws(() => model.moveSection(sections, 'missing', 1));
  assert.throws(() => model.moveSection(sections, 'waste', 0));
});
test('transfer preserves identity, fields and enabled state; appends on target PDF page', () => {
  const sections = model.createSections();
  const key = 'outside.house_number';
  find(sections, key).enabled = false;
  const moved = model.transferItem(sections, key, 'yard');
  assert.equal(moved[0].items.length, 3);
  assert.deepEqual(moved.find(section => section.key === 'yard').items.at(-1), { ...find(sections, key), page:2 });
  assert.equal(find(sections, key).page, 1);
});
test('same-category transfer is harmless and missing targets fail', () => {
  const sections = model.createSections();
  assert.deepEqual(model.transferItem(sections, 'waste.flats', 'waste'), sections);
  assert.throws(() => model.transferItem(sections, 'waste.flats', 'missing'));
});
test('capacity failure is atomic', () => {
  let sections = model.createSections();
  const keys = sections.at(-1).items.map(item => item.key);
  let rejected = false;
  for (const key of keys) {
    const before = model.copy(sections);
    try { sections = model.transferItem(sections, key, 'outside_information'); }
    catch { assert.deepEqual(sections, before); rejected = true; break; }
  }
  assert.equal(rejected, true);
});
test('rename keeps position and rejects empty or duplicate labels', () => {
  const sections = model.createSections();
  const changed = model.renameItem(sections, 'waste.flats', 'Nádoby pro byty');
  assert.equal(changed[3].items[1].key, 'waste.flats');
  assert.equal(changed[3].items[1].label, 'Nádoby pro byty');
  assert.throws(() => model.renameItem(sections, 'waste.flats', ' '));
  assert.throws(() => model.renameItem(sections, 'waste.flats', 'Půda'));
});
test('object reorder stays within its PDF page', () => {
  const sections = model.createSections();
  assert.equal(model.moveItem(sections, 'common.paint', -1)[4].items[1].key, 'common.paint');
  assert.throws(() => model.moveItem(sections, 'common.paint', 1));
});
test('prefix search supports full street, numbers and diacritics', () => {
  const building = { street:'Na Výsluní', number:'84' };
  for (const query of ['', 'N', 'Na Vysl', 'na vysluni 8', 'Na Výsluní 84', '8', '84']) assert.equal(model.matchesBuilding(building, query), true, query);
  for (const query of ['4', 'Vysluni', 'Na Výsluní 840', '85']) assert.equal(model.matchesBuilding(building, query), false, query);
});
test('photo captions are independent; new photo starts empty', () => {
  const photos = [{ id:'F001', description:'První' }, { id:'F002', description:'Druhá' }];
  const saved = model.savePhoto(photos, { id:'F001', description:'Změna' });
  assert.equal(saved[0].description, 'Změna');
  assert.equal(saved[1].description, 'Druhá');
  assert.equal(photos[0].description, 'První');
  const added = model.savePhoto(saved, { id:'F003', description:'' });
  assert.equal(added[2].description, '');
  assert.equal(added[1].description, 'Druhá');
});
test('photo descriptions are length bounded', () => {
  assert.equal(model.savePhoto([], { id:'F001', description:'x'.repeat(1100) })[0].description.length, 1000);
});
for (const [key, value] of Object.entries({ leadDays:2, hour:7, minute:15, rolloverHour:5, rolloverMinute:30, repeatDays:2, limit:6 })) {
  test('notification dirty state: ' + key, () => {
    const saved = model.defaultNotifications();
    assert.equal(model.notificationsDirty(saved, saved), false);
    const edited = { ...saved, [key]:value };
    assert.equal(model.notificationsDirty(edited, saved), true);
    assert.equal(model.notificationsDirty(edited, model.copy(edited)), false);
  });
}
test('toggles are immediately applied, only numeric settings use the save button', () => {
  const saved = model.defaultNotifications();
  for (const key of ['enabled','tomorrow','today','overdue','lockScreen','repeatRead'])
    assert.equal(model.notificationsDirty({...saved,[key]:!saved[key]},saved),false);
});
test('any invalid notification parameter prevents saving', () => {
  const saved = model.defaultNotifications();
  for (const patch of [{ leadDays:null }, { leadDays:0 }, { hour:24 }, { limit:9 }, { limit:1.5 }, {minute:60}, {rolloverHour:-1}, {rolloverMinute:60}, {repeatDays:31}])
    assert.equal(model.notificationsDirty({ ...saved, tomorrow:false, ...patch }, saved), false);
});
test('attic, yard, mailboxes and meter field regression checks', () => {
  const sections = model.createSections();
  assert.ok(find(sections, 'common.attic').fields[0].options.includes('Odložený odpad'));
  assert.equal(find(sections, 'common.attic').fields[1].key, 'lights');
  assert.ok(find(sections, 'yard.buildings').fields[0].options.includes('Poškozené'));
  assert.equal(find(sections, 'common.mailboxes').fields.filter(field => field.key === 'count').length, 1);
  assert.equal(find(sections, 'meters.water_2').fields[0].key, 'name');
  assert.equal(find(sections, 'inside.cleaning_record').fields[1].key, 'last_date');
});
