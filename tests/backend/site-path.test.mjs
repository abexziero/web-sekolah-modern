import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sitePath} from '../../lib/site-path.ts';

test('preview paths prefix local URLs once and preserve external links and anchors',()=>{
 const previous=process.env.NEXT_PUBLIC_BASE_PATH;
 try{
  delete process.env.NEXT_PUBLIC_BASE_PATH;
  assert.equal(sitePath('/images/school.jpg'),'/images/school.jpg');
  process.env.NEXT_PUBLIC_BASE_PATH='/web-sekolah-modern';
  assert.equal(sitePath('/images/school.jpg'),'/web-sekolah-modern/images/school.jpg');
  assert.equal(sitePath('/#kontak'),'/web-sekolah-modern/#kontak');
  for(const path of ['/web-sekolah-modern/','/web-sekolah-modern/#kontak','#profil','https://example.test/photo.jpg','//example.test/photo.jpg','mailto:test@example.test'])assert.equal(sitePath(path),path);
 }finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_BASE_PATH;else process.env.NEXT_PUBLIC_BASE_PATH=previous;}
});
