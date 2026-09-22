# DSO — Digitální správa objektů

Offline Android aplikace pro technické kontroly a správu objektů.

[Otevřít interaktivní Android preview V104](https://maxmilianbaron.github.io/DSO/)

## Náhled Android rozhraní

Mobilní náhled používá stejné rozměry komponent, palety, Roboto, serifové nadpisy a Material ikony jako aplikace. Rámeček má logické rozlišení 411 × 914 bodů. Na menším zařízení se rozhraní přizpůsobí dostupné šířce.

- Přihlášení, hlavní nabídka, Práce, Rozpracované a Historie.
- Nastavení v třech sloupcích, přehled kontroly s deseti navigačními dlaždicemi.
- 9 výchozích kategorií a 54 kontrolních objektů; řazení, přesouvání, úpravy a koš.
- Nové kontroly používají upravenou šablonu, rozpracovaná ukázka si drží vlastní otisk.
- Vyhledávání od prvního znaku celé ulice nebo čísla, bez ohledu na diakritiku.
- Automatické sbalení předchozí sekce a posun nové sekce nahoru.
- Samostatné popisy fotografií, označení, zrušení neuložených úprav.
- Měřidla s názvem, číslem a odečtem; potvrzení chybějící fotografie při dokončování.
- Upozornění s nastavitelnými časy, přepínači a seznamem restů.
- Výběrové mazání protokolů i mazání od data s potvrzením.
- Světlý a tmavý vzhled, dialogy a spodní navigace podle Androidu.

## Hranice ukázky

Jde o statické interaktivní rozhraní, nikoli webovou verzi produkční aplikace. Používá výhradně fiktivní záznamy a ilustrační fotografie. Změny dat zůstávají v otevřené stránce a obnovení vrátí výchozí ukázku. Ukládá se pouze preference světlého/tmavého vzhledu.

Systémová oprávnění, přihlášení skutečného uživatele, správa domů a účtů, fotoaparát, čtečka, galerie, databáze, notifikace, generování a komprese PDF, tisk a šifrované zálohy vyžadují Android aplikaci. Jejich ovládací prvky otevírají informační dialog; nic neodesílají ani nemění produkční data. Heslová pole jsou pouze vizuální a nelze do nich zadat skutečné údaje. PDF je ilustrace, ne výstup Android rendereru.

Webové vykreslení a systémové prvky se mohou nepatrně lišit podle rozlišení, systémového písma a jeho nastaveného zvětšení. Náhled používá výchozí měřítko písma.

Repozitář neobsahuje produkční zdrojový kód, databáze, přístupové údaje ani instalační balíčky. Nezadávejte zákaznické nebo jiné soukromé údaje.

## Spuštění a testy

Node.js 22 nebo novější:

```sh
node scripts/serve-demo.mjs 4174
node --test tests/*.test.mjs
node scripts/build-preview.mjs
```

Server poslouchá pouze na lokální adrese. Balíček pro Pages vzniká do prázdného adresáře `_site/` a obsahuje jen veřejné runtime soubory. UI regresní scénáře v `e2e/` se ověřují v GitHub Actions v šířkách 320, 390 a 411 bodů. Zachycují také snímky obou barevných režimů.

## Licence

Viz [LICENSE](LICENSE). Písma Roboto a Noto Serif a Material ikony mají vlastní licence přiložené v `assets/`.
