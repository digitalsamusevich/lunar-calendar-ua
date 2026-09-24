// Правила традиційного місячного садівництва + власні тексти порад.
// Логіка:
//   1) базовий рейтинг дня — за родючістю знаку, в якому Місяць опівдні;
//   2) новий місяць, повня й затемнення — найгірші дні, дні поруч із новим місяцем — на рівень гірші;
//   3) Місяць, що росте, — для культур із надземним урожаєм (зокрема квітів із насіння),
//      спадний — для коренеплодів, цибулинних (зокрема цибулинних квітів) і саджанців дерев та кущів;
//   4) стихія знаку (вода/земля/повітря/вогонь) підказує, для якої частини рослини день найкращий;
//   5) порада «сіяти/садити» з’являється, лише якщо цього дня в списку є відповідна культура
//      (підходять фаза, рейтинг і агрономічні строки) — так порада не суперечить ні фазі, ні сезону.

export const RATINGS = ['terrible', 'bad', 'normal', 'good', 'excellent'];
export const RATING_UA = {
	excellent: 'Відмінний',
	good: 'Гарний',
	normal: 'Нейтральний',
	bad: 'Поганий',
	terrible: 'Несприятливий',
};

export const PHASE_UA = {
	waxing: 'Молодий (росте)',
	waning: 'Спадний',
	new_moon: 'Новий місяць',
	first_quarter: 'Перша чверть',
	full: 'Повня',
	third_quarter: 'Остання чверть',
};

export const ELEMENT_UA = { water: 'вода', earth: 'земля', air: 'повітря', fire: 'вогонь' };

// Яку частину рослини «підтримує» стихія знаку (біодинамічна традиція)
export const ELEMENT_GROUP = { water: 'leaf', earth: 'root', air: 'flower', fire: 'fruit' };
export const GROUP_UA = {
	fruit: 'плодові й насіннєві',
	leaf: 'листові',
	root: 'коренеплоди й бульби',
	bulb: 'цибулинні',
	flower: 'квіти',
	tree_shrub: 'дерева й кущі',
};

/** Для яких груп культур підходить фаза Місяця */
export const PHASE_GROUPS = {
	waxing: ['fruit', 'leaf', 'flower'],
	waning: ['root', 'bulb', 'tree_shrub'],
};

// Порада про посів чи посадку. Показуємо її, лише якщо в списку культур дня є відповідна:
//   g — групи moon_group, cat — категорії plants.json, ids — культури, a — види робіт (windows.type),
//   seedling — лише культури, які вирощують через розсаду;
//   list — дописати до тексту назви знайдених культур, щоб не радити того, що зараз не садять;
//   home — робота на підвіконні: зважаємо лише на фазу (групи g).
const job = (t, tag) => ({ t, ...tag });
const VEG = ['solanaceae', 'cucurbit', 'melon', 'brassica', 'root', 'bulb', 'legume', 'leafy', 'cereal', 'perennial', 'herb'];
const ORCHARD = ['berry', 'vines', 'fruit_trees'];
const SEEDLINGS = job('Висаджувати розсаду', { a: ['greenhouse', 'open_ground'], seedling: true });
const ONION_GARLIC = job('Садити', { ids: ['garlic', 'onion', 'shallot'], a: ['open_ground', 'autumn'], list: true });
const FLOWER_BULBS = ['tulip', 'daffodil', 'hyacinth', 'crocus', 'lily', 'gladiolus', 'dahlia'];

