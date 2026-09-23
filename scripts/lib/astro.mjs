// Астрономія Місяця для календаря: фази, знак зодіаку, місячні дні, схід/захід, затемнення.
// Усе рахується з astronomy-engine (точність — хвилини), час — київський (Europe/Kyiv, з переходом на літній час).
import * as A from 'astronomy-engine';

export const TZ = 'Europe/Kyiv';
// Спостерігач — Київ. Схід/захід Місяця для інших міст України відрізняється на ±20–30 хв.
export const OBSERVER = new A.Observer(50.45, 30.52, 170);

export const SIGNS = [
	'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
	'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const HOUR = 3600e3;
const DAY = 24 * HOUR;

// ---------- Час (Київ) ----------

const partsFmt = new Intl.DateTimeFormat('en-GB', {
	timeZone: TZ,
	year: 'numeric', month: '2-digit', day: '2-digit',
	hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Date → { date: 'YYYY-MM-DD', time: 'HH:MM' } за Києвом */
export function kyiv(d) {
	const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
	return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** 'YYYY-MM-DD' → Date (UTC-момент київської опівночі цього дня) */
export function kyivMidnight(iso) {
	const [y, m, d] = iso.split('-').map(Number);
	for (const off of [2, 3]) {
		const t = new Date(Date.UTC(y, m - 1, d) - off * HOUR);
		const k = kyiv(t);
		if (k.date === iso && k.time === '00:00') return t;
	}
	throw new Error(`Cannot resolve Kyiv midnight for ${iso}`);
}

// ---------- Знак зодіаку (тропічний, як у традиційних місячних календарях) ----------

export function signIndexAt(t) {
	const lon = A.Ecliptic(A.GeoVector(A.Body.Moon, t, true)).elon;
	return Math.floor((((lon % 360) + 360) % 360) / 30);
}

/** Моменти входу Місяця в новий знак у проміжку [from, to) з точністю до хвилини. */
export function signIngresses(from, to) {
	const out = [];
	let prevT = from;
	let prev = signIndexAt(from);
	for (let t = new Date(+from + HOUR); t <= to; t = new Date(+t + HOUR)) {
		const cur = signIndexAt(t);
		if (cur !== prev) {
			let lo = +prevT;
			let hi = +t;
			while (hi - lo > 30e3) {
				const mid = (lo + hi) / 2;
				if (signIndexAt(new Date(mid)) === prev) lo = mid;
				else hi = mid;
			}
			out.push({ time: new Date(hi), sign: SIGNS[cur] });
			prev = cur;
		}
		prevT = t;
	}
	return out;
}

// ---------- Фази ----------

const QUARTER = ['new_moon', 'first_quarter', 'full', 'third_quarter'];

/** Усі головні фази (новий місяць, перша чверть, повня, остання чверть) у проміжку. */
export function quarters(from, to) {
	const out = [];
	let q = A.SearchMoonQuarter(from);
	while (q.time.date < to) {
		out.push({ type: QUARTER[q.quarter], time: q.time.date });
		q = A.NextMoonQuarter(q);
	}
	return out;
}

/** Освітленість диска, % (0–100) */
export const illumination = (t) => Math.round(A.Illumination(A.Body.Moon, t).phase_fraction * 100);

/** Фазовий кут 0..360: 0 — новий місяць, 180 — повня */
export const phaseAngle = (t) => A.MoonPhase(t);

// ---------- Схід / захід ----------

export function riseSetEvents(from, to) {
	const rises = [];
	const sets = [];
	for (const [dir, list] of [[+1, rises], [-1, sets]]) {
		let t = from;
		for (;;) {
			const e = A.SearchRiseSet(A.Body.Moon, OBSERVER, dir, t, (to - t) / DAY + 1);
			if (!e || e.date >= to) break;
			list.push(e.date);
			t = new Date(+e.date + 60e3);
		}
	}
	return { rises, sets };
}

// ---------- Затемнення ----------

export function eclipses(from, to) {
	const out = [];
	let le = A.SearchLunarEclipse(from);
	while (le.peak.date < to) {
		out.push({ body: 'moon', kind: le.kind, time: le.peak.date });
		le = A.NextLunarEclipse(le.peak);
	}
	let se = A.SearchGlobalSolarEclipse(from);
	while (se.peak.date < to) {
		out.push({ body: 'sun', kind: se.kind, time: se.peak.date });
		se = A.NextGlobalSolarEclipse(se.peak);
	}
	return out.sort((a, b) => a.time - b.time);
}

// ---------- Місячні дні ----------

/**
 * Традиційний відлік: 1-й місячний день починається в момент нового місяця,
 * кожен наступний — зі сходом Місяця. Повертає функцію t → номер місячного дня.
 */
export function lunarDayCounter(newMoons, rises) {
	return (t) => {
		let nm = null;
		for (const n of newMoons) {
			if (n <= t) nm = n;
			else break;
		}
		if (!nm) return null;
		let count = 0;
		for (const r of rises) if (r > nm && r <= t) count++;
		return 1 + count;
	};
}

export { DAY, HOUR };
