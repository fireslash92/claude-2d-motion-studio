import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url),'utf8'));
mkdirSync('vendor',{recursive:true});
const requested=process.argv.slice(2); let failed=0;
for(const item of catalog.filter(x=>requested.length?requested.includes(x.id):x.import)){
 const dest=`vendor/${item.id}`; if(existsSync(dest)){console.log('Exists:',dest);continue;}
 const result=spawnSync('git',['clone','--depth','1',item.url+'.git',dest],{stdio:'inherit'});
 if(result.status!==0){failed++;console.error('Failed:',item.id);}
}
if(failed)process.exitCode=1;