export const SIGN_INFO = {
	Aries: {
		ua: 'Овен', gen: 'Овні', symbol: '♈', element: 'fire', base: 'bad',
		why: 'Овен — неплідний знак: насіння сходить погано, рослини слабкі.',
		rec: ['Прополювати й розпушувати ґрунт', 'Боротися зі шкідниками й хворобами', 'Збирати овочі та зелень для швидкого вживання', 'Сушити трави, гриби й фрукти'],
		not: ['Сіяти й пересаджувати', 'Рясно поливати й підживлювати'],
		winter: ['Перебирати й перевіряти насіння', 'Провітрювати сховище з овочами'],
	},
	Taurus: {
		ua: 'Телець', gen: 'Тельці', symbol: '♉', element: 'earth', base: 'good',
		why: 'Телець — родючий земний знак: рослини ростуть повільно, зате міцні й добре зберігаються.',
		rec: [job('Садити коренеплоди й бульби для зберігання', { g: ['root'], cat: ['root', 'solanaceae', 'perennial'] }), SEEDLINGS, job('Садити саджанці дерев і кущів', { g: ['tree_shrub'] }), 'Вносити органічні добрива', 'Укорінювати живці'],
		not: ['Глибоко перекопувати біля коріння', 'Обрізати коріння під час пересадки'],
		winter: [job('Сіяти на розсаду культури з тривалим вегетаційним періодом', { a: ['seedling_indoor'] }), 'Підживлювати кімнатні рослини'],
	},
	Gemini: {
		ua: 'Близнюки', gen: 'Близнюках', symbol: '♊', element: 'air', base: 'normal',
		why: 'Близнюки — малородючий знак, але добрий для витких і в’юнких рослин.',
		// у нейтральний день Близнюків (повітря) підходять лише квіти — тож і порада про квіти
		rec: [job('Сіяти й садити квіти, особливо виткі й в’юнкі', { g: ['flower'] }), 'Прополювати й розпушувати', 'Збирати лікарські трави'],
		not: ['Рясно поливати', 'Вносити мінеральні добрива'],
		winter: [job('Сіяти мікрозелень на підвіконні', { home: true, g: ['leaf'] }), 'Розпушувати ґрунт у горщиках'],
	},
	Cancer: {
		ua: 'Рак', gen: 'Раку', symbol: '♋', element: 'water', base: 'excellent',
		why: 'Рак — один із найродючіших знаків: насіння дружно сходить, рослини соковиті.',
		rec: [job('Сіяти й висаджувати овочі та зелень', { g: ['fruit', 'leaf'], cat: VEG }), 'Поливати', 'Вносити мінеральні добрива', 'Щеплювати плодові дерева'],
		not: ['Обробляти рослини хімічними препаратами', 'Закладати врожай на тривале зберігання', 'Садити картоплю — бульби будуть водянисті'],
		winter: [job('Сіяти на розсаду', { ids: ['pepper_sweet', 'pepper_hot', 'eggplant', 'celery'], a: ['seedling_indoor'], list: true }), 'Поливати й підживлювати розсаду'],
	},
	Leo: {
		ua: 'Лев', gen: 'Леві', symbol: '♌', element: 'fire', base: 'bad',
		why: 'Лев — найбільш неплідний знак: посіяне погано сходить.',
		rec: ['Збирати фрукти, ягоди й насіння', 'Сушити й заготовляти', 'Мульчувати й прополювати', 'Косити газон — повільніше відростатиме'],
		not: ['Сіяти й садити', 'Пересаджувати', 'Поливати'],
		winter: ['Заготовляти сухі суміші для посіву', 'Перевіряти запаси на гниль'],
	},
	Virgo: {
		ua: 'Діва', gen: 'Діві', symbol: '♍', element: 'earth', base: 'good',
		why: 'Діва — знак, сприятливий для квітів і декоративних рослин; овочі на насіння — гірше.',
		rec: [
			job('Сіяти й пересаджувати квіти та декоративні рослини', { g: ['flower'] }),
			job('Садити', { ids: FLOWER_BULBS, a: ['open_ground', 'autumn'], list: true }),
			job('Ділити кущі багаторічників', { a: ['division'] }),
			job('Садити плодові дерева й кущі', { g: ['tree_shrub'], cat: ORCHARD }),
			'Укорінювати живці',
		],
		not: ['Сіяти овочі на насіння', 'Замочувати насіння'],
		winter: ['Пересаджувати кімнатні рослини', job('Сіяти квіти на розсаду: петунію, лобелію', { ids: ['petunia'], a: ['seedling_indoor'] })],
	},
	Libra: {
		ua: 'Терези', gen: 'Терезах', symbol: '♎', element: 'air', base: 'good',
		why: 'Терези — помірно родючий знак, найкращий для квітів, зокрема цибулинних.',
		rec: [
			job('Сіяти й садити квіти', { g: ['flower'] }),
			job('Садити', { ids: ['rose', ...FLOWER_BULBS], a: ['open_ground', 'autumn', 'planting'], list: true }),
			job('Висаджувати плодові дерева й кущі', { g: ['tree_shrub'], cat: ORCHARD }),
			'Збирати врожай для зберігання',
			'Вносити мінеральні добрива',
		],
		not: ['Вносити свіжий гній', 'Обробляти від шкідників'],
		winter: [job('Сіяти квіти на розсаду', { g: ['flower'], a: ['seedling_indoor'] }), 'Планувати клумби й квітники'],
	},
	Scorpio: {
		ua: 'Скорпіон', gen: 'Скорпіоні', symbol: '♏', element: 'water', base: 'excellent',
		why: 'Скорпіон — дуже родючий знак: рослини отримують міцне коріння й стійкість до хвороб.',
		rec: [job('Сіяти й садити овочі та зелень', { g: ['fruit', 'leaf'], cat: VEG }), SEEDLINGS, ONION_GARLIC, 'Щеплювати', 'Поливати й підживлювати'],
		not: ['Розмножувати поділом коренів і бульб — можуть загнити', 'Обрізати дерева'],
		winter: [job('Сіяти на розсаду', { ids: ['tomato', 'pepper_sweet', 'pepper_hot'], a: ['seedling_indoor'], list: true }), 'Підживлювати розсаду'],
	},
	Sagittarius: {
		ua: 'Стрілець', gen: 'Стрільці', symbol: '♐', element: 'fire', base: 'normal',
		why: 'Стрілець — малородючий знак: підходить хіба що для бобових і високорослих культур.',
		// у нейтральний день Стрільця (вогонь) підходять лише плодові — бобові, кукурудза, соняшник
		rec: [job('Сіяти', { ids: ['pea', 'broad_bean', 'bean', 'bean_asparagus', 'corn', 'sunflower'], a: ['open_ground'], list: true }), 'Косити й збирати насіння', 'Прополювати'],
		not: ['Пересаджувати', 'Рясно поливати', 'Обрізати'],
		winter: [job('Виганяти зелену цибулю на підвіконні', { home: true, g: ['leaf'] }), 'Перевіряти насіння на схожість'],
	},
	Capricorn: {
		ua: 'Козеріг', gen: 'Козерозі', symbol: '♑', element: 'earth', base: 'excellent',
		why: 'Козеріг — родючий земний знак: сходи повільніші, зате витривалі, урожай добре лежить.',
		rec: [job('Садити коренеплоди й бульби для зберігання', { g: ['root'], cat: ['root', 'solanaceae', 'perennial'] }), ONION_GARLIC, job('Садити дерева й кущі', { g: ['tree_shrub'] }), 'Обрізати й формувати крону', 'Щеплювати'],
		not: ['Пересаджувати з поділом коренів', 'Рясно поливати'],
		winter: [job('Сіяти на розсаду', { ids: ['celery', 'leek'], a: ['seedling_indoor'], list: true }), 'Обрізати плодові дерева в безморозний день', 'Перевіряти укриття й обв’язку молодих дерев і кущів', 'Перебирати овочі у сховищі'],
	},
	Aquarius: {
		ua: 'Водолій', gen: 'Водолії', symbol: '♒', element: 'air', base: 'bad',
		why: 'Водолій — неплідний знак: день для догляду, а не для посівів.',
		rec: ['Прополювати й розпушувати', 'Прищипувати й пасинкувати', 'Боротися зі шкідниками', 'Збирати врожай'],
		not: ['Сіяти й садити', 'Поливати й підживлювати'],
		winter: ['Прибирати в теплиці', 'Готувати інвентар до сезону'],
	},
	Pisces: {
		ua: 'Риби', gen: 'Рибах', symbol: '♓', element: 'water', base: 'excellent',
		why: 'Риби — родючий знак: добре для листових і скоростиглих культур.',
		rec: [job('Сіяти й садити овочі, особливо листові й скоростиглі', { g: ['fruit', 'leaf'], cat: VEG }), 'Поливати', 'Вносити органічні добрива'],
		not: ['Обрізати дерева', 'Обробляти хімічними препаратами', 'Закладати врожай на зберігання'],
		winter: [job('Сіяти салат і зелень на підвіконні', { home: true, g: ['leaf'] }), 'Поливати розсаду'],
	},
};

