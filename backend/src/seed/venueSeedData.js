/**
 * Sample venues for development and demos. Categories: restoran | kafe | hızlı yemek | tatlı.
 *
 * Image URLs follow the **intent** of Unsplash Source (`https://source.unsplash.com/800x600/?restaurant`
 * and food queries like `?kebab`, `?pizza`, `?coffee`, `?burger`). That Source endpoint is deprecated
 * and often returns HTTP 503, so we use **images.unsplash.com** with `w=800&h=600&fit=crop` — same
 * size, reliable loads, one curated photo per keyword theme.
 */

/** @type {Record<string, string>} Comma-joined keywords → Unsplash `photo-*` id */
const KEYWORDS_TO_PHOTO = {
  'kebab,grill': 'photo-1544025162-d76694265947',
  'coffee,cafe': 'photo-1495474472287-4d71bcdd2085',
  pizza: 'photo-1513104890138-7c749659a591',
  'kebab,pizza': 'photo-1555939594-58d7cb561ad1',
  'dessert,sweet': 'photo-1551024506-0bccd828d307',
  'restaurant,seafood': 'photo-1559339352-11d035aa65de',
  'coffee,espresso': 'photo-1509042239860-f550ce710b93',
  burger: 'photo-1568901346375-23c9450c58cd',
  'cake,pastry': 'photo-1578985545062-69928b1d9587',
};

/**
 * 800×600 food/restaurant image (Unsplash CDN). Keywords mirror Source API query terms.
 * @param {...string} keywords e.g. 'kebab', 'grill' → same as `?kebab,grill` on Source
 */
