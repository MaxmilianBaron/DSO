import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const baseURL=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
test.beforeAll(async()=>{await fs.mkdir('artifacts/ui',{recursive:true});});
async function login(page,width=411) {
  await page.setViewportSize({width,height:914});
  await page.goto(baseURL+'app/');
  await page.getByTestId('technician-card').click();
  await page.getByTestId('login-button').click();
  await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
}
async function settings(page){await page.locator('[data-route="settings"]').click();}
async function categories(page){await login(page);await settings(page);await page.locator('[data-route="categories"]').click();}
async function screenshot(page,name){await page.screenshot({path:'artifacts/ui/'+name+'.png'});}
test('desktop frame uses Android logical resolution 411 x 914',async({page})=>{
  await page.setViewportSize({width:1280,height:1100});await page.goto(baseURL);
  await expect(page.locator('.phone')).toHaveCSS('width','411px');await expect(page.locator('.phone')).toHaveCSS('height','914px');
  await expect(page.getByText('Digitální Správa Objektů · Android preview')).toBeVisible();
  await screenshot(page,'desktop-android');
});
test('Android typography, bars, buttons, settings grid and both themes',async({page})=>{
  await login(page);
  await expect(page.locator('body')).toHaveCSS('font-family','Roboto, sans-serif');
  await expect(page.locator('body')).toHaveCSS('font-size','16px');
  await expect(page.locator('.topbar')).toHaveCSS('height','64px');
  await expect(page.locator('.system-status')).toHaveCSS('height','30px');
  await expect(page.locator('.topbar__title strong')).toHaveCSS('font-size','22px');
  await expect(page.locator('.topbar__title small')).toHaveText('DSO V1.0');
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  await expect(page.locator('.release-card')).toHaveCount(0);
  await screenshot(page,'android-dashboard-dark');
  await settings(page);
  await expect(page.locator('.menu-tile')).toHaveCount(10);
  await expect(page.locator('.menu-tile__label')).toHaveText(['Aktivní účty','Domy','Export a import','Fotografie','Kontrola dat','Kategorie a objekty','Telefon','Tisk','Upozornění','Změnit heslo']);
  expect(await page.locator('.menu-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(3);
  await expect(page.locator('.bottom-nav')).toHaveCSS('height','80px');
  await screenshot(page,'android-settings-dark');
  await page.getByLabel('Přepnout vzhled').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await screenshot(page,'android-settings-light');
});
test('full street and numeric prefix search opens the selected house',async({page})=>{
  await login(page);await page.locator('[data-route="work"]').click();
  await page.getByLabel('Vyhledat podle ulice nebo čísla').fill('na vysluni 8');
  await expect(page.locator('[data-action="start-inspection"]')).toHaveCount(1);
  await expect(page.locator('#work-results')).toContainText('Na Výsluní 84');
  await page.getByLabel('Vyhledat podle ulice nebo čísla').fill('28');
  await page.locator('[data-action="start-inspection"]').click();
  await expect(page.locator('.topbar__title strong')).toHaveText('Zahradní 28');
  await expect(page.getByText('Rychlá navigace')).toBeVisible();
});
test('inspection opens overview, uses ten tiles and a form-only finish panel',async({page})=>{
  await login(page);await page.locator('[data-action="open-draft"]').click();
  await expect(page.locator('.menu-tile')).toHaveCount(10);
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  await expect(page.locator('.inspection-footer')).toHaveCount(0);
  await screenshot(page,'android-inspection-overview');
  await page.locator('[data-action="open-section"][data-key="waste"]').click();
  await expect(page.locator('.inspection-footer')).toBeVisible();
  await page.locator('[data-field="waste.flats:count"]').fill('2x');
  await expect(page.locator('.inspection-footer small')).toHaveText('51 položek není hotových');
  await expect(page.locator('[data-action="toggle-section"][data-key="waste"] .status-pill')).toHaveText('1/5');
  await page.locator('[data-action="toggle-section"][data-key="common_areas"]').click();
  await expect(page.locator('[data-action="toggle-section"][aria-expanded="true"]')).toHaveCount(1);
  const offset=await page.locator('[data-inspection-section="common_areas"]').evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.scroll').getBoundingClientRect().top);
  expect(Math.abs(offset-12)).toBeLessThan(2);
  await screenshot(page,'android-inspection-form');
  await page.locator('[data-action="toggle-section"][data-key="waste"]').click();
  await expect(page.locator('[data-field="waste.flats:count"]')).toHaveValue('2x');
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await expect(page.getByText('Rychlá navigace')).toBeVisible();
});
test('category blocks move together, transfers preserve identity and existing drafts',async({page})=>{
  await categories(page);
  await expect(page.locator('[data-category]')).toHaveCount(9);
  await expect(page.locator('[data-managed-item]')).toHaveCount(54);
  await screenshot(page,'android-categories-dark');
  const source=page.locator('[data-category="outside_information"]');
  await source.getByRole('button',{name:'Posunout kategorii dolů',exact:true}).click();
  await expect(page.locator('[data-category]').first()).toHaveAttribute('data-category','inside_information');
  await expect(source.locator('[data-managed-item]')).toHaveCount(4);
  await page.locator('[data-managed-item="outside.house_number"] [data-action="transfer-item"]').click();
  await expect(page.locator('[data-action="confirm-transfer"]')).toBeDisabled();
  await page.locator('[data-transfer-target][value="yard"]').check();
  await screenshot(page,'android-transfer-dialog');
  await page.locator('[data-action="confirm-transfer"]').click();
  const moved=page.locator('[data-category="yard"] [data-managed-item]').last();
  await expect(moved).toHaveAttribute('data-managed-item','outside.house_number');
  await moved.getByRole('button',{name:'Upravit',exact:true}).click();
  await page.getByLabel('Název objektu / co se kontroluje',{exact:true}).fill('Nová tabulka');
  await page.locator('[data-action="confirm-rename"]').click();
  await expect(moved.getByRole('heading')).toHaveText('Nová tabulka');
  await page.getByRole('button',{name:'Práce',exact:true}).click();
  await page.getByLabel('Vyhledat podle ulice nebo čísla').fill('28');
  await page.locator('[data-action="start-inspection"]').click();
  await page.locator('[data-action="open-section"][data-key="yard"]').click();
  await expect(page.locator('[data-inspection-item="outside.house_number"] h3')).toHaveText('Nová tabulka');
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await page.getByRole('button',{name:'Rozpracované',exact:true}).click();
  await page.locator('[data-action="open-draft"]').click();
  await page.locator('[data-action="open-section"][data-key="outside_information"]').click();
  await expect(page.locator('[data-inspection-item="outside.house_number"] h3')).toHaveText('Tabulka s č. p.');
});
test('category and object editing supports creation and recoverable trash',async({page})=>{
  await categories(page);await page.locator('[data-action="add-category"]').click();
  await page.getByLabel('Název kategorie',{exact:true}).fill('Zkušební kategorie');
  await page.locator('[data-action="confirm-category"]').click();
  await expect(page.locator('[data-category]')).toHaveCount(10);
  await page.locator('[data-action="add-item"]').click();
  await page.getByLabel('Název objektu / co se kontroluje',{exact:true}).fill('Zkušební objekt');
  await page.locator('[data-transfer-target][value="custom_category_1"]').check();
  await page.locator('[data-action="confirm-rename"]').click();
  const category=page.locator('[data-category="custom_category_1"]');
  await expect(category.locator('[data-managed-item]')).toHaveCount(1);
  await category.getByRole('button',{name:'Smazat kategorii',exact:true}).click();
  await page.locator('[data-action="confirm-remove-template"]').click();
  await expect(page.locator('[data-category]')).toHaveCount(9);
  await page.getByRole('button',{name:'Obnovit',exact:true}).click();
  await expect(category.locator('[data-managed-item]')).toHaveCount(1);
});
test('photo captions are independent and discarded changes do not leak',async({page})=>{
  await login(page);await page.locator('[data-action="open-draft"]').click();
  await page.locator('[data-action="open-section"][data-key="outside_inspection"]').click();
  await page.getByRole('button',{name:'Upravit fotografii F001',exact:true}).click();
  await expect(page.locator('.topbar__title strong')).toHaveText('Kontrola fotografie F001');
  await page.getByLabel('Popis fotografie',{exact:true}).fill('Pouze první <b>snímek</b>');
  await screenshot(page,'android-photo-editor');
  await page.getByRole('button',{name:'Uložit změny',exact:true}).click();
  await expect(page.locator('[data-photo-card="F001"] .photo-caption')).toHaveText('Pouze první <b>snímek</b>');
  await expect(page.locator('[data-photo-card="F001"] .photo-caption b')).toHaveCount(0);
  await expect(page.locator('[data-photo-card="F002"] .photo-caption')).toHaveText('Samostatný popis druhé fotografie');
  await page.locator('[data-action="add-photo"][data-key="exterior.entrance_doors"]').click();
  await page.getByRole('button',{name:'Vyfotit',exact:true}).click();
  await expect(page.getByLabel('Popis fotografie',{exact:true})).toHaveValue('');
  await page.getByLabel('Popis fotografie',{exact:true}).fill('Neukládat');
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await page.getByRole('button',{name:'Zahodit a vrátit se',exact:true}).click();
  await expect(page.locator('[data-photo-card]')).toHaveCount(2);
});
test('mixed-case meter input and repeated missing-photo confirmation',async({page})=>{
  await login(page);await page.locator('[data-action="open-draft"]').click();
  await page.locator('[data-action="open-section"][data-key="meters"]').click();
  await page.locator('[data-field="meters.water_1:serial"]').fill('ABc104');
  await page.locator('[data-field="meters.water_1:reading"]').fill('123,4');
  for(let i=0;i<2;i++){
    await page.locator('[data-action="finish-demo"]').click();
    await expect(page.getByRole('dialog')).toContainText('Uložit bez fotografie?');
    await page.getByRole('button',{name:'Zrušit',exact:true}).click();
  }
  await expect(page.locator('[data-field="meters.water_1:serial"]')).toHaveValue('ABc104');
});
test('notification numeric settings save explicitly, switches immediately',async({page})=>{
  await login(page);await settings(page);await page.locator('[data-route="notifications"]').click();
  const save=page.locator('[data-action="save-notifications"]');
  await expect(save).toBeDisabled();
  await page.locator('[data-notification-toggle="tomorrow"]').uncheck();
  await expect(save).toBeDisabled();
  await page.locator('[data-notification-input="leadDays"]').fill('2');
  await expect(save).toBeEnabled();
  await page.locator('[data-notification-input="hour"]').fill('24');await expect(save).toBeDisabled();
  await page.locator('[data-notification-input="hour"]').fill('7');
  await page.locator('[data-notification-input="rolloverMinute"]').fill('30');
  await save.click();await expect(save).toBeDisabled();
  await screenshot(page,'android-notifications-saved');
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await page.locator('[data-route="notifications"]').click();
  await expect(page.locator('[data-notification-toggle="tomorrow"]')).not.toBeChecked();
  await expect(page.locator('[data-notification-input="rolloverMinute"]')).toHaveValue('30');
  await page.locator('[data-action="open-reminder"][data-building="zahradni"]').click();
  await expect(page.locator('[data-action="start-inspection"]')).toHaveCount(1);
});
test('history selection, cancellation, delete from date, PDF identity',async({page})=>{
  await login(page,320);await page.locator('[data-route="history"]').click();
  await screenshot(page,'android-history-320');
  await page.locator('[data-action="history-delete-mode"]').click();
  await page.locator('[data-history-select="42"]').check();await page.locator('[data-history-select="39"]').check();
  await page.locator('[data-action="history-delete-open"]').click();
  await expect(page.locator('.delete-preview > div')).toHaveCount(2);
  await page.getByRole('button',{name:'Zrušit',exact:true}).click();
  await expect(page.locator('.history-card')).toHaveCount(3);
  await page.locator('[data-action="history-delete-open"]').click();
  await page.getByRole('button',{name:'Smazat natrvalo',exact:true}).click();
  await expect(page.locator('.history-card')).toHaveCount(1);
  await page.locator('[data-route="pdf"]').first().click();
  await expect(page.locator('.topbar__title small')).toHaveText('DSO-2026-0041');
  await page.getByRole('button',{name:'Zpět',exact:true}).click();
  await page.locator('[data-action="history-delete-from-date"]').click();
  await page.getByLabel('Datum včetně').fill('2026-08-05');
  await page.getByRole('button',{name:'Pokračovat',exact:true}).click();
  await page.getByRole('button',{name:'Smazat natrvalo',exact:true}).click();
  await expect(page.locator('.history-card')).toHaveCount(0);
});
for(const width of [320,390,411])test('all main screens fit at '+width+'px without errors or missing assets',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await login(page,width);
  for(const route of ['work','drafts','history','settings','categories']){
    await page.locator('[data-route="'+route+'"]').first().click();
    expect(await page.locator('.scroll').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  }
  await screenshot(page,'android-categories-'+width);
  await page.getByLabel('Přepnout vzhled').click();
  await screenshot(page,'android-categories-light-'+width);
  expect(errors).toEqual([]);
});
test('every settings tile opens the matching screen or dialog',async({page})=>{
  await login(page);await settings(page);
  for(const [route,title] of [['accounts','Aktivní účty'],['buildings','Domy'],['backup','Export a import'],['photo-settings','Fotografie'],['integrity','Kontrola dat'],['device','Telefon'],['print','Tisk']]){
    await page.locator('[data-route="'+route+'"]').click();
    await expect(page.locator('.topbar__title strong')).toHaveText(title);
    await page.getByRole('button',{name:'Zpět',exact:true}).click();
  }
  await page.locator('[data-action="password"]').click();
  await expect(page.getByRole('dialog')).toContainText('Změnit heslo');
  await expect(page.getByLabel('Současné heslo',{exact:true})).toHaveAttribute('readonly','');
});