const PHASE_WORKS = {
	waxing: {
		rec: [job('Сіяти й садити культури з надземним урожаєм', { g: PHASE_GROUPS.waxing }), 'Поливати й підживлювати'],
		not: ['Сильно обрізати дерева й кущі — активний сокорух', 'Садити коренеплоди, цибулинні й саджанці дерев і кущів'],
	},
	waning: {
		rec: [job('Сіяти й садити коренеплоди та цибулинні', { g: ['root', 'bulb'] }), 'Обрізати дерева й кущі, проріджувати посіви', 'Збирати врожай для зберігання'],
		not: ['Сіяти й садити культури з надземним урожаєм'],
	},
	new_moon: {
		rec: ['Планувати посадки, готувати насіння та інвентар', 'Легке прополювання'],
		not: ['Сіяти, садити й пересаджувати', 'Щеплювати й обрізати'],
		why: 'Новий місяць — сили рослин на мінімумі, посіви та пересадки приживаються гірше.',
	},
	full: {
		rec: ['Прорідити посіви, прополювати', 'Збирати врожай для швидкого вживання та лікарські трави'],
		not: ['Сіяти й пересаджувати', 'Обрізати та щеплювати'],
		why: 'Повня — рослини найчутливіші до пошкоджень, пересадки й обрізання не рекомендують.',
	},
	eclipse: {
		rec: ['Мінімум робіт у саду, тільки необхідний догляд'],
		not: ['Будь-які посіви, пересадки, обрізання'],
		why: 'День затемнення — у місячних календарях вважається найнесприятливішим для рослин.',
	},
};

