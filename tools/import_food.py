#!/usr/bin/env python3
"""Turn the "Food Masterlist" Google Sheet into assets/food.js (the Food tab's Local picks).

    python3 tools/import_food.py             build assets/food.js
    python3 tools/import_food.py --check     only list what needs attention, write nothing
    python3 tools/import_food.py --table     also print every place as a table, to review

Inputs
  tools/food/sheet.json      the sheet's Taiwan tabs: {"tabs": {"Mains": [[header], [row], ...], "Dessert": ..., "Bfast": ..., "Taichung Mains": ...}}
                             Rows can keep the sheet's blank column A; it's dropped when the header starts with "".
  tools/food/curation.json   hand-written fixes, keyed by the place's name as it appears in the sheet (trimmed):
                               note   English note for the site. Needed when the sheet's note has Chinese in it;
                                      the Chinese original is kept and shown under it.
                               type   English food type          dish   sample-photo key (see DISHES)
                               name   name to show (drops bits like " - 寧夏夜市")
                               area   area to use instead of the sheet's (a key of AREAS)
                               hours  hours to show instead of the sheet's
                               q      what to search on Google Maps (default: name, area, city)
                               skip   true to leave the place out (placeholders, closed shops)

Refreshing from the sheet
  1. Replace tools/food/sheet.json with the sheet's current values (same shape).
  2. Run with --check. It lists new places, Chinese notes without an English version, and unknown areas.
  3. Add those to curation.json, run without --check, then bump VERSION in sw.js so phones get the new list.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "tools/food/sheet.json"
CURATION = ROOT / "tools/food/curation.json"
OUT = ROOT / "assets/food.js"
DATA = ROOT / "assets/data.js"

CJK = re.compile(r"[　-〿㐀-鿿豈-﫿＀-￯]")

# Area groups, in the order the site shows them. near = place keys from data.js, used to label each
# group with the plan's days ("Day 2") and to link a day to its group.
GROUPS = [
    ("hotel", "Near the hotel", "Ximending and Wanhua, within walking distance of the hotel.",
     ["hotel", "ximending", "aychung", "xingfutang", "longshan", "guangzhou", "carrefour", "donki"]),
    ("xinyi", "Taipei 101 area", "Xinyi and the East District.", ["t101", "dtf", "elephant", "ichiran", "xinyi", "pokemon"]),
    ("zoo", "Near the Zoo", "Wenshan and the NCCU area, next to Taipei Zoo and the Maokong Gondola.", ["zoo", "gondola", "maokong", "yaoyue"]),
    ("taichung", "Taichung", "The sheet's Taichung list. Most aren't rated yet.", ["chunshui", "miyahara"]),
    ("shilin", "Shilin", "Shilin, Shipai and Yangmingshan.", ["shilin", "hotstar", "amusement"]),
    ("central", "Central Taipei", "Main Station, Zhongzheng, Datong (Ningxia Night Market) and Huashan. 1 to 3 MRT stops from the hotel.",
     ["cks", "dihua", "fuhang", "citymall", "huashan", "guanghua"]),
    ("zhongshan", "Zhongshan", "North of Main Station. The sheet's biggest list.", ["lindongfang"]),
    ("songshan", "Songshan", "Around Raohe Night Market.", ["raohe", "pepperbun", "sunnyhillsmp"]),
    ("daan", "Da'an and Gongguan", "Yongkang Street, Daan Park and Gongguan.", ["daan", "yongkang"]),
    ("newtaipei", "New Taipei", "Yonghe, Zhonghe, Banqiao, Xindian and Tamsui. Farther out.", ["tamsui"]),
    ("other", "No area", "The sheet doesn't say where these are. Check the map before going.", []),
]

# Sheet area -> (group, English label)
AREAS = {
    "西門町": ("hotel", "Ximending"), "萬華區": ("hotel", "Wanhua"), "龍山寺": ("hotel", "Longshan Temple"),
    "南機場夜市": ("central", "Nanjichang Night Market"), "中正區": ("central", "Zhongzheng"), "台北車站": ("central", "Taipei Main Station"),
    "華山": ("central", "Huashan"), "大同區": ("central", "Datong"), "寧夏夜市": ("central", "Ningxia Night Market"),
    "忠孝新生": ("central", "Zhongxiao Xinsheng"),
    "信義區": ("xinyi", "Xinyi"), "信義": ("xinyi", "Xinyi"), "101": ("xinyi", "Taipei 101"), "東區": ("xinyi", "East District"),
    "東區/信義區": ("xinyi", "East District and Xinyi"), "東區/永和": ("xinyi", "East District (also in Yonghe)"),
    "中山區": ("zhongshan", "Zhongshan"), "圓山區": ("zhongshan", "Yuanshan"),
    "松山區": ("songshan", "Songshan"), "南港區": ("songshan", "Nangang"),
    "大安區": ("daan", "Da'an"), "大安": ("daan", "Da'an"), "公館": ("daan", "Gongguan"), "永康街": ("daan", "Yongkang Street"),
    "文山區": ("zoo", "Wenshan"), "政大": ("zoo", "NCCU, near the Zoo"),
    "士林區": ("shilin", "Shilin"), "石牌/內湖": ("shilin", "Shipai"), "陽明山": ("shilin", "Yangmingshan"),
    "內湖": ("other", "Neihu"),
    "永和區": ("newtaipei", "Yonghe"), "永和": ("newtaipei", "Yonghe"), "中和區": ("newtaipei", "Zhonghe"), "板橋區": ("newtaipei", "Banqiao"),
    "新店區": ("newtaipei", "Xindian"), "新莊區": ("newtaipei", "Xinzhuang"), "淡水": ("newtaipei", "Tamsui"),
    "樂華夜市": ("newtaipei", "Lehua Night Market, Yonghe"),
    "Various": ("other", "Several branches"), "不一定": ("other", "Pick-up spot varies"), "": ("other", ""), "To Try": ("other", ""),
    # Taichung (from the Taichung tabs and the Taichung rows of Dessert)
    "台中": ("taichung", "Taichung"), "西區": ("taichung", "West District"), "逢甲夜市": ("taichung", "Fengjia Night Market"),
    "勤美附近": ("taichung", "Near CMP Block"),
}

# Sample photos: en/zh Wikipedia article titles, first one with a lead photo wins (redirects are followed).
# commons = what to search on Wikimedia Commons when someone taps the photo for more.
DISHES = {
    "lurou": ("Braised pork rice", ["Braised pork rice", "Lu rou fan", "Minced pork rice"], ["滷肉飯"], "lu rou fan"),
    "chickenrice": ("Chicken rice", ["Chiayi turkey rice"], ["火雞肉飯"], "turkey rice Chiayi"),
    "hainan": ("Hainanese chicken rice", ["Hainanese chicken rice"], [], "Hainanese chicken rice"),
    "goose": ("Goose meat", ["Goose as food"], ["鵝肉"], "goose meat Taiwan"),
    "siumei": ("Roast meats", ["Siu mei"], [], "siu mei"),
    "dimsum": ("Dim sum", ["Dim sum"], [], "dim sum"),
    "oyster": ("Oyster omelette", ["Oyster omelette"], [], "oyster omelette"),
    "beefnoodle": ("Beef noodle soup", ["Beef noodle soup"], [], "Taiwanese beef noodle soup"),
    "zhajiang": ("Zhajiang noodles", ["Zhajiangmian"], [], "zhajiangmian"),
    "knifecut": ("Knife-cut noodles", ["Daoxiao mian"], [], "daoxiao mian"),
    "drynoodle": ("Dry noodles", ["Lo mein"], ["乾麵"], "Taiwanese dry noodles"),
    "mitaimu": ("Rice noodles", ["Silver needle noodles"], ["米苔目"], "mi tai mu"),
    "ramen": ("Ramen", ["Ramen"], [], "ramen bowl"),
    "sushi": ("Sushi", ["Sushi"], [], "sushi"),
    "roll": ("Sushi rolls", ["California roll"], [], "sushi roll"),
    "sashimi": ("Sashimi", ["Sashimi"], [], "sashimi"),
    "unagi": ("Grilled eel rice", ["Unadon", "Kabayaki"], [], "unadon"),
    "udon": ("Udon", ["Udon"], [], "udon"),
    "japanese": ("Japanese set meal", ["Japanese cuisine"], [], "teishoku"),
    "teppanyaki": ("Teppanyaki", ["Teppanyaki"], [], "teppanyaki"),
    "yakiniku": ("Yakiniku", ["Yakiniku"], [], "yakiniku"),
    "skewers": ("Grilled skewers", ["Yakitori"], [], "yakitori"),
    "kbbq": ("Korean BBQ", ["Korean barbecue"], [], "Korean barbecue"),
    "korean": ("Korean food", ["Bibimbap"], [], "bibimbap"),
    "jajang": ("Black bean noodles", ["Jajangmyeon"], [], "jajangmyeon"),
    "kfc": ("Korean fried chicken", ["Korean fried chicken"], [], "Korean fried chicken"),
    "tteok": ("Tteokbokki", ["Tteokbokki"], [], "tteokbokki"),
    "hotpot": ("Hot pot", ["Hot pot"], [], "hot pot"),
    "burger": ("Burger", ["Hamburger"], [], "hamburger"),
    "pizza": ("Pizza", ["Pizza"], [], "pizza"),
    "pasta": ("Pasta", ["Spaghetti", "Pasta"], [], "spaghetti"),
    "creampasta": ("Cream pasta", ["Fettuccine Alfredo"], [], "fettuccine alfredo"),
    "padthai": ("Pad thai", ["Pad thai"], [], "pad thai"),
    "padseeew": ("Pad see ew", ["Pad see ew"], [], "pad see ew"),
    "boatnoodle": ("Thai boat noodles", ["Boat noodles"], [], "Thai boat noodles"),
    "pho": ("Pho", ["Pho"], [], "pho"),
    "burmese": ("Burmese noodles", ["Mohinga"], [], "mohinga"),
    "yunnan": ("Yunnan noodles", ["Crossing the bridge noodles"], [], "crossing the bridge noodles"),
    "indian": ("Indian curry", ["Butter chicken", "Thali"], [], "Indian curry"),
    "indonesian": ("Indonesian fried rice", ["Nasi goreng"], [], "nasi goreng"),
    "malaysian": ("Nasi lemak", ["Nasi lemak"], [], "nasi lemak"),
    "mexican": ("Tacos", ["Taco"], [], "tacos"),
    "congee": ("Congee", ["Congee"], [], "congee"),
    "dumplings": ("Dumplings", ["Jiaozi"], [], "jiaozi"),
    "bento": ("Bento", ["Bento"], ["便當"], "Taiwanese bento"),
    "stirfry": ("Taiwanese stir-fry", ["Three-cup chicken"], [], "Taiwanese stir fry"),
    "friedrice": ("Fried rice", ["Fried rice"], [], "fried rice"),
    "steak": ("Steak", ["Steak"], [], "steak dinner"),
    "pekingduck": ("Peking duck", ["Peking duck"], [], "Peking duck"),
    "sweetsour": ("Sweet and sour pork", ["Sweet and sour pork"], [], "sweet and sour pork"),
    "hokfun": ("Beef chow fun", ["Beef chow fun"], [], "beef chow fun"),
    "claypot": ("Claypot rice", ["Claypot rice"], [], "claypot rice"),
    "hkcafe": ("Hong Kong milk tea", ["Hong Kong-style milk tea"], [], "Hong Kong milk tea"),
    "poke": ("Poke bowl", ["Poke (dish)", "Poke (Hawaiian dish)"], [], "poke bowl"),
    "brunch": ("Brunch", ["Eggs Benedict"], [], "eggs benedict"),
    "bbq": ("American BBQ", ["Pulled pork", "Barbecue in the United States"], [], "pulled pork"),
    "german": ("German pork knuckle", ["Schweinshaxe"], [], "schweinshaxe"),
    "macanese": ("Pork chop bun", ["Pork chop bun"], [], "pork chop bun Macau"),
    "chickenburger": ("Fried chicken burger", ["Chicken sandwich"], [], "fried chicken sandwich"),
    "roastchicken": ("Roast chicken", ["Roast chicken"], [], "roast chicken"),
    "hotdog": ("Hot dog", ["Hot dog"], [], "hot dog"),
    "sub": ("Sub sandwich", ["Submarine sandwich"], [], "submarine sandwich"),
    "instantnoodle": ("Fried instant noodles", ["Instant noodle"], [], "instant noodles"),
    "taiwanese": ("Taiwanese food", ["Taiwanese cuisine"], [], "Taiwanese cuisine"),
    # Breakfast
    "danbing": ("Egg crepe (dan bing)", ["Danbing"], ["蛋餅"], "danbing"),
    "sandwich": ("Breakfast sandwich", ["Sandwich"], [], "sandwich"),
    "toast": ("Breakfast toast", ["Toast (food)", "Toast"], [], "toast"),
    "frenchtoast": ("French toast", ["French toast"], [], "french toast"),
    "soymilk": ("Soy milk and fried dough", ["Youtiao", "Soy milk"], [], "youtiao soy milk"),
    "mantou": ("Steamed bun", ["Mantou"], [], "mantou"),
    "bagel": ("Bagel", ["Bagel"], [], "bagel"),
    "gratin": ("Baked gratin", ["Gratin"], [], "baked rice gratin"),
    "pajeon": ("Korean pancake", ["Pajeon"], [], "pajeon"),
    "cantonese": ("Cantonese food", ["Cantonese cuisine"], [], "Cantonese cuisine"),
    # Desserts and drinks
    "mangoice": ("Mango shaved ice", ["Mango shaved ice"], [], "mango shaved ice"),
    "shavedice": ("Shaved ice", ["Baobing", "Tshuah-ping", "Shaved ice"], [], "Taiwanese shaved ice"),
    "snowice": ("Snow ice", ["Snow ice"], [], "snow ice dessert"),
    "fruitmilk": ("Fruit milk", ["Smoothie"], [], "mango smoothie"),
    "bubbletea": ("Milk tea", ["Bubble tea"], [], "bubble tea"),
    "douhua": ("Tofu pudding", ["Douhua"], [], "douhua"),
    "taroball": ("Taro balls", ["Taro ball"], ["芋圓"], "taro balls"),
    "sago": ("Sago dessert", ["Sago soup", "Sago pudding"], [], "sago dessert"),
    "froyo": ("Frozen yogurt", ["Frozen yogurt"], [], "frozen yogurt"),
    "icecream": ("Ice cream", ["Ice cream"], [], "ice cream"),
    "coffee": ("Coffee", ["Latte", "Coffee"], [], "latte"),
    "sugarcane": ("Sugarcane juice", ["Sugarcane juice"], [], "sugarcane juice"),
    "dessert": ("Dessert", ["Dessert"], [], "dessert"),
}

# Food type from the sheet's "Cuisine/Food Type" column
TYPES = {
    "Cantonese": "Cantonese", "Chicken Rice": "Chicken rice", "Taiwanese Steak": "Taiwanese steak", "Cantonese / Dim Sum": "Dim sum",
    "Pasta": "Pasta", "Taiwanese": "Taiwanese", "Yunnanese": "Yunnanese", "American Sushi": "Sushi rolls", "Taiwanese 小吃": "Taiwanese snacks",
    "Thai": "Thai", "BBQ": "Grilled skewers", "Korean": "Korean", "Sushi / Japanese": "Sushi", "Ramen": "Ramen", "Vietnamese": "Vietnamese",
    "American": "American", "Italian / Pasta": "Italian", "Noodles": "Noodles", "Hong Kong": "Hong Kong", "Japanese": "Japanese",
    "便當/自助餐": "Taiwanese buffet", "便當": "Bento", "Japanese / Unagi": "Japanese eel rice", "熱炒": "Taiwanese stir-fry", "Poke": "Poke",
    "Hotpot": "Hot pot", "Myanmar": "Burmese", "Mixed": "Baked rice and more", "Fast food": "Fast food", "German / Western": "German",
    "Korean / Hot Pot": "Korean hot pot buffet", "Japanese/Izakaya": "Izakaya", "Hotpot buffet": "Hot pot buffet", "BBQ buffet": "Grill buffet",
    "Burger": "Burgers", "Western": "Western", "Pizza": "Pizza", "Sandwich": "Sandwiches", "Teppanyaki": "Teppanyaki", "Indian": "Indian",
    "Indonesian": "Indonesian", "Macau": "Macanese", "Mexican": "Mexican", "Malaysian": "Malaysian", "Porridge": "Congee",
    "Chicken Burger": "Chicken burgers", "Brunch": "Brunch", "Healthy": "Healthy bowls",
}

# Sample photo from the name, type and note (first match wins). Curation can override.
MEAL_RULES = [
    (r"滷肉飯", "lurou"), (r"海南雞", "hainan"), (r"雞肉飯|火雞肉|雞滷飯|雞肉$|Chicken Rice", "chickenrice"), (r"鵝肉", "goose"),
    (r"蚵仔煎", "oyster"), (r"牛肉麵", "beefnoodle"), (r"刀削麵|刀切麵", "knifecut"), (r"米苔目", "mitaimu"), (r"燒臘", "siumei"),
    (r"點心|飲茶|dim ?sum", "dimsum"), (r"烤鴨|Peking duck", "pekingduck"), (r"咕咾肉", "sweetsour"), (r"牛河|hor fun", "hokfun"),
    (r"煲仔飯", "claypot"), (r"茶餐廳|冰室|大排檔|Hong Kong", "hkcafe"), (r"年糕", "tteok"),
    (r"韓.{0,3}烤肉|韓国烤肉|烤肉食堂|炭火烤肉|BBQ beef", "kbbq"), (r"Korean|韓|韩", "korean"), (r"燒肉", "yakiniku"),
    (r"串燒|Izakaya", "skewers"), (r"生魚片|sashimi", "sashimi"), (r"American Sushi|美式壽司", "roll"), (r"壽司|sushi", "sushi"),
    (r"Unagi|鰻", "unagi"), (r"udon|烏龍", "udon"), (r"鐵板燒|teppanyaki", "teppanyaki"), (r"拉麵|ramen|麵屋", "ramen"),
    (r"火鍋|鍋|hot ?pot", "hotpot"), (r"pad see ew", "padseeew"), (r"船面|船麵", "boatnoodle"), (r"Thai|泰", "padthai"),
    (r"Vietnam|越", "pho"), (r"Myanmar", "burmese"), (r"Yunnan", "yunnan"), (r"Indian|印度", "indian"), (r"Indonesian", "indonesian"),
    (r"Malaysian", "malaysian"), (r"Mexican", "mexican"), (r"粥|Porridge", "congee"), (r"水餃|蒸餃", "dumplings"), (r"炸醬麵", "zhajiang"),
    (r"意麵|乾麵|乾拌|麵攤|麵館|麵店|麵食|Noodles?", "drynoodle"), (r"炒飯", "friedrice"), (r"熱炒|快炒", "stirfry"),
    (r"便當|自助餐|飯包|排骨", "bento"), (r"牛排|Steak", "steak"), (r"pizza|披薩", "pizza"), (r"Chicken Burger", "chickenburger"),
    (r"Burger|漢堡", "burger"), (r"Poke|Healthy", "poke"), (r"Brunch", "brunch"), (r"Smokehouse|BBQ", "bbq"), (r"Pasta|義|意大利", "pasta"),
    (r"German", "german"), (r"Macau", "macanese"), (r"Costco|hotdog", "hotdog"), (r"Subway", "sub"), (r"Japanese", "japanese"),
]
BREAKFAST_RULES = [
    (r"蛋餅|danbing", "danbing"), (r"炒泡麵", "instantnoodle"), (r"鐵板麵|肉燥麵|麵|面|noodles", "drynoodle"), (r"法式吐司", "frenchtoast"),
    (r"吐司|toast|奶酥|烤司|可蜜達|真芳", "toast"), (r"三明治|sandwich|美而美", "sandwich"), (r"豆漿", "soymilk"), (r"饅頭", "mantou"),
    (r"bagel|McDonald", "bagel"), (r"Brunch", "brunch"), (r"burger|漢堡", "burger"),
]
SWEET_RULES = [
    (r"雪花冰", "snowice"), (r"芒果冰沙|果汁|芒果牛奶|大苑子", "fruitmilk"), (r"芋圓|鮮芋仙", "taroball"), (r"豆花", "douhua"),
    (r"西米露", "sago"), (r"froyo|酸奶|yogurt", "froyo"), (r"薄荷|ice cream|Cows", "icecream"), (r"Coffee|咖啡", "coffee"),
    (r"甘蔗", "sugarcane"), (r"mango ice|Ice Monster|冰讚", "mangoice"), (r"冰|雪氷|Snow", "shavedice"),
    (r"茶|tea|Coco|Kebuke|迷客夏|Macu|白巷子|Truewin|Mr Wish|樂法|Got Cha|撞奶|春芳號", "bubbletea"),
]
DEFAULT_DISH = {"meal": "taiwanese", "breakfast": "danbing", "sweet": "dessert"}
SWEET_TYPES = {"bubbletea": "Milk tea and drinks", "fruitmilk": "Fruit drinks", "coffee": "Coffee", "sugarcane": "Sugarcane drinks",
               "icecream": "Ice cream", "froyo": "Frozen yogurt", "mangoice": "Shaved ice", "shavedice": "Shaved ice",
               "snowice": "Snow ice", "douhua": "Tofu pudding", "taroball": "Taro balls", "sago": "Sago and taro desserts"}

DAYS = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}
SKIP_NAME = re.compile(r"\(closed\)|（closed）|[？?]$", re.I)


def rating(s):
    s = (s or "").strip()
    if not s or s.lower() == "to try":
        return None
    n = s.count("🌟") + (0.5 if ".5" in s else 0)
    return n or None


def price(s):
    s = (s or "").strip()
    n = s.count("💸")
    m = re.search(r"\*\s*(\d+)", s)
    return int(m.group(1)) if m else n


def closed_days(s):
    s = (s or "").strip().lower()
    if not s:
        return None
    if s == "none":
        return []
    out = []
    for w in re.findall(r"[a-z]+", s):
        d = DAYS.get(w[:3])
        if d is not None and d not in out:
            out.append(d)
    return out or None


def ampm(h, mi):
    h = int(h)
    ap = "AM" if h % 24 < 12 else "PM"
    hh = h % 12 or 12
    return f"{hh}{':' + mi if mi and mi != '00' else ''} {ap}"


def hours(s):
    s = (s or "").strip().replace("：", ":")
    if not s:
        return ""
    if s.upper() == "24H":
        return "Open 24 hours"
    if not re.search(r"[a-z]", s, re.I):  # 24-hour clock, like 17:30–23:30
        s = re.sub(r"\b(\d{1,2}):(\d{2})\b", lambda m: ampm(m.group(1), m.group(2)), s)
    s = re.sub(r"\b(\d{1,2})(\d{2})\s*(am|pm)\b", r"\1:\2 \3", s, flags=re.I)  # 530am
    s = re.sub(r"(\d)\s*(am|pm)\b", lambda m: f"{m.group(1)} {m.group(2).upper()}", s, flags=re.I)
    s = re.sub(r"\s*[-–]\s*", "–", s)
    s = re.sub(r"\b(\d{1,2}):00(?= [AP]M)", r"\1", s)  # 2:00 PM -> 2 PM
    s = re.sub(r"\b(mon|tue|wed|thu|fri|sat|sun)", lambda m: m.group(1).capitalize(), s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def tidy(note):
    note = re.sub(r"\s+", " ", (note or "").strip())
    note = re.sub(r"!{3,}", "!!", note)
    note = re.sub(r"！{2,}", "！", note)
    note = re.sub(r"\?{2,}", "?", note)
    note = re.sub(r"。{2,}", "...", note)
    return note


def classify(text, kind):
    rules = {"meal": MEAL_RULES, "breakfast": BREAKFAST_RULES, "sweet": SWEET_RULES}[kind]
    for rx, dish in rules:
        if re.search(rx, text, re.I):
            return dish
    return DEFAULT_DISH[kind]


def rows_of(tab):
    rows = tab[:]
    head = rows.pop(0)
    strip = head and head[0] == ""
    for r in rows:
        r = r[1:] if strip and r else r
        yield [c if isinstance(c, str) else str(c) for c in r]


def read_places():
    sheet = json.loads(SHEET.read_text(encoding="utf-8"))
    tabs = sheet["tabs"]
    out = []
    # Mains-style tabs: Food, Cuisine/Food Type, Area, Rating, Price, Closed, Notes, Hours
    for tab, city in [("Mains", ""), ("Taichung Mains", "台中")]:
        for r in rows_of(tabs.get(tab, [[]])):
            r = (r + [""] * 8)[:8]
            if not r[0].strip():
                continue
            out.append({"tab": tab, "kind": "meal", "raw": r[0].strip(), "stype": r[1].strip(), "area": city or r[2].strip(),
                        "rating": r[3], "price": r[4], "closed": r[5], "note": r[6], "hours": r[7]})
    # Dessert and Bfast: Name, Area, Rating, Price, Closed, Hours, Notes
    for tab, kind in [("Dessert", "sweet"), ("Bfast", "breakfast")]:
        city = ""
        for r in rows_of(tabs.get(tab, [[]])):
            r = (r + [""] * 7)[:7]
            name = r[0].strip()
            if not name:
                continue
            if name == "台中" and not any(x.strip() for x in r[1:]):
                city = "台中"  # the rows after this heading are in Taichung
                continue
            area = r[1].strip()
            out.append({"tab": tab, "kind": kind, "raw": name, "stype": "", "area": area if not city else (area or city),
                        "taichung": bool(city), "rating": r[2], "price": r[3], "closed": r[4], "note": r[6], "hours": r[5]})
    return sheet, out


def place_keys():
    text = DATA.read_text(encoding="utf-8")
    return set(re.findall(r"^\s{4}(\w+):\s*\{ en:", text, re.M))


def build(check=False, table=False):
    sheet, places = read_places()
    cur = json.loads(CURATION.read_text(encoding="utf-8")) if CURATION.exists() else {}
    problems, seen, items = [], set(), []
    names = [p["raw"] for p in places]
    for k in cur:
        if k not in names:
            problems.append(f"curation.json has '{k}', which isn't in the sheet any more")
    for p in places:
        c = cur.get(p["raw"], {})
        if p["raw"] in seen and not c.get("skip"):
            problems.append(f"'{p['raw']}' is in the sheet twice; the curation applies to both")
        seen.add(p["raw"])
        if c.get("skip") or (SKIP_NAME.search(p["raw"]) and "skip" not in c):
            continue
        area_raw = c.get("area", p["area"])
        if p.get("taichung") and area_raw not in AREAS:
            area_raw = "台中"
        if area_raw not in AREAS:
            problems.append(f"{p['raw']}: unknown area '{area_raw}' (add it to AREAS or set \"area\" in curation.json)")
            area_raw = ""
        group, where = AREAS[area_raw]
        if p["tab"] == "Taichung Mains" or p.get("taichung"):
            group = "taichung"
            where = where if area_raw not in ("", "台中") else "Taichung"
        note_raw = tidy(p["note"])
        hours_raw = p["hours"].strip()
        if not note_raw and hours_raw and not re.search(r"\d", hours_raw):  # a note typed into the Hours column
            note_raw, hours_raw = tidy(hours_raw), ""
        note = c.get("note", note_raw)
        # Show the Chinese original under the English only when the note was mostly Chinese
        han, latin = len(CJK.findall(note_raw)), len(re.findall(r"[A-Za-z]", note_raw))
        orig = note_raw if ("note" in c and han and han >= latin) else ""
        if CJK.search(note) and "note" not in c:
            problems.append(f"{p['raw']}: note needs English: {note_raw}")
        text = " ".join([p["raw"], p["stype"], note_raw])
        dish = c.get("dish") or classify(text, p["kind"])
        if dish not in DISHES:
            problems.append(f"{p['raw']}: unknown dish '{dish}'")
            dish = DEFAULT_DISH[p["kind"]]
        stype = TYPES.get(p["stype"])
        if p["stype"] and stype is None:
            problems.append(f"{p['raw']}: unknown food type '{p['stype']}' (add it to TYPES)")
        if p["kind"] == "breakfast":
            stype = "Breakfast" if dish != "brunch" else "Brunch"
        elif p["kind"] == "sweet":
            stype = SWEET_TYPES.get(dish, "Desserts")
        type_en = c.get("type") or stype or DISHES[dish][0]
        hrs = c.get("hours", hours(hours_raw))
        if CJK.search(hrs):
            problems.append(f"{p['raw']}: hours need English: {hrs}")
        name = c.get("name", p["raw"])
        zh_area = area_raw if area_raw not in ("Various", "不一定", "To Try") else ""
        city = "台中" if group == "taichung" else "新北" if group == "newtaipei" else "台北"
        q = c.get("q") or " ".join(x for x in [name, zh_area if CJK.search(zh_area) else "", city if city not in zh_area else ""] if x)
        item = {
            "name": name, "kind": p["kind"], "group": group, "where": c.get("where", where), "zh": zh_area if CJK.search(zh_area) else "",
            "type": type_en, "stars": rating(p["rating"]), "price": price(p["price"]), "closed": closed_days(p["closed"]),
            "hours": hrs, "note": note, "orig": orig, "dish": dish, "q": q,
        }
        # Leave out empty fields to keep the file small (closed: [] stays: it means "open every day")
        items.append({k: v for k, v in item.items() if v not in ("", None, 0) or k == "closed" and v == []})

    used = sorted({i["dish"] for i in items})
    dishes = {k: {"en": DISHES[k][0], "wiki": DISHES[k][1], "wikiZh": DISHES[k][2], "commons": DISHES[k][3]} for k in used}
    keys = place_keys()
    for g in GROUPS:
        for k in g[3]:
            if k not in keys:
                problems.append(f"group {g[0]}: place key '{k}' isn't in data.js")
    groups = [{"key": g[0], "label": g[1], "sub": g[2], "near": g[3]} for g in GROUPS]
    data = {
        "source": {"title": sheet.get("title", "Food Masterlist"), "url": sheet.get("url", ""), "fetched": sheet.get("fetched", "")},
        "version": sheet.get("fetched", "") + "-" + str(len(items)),
        "groups": groups,
        "dishes": dishes,
        "list": items,
    }

    if table:
        for i in items:
            print(" | ".join(str(i.get(x, "")) for x in ["group", "kind", "name", "type", "dish", "stars", "price", "closed", "hours", "note"]))
    by = {}
    for i in items:
        by.setdefault(i["group"], [0, 0])
        by[i["group"]][0] += 1
        by[i["group"]][1] += 1 if (i.get("stars") or 0) >= 3 else 0
    print(f"{len(items)} places ({sum(1 for i in items if i['kind'] == 'meal')} meals, {sum(1 for i in items if i['kind'] == 'breakfast')} breakfast, "
          f"{sum(1 for i in items if i['kind'] == 'sweet')} desserts and drinks), {len(used)} sample-photo dishes")
    print("By area (all / 3 stars and up): " + ", ".join(f"{g[0]} {by.get(g[0], [0, 0])[0]}/{by.get(g[0], [0, 0])[1]}" for g in GROUPS))
    if problems:
        print(f"\n{len(problems)} things need attention:")
        for x in problems:
            print("  - " + x)
    if check:
        return 1 if problems else 0
    # One place per line: compact, but still readable in a diff
    head = {k: v for k, v in data.items() if k != "list"}
    body = json.dumps(head, ensure_ascii=False, separators=(",", ":"))[:-1]
    rows = ",\n".join("  " + json.dumps(i, ensure_ascii=False, separators=(",", ":")) for i in items)
    OUT.write_text("/* PaPi Taiwan 2026: Local picks for the Food tab, from the \"Food Masterlist\" Google Sheet.\n"
                   "   Made by tools/import_food.py. Don't edit by hand: change tools/food/curation.json and run the script.\n"
                   "   stars: the sheet's rating (missing = not tried yet). price: the sheet's 💸 count. closed: days of the week, 0 = Sunday;\n"
                   "   [] = open every day, missing = the sheet doesn't say. dish: the sample photo. q: what to search on Google Maps. */\n"
                   f"window.FOOD = {body},\"list\":[\n{rows}\n]}};\n", encoding="utf-8")
    print(f"\nWrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="only report problems, write nothing")
    ap.add_argument("--table", action="store_true", help="print every place, to review")
    a = ap.parse_args()
    sys.exit(build(check=a.check, table=a.table))
