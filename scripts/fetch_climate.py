"""
fetch_climate.py
================
Скрипт збирає реальні кліматичні дані по регіонах України
через open-meteo Archive API (безкоштовно, без ключа).

Встановлення:
    pip install requests

Запуск:
    python fetch_climate.py

Результат:
    regions_ua_climate.json  — оновлений файл з реальними даними
"""

import requests
import json
import time
from datetime import datetime, date
from statistics import mean

# ─── Регіони України ────────────────────────────────────────────
REGIONS = [
    {"id": "vinnytsia",        "name_ua": "Вінницька",         "zone": "central",  "center": "Вінниця",           "lat": 49.23, "lng": 28.47},
    {"id": "volyn",            "name_ua": "Волинська",          "zone": "west",     "center": "Луцьк",             "lat": 50.75, "lng": 25.32},
    {"id": "dnipropetrovsk",   "name_ua": "Дніпропетровська",   "zone": "east",     "center": "Дніпро",            "lat": 48.46, "lng": 35.05},
    {"id": "donetsk",          "name_ua": "Донецька",           "zone": "east",     "center": "Краматорськ",       "lat": 48.72, "lng": 37.56},
    {"id": "zhytomyr",         "name_ua": "Житомирська",        "zone": "north",    "center": "Житомир",           "lat": 50.25, "lng": 28.66},
    {"id": "zakarpattia",      "name_ua": "Закарпатська",       "zone": "mountain", "center": "Ужгород",           "lat": 48.62, "lng": 22.29},
    {"id": "zaporizhzhia",     "name_ua": "Запорізька",         "zone": "south",    "center": "Запоріжжя",         "lat": 47.82, "lng": 35.17},
    {"id": "ivano-frankivsk",  "name_ua": "Івано-Франківська",  "zone": "mountain", "center": "Івано-Франківськ",  "lat": 48.92, "lng": 24.71},
    {"id": "kyiv",             "name_ua": "Київська",           "zone": "central",  "center": "Київ",              "lat": 50.45, "lng": 30.52},
    {"id": "kirovohrad",       "name_ua": "Кіровоградська",     "zone": "central",  "center": "Кропивницький",     "lat": 48.51, "lng": 32.26},
    {"id": "luhansk",          "name_ua": "Луганська",          "zone": "east",     "center": "Сєвєродонецьк",     "lat": 48.95, "lng": 38.49},
    {"id": "lviv",             "name_ua": "Львівська",          "zone": "west",     "center": "Львів",             "lat": 49.84, "lng": 24.03},
    {"id": "mykolaiv",         "name_ua": "Миколаївська",       "zone": "south",    "center": "Миколаїв",          "lat": 46.97, "lng": 32.00},
    {"id": "odesa",            "name_ua": "Одеська",            "zone": "south",    "center": "Одеса",             "lat": 46.48, "lng": 30.73},
    {"id": "poltava",          "name_ua": "Полтавська",         "zone": "central",  "center": "Полтава",           "lat": 49.59, "lng": 34.55},
    {"id": "rivne",            "name_ua": "Рівненська",         "zone": "north",    "center": "Рівне",             "lat": 50.62, "lng": 26.25},
    {"id": "sumy",             "name_ua": "Сумська",            "zone": "north",    "center": "Суми",              "lat": 50.91, "lng": 34.80},
    {"id": "ternopil",         "name_ua": "Тернопільська",      "zone": "west",     "center": "Тернопіль",         "lat": 49.55, "lng": 25.59},
    {"id": "kharkiv",          "name_ua": "Харківська",         "zone": "east",     "center": "Харків",            "lat": 49.99, "lng": 36.23},
    {"id": "kherson",          "name_ua": "Херсонська",         "zone": "south",    "center": "Херсон",            "lat": 46.65, "lng": 32.60},
    {"id": "khmelnytskyi",     "name_ua": "Хмельницька",        "zone": "central",  "center": "Хмельницький",      "lat": 49.42, "lng": 26.98},
    {"id": "cherkasy",         "name_ua": "Черкаська",          "zone": "central",  "center": "Черкаси",           "lat": 49.44, "lng": 32.06},
    {"id": "chernivtsi",       "name_ua": "Чернівецька",        "zone": "west",     "center": "Чернівці",          "lat": 48.29, "lng": 25.93},
    {"id": "chernihiv",        "name_ua": "Чернігівська",       "zone": "north",    "center": "Чернігів",          "lat": 51.49, "lng": 31.29},
    {"id": "crimea",           "name_ua": "АР Крим",            "zone": "south",    "center": "Сімферополь",       "lat": 44.95, "lng": 34.10},
]

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# Беремо середнє за 3 роки для надійності
YEARS = [2022, 2023, 2024]