const isWinter = (month) => month === 12 || month <= 2;

const downgrade = (r) => RATINGS[Math.max(0, RATINGS.indexOf(r) - 1)];
const minRating = (a, b) => (RATINGS.indexOf(a) < RATINGS.indexOf(b) ? a : b);

const NEAR_NEW_MOON = {
	before: 'Напередодні нового місяця сили рослин мінімальні, тому день на рівень гірший.',
	after: 'Щойно минув новий місяць — рослини ще не набрали сили, тому день на рівень гірший.',
};

/**
 * Оцінка дня.
 * @param day { sign, phaseEvent, nearNewMoon: 'before' | 'after' | null, eclipse }
 */
export function rateDay({ sign, phaseEvent, nearNewMoon, eclipse }) {
	const info = SIGN_INFO[sign];
	let rating = info.base;
	const reasons = [info.why];
	if (eclipse) {
		rating = 'terrible';
		reasons.unshift(PHASE_WORKS.eclipse.why);
	} else if (phaseEvent === 'new_moon') {
		rating = 'terrible';
		reasons.unshift(PHASE_WORKS.new_moon.why);
	} else if (phaseEvent === 'full') {
		rating = 'terrible';
		reasons.unshift(PHASE_WORKS.full.why);
	} else if (nearNewMoon) {
		rating = downgrade(rating);
		reasons.push(NEAR_NEW_MOON[nearNewMoon]);
	}
	return { rating, reason: reasons.join(' ') };
}

