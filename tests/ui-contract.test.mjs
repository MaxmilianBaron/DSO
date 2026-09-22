import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
test('all referenced runtime modules and bundled Android fonts exist',()=>{
  const loader=readFileSync(new URL('app/app.js',root),'utf8');
  for(const [,name] of loader.matchAll(/\.\/([a-z-]+\.js)\?v=/g))assert.ok(existsSync(new URL('app/'+name,root)),name);
  const css=readFileSync(new URL('app/styles.css',root),'utf8');
  for(const [,name] of css.matchAll(/\.\.\/assets\/fonts\/([^']+)/g))assert.ok(existsSync(new URL('assets/fonts/'+name,root)),name);
});
test('all runtime scripts parse and publish no remote data endpoints',()=>{
  for(const name of ['model','core','features','screens','admin','dialogs','runtime']){
    const code=readFileSync(new URL('app/'+name+'.js',root),'utf8');
    assert.doesNotThrow(()=>new vm.Script(code,{filename:name}));
    assert.doesNotMatch(code,/https?:\/\//);
    assert.doesNotMatch(code,/navigator\.(mediaDevices|geolocation)|Notification\.requestPermission|XMLHttpRequest/);
  }
});
test('native visual contracts remain stable',()=>{
  const css=readFileSync(new URL('app/styles.css',root),'utf8');
  for(const token of ['font-size:16px','font:700 22px/28px','flex:0 0 64px','height:80px','grid-template-columns:repeat(3,minmax(0,1fr))','width:56px; height:56px','width:52px; height:32px','padding:14px','border-radius:26px']){
    assert.ok(css.includes(token),token);
  }
  assert.doesNotMatch(css,/Segoe UI|Georgia/);
});
