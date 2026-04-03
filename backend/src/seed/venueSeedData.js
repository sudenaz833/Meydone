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
    name: 'Zula Burger',
    category: 'hızlı yemek',
    description:
      'Isparta merkezde hamburger ve yan ürünleriyle hızlı servis veren mekan.',
    location: { lat: 37.7647, lng: 30.5558 },
    rating: 4.2,
    menu: [
      { name: 'Cheeseburger', price: 189 },
      { name: 'Double burger', price: 239 },
      { name: 'Patates kızartması', price: 75 },
      { name: 'Soğan halkası', price: 65 },
      { name: 'Milkshake', price: 95 },
    ],
    hours: { mon: '11:00–23:00', tue: '11:00–23:00', wed: '11:00–23:00', thu: '11:00–23:00', fri: '11:00–00:00', sat: '11:00–00:00', sun: '12:00–22:00' },
    photoUrl: 'https://iasbh.tmgrup.com.tr/78d2fd/821/464/0/0/724/409?u=https://isbh.tmgrup.com.tr/sbh/2021/09/30/hamburger-tarifi-evde-hamburger-nasil-yapilir-1633000765331.jpg',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Kutlubey' },
  },
  {
    name: 'Dominos Pizza Isparta',
    category: 'hızlı yemek',
    description:
      'Isparta merkezde pizza odaklı hızlı servis noktası.',
    location: { lat: 37.7628, lng: 30.5524 },
    rating: 4.0,
    menu: [
      { name: 'Karışık pizza', price: 329 },
      { name: 'Sucuklu pizza', price: 299 },
      { name: 'Margarita', price: 249 },
      { name: 'Soğan halkası', price: 69 },
      { name: 'Kola', price: 45 },
    ],
    hours: { mon: '11:00–23:30', tue: '11:00–23:30', wed: '11:00–23:30', thu: '11:00–23:30', fri: '11:00–00:30', sat: '11:00–00:30', sun: '12:00–22:30' },
    photoUrl: 'https://b.zmtcdn.com/data/collections/c7d46261b33b5d464ec536c1706a72ec_1754474018.png?fit=around|562.5:360&crop=562.5:360;*,*',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Pirimehmet' },
  },
  {
    name: 'Kahve Dünyası Iyaşpark',
    category: 'kafe',
    description:
      'Isparta Iyaşpark AVM içinde kahve ve tatlı seçenekleri sunan zincir kafe.',
    location: { lat: 37.7712, lng: 30.5389 },
    rating: 4.2,
    menu: [
      { name: 'Americano', price: 69 },
      { name: 'Latte', price: 79 },
      { name: 'Mozaik pasta', price: 119 },
      { name: 'Cookie', price: 45 },
      { name: 'Sıcak çikolata', price: 89 },
    ],
    hours: { mon: '10:00–22:00', tue: '10:00–22:00', wed: '10:00–22:00', thu: '10:00–22:00', fri: '10:00–22:30', sat: '10:00–22:30', sun: '10:00–22:00' },
    photoUrl: 'https://www.tasocakfirin.com/image/cache/catalog/products_2021/S%C3%BCtl%C3%BC-Gran%C3%BCl-Kahve-500x500.jpg',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Çünür' },
  },
  {
    name: 'Mersin Tantuni Isparta',
    category: 'hızlı yemek',
    description:
      'Isparta merkezde et ve tavuk tantuni sunan hızlı yemek mekanı.',
    location: { lat: 37.7586, lng: 30.5515 },
    rating: 4.1,
    menu: [
      { name: 'Et tantuni', price: 149 },
      { name: 'Tavuk tantuni', price: 129 },
      { name: 'Acılı tantuni', price: 159 },
      { name: 'Ayran', price: 25 },
      { name: 'Şalgam', price: 30 },
    ],
    hours: { mon: '11:00–01:00', tue: '11:00–01:00', wed: '11:00–01:00', thu: '11:00–01:00', fri: '11:00–02:00', sat: '11:00–02:00', sun: '12:00–00:00' },
    photoUrl: 'https://www.unileverfoodsolutions.com.tr/dam/global-ufs/mcos/TURKEY/calcmenu/recipes/TR-recipes/general/ac%C4%B1l%C4%B1-tantuni/main-header.jpg',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Yayla' },
  },
  {
    name: 'Köfteci Yusuf Isparta',
    category: 'restoran',
    description:
      'Isparta şubesinde köfte ve ızgara çeşitleriyle bilinen zincir restoran.',
    location: { lat: 37.7811, lng: 30.5584 },
    rating: 4.3,
    menu: [
      { name: 'Köfte', price: 219 },
      { name: 'Izgara tavuk', price: 199 },
      { name: 'Piyaz', price: 69 },
      { name: 'Ayran', price: 20 },
      { name: 'Sütlaç', price: 79 },
    ],
    hours: { mon: '10:00–23:00', tue: '10:00–23:00', wed: '10:00–23:00', thu: '10:00–23:00', fri: '10:00–23:30', sat: '10:00–23:30', sun: '10:00–22:30' },
    photoUrl: 'https://d17wu0fn6x6rgz.cloudfront.net/img/w/tarif/mgt/izgara-kofte-1.webp',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Sanayi' },
  },
  {
    name: 'Kebapçı Kadir Isparta',
    category: 'restoran',
    description:
      'Isparta merkezde Adana ve Urfa kebap çeşitleriyle bilinen kebapçı.',
    location: { lat: 37.7664, lng: 30.5531 },
    rating: 4.4,
    menu: [
      { name: 'Adana kebap', price: 349 },
      { name: 'Urfa kebap', price: 339 },
      { name: 'Karışık ızgara', price: 449 },
      { name: 'Lahmacun', price: 89 },
      { name: 'Ayran', price: 25 },
    ],
    hours: { mon: '11:00–23:30', tue: '11:00–23:30', wed: '11:00–23:30', thu: '11:00–23:30', fri: '11:00–00:30', sat: '11:00–00:30', sun: '12:00–22:30' },
    photoUrl: 'https://turkiyerestoranlari.com/wp-content/uploads/2025/07/Istanbul-en-iyi-kebapcilar.jpg',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Kutlubey' },
  },
  {
    name: 'Mado Isparta',
    category: 'tatlı',
    description: 'Isparta merkezde dondurma ve baklava çeşitleri sunan tatlıcı.',
    location: { lat: 37.7651, lng: 30.5562 },
    rating: 4.5,
    menu: [
      { name: 'Dondurma', price: 95 },
      { name: 'Baklava', price: 140 },
      { name: 'Künefe', price: 165 },
      { name: 'Profiterol', price: 125 },
      { name: 'Pasta', price: 135 },
      { name: 'Türk kahvesi', price: 55 },
    ],
    hours: { mon: '10:00–23:00', tue: '10:00–23:00', wed: '10:00–23:00', thu: '10:00–23:00', fri: '10:00–23:30', sat: '10:00–23:30', sun: '10:00–22:30' },
    photoUrl: 'https://www.yasarpastanesi.com.tr/2-kg-fistikli-yasar-baklava-2-kg-hakiki-sade-maras-dondurmasi-dondurmalar-mado-1500-34-B.jpg',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Kutlubey' },
  },
  {
    name: 'Mantı Makarna Evi Isparta',
    category: 'restoran',
    description: 'Isparta merkezde ev usulü mantı ve taze makarna çeşitleri sunan mekan.',
    location: { lat: 37.7672, lng: 30.5594 },
    rating: 4.3,
    menu: [
      { name: 'Kayseri mantısı', price: 189 },
      { name: 'Fırın mantı', price: 179 },
      { name: 'Penne arrabbiata', price: 165 },
      { name: 'Kremalı mantarlı makarna', price: 175 },
      { name: 'Sebzeli makarna', price: 155 },
      { name: 'Köri soslu makarna', price: 169 },
      { name: 'Ayran', price: 20 },
    ],
    hours: { mon: '12:00–22:30', tue: '12:00–22:30', wed: '12:00–22:30', thu: '12:00–22:30', fri: '12:00–23:00', sat: '12:00–23:00', sun: '12:00–22:00' },
    photoUrl: 'https://d17wu0fn6x6rgz.cloudfront.net/img/w/tarif/ogt/sebzeli-makarna.webp',
    address: { city: 'Isparta', district: 'Merkez', neighborhood: 'Kutlubey' },
  },
  {
    name: 'Zula Burger Akaretler',
    category: 'hızlı yemek',
    description: 'İstanbul Beşiktaş tarafında hamburger odaklı hızlı yemek mekanı.',
    location: { lat: 41.0438, lng: 29.0059 },
    rating: 4.5,
    menu: [
      { name: 'Cheeseburger', price: 209 },
      { name: 'Double burger', price: 259 },
      { name: 'Patates kızartması', price: 85 },
      { name: 'Soğan halkası', price: 75 },
      { name: 'Milkshake', price: 105 },
    ],
    hours: { mon: '11:00–23:30', tue: '11:00–23:30', wed: '11:00–23:30', thu: '11:00–23:30', fri: '11:00–01:00', sat: '11:00–01:00', sun: '12:00–22:30' },
    photoUrl: 'https://iasbh.tmgrup.com.tr/78d2fd/821/464/0/0/724/409?u=https://isbh.tmgrup.com.tr/sbh/2021/09/30/hamburger-tarifi-evde-hamburger-nasil-yapilir-1633000765331.jpg',
    address: { city: 'Istanbul', district: 'Beşiktaş', neighborhood: 'Akaretler' },
  },
  {
    name: 'Karaköy Güllüoğlu',
    category: 'tatlı',
    description: 'İstanbulda baklava denince akla gelen tanınmış tatlıcı.',
    location: { lat: 41.0246, lng: 28.9773 },
    rating: 4.8,
    menu: [
      { name: 'Fıstıklı baklava', price: 520 },
      { name: 'Künefe', price: 195 },
      { name: 'Sütlü nuriye', price: 480 },
      { name: 'Dondurma', price: 110 },
      { name: 'Türk kahvesi', price: 65 },
    ],
    hours: { mon: '10:00–23:00', tue: '10:00–23:00', wed: '10:00–23:00', thu: '10:00–23:00', fri: '10:00–00:00', sat: '10:00–00:00', sun: '11:00–22:00' },
    photoUrl: foodImage800x600('dessert', 'sweet'),
    address: { city: 'Istanbul', district: 'Beyoğlu', neighborhood: 'Karaköy' },
  },
  {
    name: 'Hamdi Restaurant',
    category: 'restoran',
    description: 'İstanbul Eminönü tarafında kebap çeşitleriyle bilinen restoran.',
    location: { lat: 41.0162, lng: 28.9706 },
    rating: 4.6,
    menu: [
      { name: 'Ali nazik', price: 385 },
      { name: 'Patlıcan kebap', price: 365 },
      { name: 'Adana kebap', price: 395 },
      { name: 'Lahmacun', price: 95 },
      { name: 'Ayran', price: 30 },
    ],
    hours: { mon: '12:00–23:00', tue: '12:00–23:00', wed: '12:00–23:00', thu: '12:00–23:00', fri: '12:00–00:00', sat: '12:00–00:00', sun: '12:00–22:30' },
    photoUrl: 'https://d17wu0fn6x6rgz.cloudfront.net/img/w/tarif/ogt/alinazik.webp',
    address: { city: 'Istanbul', district: 'Fatih', neighborhood: 'Eminönü' },
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
