#!/usr/bin/env node
// Перевірка згенерованих даних: файли з маніфесту існують, культури відомі,
// у поганий день немає порад садити й немає культур, культури й поради не суперечать фазі
// та «не рекомендовано», поради в moon_tips — групі культури. Падає з кодом 1, якщо щось не так.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASE_GROUPS, PLANTING, conflicts } from './lib/rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const errors = [];
// Апостроф — лише ’ (U+2019)
const BAD_APOSTROPHE = /[А-Яа-яЄєІіЇїҐґ]['\u02BC][А-Яа-яЄєІіЇїҐґ]/;

const manifest = read('data/manifest.json');
const plants = read('data/plants.json');
const ids = new Set(plants.plants.map((p) => p.id));
const groupOf = Object.fromEntries(plants.plants.map((p) => [p.id, p.moon_group]));
const slugs = new Set();
for (const p of plants.plants) {
	if (!/^[a-z0-9-]+$/.test(p.slug)) errors.push(`plant ${p.id}: bad slug "${p.slug}"`);
	if (slugs.has(p.slug)) errors.push(`plant ${p.id}: duplicate slug "${p.slug}"`);
	slugs.add(p.slug);
	for (const k of ['name_ua', 'name_acc', 'name_gen', 'moon_group', 'windows']) if (!p[k]) errors.push(`plant ${p.id}: missing ${k}`);
	// Перша згадка фази в moon_tips має збігатися з фазою, яку правила дають групі культури
	const tip = /(молод)|(спадн)/i.exec(p.moon_tips ?? '');
	if (tip && !PHASE_GROUPS[tip[1] ? 'waxing' : 'waning'].includes(p.moon_group)) errors.push(`plant ${p.id}: moon_tips «${tip[0]}…» vs moon_group ${p.moon_group}`);
	// «новий місяць» — назва фази (з малої, як в інтерфейсі); Місяць як небесне тіло — з великої
	if (/зростаюч|місяц/.test((p.moon_tips ?? '').replace(/нов[а-яії]+ місяц[а-яії]*/gi, ''))) errors.push(`plant ${p.id}: moon_tips — пишемо «на молодому / на спадному Місяці»`);
}
if (BAD_APOSTROPHE.test(JSON.stringify(plants))) errors.push('plants.json: apostrophe must be ’ (U+2019)');

let days = 0;
let prevDate = null;
for (const m of manifest.months) {
	const cal = read(m.calendar);
	read(m.index);
	for (const d of cal.days) {
		days++;
		if (prevDate && new Date(d.date) - new Date(prevDate) !== 864e5) errors.push(`gap before ${d.date}`);
		prevDate = d.date;
		for (const p of d.plants) if (!ids.has(p.id)) errors.push(`${d.date}: unknown plant ${p.id}`);
		const bad = d.planting_rating === 'bad' || d.planting_rating === 'terrible';
		if (bad && d.plants.length) errors.push(`${d.date}: plants on a ${d.planting_rating} day`);
		if (bad && d.recommended.some((r) => PLANTING.test(r))) errors.push(`${d.date}: planting advice on a ${d.planting_rating} day`);
		if (!d.lunar_day) errors.push(`${d.date}: no lunar day`);
		// Звичайний день (без фази-події й затемнення) має мати хоча б одну пораду
		if (!d.phase_event && !d.eclipse && !d.recommended.length) errors.push(`${d.date}: empty recommended list`);
		const groups = PHASE_GROUPS[d.waxing ? 'waxing' : 'waning'];
		for (const p of d.plants) if (!groups.includes(groupOf[p.id])) errors.push(`${d.date}: ${p.id} (${groupOf[p.id]}) on a ${d.waxing ? 'waxing' : 'waning'} day`);
		if (d.not_recommended.some((n) => /поділ|пересаджув/i.test(n)) && d.plants.some((p) => p.activities.includes('division'))) errors.push(`${d.date}: division while not recommended`);
		for (const r of d.recommended) if (conflicts(r, d.not_recommended)) errors.push(`${d.date}: «${r}» conflicts with not_recommended`);
		// Порада сіяти/садити в саду — лише коли в списку дня є культури (підвіконня — окремо)
		if (!d.plants.length && d.recommended.some((r) => PLANTING.test(r) && !/підвіконн/.test(r))) errors.push(`${d.date}: planting advice without plants`);
		if (BAD_APOSTROPHE.test([d.weekday, d.rating_reason, ...d.recommended, ...d.not_recommended].join(' '))) errors.push(`${d.date}: apostrophe must be ’ (U+2019)`);
	}
}

if (errors.length) {
	console.error(errors.slice(0, 50).join('\n'));
	console.error(`${errors.length} error(s)`);
	process.exit(1);
}
console.log(`OK: ${manifest.months.length} months, ${days} days, ${ids.size} plants`);
