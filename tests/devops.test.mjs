import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {services,findService,resolveInterest,enquiryHref} from '../app/config/offeringCatalog.ts';
import {serviceNavigation} from '../app/config/offeringNavigation.ts';
import {corporateSolutions} from '../app/config/corporateSolutions.ts';
import {indexableRoutes} from '../app/lib/metadata.ts';
import {capabilities,technologies} from '../app/components/devops/content.ts';
test('DevOps is consistently integrated without replacing the seven original services',()=>{
 assert.equal(services.length,8);assert.equal(capabilities.length,7);assert.equal(new Set(capabilities.map(x=>x.id)).size,7);
 assert.equal(findService('devops-infrastructure').formService,'Technology Consulting');
 const route='/services/devops-infrastructure';assert.ok(serviceNavigation.some(x=>x.href===route));assert.ok(corporateSolutions.some(x=>x.href===route));assert.ok(indexableRoutes.includes(route));
 for(const slug of ['ai-automation','software-development','website-development','business-integrations','mobile-app-development','digital-marketing','technology-consulting'])assert.ok(findService(slug));
 assert.deepEqual(technologies,['Git','GitHub','Ubuntu','Linux','Nginx','Node.js','Next.js','VPS Hosting','SSL/TLS','systemd']);
});
test('DevOps conversion links reuse existing contact and booking interest resolution',()=>{
 for(const booking of [false,true]){const result=resolveInterest('service:devops-infrastructure',booking);assert.equal(result.service,'Technology Consulting');assert.match(result.message,/DevOps & Infrastructure Solutions/);assert.match(enquiryHref('service','devops-infrastructure',booking),booking?/^\/book\?interest=/:/^\/contact\?interest=/);}
});
test('local original hero asset remains lightweight and page makes no live-platform claim',()=>{
 assert.ok(fs.statSync(new URL('../public/images/devops/african-engineering-team.webp',import.meta.url)).size<150000);
 const source=fs.readFileSync(new URL('../app/components/devops/DevOpsService.tsx',import.meta.url),'utf8');assert.match(source,/not a photograph of Monetcore staff/);assert.match(source,/not a claim of an already running managed platform/);assert.doesNotMatch(source,/<form/);
});

test('DevOps review branch is excluded from automatic Vercel Git deployment',()=>{const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));assert.equal(config.git.deploymentEnabled['feature/devops-infrastructure-review-20261105'],false);for(const branch of ['feature/monetcore-vps-completed','feature/phase2-clean-review','feature/review-deployment-automation'])assert.equal(config.git.deploymentEnabled[branch],false);assert.equal(config.git.deploymentEnabled.main,undefined);});
