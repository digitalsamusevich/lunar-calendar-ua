#!/usr/bin/env node
// Генератор місячного посівного календаря.
//   node scripts/generate.mjs                       → від поточного місяця на 18 місяців уперед
//   node scripts/generate.mjs --from 2026-01 --to 2027-12
// Пише data/<рік>/<MM>-<month>-calendar.json, ...-index.json і data/manifest.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './lib/astro.mjs';
import * as R from './lib/rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = arg('out') ?? path.join(ROOT, 'data');
const RULES_VERSION = '2.0';

const MONTH_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const WEEKDAY_UA = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];
const ACTIVITY_UA = {
	seedling_indoor: 'сівба на розсаду',
	greenhouse: 'у теплицю',
	open_ground: 'у відкритий ґрунт',
	autumn: 'осіння посадка',
	planting: 'посадка саджанців',
	division: 'поділ і пересадка',
};

// ---------- аргументи ----------

function arg(name) {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : undefined;
}
const now = new Date();
const addMonths = (y, m, n) => {
	const d = new Date(Date.UTC(y, m - 1 + n, 1));
	return [d.getUTCFullYear(), d.getUTCMonth() + 1];
};
const parseYm = (s) => s.split('-').map(Number);
const [fromY, fromM] = arg('from') ? parseYm(arg('from')) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
const [toY, toM] = arg('to') ? parseYm(arg('to')) : addMonths(fromY, fromM, 17);

// ---------- культури ----------

const plantsDb = JSON.parse(fs.readFileSync(arg('plants') ?? path.join(DATA, 'plants.json'), 'utf8'));
if (plantsDb.meta?.version?.startsWith('1')) throw new Error('plants.json v1 не підтримується — потрібна схема 2.x (windows, moon_group).');
const plants = plantsDb.plants;

const md = (iso) => iso.slice(5); // 'MM-DD'
function activeWindows(plant, iso) {
	const d = md(iso);
	return plant.windows.filter((w) => w.start <= d && d <= w.end).map((w) => w.type);
}

// ---------- астрономія на весь період (+запас для місячних днів і сусідніх нових місяців) ----------

const pad = 45 * S.DAY;
const periodStart = new Date(+S.kyivMidnight(`${fromY}-${String(fromM).padStart(2, '0')}-01`) - pad);
const [endY, endM] = addMonths(toY, toM, 1);
const periodEnd = new Date(+S.kyivMidnight(`${endY}-${String(endM).padStart(2, '0')}-01`) + pad);

console.log(`Astronomy ${periodStart.toISOString().slice(0, 10)} … ${periodEnd.toISOString().slice(0, 10)}`);
const quarters = S.quarters(periodStart, periodEnd);
const newMoons = quarters.filter((q) => q.type === 'new_moon').map((q) => q.time);
const { rises, sets } = S.riseSetEvents(periodStart, periodEnd);
const eclipses = S.eclipses(periodStart, periodEnd);
const ingresses = S.signIngresses(periodStart, periodEnd);
const lunarDay = S.lunarDayCounter(newMoons, rises);

const inRange = (t, a, b) => t >= a && t < b;
const hhmm = (t) => S.kyiv(t).time;
const isoOf = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function buildDay(y, m, d) {
	const date = isoOf(y, m, d);
	const m0 = S.kyivMidnight(date);
	const [ny, nm, nd] = (() => {
		const t = new Date(Date.UTC(y, m - 1, d + 1));
		return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
	})();
	const m1 = S.kyivMidnight(isoOf(ny, nm, nd));

	// Знак дня — той, у якому Місяць опівдні (у робочий час), а не на 00:00:
	// якщо знак змінюється о 01:54, увесь день фактично проходить уже в новому знаку.
	const noon = new Date(+m0 + 12 * S.HOUR);
	const sign = S.SIGNS[S.signIndexAt(noon)];
	const signInfo = R.SIGN_INFO[sign];
	const signAtStart = S.SIGNS[S.signIndexAt(new Date(+m0 + 60e3))];
	const change = ingresses.find((g) => inRange(g.time, m0, m1));

	const event = quarters.find((q) => inRange(q.time, m0, m1));
	const angle = S.phaseAngle(noon);
	const phase = event ? event.type : angle < 180 ? 'waxing' : 'waning';
	const nearNewMoon = !event?.type?.startsWith('new') && newMoons.some((t) => inRange(t, new Date(+m0 - S.DAY), new Date(+m1 + S.DAY)));
	const eclipse = eclipses.find((e) => inRange(e.time, m0, m1)) ?? null;

	// Послідовність місячних днів протягом доби: 28-29-1 тощо
	const marks = [new Date(+m0 + 60e3), ...[...rises, ...newMoons].filter((t) => inRange(t, m0, m1)).sort((a, b) => a - b).map((t) => new Date(+t + 60e3))];
	const seq = [];
	for (const t of marks) {
		const v = lunarDay(t);
		if (v && seq[seq.length - 1] !== v) seq.push(v);
	}

	const phaseEvent = event?.type === 'new_moon' || event?.type === 'full' ? event.type : null;
	const { rating, reason } = R.rateDay({ sign, phaseEvent, nearNewMoon, eclipse });
	const works = R.worksForDay({ sign, phase: angle < 180 ? 'waxing' : 'waning', phaseEvent, eclipse, month: m, rating });

	const dayPlants = [];
	for (const p of plants) {
		const acts = activeWindows(p, date);
		if (!acts.length) continue;
		if (R.plantFits(p.moon_group, { rating, phase: angle < 180 ? 'waxing' : 'waning', sign })) {
			dayPlants.push({ id: p.id, activities: acts });
		}
	}

	const rise = rises.find((t) => inRange(t, m0, m1));
	const set = sets.find((t) => inRange(t, m0, m1));
	const weekday = WEEKDAY_UA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

	return {
		date,
		day: d,
		weekday,
		lunar_day: seq.join('-'),
		lunar_days: seq,
		moon_phase: phase,
		moon_phase_ua: R.PHASE_UA[phase],
		phase_event: event ? { type: event.type, time: hhmm(event.time) } : null,
		illumination: S.illumination(noon),
		waxing: angle < 180,
		moon_sign: sign,
		moon_sign_ua: signInfo.ua,
		moon_sign_symbol: signInfo.symbol,
		element: signInfo.element,
		sign_at_start: signAtStart,
		sign_at_start_ua: R.SIGN_INFO[signAtStart].ua,
		sign_change: change ? { time: hhmm(change.time), to: change.sign, to_ua: R.SIGN_INFO[change.sign].ua } : null,
		moonrise: rise ? hhmm(rise) : null,
		moonset: set ? hhmm(set) : null,
		eclipse: eclipse ? { body: eclipse.body, kind: eclipse.kind, time: hhmm(eclipse.time) } : null,
		planting_rating: rating,
		rating_reason: reason,
		recommended: works.recommended,
		not_recommended: works.not_recommended,
		sign_works: works.sign_works,
		phase_works: works.phase_works,
		plants: dayPlants,
		// сумісність зі схемою 1.x
		plants_possible: dayPlants.map((x) => plants.find((p) => p.id === x.id).name_ua),
	};
}

