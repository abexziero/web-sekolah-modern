import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile,rm,access,readdir} from 'node:fs/promises';
import {resolve,relative,sep,join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd(),preview=resolve(root,'.npm-cache/pages-build');
const basePath=process.env.PAGES_BASE_PATH??'/web-sekolah-modern';
assert.match(basePath,/^(?:\/[a-zA-Z0-9_.-]+)?$/,'Invalid Pages base path');
assert.equal(preview,join(root,'.npm-cache','pages-build'));
assert.ok(preview.startsWith(root+sep));
await rm(preview,{recursive:true,force:true});
await mkdir(preview,{recursive:true});
// Only public application sources are copied; environment files and private routes stay outside this build.
for(const path of ['app','components','lib','public','package.json','tsconfig.json','postcss.config.mjs']){
 await cp(join(root,path),join(preview,path),{recursive:true,filter:source=>! /^(?:app\/(?:admin|api|media)|components\/admin)(?:\/|$)/.test(relative(root,source).split(sep).join('/'))});
}
for(const path of ['app/page.tsx','app/[area]/[slug]/page.tsx']){
 const file=join(preview,path);
 await writeFile(file,(await readFile(file,'utf8')).replace(/export const dynamic\s*=\s*["']force-dynamic["'];?/,'export const dynamic="force-static";'));
}
const article=join(preview,'app/informasi/berita/[slug]/page.tsx');
await writeFile(article,(await readFile(article,'utf8')).replace('import { getPublicNewsBySlug }','import { getPublicNews, getPublicNewsBySlug }')+'\nexport const dynamicParams=false;\nexport async function generateStaticParams(){return (await getPublicNews()).map(article=>({slug:article.id}));}\n');
const layout=join(preview,'app/layout.tsx');
await writeFile(layout,(await readFile(layout,'utf8'))+'\nexport const dynamic="force-static";\n');
const css=join(preview,'app/globals.css');
await writeFile(css,(await readFile(css,'utf8'))+'\n@source "../components";\n@source "../lib";\n@source "./";\n');
await writeFile(join(preview,'app/sitemap.ts'),'export const dynamic="force-static";\nexport default function sitemap(){return [];}\n');
const robots=join(preview,'app/robots.ts');
await writeFile(robots,(await readFile(robots,'utf8'))+'\nexport const dynamic="force-static";\n');
await writeFile(join(preview,'next.config.mjs'),'export default '+JSON.stringify({output:'export',trailingSlash:true,basePath,images:{unoptimized:true},poweredByHeader:false,turbopack:{root},env:{NEXT_PUBLIC_BASE_PATH:basePath}})+';\n');
const child=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'build',preview],{
 cwd:preview,stdio:'inherit',windowsHide:true,
 env:{...process.env,NODE_ENV:'production',DATABASE_NAME:'',DATABASE_USER:'',DATABASE_PASSWORD:'',MARIADB_ROOT_PASSWORD:'',BETTER_AUTH_SECRET:'',BETTER_AUTH_URL:'',NEXT_PUBLIC_BASE_PATH:basePath,SITE_INDEXABLE:'false',SITE_URL:process.env.SITE_URL||'https://abexziero.github.io'}
});
const [code]=await once(child,'exit');
assert.equal(code,0,'Static preview build failed');
const out=join(preview,'out');
await writeFile(join(out,'.nojekyll'),'');
const home=await readFile(join(out,'index.html'),'utf8');
assert.ok(home.includes(basePath+'/images/school.jpg'),'Hero image must use the Pages path');
assert.ok(home.includes(basePath+'/_next/'),'Build assets must use the Pages path');
assert.match(home,/<meta name="robots" content="noindex/);
for(const path of ['admin','api','media','.env.local'])await assert.rejects(access(join(out,path)));
const files=await readdir(out,{recursive:true});
assert.ok(files.filter(path=>path.endsWith('.html')).length>20,'Public topic/article pages must be exported');
console.log(`Pages preview ready: ${out} (${basePath||'/'})`);
