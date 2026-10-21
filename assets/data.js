/* PaPi Taiwan 2026 — trip data.
   Edit prices, times and stops here. The site recalculates everything from this file.
   Prices are rough estimates in NT$ (New Taiwan dollars), checked October 2026. */

window.TRIP = {
  title: "PaPi Taiwan 2026",
  start: "2026-12-04",
  dates: ["2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09"],
  version: 1,

  // Fallback exchange rate if the live rate can't load (mid-market, Oct 21, 2026)
  rate: { value: 1.95, asOf: "Oct 21, 2026" },

  // Group setup. Every number can be changed on the Budget tab.
  settings: {
    adults: 4,
    kids: 4,             // three 3-year-olds + one almost-2-year-old
    kidFood: 0.4,        // a toddler eats about 40% of an adult meal
    vanPax: 8,           // 9-seater van = 8 passengers; a car seat counts as 1
    seatsPerVan: 2,      // many operators fit only 2 car seats per 9-seater
    lanternShare: 4,     // people sharing one sky lantern
    buffer: 0.10,        // safety buffer on the total
    shopPerAdult: 3000,  // pasalubong / shopping money per adult (NT$)
    hotelTotal: 0        // 0 if the hotel is already paid
  },

  // One Taipei-MRT-style line per day
  lines: [
    { code: "R",  color: "#E3002C", ink: "#FFFFFF" },
    { code: "BR", color: "#C48C31", ink: "#1A1306" },
    { code: "G",  color: "#008659", ink: "#FFFFFF" },
    { code: "O",  color: "#F8B61C", ink: "#1F1500" },
    { code: "BL", color: "#0070BD", ink: "#FFFFFF" },
    { code: "A",  color: "#8246AF", ink: "#FFFFFF" }
  ],

  /* Places. wiki / wikiZh = Wikipedia articles to borrow a photo from (first good one wins).
     commons = what to search on Wikimedia Commons for the photo gallery.
     photo = a direct image URL that overrides everything (optional). */
  places: {
    airport:     { en: "Taoyuan International Airport", zh: "桃園國際機場", map: "Taoyuan International Airport Terminal 1", wiki: ["Taoyuan International Airport"], commons: "Taoyuan International Airport terminal" },
    hotel:       { en: "Orange Hotel", zh: "福泰桔子商旅", map: "Orange Hotel Taipei", note: "Show your booking too, so the driver gets the right branch.", photoless: true },
    t101:        { en: "Taipei 101", zh: "台北101", addr: "台北市信義區信義路五段7號", wiki: ["Taipei 101"], commons: "Taipei 101" },
    dtf:         { en: "Din Tai Fung, Taipei 101", zh: "鼎泰豐 台北101店", addr: "台北101購物中心 B1", map: "Din Tai Fung Taipei 101", wiki: ["Xiaolongbao", "Din Tai Fung"], commons: "Din Tai Fung" },
    cks:         { en: "Chiang Kai-shek Memorial Hall", zh: "中正紀念堂", addr: "台北市中正區中山南路21號", wiki: ["Chiang Kai-shek Memorial Hall"], commons: "Chiang Kai-shek Memorial Hall" },
    longshan:    { en: "Longshan Temple", zh: "艋舺龍山寺", addr: "台北市萬華區廣州街211號", map: "Longshan Temple Taipei", wiki: ["Bangka Lungshan Temple", "Lungshan Temple of Manka"], commons: "Lungshan Temple Taipei" },
    guangzhou:   { en: "Guangzhou Street Night Market", zh: "廣州街夜市", map: "Guangzhou Street Night Market Taipei", wiki: ["Lu rou fan", "Minced pork rice"], commons: "lu rou fan" },
    ximending:   { en: "Ximending", zh: "西門町", map: "Ximending Taipei", wiki: ["Ximending"], commons: "Ximending" },
    aychung:     { en: "Ay-Chung Flour-Rice Noodle", zh: "阿宗麵線", addr: "台北市萬華區峨眉街8-1號", map: "Ay-Chung Flour-Rice Noodle Ximending", wiki: ["Oyster vermicelli", "Misua"], commons: "oyster vermicelli" },
    xingfutang:  { en: "Xing Fu Tang", zh: "幸福堂", map: "Xing Fu Tang Ximending", wiki: ["Bubble tea"], commons: "bubble tea" },
    zoo:         { en: "Taipei Zoo", zh: "臺北市立動物園", addr: "台北市文山區新光路二段30號", wiki: ["Taipei Zoo"], commons: "Taipei Zoo" },
    gondola:     { en: "Maokong Gondola", zh: "貓空纜車", map: "Maokong Gondola Taipei Zoo Station", wiki: ["Maokong Gondola"], commons: "Maokong Gondola" },
    maokong:     { en: "Maokong tea houses", zh: "貓空", map: "Maokong Station", wiki: ["Maokong", "Tieguanyin"], commons: "Maokong tea" },
    yaoyue:      { en: "Yao Yue Teahouse", zh: "邀月茶坊", map: "Yao Yue Teahouse Maokong", wiki: ["Tieguanyin", "Maokong"], commons: "Maokong teahouse" },
    shilin:      { en: "Shilin Night Market", zh: "士林夜市", wiki: ["Shilin Night Market"], commons: "Shilin Night Market" },
    hotstar:     { en: "Hot-Star Large Fried Chicken", zh: "豪大大雞排", map: "Hot-Star Large Fried Chicken Shilin", wiki: ["Hot-Star Large Fried Chicken", "Taiwanese fried chicken", "Popcorn chicken"], commons: "Taiwanese fried chicken" },
    formosan:    { en: "Formosan Aboriginal Culture Village", zh: "九族文化村", addr: "南投縣魚池鄉", wiki: ["Formosan Aboriginal Culture Village", "Sun Moon Lake"], commons: "Formosan Aboriginal Culture Village" },
    chunshui:    { en: "Chun Shui Tang, original store", zh: "春水堂 四維創始店", addr: "台中市西區四維街30號", map: "Chun Shui Tang Siwei original store Taichung", wiki: ["Chun Shui Tang", "Bubble tea"], wikiZh: ["春水堂"], commons: "Chun Shui Tang" },
    miyahara:    { en: "Miyahara", zh: "宮原眼科", addr: "台中市中區中山路20號", map: "Miyahara Taichung", wiki: ["Miyahara (store)", "Miyahara Ophthalmology"], wikiZh: ["宮原眼科"], commons: "Miyahara Taichung" },
    taichungpark:{ en: "Taichung Park", zh: "台中公園", wiki: ["Taichung Park"], commons: "Taichung Park" },
    raohe:       { en: "Raohe Night Market", zh: "饒河街觀光夜市", map: "Raohe Street Night Market", wiki: ["Raohe Street Night Market"], commons: "Raohe Street Night Market" },
    pepperbun:   { en: "Fuzhou Black Pepper Bun", zh: "福州世祖胡椒餅", map: "Fuzhou Black Pepper Bun Raohe", wiki: ["Hujiao bing", "Pepper bun"], commons: "hujiao bing" },
    shifen:      { en: "Shifen Old Street", zh: "十分老街", map: "Shifen Old Street", wiki: ["Shifen Old Street", "Shifen Station", "Sky lantern"], commons: "Shifen sky lantern" },
    shifenfalls: { en: "Shifen Waterfall", zh: "十分瀑布", wiki: ["Shifen Waterfall"], commons: "Shifen Waterfall" },
    houtong:     { en: "Houtong Cat Village", zh: "猴硐貓村", map: "Houtong Cat Village", wiki: ["Houtong Cat Village", "Houtong Station"], commons: "Houtong cat" },
    jiufen:      { en: "Jiufen Old Street", zh: "九份老街", map: "Jiufen Old Street", wiki: ["Jiufen"], commons: "Jiufen" },
    agan:        { en: "A-Gan Yi Taro Balls", zh: "阿柑姨芋圓", map: "A-Gan Yi Taro Balls Jiufen", wiki: ["Taro ball", "Taro balls"], commons: "taro balls dessert" },
    peanutroll:  { en: "Peanut ice cream roll", zh: "花生捲冰淇淋", map: "Jiufen Old Street", wiki: ["Peanut ice cream roll"], commons: "peanut ice cream roll Taiwan" },
    amei:        { en: "A-Mei Teahouse", zh: "阿妹茶樓", map: "A-Mei Teahouse Jiufen", wiki: ["A-Mei Tea House"], wikiZh: ["阿妹茶樓"], commons: "A-Mei Tea House Jiufen" },
    fuhang:      { en: "Fu Hang Dou Jiang", zh: "阜杭豆漿", addr: "台北市中正區忠孝東路一段108號2樓", map: "Fu Hang Dou Jiang Taipei", wiki: ["Fuhang Soy Milk", "Soy milk"], wikiZh: ["阜杭豆漿"], commons: "Fu Hang soy milk" },
    dihua:       { en: "Dihua Street", zh: "迪化街", map: "Dihua Street Taipei", wiki: ["Dihua Street", "Dadaocheng"], commons: "Dihua Street" },
    lindongfang: { en: "Lin Dong Fang Beef Noodles", zh: "林東芳牛肉麵", map: "Lin Dong Fang Beef Noodles Taipei", wiki: ["Beef noodle soup"], commons: "Taiwanese beef noodle soup" },
    elephant:    { en: "Elephant Mountain", zh: "象山步道", map: "Elephant Mountain Hiking Trail Taipei", wiki: ["Elephant Mountain (Taipei)", "Xiangshan (Taipei)"], wikiZh: ["象山 (臺北市)"], commons: "Taipei 101 from Elephant Mountain" },
    ichiran:     { en: "Ichiran Taipei flagship", zh: "一蘭 台灣台北本店", addr: "台北市信義區松仁路97號", map: "Ichiran Taipei Main Store Songren Road", wiki: ["Ichiran", "Tonkotsu ramen"], commons: "Ichiran ramen" },
    sunnyhills:  { en: "SunnyHills or Chia Te", zh: "微熱山丘 / 佳德糕餅", map: "Chia Te Bakery Taipei", wiki: ["Pineapple cake"], commons: "Taiwanese pineapple cake" },
    amusement:   { en: "Taipei Children's Amusement Park", zh: "臺北市立兒童新樂園", addr: "台北市士林區承德路五段55號", wiki: ["Taipei Children's Amusement Park"], commons: "Taipei Children's Amusement Park" },
    breakfast:   { en: "Taiwanese breakfast shop", zh: "早餐店", generic: true, wiki: ["Dan bing", "Youtiao"], commons: "Taiwanese breakfast" },
    sunmoon:     { en: "Sun Moon Lake", zh: "日月潭", wiki: ["Sun Moon Lake"], commons: "Sun Moon Lake" }
  },

  plans: {
    /* ---------------- Option B: slow & kid-friendly ---------------- */
    slow: {
      name: "Slow & kid-friendly",
      blurb: "Days end by 7 PM, with nap time at the hotel and no van ride longer than about 2½ hours.",
      days: [
        { title: "Arrive, rest, early Din Tai Fung", banner: ["t101", "dtf"] },
        { title: "Taipei Zoo and the Maokong Gondola", banner: ["zoo", "gondola"] },
        { title: "Kids' amusement park, then Shilin", banner: ["amusement", "shilin"] },
        { title: "Cats, sky lanterns and Jiufen", banner: ["jiufen", "shifen", "houtong"] },
        { title: "Taichung for the first milk tea", banner: ["chunshui", "miyahara", "taichungpark", "ichiran"] },
        { title: "Easy morning, then uwian", banner: ["cks", "airport"] }
      ],
      stops: [
        [1, "12:00 PM", "Land at Taoyuan Airport", "airport", "", "Immigration, then grab a SIM or eSIM. Keep snacks, milk and a change of clothes in your hand-carry."],
        [1, "1:00 PM", "Meet the van driver at arrivals", "", "Van, about 50 min", "Car seats should already be installed. Kids can nap on the ride."],
        [1, "2:00 PM", "Check in at Orange Hotel, then nap time", "hotel", "", "Let everyone recover from the flight."],
        [1, "4:00 PM", "Early dinner at Din Tai Fung, Taipei 101", "dtf", "Van, about 25 min", "4 to 5 PM has the shortest queue. High chairs available. Plain xiaolongbao and fried rice are toddler-safe.", "must"],
        [1, "5:30 PM", "Taipei 101 Observatory, or just walk the mall", "t101", "", "Kids under 115 cm usually go up free."],
        [1, "6:30 PM", "Van back to the hotel for an early night", "hotel", "Van", ""],

        [2, "8:00 AM", "Breakfast near the hotel", "breakfast", "Walk", "Steamed buns (mantou) make easy toddler food."],
        [2, "9:00 AM", "Van pickup at the hotel", "hotel", "", "8-hour charter today."],
        [2, "9:30 AM", "Taipei Zoo: pandas, penguins, koalas and the Children's Zoo", "zoo", "Van, about 30 min", "Bring the stroller; the zoo is big. Kids under 6 get in free. Have lunch inside."],
        [2, "1:00 PM", "Maokong Gondola, a short round trip for the view", "gondola", "Gondola, about 25 min each way", "Kids may nap in the cabin. Snack at a tea house near Maokong Station, then ride down."],
        [2, "3:00 PM", "Van back to the hotel, then nap time", "hotel", "Van", "The van's day ends here."],
        [2, "5:30 PM", "Dinner near the hotel", "", "Walk or taxi", "Keep it close. Day 2 doesn't need more."],

        [3, "8:00 AM", "Breakfast", "breakfast", "Walk", ""],
        [3, "9:00 AM", "Van to Taipei Children's Amusement Park", "", "Van, about 25 min", "The park is closed on Mondays, so Sunday works."],
        [3, "9:30 AM", "Carousel, Ferris wheel and the indoor play area", "amusement", "", "Kids under 6 get in free. Toddlers under 90 cm have their own rides and an air-conditioned playground."],
        [3, "12:00 PM", "Lunch at the park or nearby", "", "", ""],
        [3, "1:00 PM", "Van back to the hotel, then nap time", "hotel", "Van", ""],
        [3, "4:30 PM", "Shilin Night Market, early before the crowds", "shilin", "Van, about 30 min", "Use a baby carrier, not a stroller. Leave by 7 PM."],
        [3, "7:00 PM", "Van back to the hotel", "hotel", "Van", "The van's day ends here."],

        [4, "8:00 AM", "Breakfast", "breakfast", "Walk", ""],
        [4, "9:00 AM", "Van to Houtong", "", "Van, about 1 hr", "9-hour charter. Kids nap on the drive."],
        [4, "10:00 AM", "Houtong Cat Village", "houtong", "", "Kids love the cats. Don't feed them your own snacks."],
        [4, "11:00 AM", "Shifen Old Street: sky lantern and lunch", "shifen", "Van, about 25 min", "Hold the kids' hands. The train runs right through the street."],
        [4, "12:30 PM", "Shifen Waterfall", "shifenfalls", "Van, then a 15-min walk", "Paved path. A carrier is easier than a stroller."],
        [4, "1:30 PM", "Van to Jiufen while the kids nap", "", "Van, about 40 min", ""],
        [4, "2:30 PM", "Jiufen Old Street: taro balls and A-Mei Teahouse", "jiufen", "", "Lots of stairs, so carriers only. Head back before the evening rush."],
        [4, "4:30 PM", "Van back to Taipei", "hotel", "Van, about 1 hr", "The van's day ends at the hotel."],
        [4, "6:00 PM", "Dinner near the hotel", "", "Walk or taxi", ""],

        [5, "7:30 AM", "Breakfast", "breakfast", "Walk", ""],
        [5, "8:30 AM", "Van to Taichung, with one rest stop", "", "Van, about 2½ hrs", "10-hour charter. Nantou and the Aboriginal village are left out; too far for toddlers."],
        [5, "11:00 AM", "Lunch at Chun Shui Tang's original store, where pearl milk tea began", "chunshui", "", "It opens at 11 AM. Arrive at opening and skip the queue.", "must"],
        [5, "12:30 PM", "Miyahara: ice cream and pineapple cakes", "miyahara", "Van, about 5 min", ""],
        [5, "1:30 PM", "Taichung Park: a lake and lawns for the kids to run (optional)", "taichungpark", "Van, about 5 min", "Skip it if everyone is tired."],
        [5, "2:15 PM", "Van back to Taipei, nap time in the car seats", "", "Van, about 2½ hrs", ""],
        [5, "5:00 PM", "Early dinner at Ichiran Taipei flagship", "ichiran", "Van", "5 PM on a weekday means a short queue. The booth dividers fold open so families can sit together.", "must"],
        [5, "6:30 PM", "Back to the hotel", "hotel", "Van", "The van's day ends here."],

        [6, "8:00 AM", "Breakfast, pack and check out", "hotel", "", "Bags go in the van. Confirm the luggage space with the operator."],
        [6, "9:30 AM", "Chiang Kai-shek Memorial Hall: big plaza and the guard change on the hour", "cks", "Van, about 15 min", "A great place for the kids to run around."],
        [6, "10:45 AM", "Last pasalubong: pineapple cakes", "sunnyhills", "Van", "SunnyHills or Chia Te."],
        [6, "12:00 PM", "Lunch", "", "", ""],
        [6, "TBD", "Van to Taoyuan Airport", "airport", "Van, about 50 min", "Be at the airport 3 hours before the flight. Add your flight time here."]
      ],
      // day, place, name, type, what to order, NT$ per person, counted in budget, tip, must-eat
      food: [
        [1, "dtf", "Din Tai Fung (Taipei 101 B1)", "Restaurant", "Xiaolongbao, pork chop fried rice, shrimp and pork wontons", 700, true, "Kid-friendly, with high chairs. Go 4 to 5 PM.", true],
        [2, "breakfast", "Breakfast shop or 7-Eleven", "Breakfast", "Dan bing (egg crepe), soy milk, steamed buns", 100, true, "Steamed buns are great toddler food."],
        [2, "zoo", "Zoo food court", "Casual", "Bento, noodles", 200, true, ""],
        [2, "yaoyue", "Yao Yue Teahouse", "Teahouse", "Tea set with tea snacks", 300, true, "Close to Maokong Station."],
        [2, "aychung", "Ay-Chung Flour-Rice Noodle (if near the hotel)", "Street food", "Mee sua, soft noodles that kids can eat", 85, true, ""],
        [2, "xingfutang", "Xing Fu Tang", "Milk tea", "Brown sugar boba milk", 90, true, "No boba for the toddlers: choking risk."],
        [2, "", "Dinner near the hotel", "Casual", "Fried rice, noodles, dumplings", 250, true, ""],
        [3, "breakfast", "Breakfast", "Breakfast", "Dan bing, soy milk", 100, true, ""],
        [3, "amusement", "Amusement park food court", "Casual", "Simple meals and snacks", 200, true, ""],
        [3, "hotstar", "Hot-Star Large Fried Chicken", "Street food", "Giant fried chicken cutlet to share", 120, true, ""],
        [3, "shilin", "Shilin Night Market stalls", "Street food", "Oyster omelette, sweet potato balls, sausage", 200, true, "Sweet potato balls (QQ balls) are a kid favorite."],
        [4, "breakfast", "Breakfast", "Breakfast", "", 100, true, ""],
        [4, "shifen", "Shifen Old Street stall", "Street food", "Chicken wing stuffed with fried rice", 80, true, ""],
        [4, "shifen", "Shifen lunch", "Casual", "Noodles, braised pork rice", 150, true, ""],
        [4, "agan", "A-Gan Yi Taro Balls", "Dessert", "Taro balls, hot or cold", 60, true, "Soft and good for toddlers; cut them small."],
        [4, "peanutroll", "Peanut ice cream roll stall", "Street food", "Peanut brittle and ice cream in a crepe", 60, true, "Ask for no cilantro for the kids."],
        [4, "amei", "A-Mei Teahouse", "Teahouse", "Tea set with snacks", 350, true, ""],
        [4, "", "Dinner near the hotel", "Casual", "", 250, true, ""],
        [5, "breakfast", "Breakfast", "Breakfast", "", 100, true, ""],
        [5, "chunshui", "Chun Shui Tang original (30 Siwei St)", "Milk tea", "The original pearl milk tea, with noodles, braised pork or tofu snacks", 350, true, "Birthplace of pearl milk tea, 1987.", true],
        [5, "miyahara", "Miyahara", "Dessert", "Ice cream with toppings", 200, true, ""],
        [5, "ichiran", "Ichiran Taipei flagship (97 Songren Rd)", "Restaurant", "Tonkotsu ramen with egg; kids share", 350, true, "Ask for mild or no spicy sauce on the kids' bowl.", true],
        [6, "breakfast", "Breakfast", "Breakfast", "", 100, true, ""],
        [6, "cks", "Lunch near CKS or at the airport", "Casual", "", 250, true, ""],
        [1, "ximending", "Ximending street food (optional night)", "Street food", "If the kids still have energy", 250, false, "Switch on to count it."],
        [3, "pepperbun", "Fuzhou Black Pepper Bun (optional)", "Street food", "Pepper bun from the clay oven", 65, false, "Raohe isn't in this plan. Switch on to count it."]
      ],
      // day, item, category, basis, NT$ per unit (or FOOD / SHOP / HOTEL), note, price-check search
      budget: [
        [1, "Van: airport pickup + 6-hour city charter", "Van", "van", 8000, "9-seater. Tolls, fuel and parking are usually included.", "Taipei airport pickup 9 seater private car charter 6 hours price"],
        [1, "Child car seats (NT$200 per seat, 6 van days)", "Van", "child", 1200, "Required by law for kids 0 to 4. Some operators give one seat free.", "Taiwan private charter child car seat fee"],
        [1, "Taipei 101 Observatory (adults)", "Entrance", "adult", 600, "Kids under 115 cm usually free. Type 0 to skip.", "Taipei 101 Observatory ticket price"],
        [1, "Meals", "Food", "eater", "FOOD", "From the Food tab."],
        [1, "eSIM or SIM card", "Other", "adult", 300, "", "Taiwan eSIM 6 days price"],
        [1, "EasyCard (deposit + load)", "Other", "adult", 200, "Kids under 6 ride the MRT free.", "EasyCard Taiwan price"],
        [2, "Van: 8-hour charter (zoo + Maokong)", "Van", "van", 7500, "Ends around 3 PM.", "Taipei 8 hour private car charter 9 seater price"],
        [2, "Taipei Zoo (adults)", "Entrance", "adult", 60, "Kids under 6 free.", "Taipei Zoo ticket price"],
        [2, "Maokong Gondola round trip (adults)", "Entrance", "adult", 240, "Kids under 6 free.", "Maokong Gondola fare"],
        [2, "Meals", "Food", "eater", "FOOD", ""],
        [2, "Taxi to and from dinner", "Transport", "group", 300, ""],
        [3, "Van: 10-hour charter (driver waits during nap)", "Van", "van", 9000, "Or two short transfers. Ask which is cheaper.", "Taipei 10 hour private car charter 9 seater price"],
        [3, "Amusement park entry (adults)", "Entrance", "adult", 30, "Kids under 6 free.", "Taipei Children's Amusement Park ticket price"],
        [3, "Kids' rides (NT$20 to 40 each)", "Entrance", "child", 200, "About 6 to 8 rides each.", "Taipei Children's Amusement Park ride price"],
        [3, "Adults riding with toddlers", "Entrance", "adult", 100, ""],
        [3, "Meals", "Food", "eater", "FOOD", ""],
        [4, "Van: 9-hour Houtong, Shifen, Jiufen charter", "Van", "van", 9500, "", "Jiufen Shifen private car charter 9 seater price"],
        [4, "Sky lantern (4 colors) at Shifen", "Entrance", "lantern", 300, "", "Shifen sky lantern price"],
        [4, "Meals", "Food", "eater", "FOOD", ""],
        [4, "Taxi to and from dinner", "Transport", "group", 300, ""],
        [5, "Van: 10-hour Taipei to Taichung and back", "Van", "van", 12000, "Shorter than the original plan (no Nantou).", "Taipei to Taichung private car charter day trip 9 seater price"],
        [5, "Meals", "Food", "eater", "FOOD", ""],
        [6, "Van: 6-hour morning + airport drop-off", "Van", "van", 6500, "", "Taipei to Taoyuan airport 9 seater van transfer price"],
        [6, "Meals", "Food", "eater", "FOOD", ""],
        [6, "Diapers, milk and kid snacks (whole trip)", "Kids", "child", 1800, "About NT$300 per child per day. Bring from home to save."],
        [6, "Shopping and pasalubong", "Shopping", "adult", "SHOP", "Set on the Budget tab."],
        [6, "Hotel (if not prepaid)", "Hotel", "group", "HOTEL", "Set on the Budget tab."],
        [6, "Driver tips (optional, about NT$500 per van-day)", "Van", "van", 3000, "Not required in Taiwan, but a nice gesture."]
      ]
    },

    /* ---------------- Option A: original pace ---------------- */
    original: {
      name: "Original pace",
      blurb: "The Canva plan with a van: long days, Nantou and Taichung in one go, and a free day on the MRT.",
      days: [
        { title: "Arrival and Taipei highlights", banner: ["t101", "cks", "longshan", "ximending"] },
        { title: "Taipei Zoo, Maokong and Shilin", banner: ["gondola", "zoo", "shilin"] },
        { title: "Nantou and Taichung day trip", banner: ["formosan", "sunmoon", "chunshui", "raohe"] },
        { title: "Shifen, Houtong and Jiufen", banner: ["jiufen", "shifen", "shifenfalls", "houtong"] },
        { title: "Free day on the MRT", banner: ["elephant", "dihua", "ichiran"] },
        { title: "Uwian day", banner: ["airport"] }
      ],
      stops: [
        [1, "12:00 PM", "Land at Taoyuan Airport", "airport", "", "Allow 45 to 60 minutes for immigration and bags. Buy an EasyCard and a SIM or eSIM."],
        [1, "1:00 PM", "Meet the van driver at arrivals", "", "Van, about 50 min", "The van day starts here (8-hour charter)."],
        [1, "2:00 PM", "Orange Hotel: check in or drop the bags", "hotel", "", ""],
        [1, "2:30 PM", "Taipei 101: late lunch at Din Tai Fung (B1), then the mall", "dtf", "Van, about 25 min", "Get a queue number first, then walk the mall while you wait.", "must"],
        [1, "4:15 PM", "Taipei 101 Observatory on the 89th floor (optional)", "t101", "", "Go up before sunset, around 5:05 PM in December."],
        [1, "5:15 PM", "Chiang Kai-shek Memorial Hall: plaza, gates and night lights", "cks", "Van, about 15 min", ""],
        [1, "6:15 PM", "Longshan Temple, lit up at night", "longshan", "Van, about 10 min", "Snack on lu rou fan at Guangzhou Street Night Market next door."],
        [1, "7:15 PM", "Ximending: dinner, street food and shopping", "ximending", "Van, about 5 min", "Ay-Chung mee sua and Xing Fu Tang brown sugar boba."],
        [1, "9:00 PM", "The van's day ends. Walk or taxi back to the hotel.", "hotel", "Walk or taxi", ""],

        [2, "7:30 AM", "Breakfast near the hotel (dan bing or 7-Eleven)", "breakfast", "Walk", ""],
        [2, "8:30 AM", "Van pickup at the hotel", "hotel", "", "10-hour charter today."],
        [2, "9:00 AM", "Taipei Zoo: pandas, penguins and koalas", "zoo", "Van, about 30 min", "Opens at 9 AM. It's a big park, so wear comfy shoes. Lunch inside the zoo."],
        [2, "1:30 PM", "Maokong Gondola from Taipei Zoo Station", "gondola", "Gondola, about 25 min", "Try the glass-floor Eyes of Maokong cabins (separate queue)."],
        [2, "2:15 PM", "Maokong tea houses: tea, tea snacks and mountain views", "maokong", "Walk", "Yao Yue Teahouse is the classic pick."],
        [2, "4:30 PM", "Van picks you up at Maokong Station", "", "Van", "Saves riding the gondola back down."],
        [2, "5:30 PM", "Shilin Night Market: dinner and street food", "shilin", "Van, about 40 min", "The van's day ends here. Hot-Star chicken, oyster omelette."],
        [2, "8:30 PM", "Back to the hotel", "hotel", "MRT from Jiantan, or taxi", ""],

        [3, "6:00 AM", "Wake up and grab breakfast to eat in the van", "breakfast", "", "Long day: about 6 hours of driving."],
        [3, "6:30 AM", "Van leaves for Yuchi, Nantou", "", "Van, about 3 hrs", "12 to 13-hour long-distance charter."],
        [3, "9:30 AM", "Formosan Aboriginal Culture Village: shows, cable car and rides", "formosan", "", "It's beside Sun Moon Lake in Nantou, not in Taichung city."],
        [3, "12:30 PM", "Leave for Taichung city", "", "Van, about 1¼ hrs", ""],
        [3, "1:45 PM", "Lunch at Chun Shui Tang's original store, birthplace of pearl milk tea", "chunshui", "", "Order the classic pearl milk tea with a meal.", "must"],
        [3, "3:00 PM", "Miyahara: ice cream and pineapple cake pasalubong", "miyahara", "Van, about 5 min", "A restored 1920s eye clinic near Taichung Station."],
        [3, "4:00 PM", "Leave Taichung for Taipei", "", "Van, about 2½ to 3 hrs", "Sunday traffic north can be heavy."],
        [3, "7:00 PM", "Raohe Night Market: dinner", "raohe", "Van", "The van's day ends here. Fuzhou pepper bun at the entrance."],
        [3, "9:00 PM", "Back to the hotel", "hotel", "MRT or taxi", ""],

        [4, "7:30 AM", "Breakfast", "breakfast", "Walk", ""],
        [4, "8:00 AM", "Van pickup at the hotel", "hotel", "", "11-hour charter today."],
        [4, "9:00 AM", "Shifen Old Street: sky lantern release", "shifen", "Van, about 1 hr", "Write wishes on all 4 sides. Try the stuffed chicken wing."],
        [4, "10:30 AM", "Shifen Waterfall", "shifenfalls", "Van, then a 15-min walk", ""],
        [4, "11:45 AM", "Houtong Cat Village", "houtong", "Van, about 25 min", ""],
        [4, "1:00 PM", "Jiufen Old Street: lunch, taro balls and A-Mei Teahouse", "jiufen", "Van, about 25 min", "Stay until dusk. The lanterns light up around 5 PM."],
        [4, "5:30 PM", "Leave Jiufen for Taipei", "", "Van, about 1 hr", ""],
        [4, "6:45 PM", "Drop-off at Ximending for a last shopping evening", "ximending", "", "The van's day ends here."],
        [4, "9:00 PM", "Back to the hotel", "hotel", "Walk or taxi", ""],

        [5, "8:00 AM", "Fu Hang Dou Jiang, the famous soy milk breakfast", "fuhang", "MRT to Shandao Temple", "Free day, no van. The line moves fast; go early."],
        [5, "10:00 AM", "Dadaocheng and Dihua Street: old shophouses and dried goods", "dihua", "MRT", "Only a suggestion. Swap anything."],
        [5, "1:00 PM", "Lunch at Lin Dong Fang beef noodles", "lindongfang", "MRT or taxi", ""],
        [5, "4:00 PM", "Elephant Mountain hike for the sunset view of Taipei 101", "elephant", "MRT to Xiangshan", "About 20 minutes of stairs. Sunset is around 5:05 PM."],
        [5, "6:00 PM", "Dinner at Ichiran Taipei flagship", "ichiran", "Walk, about 5 min from the trail", "Open 24 hours; expect a queue.", "must"],
        [5, "7:30 PM", "Xinyi shopping district, or rest", "", "Walk", ""],

        [6, "8:00 AM", "Breakfast and pack", "hotel", "", ""],
        [6, "9:30 AM", "Last pasalubong: pineapple cakes", "sunnyhills", "MRT or taxi", "SunnyHills, or Chia Te near Nanjing Fuxing MRT."],
        [6, "12:00 PM", "Hotel check-out", "hotel", "", "Confirm the check-out time with Orange Hotel."],
        [6, "TBD", "Van to Taoyuan Airport", "airport", "Van, about 50 min", "Be at the airport 3 hours before the flight. Add your flight time here."]
      ],
      food: [
        [1, "dtf", "Din Tai Fung (Taipei 101 B1)", "Restaurant", "Xiaolongbao, truffle xiaolongbao, pork chop fried rice, shrimp and pork wontons", 700, true, "Must-try. The queue can be over an hour.", true],
        [1, "guangzhou", "Guangzhou Street Night Market", "Street food", "Lu rou fan (braised pork rice), oyster omelette", 120, true, "Cheap and local, beside Longshan Temple."],
        [1, "aychung", "Ay-Chung Flour-Rice Noodle", "Street food", "Oyster and pork intestine mee sua", 85, true, "Eaten standing up. It's tradition."],
        [1, "xingfutang", "Xing Fu Tang", "Milk tea", "Brown sugar boba milk", 90, true, ""],
        [1, "ximending", "Ximending street stalls", "Street food", "Fried squid, grilled corn, scallion pancake", 200, true, ""],
        [2, "breakfast", "Breakfast shop or 7-Eleven", "Breakfast", "Dan bing (egg crepe), soy milk, tea eggs", 100, true, ""],
        [2, "zoo", "Zoo food court", "Casual", "Bento, noodles", 200, true, ""],
        [2, "yaoyue", "Yao Yue Teahouse", "Teahouse", "Tieguanyin tea set with tea-oil noodles or tea snacks", 350, true, "Open 24 hours."],
        [2, "hotstar", "Hot-Star Large Fried Chicken", "Street food", "Giant fried chicken cutlet", 120, true, ""],
        [2, "shilin", "Shilin Night Market stalls", "Street food", "Oyster omelette, sausage in sticky rice, stinky tofu", 230, true, ""],
        [3, "", "7-Eleven or FamilyMart", "Breakfast", "Onigiri, tea eggs, coffee", 80, true, "Eat in the van."],
        [3, "formosan", "Aboriginal Village food stalls", "Snack", "Aboriginal grilled sausage, millet snacks", 150, true, ""],
        [3, "chunshui", "Chun Shui Tang original (30 Siwei St)", "Milk tea", "The original pearl milk tea, with beef noodles, braised pork or tofu snacks", 350, true, "Birthplace of pearl milk tea, 1987.", true],
        [3, "miyahara", "Miyahara", "Dessert", "Ice cream with 3 toppings; pineapple cakes for pasalubong", 200, true, "Pasalubong isn't counted here."],
        [3, "pepperbun", "Fuzhou Black Pepper Bun", "Street food", "Pepper bun fresh from the clay oven", 65, true, "Right at the entrance. Michelin Bib Gourmand."],
        [3, "raohe", "Chen Dong Pork Ribs Herbal Soup", "Street food", "Herbal pork rib soup", 100, true, ""],
        [3, "raohe", "Raohe stalls", "Street food", "Mochi, grilled mushrooms, beef cubes", 150, true, ""],
        [4, "breakfast", "Breakfast shop", "Breakfast", "Dan bing, radish cake, milk tea", 100, true, ""],
        [4, "shifen", "Shifen Old Street stall", "Street food", "Chicken wing stuffed with fried rice", 80, true, ""],
        [4, "jiufen", "Jiufen Old Street lunch", "Street food", "Fish ball soup, braised pork rice, sausage", 250, true, ""],
        [4, "agan", "A-Gan Yi Taro Balls", "Dessert", "Taro balls, hot or cold", 60, true, "Great valley view."],
        [4, "peanutroll", "Peanut ice cream roll stall", "Street food", "Peanut brittle and ice cream in a crepe, with cilantro", 60, true, ""],
        [4, "amei", "A-Mei Teahouse", "Teahouse", "Tea set with snacks in the lantern-lit teahouse", 350, true, "Best at dusk."],
        [4, "ximending", "Ximending dinner", "Street food", "Whatever you missed on day 1", 300, true, ""],
        [5, "fuhang", "Fu Hang Dou Jiang", "Breakfast", "Thick egg flatbread and warm soy milk", 100, true, "Michelin Bib Gourmand."],
        [5, "lindongfang", "Lin Dong Fang Beef Noodles", "Restaurant", "Beef noodle soup", 260, true, ""],
        [5, "ichiran", "Ichiran Taipei flagship (97 Songren Rd)", "Restaurant", "Tonkotsu ramen with a soft-boiled egg", 350, true, "Solo booths, near Xiangshan MRT. Open 24 hours.", true],
        [5, "", "Snacks and drinks", "Snack", "Milk tea, convenience store treats", 200, true, ""],
        [6, "breakfast", "Breakfast", "Breakfast", "", 100, true, ""],
        [6, "airport", "Lunch at the airport", "Casual", "", 250, true, ""],
        [1, "dtf", "Din Tai Fung extras", "Restaurant", "Chocolate xiaolongbao, red bean buns", 150, false, "Switch on to count it."],
        [3, "chunshui", "Chun Shui Tang extra milk tea to go", "Milk tea", "A second cup for the road", 100, false, "Switch on to count it."]
      ],
      budget: [
        [1, "Van: airport pickup + 8-hour city charter", "Van", "van", 9000, "Tolls, fuel and parking are usually included.", "Taipei airport pickup 9 seater private car charter 8 hours price"],
        [1, "Child car seats (NT$200 per seat, 5 van days)", "Van", "child", 1000, "Required by law for kids 0 to 4. Some operators give one seat free.", "Taiwan private charter child car seat fee"],
        [1, "Taipei 101 Observatory (adults, optional)", "Entrance", "adult", 600, "Type 0 to skip.", "Taipei 101 Observatory ticket price"],
        [1, "Meals and street food", "Food", "eater", "FOOD", "From the Food tab."],
        [1, "eSIM or SIM card", "Other", "adult", 300, "", "Taiwan eSIM 6 days price"],
        [1, "EasyCard (deposit + load)", "Other", "adult", 200, "Used on the MRT and in convenience stores.", "EasyCard Taiwan price"],
        [2, "Van: 10-hour Taipei charter", "Van", "van", 9000, "", "Taipei 10 hour private car charter 9 seater price"],
        [2, "Taipei Zoo (adults)", "Entrance", "adult", 60, "", "Taipei Zoo ticket price"],
        [2, "Maokong Gondola, one way up (adults)", "Entrance", "adult", 120, "The van picks you up at the top.", "Maokong Gondola fare"],
        [2, "Meals and street food", "Food", "eater", "FOOD", ""],
        [2, "MRT or taxi back from Shilin", "Other", "adult", 50, ""],
        [3, "Van: 12 to 13-hour Taipei, Nantou, Taichung charter", "Van", "van", 15000, "Long-distance route. Get a firm quote that includes overtime.", "Taipei to Sun Moon Lake Taichung private car charter 9 seater price"],
        [3, "Formosan Aboriginal Culture Village (adults)", "Entrance", "adult", 950, "Usually cheaper on Klook or KKday.", "Formosan Aboriginal Culture Village ticket price"],
        [3, "Meals and street food", "Food", "eater", "FOOD", ""],
        [3, "MRT or taxi back from Raohe", "Other", "adult", 50, ""],
        [4, "Van: 11-hour Shifen, Houtong, Jiufen charter", "Van", "van", 10500, "", "Jiufen Shifen private car charter 9 seater price"],
        [4, "Sky lantern (4 colors) at Shifen", "Entrance", "lantern", 300, "", "Shifen sky lantern price"],
        [4, "Meals and street food", "Food", "eater", "FOOD", ""],
        [5, "MRT and taxis for the free day", "Transport", "adult", 200, "No van on the free day."],
        [5, "Meals and street food", "Food", "eater", "FOOD", ""],
        [6, "Van: hotel to Taoyuan Airport", "Van", "van", 1800, "", "Taipei to Taoyuan airport 9 seater van transfer price"],
        [6, "Meals", "Food", "eater", "FOOD", ""],
        [6, "Shopping and pasalubong", "Shopping", "adult", "SHOP", "Set on the Budget tab."],
        [6, "Hotel (if not prepaid)", "Hotel", "group", "HOTEL", "Set on the Budget tab."],
        [6, "Driver tips (optional, about NT$500 per van-day)", "Van", "van", 2000, "Not required in Taiwan, but a nice gesture."]
      ]
    }
  },

  confirm: [
    "Van operator can fit 4 child car seats (and how many vans that means)",
    "Van quote includes tolls, parking, fuel and overtime",
    "Exact number of adults coming",
    "Flight times for Dec 4 and Dec 9",
    "Orange Hotel branch, and whether it's prepaid",
    "Taiwan online arrival card filed within 3 days before the flight (one person can file for the whole family)",
    "Passports valid, with return tickets",
    "Travel insurance"
  ],

  pack: [
    "Light stroller for the zoo, Taipei 101 and CKS",
    "Baby carriers for Jiufen, Shifen and night markets",
    "Diapers and wipes for the first 2 days (buy more at 7-Eleven)",
    "Milk, formula and favorite snacks for the flight",
    "Change of clothes in every hand-carry",
    "Jackets and rain covers: 15 to 20°C and drizzly in December",
    "Kids' medicine, thermometer and band-aids",
    "Sippy cups and a small spoon set",
    "Phone power banks",
    "Some NT$ cash for night markets and taxis"
  ],

  tips: [
    ["Car seats are the law", "Kids 0 to 4 must ride in a car seat, and each seat takes a passenger spot. That's why the budget assumes 2 vans until an operator confirms 4 seats in one."],
    ["Visa-free for Philippine passports", "Up to 14 days, extended through July 31, 2027. Six days fits easily."],
    ["Arrival card goes online", "Taiwan's paper arrival cards are gone. File online at twac.immigration.gov.tw within 3 days before you land."],
    ["Skip whole boba for little ones", "Tapioca pearls are a choking risk for kids under 4. Order their drinks without pearls."],
    ["Free for small kids", "Kids under 6 get in free at the zoo, gondola and the children's amusement park, and ride the MRT free with an adult."],
    ["Taiwan runs on 110V", "Phone and laptop chargers work. 220V-only appliances from home, like hair dryers, won't."],
    ["Emergency numbers", "Police 110. Ambulance and fire 119. Tourist hotline 0800-011-765, free and open 24 hours."]
  ]
};