function buildMonth(y, m) {
	const nDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
	const days = Array.from({ length: nDays }, (_, i) => buildDay(y, m, i + 1));

	const byRating = Object.fromEntries(R.RATINGS.map((r) => [r, []]));
	for (const d of days) {
		byRating[d.planting_rating].push({ day: d.day, date: d.date, weekday: d.weekday, moon_sign_ua: d.moon_sign_ua, moon_phase_ua: d.moon_phase_ua });
	}
	const byPlant = {};
	for (const d of days) {
		for (const p of d.plants) {
			(byPlant[p.id] ??= []).push({ day: d.day, date: d.date, rating: d.planting_rating, activities: p.activities, moon_sign_ua: d.moon_sign_ua, moon_phase_ua: d.moon_phase_ua });
		}
	}

	const meta = {
		year: y,
		month: m,
		month_name_ua: MONTH_UA[m - 1],
		generated_at: new Date().toISOString(),
		rules_version: RULES_VERSION,
		source: 'Власний розрахунок (astronomy-engine) і правила традиційного місячного садівництва',
		timezone: S.TZ,
		observer: 'Київ (50.45° пн. ш., 30.52° сх. д.)',
		phases: days.filter((d) => d.phase_event).map((d) => ({ date: d.date, ...d.phase_event })),
		eclipses: days.filter((d) => d.eclipse).map((d) => ({ date: d.date, ...d.eclipse })),
		tasks: R.MONTH_TASKS[m],
		rating_counts: Object.fromEntries(R.RATINGS.map((r) => [r, byRating[r].length])),
	};

	return {
		calendar: { meta, days },
		index: { meta: { year: y, month: m }, by_plant: byPlant, by_rating: byRating, rating_labels_ua: R.RATING_UA, activity_labels_ua: ACTIVITY_UA },
	};
}

// ---------- запис ----------

const manifest = { generated_at: new Date().toISOString(), rules_version: RULES_VERSION, timezone: S.TZ, months: [] };
for (let [y, m] = [fromY, fromM]; y < toY || (y === toY && m <= toM); [y, m] = addMonths(y, m, 1)) {
	const { calendar, index } = buildMonth(y, m);
	const dir = path.join(DATA, String(y));
	fs.mkdirSync(dir, { recursive: true });
	const base = `${String(m).padStart(2, '0')}-${MONTH_EN[m - 1]}`;
	fs.writeFileSync(path.join(dir, `${base}-calendar.json`), JSON.stringify(calendar, null, 2) + '\n');
	fs.writeFileSync(path.join(dir, `${base}-index.json`), JSON.stringify(index, null, 2) + '\n');
	manifest.months.push({ year: y, month: m, calendar: `data/${y}/${base}-calendar.json`, index: `data/${y}/${base}-index.json` });
	const c = calendar.meta.rating_counts;
	console.log(`${y}-${String(m).padStart(2, '0')}: excellent ${c.excellent}, good ${c.good}, normal ${c.normal}, bad ${c.bad}, terrible ${c.terrible}`);
}
fs.writeFileSync(path.join(DATA, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${manifest.months.length} months`);
