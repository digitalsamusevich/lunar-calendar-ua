# Структура репозиторію

```
data/
├── 2026/
│   ├── 05-may-calendar.json      ← повні дані по днях
│   ├── 05-may-index.json         ← індекс по рослинах і рейтингах
│   ├── 06-june-calendar.json
│   ├── 06-june-index.json
│   └── ...
└── schema.md                     ← опис структури JSON
```

## Структура `calendar.json`

```json
{
  "meta": {
    "month": 5,
    "year": 2026,
    "month_name_ua": "Травень",
    "source": "floristics.info",
    "source_url": "..."
  },
  "days": [
    {
      "date": "2026-05-06",
      "day": 6,
      "weekday": "середа",
      "lunar_day": "18-19",
      "moon_phase": "waning",           // waxing | waning | full | new_moon | first_quarter | third_quarter
      "moon_phase_ua": "Спадний",
      "moon_sign": "Capricorn",          // English key для коду
      "moon_sign_ua": "Козеріг",
      "moon_sign_symbol": "♑",
      "planting_rating": "excellent",    // excellent | good | normal | bad | terrible
      "recommended": ["..."],
      "not_recommended": ["..."],
      "plants_possible": ["часник", "морква", ...],
      "notes": "..."                     // optional
    }
  ]
}
```

## Структура `index.json`

```json
{
  "by_plant": {
    "часник": [
      { "day": 6, "date": "2026-05-06", "rating": "excellent", "moon_sign_ua": "Козеріг", "moon_phase_ua": "Спадний" },
      ...
    ]
  },
  "by_rating": {
    "excellent": [{ "day": 6, "date": "2026-05-06", "weekday": "середа", ... }],
    "good": [...],
    "normal": [...],
    "bad": [...],
    "terrible": [...]
  },
  "rating_labels_ua": {
    "excellent": "Відмінний",
    "good": "Гарний",
    "normal": "Нормальний",
    "bad": "Поганий",
    "terrible": "Жахливий"
  }
}
```

## Приклад використання (JS)

```js
// Отримати всі сприятливі дні для посадки часнику в травні
const res = await fetch('data/2026/05-may-index.json');
const idx = await res.json();
const garlicDays = idx.by_plant['часник']
  .filter(d => d.rating === 'excellent' || d.rating === 'good');

// Отримати повний опис конкретного дня
const cal = await fetch('data/2026/05-may-calendar.json').then(r => r.json());
const day6 = cal.days.find(d => d.day === 6);
```
