// Explicit isolated Docker database only; no remote connection strings accepted.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile), container=process.env.COMMUNITY_TEST_PSQL_DOCKER;
assert.equal(process.env.COMMUNITY_TEST_ISOLATED,'1');assert.match(container||'',/^proofwell-community-[a-z0-9-]+$/);
const env={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
const sql=async text=>(await run('docker',['--host=unix:///var/run/docker.sock','exec',container,'psql','-U','postgres','-tAq','-v','ON_ERROR_STOP=1','-c',text],{env})).stdout.trim().split('\n').at(-1);
const actor=crypto.randomUUID(), k='/science/does-red-light-therapy-work';let poll;let inserted=false;
try {
 poll=await sql(`select id from public.community_polls where article_key='${k}' and active;`);assert.match(poll,/^[0-9a-f-]{36}$/);
 await sql(`insert into auth.users(id,is_anonymous) values('${actor}',true); insert into public.community_votes(poll_id,user_id,option_id,created_at) values('${poll}','${actor}','regularly',now()-interval '91 days');`);
 inserted=true;
 const results=await Promise.all(Array.from({length:24},(_,i)=> i%3===0 ? sql('set role service_role; select public.community_maintenance(false)->>\'dry_run\';') : i%3===1 ? sql(`set role service_role; select public.community_submit('${k}','${actor}',repeat('a',64),'poll','{"pollId":"${poll}","option":"occasionally"}')->>'accepted';`) : sql(`set role service_role; select public.community_read('${k}')->'poll'->>'total';`)));
 const votes=results.filter((_,i)=>i%3===1);assert.equal(votes.filter(x=>x==='true').length,1);assert.equal(votes.filter(x=>x==='false').length,7);
 assert.ok(results.filter((_,i)=>i%3===2).every(x=>['1','2'].includes(x)),'Readers never observe zero/double-counted archival state');
 assert.equal(await sql(`select public.community_read('${k}')->'poll'->>'total';`),'2');
 assert.equal(await sql(`select responses from public.community_vote_totals where poll_id='${poll}' and option_id='regularly';`),'1');
 console.log('24 concurrent cleanup/read/re-vote requests: archive counted once, 1 accepted and 7 duplicate votes, consistent reads, no deadlocks.');
} finally {
 if(inserted)await sql(`delete from auth.users where id='${actor}';`);
 if(inserted && poll)await sql(`delete from public.community_vote_totals where poll_id='${poll}';`);
}