// Основи слів, за якими ловимо суперечності «рекомендовано X» ↔ «не рекомендовано X»
const CONFLICT_STEMS = ['обріз', 'картопл', 'полив', 'пересад', 'щеплю', 'зберіган', 'підживл', 'добрив', 'надземн', 'коренепл', 'цибулин', 'саджан'];
const stemsOf = (line) => CONFLICT_STEMS.filter((st) => line.toLowerCase().includes(st));
export const conflicts = (line, notList) => stemsOf(line).some((st) => notList.some((n) => n.toLowerCase().includes(st)));

// Рядки «не рекомендовано», що забороняють роботу з культурою, — її прибираємо і зі списку культур дня
const FORBIDS = [
	{ re: /поділ|пересаджув/i, act: 'division' },
	{ re: /картопл/i, id: 'potato' },
];
const forbidden = (plant, act, not) => FORBIDS.some((f) => (f.act ? f.act === act : f.id === plant.id) && not.some((n) => f.re.test(n)));

const matches = (tag, { plant, acts }) =>
	(!tag.g || tag.g.includes(plant.moon_group)) &&
	(!tag.cat || tag.cat.includes(plant.category)) &&
	(!tag.ids || tag.ids.includes(plant.id)) &&
	(!tag.a || acts.some((a) => tag.a.includes(a))) &&
	(!tag.seedling || plant.windows.some((w) => w.type === 'seedling_indoor'));

// «a, b і c»: після голосного — «й», після приголосного чи перед й/я/ю/є/ї — «і»
function joinUa(xs) {
	if (xs.length < 2) return xs.join('');
	const [prev, last] = xs.slice(-2);
	const and = /[аеєиіїоуюя]$/i.test(prev) && !/^[йяюєї]/i.test(last) ? 'й' : 'і';
	return `${xs.slice(0, -1).join(', ')} ${and} ${last}`;
}

export const PLANTING = /^(Сіяти|Садити|Висаджувати)/;

/**
 * Роботи дня: окремо за знаком і за фазою (так їх і показуємо на сайті),
 * плюс об’єднані списки без суперечностей — якщо щось «не рекомендовано» в одній групі,
 * його прибрано з «рекомендовано» в іншій.
 * active — культури з відкритим сьогодні агровікном: [{ plant, acts }]. З них у plants лишаються ті,
 * що підходять дню й не заборонені «не рекомендовано»; поради «сіяти/садити» даємо лише під них.
 */
export function worksForDay({ sign, phase, phaseEvent, eclipse, month, rating, active = [] }) {
	const info = SIGN_INFO[sign];
	const key = eclipse ? 'eclipse' : phaseEvent === 'new_moon' || phaseEvent === 'full' ? phaseEvent : phase;
	const pw = PHASE_WORKS[key];
	const special = key === 'eclipse' || key === 'new_moon' || key === 'full';
	const signRec = isWinter(month) ? info.winter : info.rec;

	const not = dedupe(special ? pw.not : [...info.not, ...pw.not]);
	const plants = active
		.filter(({ plant }) => plantFits(plant.moon_group, { rating, phase, sign }))
		.map(({ plant, acts }) => ({ plant, acts: acts.filter((a) => !forbidden(plant, a, not)) }))
		.filter(({ acts }) => acts.length);
	// У поганий день посів і посадку не радимо, навіть якщо фаза «за»
	const noPlanting = rating === 'bad' || rating === 'terrible';
	const pick = (l) => {
		if (typeof l === 'string') return l;
		if (l.home) return !noPlanting && l.g.some((g) => PHASE_GROUPS[phase].includes(g)) ? l.t : null;
		const found = plants.filter((x) => matches(l, x));
		if (!found.length) return null;
		if (l.ids) found.sort((x, y) => l.ids.indexOf(x.plant.id) - l.ids.indexOf(y.plant.id));
		return l.list ? `${l.t} ${joinUa(dedupe(found.map((x) => x.plant.name_acc)))}` : l.t;
	};
	const clean = (list) => list.map(pick).filter((l) => l && !conflicts(l, not) && !(noPlanting && PLANTING.test(l)));
	const signWorks = special ? { rec: [], not: [] } : { rec: clean(signRec), not: info.not };
	const phaseWorks = { rec: clean(pw.rec), not: pw.not };
	return {
		recommended: dedupe([...signWorks.rec, ...phaseWorks.rec]),
		not_recommended: not,
		sign_works: signWorks,
		phase_works: phaseWorks,
		plants,
	};
}

