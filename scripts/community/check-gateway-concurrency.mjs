// Dedicated local Docker/PostgreSQL harness only. Never accepts a remote DSN.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile);
const container=process.env.COMMUNITY_TEST_PSQL_DOCKER;
assert.equal(process.env.COMMUNITY_TEST_ISOLATED,'1','Explicitly confirm an isolated test database.');
assert.match(container||'',/^proofwell-community-[a-z0-9-]+$/);
const env={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
const nonce=crypto.randomUUID();
const args=['--host=unix:///var/run/docker.sock','exec',container,'psql','-U','postgres','-tA','-v','ON_ERROR_STOP=1','-c',`set role service_role; select public.community_consume_gateway_nonce('${nonce}'::uuid)->>'accepted';`];
const outputs=await Promise.all(Array.from({length:16},()=>run('docker',args,{env})));
const answers=outputs.map(({stdout})=>stdout.trim().split('\n').at(-1));
assert.equal(answers.filter(value=>value==='true').length,1);assert.equal(answers.filter(value=>value==='false').length,15);
console.log(JSON.stringify({scope:'isolated local PostgreSQL',concurrentRequests:16,accepted:1,replaysRejected:15,sharedDurableNonceStore:true},null,2));
