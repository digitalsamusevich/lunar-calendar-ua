#!/usr/bin/env node
// Перевірка згенерованих даних: файли з маніфесту існують, культури відомі,
// у поганий день немає порад садити й немає культур. Падає з кодом 1, якщо щось не так.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const errors = [];

const manifest = read('data/manifest.json');
const plants = read('data/plants.json');
const ids = new Set(plants.plants.map((p) => p.id));
const slugs = new Set();
for (const p of plants.plants) {
	if (!/^[a-z0-9-]+$/.test(p.slug)) errors.push(`plant ${p.id}: bad slug "${p.slug}"`);
	if (slugs.has(p.slug)) errors.push(`plant ${p.id}: duplicate slug "${p.slug}"`);
	slugs.add(p.slug);
	for (const k of ['name_ua', 'name_acc', 'name_gen', 'moon_group', 'windows']) if (!p[k]) errors.push(`plant ${p.id}: missing ${k}`);
}

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
		if (bad && d.recommended.some((r) => /^(Сіяти|Садити|Висаджувати)/.test(r))) errors.push(`${d.date}: planting advice on a ${d.planting_rating} day`);
		if (!d.lunar_day) errors.push(`${d.date}: no lunar day`);
	}
}

if (errors.length) {
	console.error(errors.slice(0, 50).join('\n'));
	console.error(`${errors.length} error(s)`);
	process.exit(1);
}
console.log(`OK: ${manifest.months.length} months, ${days} days, ${ids.size} plants`);