function dedupe(list) {
	return [...new Set(list)];
}

/** Чи підходить день для культури (група moon_group) з урахуванням рейтингу, фази й стихії. */
export function plantFits(group, { rating, phase, sign }) {
	if (rating === 'bad' || rating === 'terrible') return false;
	const simplePhase = phase === 'waning' || phase === 'third_quarter' ? 'waning' : 'waxing';
	if (!PHASE_GROUPS[simplePhase].includes(group)) return false;
	if (rating === 'normal') {
		const g = ELEMENT_GROUP[SIGN_INFO[sign].element];
		return g === group || (g === 'root' && group === 'bulb');
	}
	return true;
}

// ---------- Роботи місяця (загальні, для сторінок місяців) ----------

export const MONTH_TASKS = {
	1: ['Сівба на розсаду культур із довгим вегетаційним періодом: селера, цибуля-порей, лобелія', 'Перевірка насіння на схожість і планування сівозміни', 'Обтрушування снігу з гілок і перевірка обв’язки саджанців від гризунів', 'Огляд овочів і фруктів у сховищі'],
	2: ['Сівба на розсаду перцю, баклажанів, пізніх томатів', 'Обрізування плодових дерев у безморозні дні', 'Підготовка ґрунтосумішей і ємностей для розсади', 'Заготівля живців для весняного щеплення'],
	3: ['Сівба на розсаду томатів, капусти, квітів', 'Санітарне й формувальне обрізування саду до початку сокоруху', 'Побілка стовбурів, перші обприскування від хвороб', 'Підготовка теплиці: дезінфекція, заміна ґрунту'],
	4: ['Сівба холодостійких культур у ґрунт: морква, горох, редис, цибуля', 'Посадка ранньої картоплі та цибулі-сіянки', 'Весняна посадка саджанців дерев і кущів', 'Пікірування й загартовування розсади'],
	5: ['Висадка розсади томатів, перцю, баклажанів після заморозків', 'Сівба огірків, кабачків, гарбузів, квасолі', 'Перші підживлення й регулярне прополювання', 'Захист від весняних заморозків і шкідників'],
	6: ['Повторні посіви редису, салату, кропу', 'Пасинкування томатів, формування огірків', 'Мульчування грядок і регулярний полив', 'Збір полуниці, укорінення вусів'],
	7: ['Збір часнику та ранніх овочів', 'Сівба на осінній урожай: редька, дайкон, пекінська капуста', 'Літнє обрізування ягідних кущів після плодоношення', 'Боротьба з фітофторою та борошнистою росою'],
	8: ['Масовий збір урожаю й заготовки', 'Посадка вусів і розсади суниці', 'Сівба сидератів на звільнених грядках', 'Підготовка до осінньої посадки часнику та цибулинних квітів'],
	9: ['Збір пізніх овочів і картоплі', 'Посадка тюльпанів, нарцисів, крокусів', 'Осіння посадка саджанців ягідних кущів', 'Сівба сидератів і озимих культур'],
	10: ['Посадка озимого часнику й цибулі', 'Осіння посадка плодових дерев', 'Підзимова підготовка грядок, внесення органіки', 'Збір і закладання врожаю на зберігання'],
	11: ['Підзимова сівба моркви, кропу, петрушки', 'Укриття теплолюбних багаторічників і троянд', 'Санітарне обрізування саду після листопаду', 'Очищення й консервація інвентарю'],
	12: ['Перевірка сховища, перебирання овочів', 'Обтрушування мокрого снігу з гілок', 'Вигонка зелені й цибулі на підвіконні', 'Замовлення насіння й планування сезону'],
};