export function foodImage800x600(...keywords) {
  const key = keywords.join(',');
  const photoId = KEYWORDS_TO_PHOTO[key];
  if (!photoId) {
    throw new Error(`venueSeedData: no photo mapped for keywords "${key}"`);
  }
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=600&q=80`;
}

/** Base venue documents without `owner` — pass owner ObjectId when inserting. */
export const venueSeedDocuments = [
  {
    name: 'Isparta Kebap ve Izgara Evi',
    category: 'restoran',
    description:
      'Isparta merkezde geleneksel ocakbasi ve Adana-Urfa kebap cesitleri. Oglen ve aksam icin genis meze secenegi.',
    location: { lat: 37.7661, lng: 30.5532 },
    rating: 4.3,
    menu: ['Adana kebap', 'Karışık ızgara', 'Çoban salata', 'Künefe', 'Ayran'],
    hours: { mon: '11:00–23:00', tue: '11:00–23:00', wed: '11:00–23:00', thu: '11:00–23:00', fri: '11:00–24:00', sat: '11:00–24:00', sun: '12:00–22:00' },
    photoUrl: foodImage800x600('kebab', 'grill'),
  },
  {
    name: 'Isparta Kahve Lab',
    category: 'kafe',
    description:
      'Ucuncu dalga kahve, soguk demleme ve ev yapimi cheesecake. Isparta merkezde sakin calisma ortami sunar.',
    location: { lat: 37.7632, lng: 30.5591 },
    rating: 4.7,
    menu: ['Flat white', 'Cold brew', 'Avokado toast', 'Cheesecake', 'Matcha latte'],
    hours: { mon: '08:00–22:00', tue: '08:00–22:00', wed: '08:00–22:00', thu: '08:00–22:00', fri: '08:00–23:00', sat: '09:00–23:00', sun: '09:00–21:00' },
    photoUrl: foodImage800x600('coffee', 'cafe'),
  },
  {
    name: 'Isparta Durum Express',
    category: 'hızlı yemek',
    description:
      'Gece gec saatlere kadar acik; tavuk ve et durum, citir tavuk kutusu ve hizli servis. Merkezde pratik durak.',
    location: { lat: 37.7587, lng: 30.5489 },
    rating: 3.8,
    menu: ['Tavuk dürüm', 'Et şiş dürüm', 'Çıtır tavuk box', 'Ayran', 'Patates kızartması'],
    hours: { mon: '10:00–04:00', tue: '10:00–04:00', wed: '10:00–04:00', thu: '10:00–04:00', fri: '10:00–05:00', sat: '10:00–05:00', sun: '10:00–03:00' },
    photoUrl: foodImage800x600('kebab', 'pizza'),
  },
  {
    name: 'Isparta Baklava Sarayi',
    category: 'tatlı',
    description:
      'Baklava, kunefe ve dondurma cesitleri. Carsiya yakin konumda cay esliginde tatli molasi icin uygundur.',
    location: { lat: 37.7704, lng: 30.5626 },
    rating: 4.6,
    menu: ['Fıstıklı baklava', 'Künefe', 'Sütlü nuriye', 'Dondurma', 'Türk kahvesi'],
    hours: { mon: '09:00–23:00', tue: '09:00–23:00', wed: '09:00–23:00', thu: '09:00–23:00', fri: '09:00–24:00', sat: '09:00–24:00', sun: '10:00–22:00' },
    photoUrl: foodImage800x600('dessert', 'sweet'),
  },
  {
    name: 'Isparta Meyhane Sofrasi',
    category: 'restoran',
    description:
      'Raki-balik kulturu ve Ege mezeleri. Cuma-Cumartesi canli muzik aksamlariyla Isparta merkezde hizmet verir.',
    location: { lat: 37.7568, lng: 30.5652 },
    rating: 4.5,
    menu: ['Meze tabağı', 'Çiroz', 'Ahtapot salatası', 'Rakı', 'İncir tatlısı'],
    hours: { wed: '17:00–01:00', thu: '17:00–01:00', fri: '17:00–02:00', sat: '17:00–02:00', sun: '12:00–23:00' },
    photoUrl: foodImage800x600('restaurant', 'seafood'),
  },
  {
    name: 'Isparta Roasters Co.',
    category: 'kafe',
    description:
      'Kendi kavurduklari cekirdekler ve filtre kahve cesitleri. Tatli olarak limonlu tart ve brownie one cikar.',
    location: { lat: 37.7729, lng: 30.5511 },
    rating: 4.4,
    menu: ['V60', 'Espresso tonic', 'Cortado', 'Limonlu tart', 'Brownie'],
    hours: { mon: '09:00–21:00', tue: '09:00–21:00', wed: '09:00–21:00', thu: '09:00–21:00', fri: '09:00–22:00', sat: '08:00–22:00', sun: '08:00–21:00' },
    photoUrl: foodImage800x600('coffee', 'espresso'),
  },
  {
    name: 'Isparta Smash Burger',
    category: 'hızlı yemek',
    description:
      'Smash burger, citir tavuk sandvic ve patates uzerine ozel soslar. Isparta merkezde hizli servis sunar.',
    location: { lat: 37.7601, lng: 30.5458 },
    rating: 3.9,
    menu: ['Double smash burger', 'Tavuk burger', 'Patates kızartması', 'Milkshake', 'Soğan halkası'],
    hours: { mon: '11:00–23:00', tue: '11:00–23:00', wed: '11:00–23:00', thu: '11:00–23:00', fri: '11:00–01:00', sat: '11:00–01:00', sun: '11:00–22:00' },
    photoUrl: foodImage800x600('burger'),
  },
  {
    name: 'Isparta Pasta Atolyesi',
    category: 'tatlı',
    description:
      'Pastacilik urunleri ve ozel gun pastalari siparisle hazirlanir. Gunluk tart ve makaron secenekleri bulunur.',
    location: { lat: 37.7688, lng: 30.5704 },
    rating: 4.8,
    menu: ['Opera pasta', 'Frambuazlı tart', 'Makaron kutusu', 'Çikolatalı soufflé', 'Çay'],
    hours: { mon: '10:00–20:00', tue: '10:00–20:00', wed: '10:00–20:00', thu: '10:00–20:00', fri: '10:00–21:00', sat: '10:00–21:00', sun: '11:00–19:00' },
    photoUrl: foodImage800x600('cake', 'pastry'),
  },
  {
    name: 'Isparta Carsi Doner',
    category: 'hızlı yemek',
    description:
      'Isparta merkezde doner ve hizli atistirmaliklar. Ogrenciler icin uygun fiyatli menu secenekleri.',
    location: { lat: 37.7624, lng: 30.5523 },
    rating: 4.1,
    menu: ['Et doner', 'Tavuk doner', 'Ayran', 'Patates kizartmasi'],
    hours: { mon: '10:00–23:00', tue: '10:00–23:00', wed: '10:00–23:00', thu: '10:00–23:00', fri: '10:00–24:00', sat: '10:00–24:00', sun: '11:00–22:00' },
    photoUrl: foodImage800x600('kebab', 'pizza'),
  },
  {
    name: 'Gul Vadisi Kafe',
    category: 'kafe',
    description:
      'Gul aromali icecekler ve sakin oturma alani sunan samimi bir Isparta kafesi.',
    location: { lat: 37.7692, lng: 30.5605 },
    rating: 4.5,
    menu: ['Gul latte', 'Filtre kahve', 'San Sebastian', 'Limonata'],
    hours: { mon: '08:30–22:00', tue: '08:30–22:00', wed: '08:30–22:00', thu: '08:30–22:00', fri: '08:30–23:00', sat: '09:00–23:00', sun: '09:00–21:00' },
    photoUrl: foodImage800x600('coffee', 'cafe'),
  },
  {
    name: 'Lavanta Sofrasi',
    category: 'restoran',
    description:
      'Ev yemegi ve izgara seceneklerini bir arada sunan aile restoranı.',
    location: { lat: 37.7716, lng: 30.5477 },
    rating: 4.4,
    menu: ['Gunluk ev yemegi', 'Kofte', 'Pilav', 'Yogurtlu mezeler'],
    hours: { mon: '11:00–22:00', tue: '11:00–22:00', wed: '11:00–22:00', thu: '11:00–22:00', fri: '11:00–23:00', sat: '11:00–23:00', sun: '12:00–21:00' },
    photoUrl: foodImage800x600('restaurant', 'seafood'),
  },
  {
    name: 'Meydan Burger House',
    category: 'hızlı yemek',
    description:
      'Smash burger ve atistirmaliklariyla Isparta meydaninda hizli servis veren mekan.',
    location: { lat: 37.7579, lng: 30.5578 },
    rating: 4.0,
    menu: ['Cheese burger', 'Double burger', 'Sogan halkasi', 'Milkshake'],
    hours: { mon: '11:00–23:30', tue: '11:00–23:30', wed: '11:00–23:30', thu: '11:00–23:30', fri: '11:00–01:00', sat: '11:00–01:00', sun: '12:00–22:30' },
    photoUrl: foodImage800x600('burger'),
  },
  {
    name: 'Goller Yoresel Mutfak',
    category: 'restoran',
    description:
      'Isparta ve cevresinin yoresel yemeklerini modern sunumla servis eder.',
    location: { lat: 37.7751, lng: 30.5634 },
    rating: 4.6,
    menu: ['Kabune pilavi', 'Firinda et', 'Yoresel corba', 'Hosaf'],
    hours: { mon: '12:00–22:00', tue: '12:00–22:00', wed: '12:00–22:00', thu: '12:00–22:00', fri: '12:00–23:00', sat: '12:00–23:00', sun: '12:00–21:30' },
    photoUrl: foodImage800x600('kebab', 'grill'),
  },
  {
    name: 'Cinaralti Espresso',
    category: 'kafe',
    description:
      'Merkezde mini bahcesi olan, espresso bazli icecekleriyle one cikan kafe.',
    location: { lat: 37.7608, lng: 30.5661 },
    rating: 4.3,
    menu: ['Espresso', 'Flat white', 'Cookie', 'Mozaik pasta'],
    hours: { mon: '09:00–22:00', tue: '09:00–22:00', wed: '09:00–22:00', thu: '09:00–22:00', fri: '09:00–23:00', sat: '09:00–23:00', sun: '10:00–21:00' },
    photoUrl: foodImage800x600('coffee', 'espresso'),
  },
  {
    name: 'Akdeniz Tantuni Point',
    category: 'hızlı yemek',
    description:
      'Tantuni, tavuk wrap ve hizli menu secenekleri sunan geceye kadar acik mekan.',
    location: { lat: 37.7544, lng: 30.5516 },
    rating: 3.9,
    menu: ['Et tantuni', 'Tavuk tantuni', 'Acili soslu patates', 'Ayran'],
    hours: { mon: '11:00–00:00', tue: '11:00–00:00', wed: '11:00–00:00', thu: '11:00–00:00', fri: '11:00–01:00', sat: '11:00–01:00', sun: '12:00–23:00' },
    photoUrl: foodImage800x600('kebab', 'pizza'),
  },
  {
    name: 'Gul Bahcesi Tatli Evi',
    category: 'tatlı',
    description:
      'Serbetli tatlilar ve sutlu tatlilarin bir arada oldugu ferah tatli dukkani.',
    location: { lat: 37.7675, lng: 30.5469 },
    rating: 4.7,
    menu: ['Baklava', 'Sutlac', 'Kazandibi', 'Kunefe'],
    hours: { mon: '10:00–22:00', tue: '10:00–22:00', wed: '10:00–22:00', thu: '10:00–22:00', fri: '10:00–23:00', sat: '10:00–23:00', sun: '11:00–21:00' },
    photoUrl: foodImage800x600('dessert', 'sweet'),
  },
  {
    name: 'Merkez Firin & Pasta',
    category: 'tatlı',
    description:
      'Gunluk cikolatali urunler, yas pasta ve kahvaltilik firin urunleri sunar.',
    location: { lat: 37.7734, lng: 30.5588 },
    rating: 4.2,
    menu: ['Profiterol', 'Yas pasta', 'Ekler', 'Pogaca'],
    hours: { mon: '07:30–21:00', tue: '07:30–21:00', wed: '07:30–21:00', thu: '07:30–21:00', fri: '07:30–21:30', sat: '08:00–21:30', sun: '08:30–20:00' },
    photoUrl: foodImage800x600('cake', 'pastry'),
  },
  {
    name: 'Isparta Ev Lezzetleri',
    category: 'restoran',
    description:
      'Gunluk tencere yemekleri, izgara ve corba cesitleriyle ailece tercih edilen lokanta.',
    location: { lat: 37.7583, lng: 30.5719 },
    rating: 4.4,
    menu: ['Kuru fasulye', 'Pilav', 'Izgara tavuk', 'Mercimek corbasi'],
    hours: { mon: '11:00–21:30', tue: '11:00–21:30', wed: '11:00–21:30', thu: '11:00–21:30', fri: '11:00–22:30', sat: '11:00–22:30', sun: '12:00–21:00' },
    photoUrl: foodImage800x600('kebab', 'grill'),
  },
];

/**
 * @param {import('mongoose').Types.ObjectId | null | undefined} ownerId
 */
export function venuesWithOwner(ownerId) {
  return venueSeedDocuments.map((doc) => ({
    ...doc,
    owner: ownerId ?? null,
  }));
}
