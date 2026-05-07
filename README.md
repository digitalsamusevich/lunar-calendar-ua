# 🌙 Місячний посівний календар України — JSON API

Структуровані дані місячного посівного календаря садівника-городника для генерації SEO-контенту.

## Структура репозиторію

```
data/
└── 2026/
    ├── 05-may-calendar.json      ← повні дані по кожному дню
    ├── 05-may-index.json         ← індекс: рослини → дні, рейтинг → дні
    ├── 06-june-calendar.json
    └── 06-june-index.json
docs/
└── STRUCTURE.md                  ← опис схеми JSON
```

## Як читати дані з сайту

### Отримати дані поточного місяця

```js
const REPO = 'https://raw.githubusercontent.com/YOUR_USERNAME/lunar-calendar-ua/main';

// Повний календар місяця
const calendar = await fetch(`${REPO}/data/2026/05-may-calendar.json`)
  .then(r => r.json());

// Індекс по рослинах і рейтингах
const index = await fetch(`${REPO}/data/2026/05-may-index.json`)
  .then(r => r.json());
```

### Знайти сприятливі дні для конкретної рослини

```js
const garlicDays = index.by_plant['часник']
  .filter(d => ['excellent', 'good'].includes(d.rating));
// → [{ day: 6, date: '2026-05-06', rating: 'excellent', moon_sign_ua: 'Козеріг', ... }]
```

### Отримати всі відмінні дні місяця

```js
const bestDays = index.by_rating.excellent;
// → [{ day: 6, date: '2026-05-06', weekday: 'середа', moon_sign_ua: 'Козеріг', ... }]
```

### Отримати повний опис дня

```js
const dayInfo = calendar.days.find(d => d.day === 6);
// → { date, lunar_day, moon_phase, moon_sign, planting_rating,
//     recommended: [...], not_recommended: [...], plants_possible: [...] }
```

## Схема об'єкта дня

| Поле | Тип | Приклад |
|------|-----|---------|
| `date` | string | `"2026-05-06"` |
| `day` | number | `6` |
| `weekday` | string | `"середа"` |
| `lunar_day` | string | `"18-19"` |
| `moon_phase` | string | `"waning"` |
| `moon_phase_ua` | string | `"Спадний"` |
| `moon_sign` | string | `"Capricorn"` |
| `moon_sign_ua` | string | `"Козеріг"` |
| `moon_sign_symbol` | string | `"♑"` |
| `planting_rating` | string | `"excellent"` |
| `recommended` | array | `["Сіяти бобові..."]` |
| `not_recommended` | array | `["Поливати..."]` |
| `plants_possible` | array | `["часник", "морква"]` |
| `notes` | string | опціонально |

### Значення `moon_phase`
`waxing` · `waning` · `full` · `new_moon` · `first_quarter` · `third_quarter`

### Значення `planting_rating`
| Код | Українською |
|-----|-------------|
| `excellent` | Відмінний |
| `good` | Гарний |
| `normal` | Нормальний |
| `bad` | Поганий |
| `terrible` | Жахливий |

## Доступні місяці

| Місяць | Calendar | Index |
|--------|----------|-------|
| Травень 2026 | [05-may-calendar.json](data/2026/05-may-calendar.json) | [05-may-index.json](data/2026/05-may-index.json) |
| Червень 2026 | [06-june-calendar.json](data/2026/06-june-calendar.json) | [06-june-index.json](data/2026/06-june-index.json) |

## Джерело даних

[floristics.info](https://floristics.info/ua/misyachnij-kalendar/) — місячний посівний календар садівника-городника.