def get_monthly_climate(lat, lng):
    """
    Отримує місячні кліматичні норми через Archive API.
    Повертає dict з середніми температурами і опадами по місяцях.
    """
    monthly = {m: {"temp_max": [], "temp_min": [], "precip": []} for m in range(1, 13)}

    for year in YEARS:
        try:
            resp = requests.get(ARCHIVE_URL, params={
                "latitude":   lat,
                "longitude":  lng,
                "start_date": f"{year}-01-01",
                "end_date":   f"{year}-12-31",
                "daily":      "temperature_2m_max,temperature_2m_min,precipitation_sum",
                "timezone":   "Europe/Kyiv"
            }, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            dates  = data["daily"]["time"]
            t_max  = data["daily"]["temperature_2m_max"]
            t_min  = data["daily"]["temperature_2m_min"]
            precip = data["daily"]["precipitation_sum"]

            for i, d in enumerate(dates):
                month = int(d[5:7])
                if t_max[i]  is not None: monthly[month]["temp_max"].append(t_max[i])
                if t_min[i]  is not None: monthly[month]["temp_min"].append(t_min[i])
                if precip[i] is not None: monthly[month]["precip"].append(precip[i])

            time.sleep(0.3)  # Не спамимо API

        except Exception as e:
            print(f"    Помилка {year}: {e}")

    # Рахуємо середні
    result = {}
    for m in range(1, 13):
        d = monthly[m]
        result[m] = {
            "avg_temp_max":  round(mean(d["temp_max"]),  1) if d["temp_max"]  else None,
            "avg_temp_min":  round(mean(d["temp_min"]),  1) if d["temp_min"]  else None,
            "avg_temp":      round(mean(d["temp_max"] + d["temp_min"]) / 2 if d["temp_max"] else 0, 1),
            "total_precip":  round(sum(d["precip"]) / len(YEARS), 1) if d["precip"] else None,
        }
    return result


def find_last_frost(lat, lng):
    """
    Визначає середню дату останнього весняного заморозку.
    Шукає останній день з мін. температурою < 0 в березні-травні.
    """
    last_frost_days = []

    for year in YEARS:
        try:
            resp = requests.get(ARCHIVE_URL, params={
                "latitude":   lat,
                "longitude":  lng,
                "start_date": f"{year}-03-01",
                "end_date":   f"{year}-05-31",
                "daily":      "temperature_2m_min",
                "timezone":   "Europe/Kyiv"
            }, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            dates  = data["daily"]["time"]
            t_mins = data["daily"]["temperature_2m_min"]
            last   = None

            for i, d in enumerate(dates):
                if t_mins[i] is not None and t_mins[i] < 0:
                    last = int(d[5:7]) * 100 + int(d[8:10])  # MMDD

            if last:
                last_frost_days.append(last)
            time.sleep(0.2)

        except Exception as e:
            print(f"    Frost error {year}: {e}")

    if not last_frost_days:
        return None

    avg = int(mean(last_frost_days))
    month = avg // 100
    day   = avg % 100
    return f"{month:02d}-{day:02d}"


def find_first_frost(lat, lng):
    """
    Визначає середню дату першого осіннього заморозку.
    Шукає перший день з мін. температурою < 0 у вересні-листопаді.
    """
    first_frost_days = []

    for year in YEARS:
        try:
            resp = requests.get(ARCHIVE_URL, params={
                "latitude":   lat,
                "longitude":  lng,
                "start_date": f"{year}-09-01",
                "end_date":   f"{year}-11-30",
                "daily":      "temperature_2m_min",
                "timezone":   "Europe/Kyiv"
            }, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            dates  = data["daily"]["time"]
            t_mins = data["daily"]["temperature_2m_min"]
            first  = None

            for i, d in enumerate(dates):
                if t_mins[i] is not None and t_mins[i] < 0:
                    first = int(d[5:7]) * 100 + int(d[8:10])
                    break

            if first:
                first_frost_days.append(first)
            time.sleep(0.2)

        except Exception as e:
            print(f"    First frost error {year}: {e}")

    if not first_frost_days:
        return None

    avg = int(mean(first_frost_days))
    month = avg // 100
    day   = avg % 100
    return f"{month:02d}-{day:02d}"


def find_soil_warmup(lat, lng, target_temp=10):
    """
    Визначає дату коли ґрунт прогрівається до target_temp°C.
    Використовуємо temperature_2m_min як proxy (ґрунт ~2°C нижче).
    """
    warmup_days = []

    for year in YEARS:
        try:
            resp = requests.get(ARCHIVE_URL, params={
                "latitude":   lat,
                "longitude":  lng,
                "start_date": f"{year}-03-01",
                "end_date":   f"{year}-05-31",
                "daily":      "temperature_2m_max,temperature_2m_min",
                "timezone":   "Europe/Kyiv"
            }, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            dates  = data["daily"]["time"]
            t_max  = data["daily"]["temperature_2m_max"]
            t_min  = data["daily"]["temperature_2m_min"]

            # Ґрунт прогрівається коли середньодобова > target+2 протягом 5 днів поспіль
            streak = 0
            warmup = None

            for i, d in enumerate(dates):
                if t_max[i] and t_min[i]:
                    avg = (t_max[i] + t_min[i]) / 2
                    if avg >= target_temp + 2:
                        streak += 1
                        if streak >= 5 and warmup is None:
                            warmup = int(d[5:7]) * 100 + int(d[8:10]) - 4
                    else:
                        streak = 0

            if warmup:
                warmup_days.append(warmup)
            time.sleep(0.2)

        except Exception as e:
            print(f"    Soil warmup error {year}: {e}")

    if not warmup_days:
        return None

    avg   = int(mean(warmup_days))
    month = avg // 100
    day   = avg % 100
    return f"{month:02d}-{day:02d}"


def get_current_weather(lat, lng):
    """
    Поточна погода для відображення на сайті (оновлюється щодня).
    """
    try:
        resp = requests.get(FORECAST_URL, params={
            "latitude":  lat,
            "longitude": lng,
            "current":   "temperature_2m,precipitation,weather_code,wind_speed_10m",
            "daily":     "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
            "timezone":  "Europe/Kyiv",
            "forecast_days": 7
        }, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        daily   = data.get("daily", {})

        return {
            "current": {
                "temp_c":       current.get("temperature_2m"),
                "precip_mm":    current.get("precipitation"),
                "wind_kmh":     current.get("wind_speed_10m"),
                "weather_code": current.get("weather_code"),
                "updated_at":   current.get("time")
            },
            "forecast_7d": [
                {
                    "date":      daily["time"][i],
                    "temp_max":  daily["temperature_2m_max"][i],
                    "temp_min":  daily["temperature_2m_min"][i],
                    "precip":    daily["precipitation_sum"][i],
                    "code":      daily["weather_code"][i]
                }
                for i in range(len(daily.get("time", [])))
            ]
        }
    except Exception as e:
        print(f"    Weather error: {e}")
        return None


# ─── Головна функція ────────────────────────────────────────────
def build_regions_json(output_file="regions_ua_climate.json"):
    """
    Збирає всі дані і зберігає в JSON.
    Час виконання: ~5-10 хвилин (API rate limit).
    """
    result = {
        "meta": {
            "version":     "2.0",
            "updated":     date.today().isoformat(),
            "description": "Агрокліматичні дані по регіонах України з open-meteo API",
            "source":      "open-meteo.com Archive API + open-meteo.com Forecast API",
            "years_used":  YEARS,
            "note":        "Дані базуються на середніх за 2022-2024 роки"
        },
        "zones": {
            "north":    {"name_ua": "Північ",   "description": "Поліська зона, коротший сезон"},
            "central":  {"name_ua": "Центр",   "description": "Лісостепова зона, помірний клімат"},
            "south":    {"name_ua": "Південь",  "description": "Степова зона, тепліше і посушливіше"},
            "east":     {"name_ua": "Схід",    "description": "Континентальний клімат, різкі перепади"},
            "west":     {"name_ua": "Захід",   "description": "М'який клімат, вплив Атлантики"},
            "mountain": {"name_ua": "Гори",    "description": "Карпатська зона, вологіше"},
        },
        "regions": []
    }

    total = len(REGIONS)
    for i, region in enumerate(REGIONS, 1):
        print(f"\n[{i}/{total}] {region['name_ua']} ({region['center']})...")

        lat, lng = region["lat"], region["lng"]

        print("  → Місячний клімат...")
        monthly = get_monthly_climate(lat, lng)

        print("  → Останній заморозок...")
        last_frost = find_last_frost(lat, lng)

        print("  → Перший заморозок...")
        first_frost = find_first_frost(lat, lng)

        print("  → Прогрів ґрунту...")
        soil_warmup = find_soil_warmup(lat, lng)

        print("  → Поточна погода...")
        weather = get_current_weather(lat, lng)

        # Розраховуємо тривалість сезону
        growing_days = None
        if last_frost and first_frost:
            lf = datetime.strptime(f"2024-{last_frost}", "%Y-%m-%d")
            ff = datetime.strptime(f"2024-{first_frost}", "%Y-%m-%d")
            if ff > lf:
                growing_days = (ff - lf).days

        entry = {
            "id":      region["id"],
            "name_ua": region["name_ua"],
            "zone":    region["zone"],
            "center":  region["center"],
            "coords":  {"lat": lat, "lng": lng},
            "climate": {
                "last_frost_avg":       last_frost,
                "first_frost_avg":      first_frost,
                "growing_season_days":  growing_days,
                "soil_warmup_10cm":     soil_warmup,
                "annual_precip_mm":     round(sum(
                    monthly[m]["total_precip"]
                    for m in range(1, 13)
                    if monthly[m]["total_precip"]
                ), 0) if monthly else None,
                "july_avg_temp_c":  monthly[7]["avg_temp"]  if monthly else None,
                "jan_avg_temp_c":   monthly[1]["avg_temp"]  if monthly else None,
                "monthly":          monthly,
            },
            "weather": weather,
            "seo": {
                "slug":     f"{region['id']}-oblast",
                "keywords": [
                    f"посадка городу {region['center']}",
                    f"коли садити овочі {region['name_ua']} область",
                    f"посівний календар {region['center']} 2026"
                ]
            }
        }

        result["regions"].append(entry)
        print(f"  ✓ Готово: заморозки {last_frost}–{first_frost}, сезон {growing_days} днів")

        # Пауза між регіонами
        time.sleep(1)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Збережено: {output_file}")
    print(f"   Регіонів: {len(result['regions'])}")
    return result


# ─── Окремий скрипт для щоденного оновлення погоди ─────────────
def update_weather_only(
    regions_file="regions_ua_climate.json",
    output_file="regions_ua_weather.json"
):
    """
    Оновлює тільки поточну погоду (швидко, ~2 хв).
    Запускати щодня через cron або GitHub Actions.
    """
    weather_data = {
        "updated_at": datetime.now().isoformat(),
        "regions": {}
    }

    for region in REGIONS:
        print(f"Weather: {region['center']}...")
        w = get_current_weather(region["lat"], region["lng"])
        if w:
            weather_data["regions"][region["id"]] = {
                "name_ua": region["name_ua"],
                "center":  region["center"],
                **w
            }
        time.sleep(0.5)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(weather_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Погода оновлена: {output_file}")
    return weather_data


# ─── Запуск ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--weather-only":
        # python fetch_climate.py --weather-only
        update_weather_only()
    else:
        # python fetch_climate.py
        build_regions_json()
