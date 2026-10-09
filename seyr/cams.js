// Seyr — kamera listesi.
// Yeni kamera eklemek için bir satır ekle. "yt" = YouTube video kimliği.
// Sadece sahibinin gömmeye izin verdiği herkese açık canlı yayınlar.
window.SEYR_CAMS = [
  // Kuzey Amerika
  { id: "new-york", city: "New York", cityEn: "New York", country: "ABD", countryEn: "USA", flag: "🇺🇸", continent: "amerika", lat: 40.758, lon: -73.9855, tz: "America/New_York", yt: "VGnFLdQW39A", spot: "Times Meydanı ve şehir", spotEn: "Times Square and the city", source: "FOX 5 New York" },
  { id: "los-angeles", city: "Los Angeles", cityEn: "Los Angeles", country: "ABD", countryEn: "USA", flag: "🇺🇸", continent: "amerika", lat: 33.985, lon: -118.4695, tz: "America/Los_Angeles", yt: "EO_1LWqsCNE", spot: "Venice Beach", spotEn: "Venice Beach", source: "Teleport.camera" },
  { id: "san-francisco", city: "San Francisco", cityEn: "San Francisco", country: "ABD", countryEn: "USA", flag: "🇺🇸", continent: "amerika", lat: 37.7957, lon: -122.3969, tz: "America/Los_Angeles", yt: "G8RIAgPxaMc", spot: "Şehir manzarası", spotEn: "City skyline", source: "ABC7 News Bay Area" },
  { id: "vancouver", city: "Vancouver", cityEn: "Vancouver", country: "Kanada", countryEn: "Canada", flag: "🇨🇦", continent: "amerika", lat: 49.2888, lon: -123.1111, tz: "America/Vancouver", yt: "rxyNjFKwzJA", spot: "Liman ve Canada Place", spotEn: "Harbour and Canada Place", source: "Vancouver City Views" },
  { id: "houston", city: "Houston", cityEn: "Houston", country: "ABD", countryEn: "USA", flag: "🇺🇸", continent: "amerika", lat: 29.73, lon: -95.42, tz: "America/Chicago", yt: "SDK_m1_BVJ4", spot: "Şehir kulesinden", spotEn: "From the city tower", source: "ABC13 Houston" },
  { id: "hollywood-beach", city: "Hollywood, Florida", cityEn: "Hollywood, Florida", country: "ABD", countryEn: "USA", flag: "🇺🇸", continent: "amerika", lat: 26.0112, lon: -80.1162, tz: "America/New_York", yt: "cmkAbDUEoyA", spot: "Sahil yürüyüş yolu", spotEn: "Beach Broadwalk", source: "City of Hollywood" },
  { id: "spanish-town", city: "Spanish Town", cityEn: "Spanish Town", country: "Jamaika", countryEn: "Jamaica", flag: "🇯🇲", continent: "amerika", lat: 17.991, lon: -76.957, tz: "America/Jamaica", yt: "KBnlexbryqE", spot: "Şehir caddesi", spotEn: "Town street", source: "See Jamaica" },
  { id: "curacao", city: "Willemstad", cityEn: "Willemstad", country: "Curaçao", countryEn: "Curaçao", flag: "🇨🇼", continent: "amerika", lat: 12.09, lon: -68.9, tz: "America/Curacao", yt: "loHbMM9JfCs", spot: "Mambo Plajı", spotEn: "Mambo Beach", source: "SHOWME Caribbean" },

  { id: "meksiko-zocalo", city: "Meksiko", cityEn: "Mexico City", country: "Meksika", countryEn: "Mexico", flag: "🇲🇽", continent: "amerika", lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City", yt: "Z7bECtLg40A", spot: "Zócalo Meydanı", spotEn: "Zócalo square", source: "YouTube" },
  { id: "cancun", city: "Cancún", cityEn: "Cancún", country: "Meksika", countryEn: "Mexico", flag: "🇲🇽", continent: "amerika", lat: 21.137, lon: -86.75, tz: "America/Cancun", yt: "zhRcRgZEoQw", spot: "Sahil", spotEn: "Beachfront", source: "YouTube" },

  // Avrupa
  { id: "venedik", city: "Venedik", cityEn: "Venice", country: "İtalya", countryEn: "Italy", flag: "🇮🇹", continent: "avrupa", lat: 45.438, lon: 12.336, tz: "Europe/Rome", yt: "x4AlaibltlA", spot: "Büyük Kanal ve Rialto Köprüsü", spotEn: "Grand Canal and Rialto Bridge", source: "SkylineWebcams" },
  { id: "venedik-tur", city: "Venedik", cityEn: "Venice", country: "İtalya", countryEn: "Italy", flag: "🇮🇹", continent: "avrupa", lat: 45.434, lon: 12.339, tz: "Europe/Rome", yt: "a1mcaV3Sf9U", spot: "Şehir kameraları turu", spotEn: "Rotating city cams", source: "I Love You Venice" },
  { id: "londra", city: "Londra", cityEn: "London", country: "Birleşik Krallık", countryEn: "United Kingdom", flag: "🇬🇧", continent: "avrupa", lat: 51.51, lon: -0.134, tz: "Europe/London", yt: "WKGK_hYnlGE", spot: "Piccadilly ve Soho yürüyüşü", spotEn: "Piccadilly and Soho walk", source: "Experiencing London" },
  { id: "yunanistan", city: "Atina ve adalar", cityEn: "Athens and islands", country: "Yunanistan", countryEn: "Greece", flag: "🇬🇷", continent: "avrupa", lat: 37.97, lon: 23.73, tz: "Europe/Athens", yt: "5p-s-1453Us", spot: "Ülke çapında kamera turu", spotEn: "Country-wide cam tour", source: "SkylineWebcams" },
  { id: "ispanya", city: "Madrid ve sahiller", cityEn: "Madrid and coasts", country: "İspanya", countryEn: "Spain", flag: "🇪🇸", continent: "avrupa", lat: 40.4168, lon: -3.7038, tz: "Europe/Madrid", yt: "kUfuwa8mDrA", spot: "Ülke çapında kamera turu", spotEn: "Country-wide cam tour", source: "SkylineWebcams" },

  // Afrika
  { id: "cape-town-masa-dagi", city: "Cape Town", cityEn: "Cape Town", country: "Güney Afrika", countryEn: "South Africa", flag: "🇿🇦", continent: "afrika", lat: -33.925, lon: 18.42, tz: "Africa/Johannesburg", yt: "fhUEi-ka6Ks", spot: "Masa Dağı", spotEn: "Table Mountain", source: "Vanilla" },
  { id: "cape-town-sea-point", city: "Cape Town", cityEn: "Cape Town", country: "Güney Afrika", countryEn: "South Africa", flag: "🇿🇦", continent: "afrika", lat: -33.915, lon: 18.385, tz: "Africa/Johannesburg", yt: "4Zu64CmAjMo", spot: "Sea Point ve Aslan Başı", spotEn: "Sea Point and Lion's Head", source: "Vanilla" },
  { id: "cape-town-clifton", city: "Cape Town", cityEn: "Cape Town", country: "Güney Afrika", countryEn: "South Africa", flag: "🇿🇦", continent: "afrika", lat: -33.94, lon: 18.377, tz: "Africa/Johannesburg", yt: "IGu55JrxyHU", spot: "Clifton Plajı", spotEn: "Clifton Beach", source: "SA Webcams" },

  // Asya
  { id: "tokyo-shibuya", city: "Tokyo", cityEn: "Tokyo", country: "Japonya", countryEn: "Japan", flag: "🇯🇵", continent: "asya", lat: 35.6595, lon: 139.7005, tz: "Asia/Tokyo", yt: "d1JuNg7knNo", spot: "Shibuya kavşağı", spotEn: "Shibuya Crossing", source: "YouTube" },
  { id: "tokyo-ginza", city: "Tokyo", cityEn: "Tokyo", country: "Japonya", countryEn: "Japan", flag: "🇯🇵", continent: "asya", lat: 35.6728, lon: 139.7636, tz: "Asia/Tokyo", yt: "1Xm5bjdI5hU", spot: "Ginza Sukiyabashi kavşağı", spotEn: "Ginza Sukiyabashi crossing", source: "YouTube" },
  { id: "fuji", city: "Fuji Dağı", cityEn: "Mount Fuji", country: "Japonya", countryEn: "Japan", flag: "🇯🇵", continent: "asya", lat: 35.51, lon: 138.76, tz: "Asia/Tokyo", yt: "Sv9hcJ3k5h4", spot: "Kawaguchi Gölü'nden", spotEn: "From Lake Kawaguchi", source: "YouTube" },
  { id: "seul", city: "Seul", cityEn: "Seoul", country: "Güney Kore", countryEn: "South Korea", flag: "🇰🇷", continent: "asya", lat: 37.5512, lon: 126.9882, tz: "Asia/Seoul", yt: "3Uf3w-UHB4U", spot: "Namsan Kulesi'nden", spotEn: "From Namsan Tower", source: "YouTube" },
  { id: "busan", city: "Busan", cityEn: "Busan", country: "Güney Kore", countryEn: "South Korea", flag: "🇰🇷", continent: "asya", lat: 35.153, lon: 129.122, tz: "Asia/Seoul", yt: "OSnuM2fNovg", spot: "Gwangan Köprüsü", spotEn: "Gwangan Bridge", source: "YouTube" },

  { id: "seul-myeongdong", city: "Seul", cityEn: "Seoul", country: "Güney Kore", countryEn: "South Korea", flag: "🇰🇷", continent: "asya", lat: 37.5633, lon: 126.987, tz: "Asia/Seoul", yt: "0iElYWnfHZM", spot: "Myeongdong Katedrali meydanı", spotEn: "Myeongdong Cathedral plaza", source: "YouTube" },
  { id: "seul-han", city: "Seul", cityEn: "Seoul", country: "Güney Kore", countryEn: "South Korea", flag: "🇰🇷", continent: "asya", lat: 37.5407, lon: 126.926, tz: "Asia/Seoul", yt: "_gmTN6ssF7I", spot: "Han Nehri ve Seogang Köprüsü", spotEn: "Han River and Seogang Bridge", source: "YouTube" },
  { id: "seul-ddp", city: "Seul", cityEn: "Seoul", country: "Güney Kore", countryEn: "South Korea", flag: "🇰🇷", continent: "asya", lat: 37.5665, lon: 127.0092, tz: "Asia/Seoul", yt: "GOt7UVVp-5Y", spot: "Dongdaemun Tasarım Meydanı", spotEn: "Dongdaemun Design Plaza", source: "YouTube" },
  { id: "bangkok", city: "Bangkok", cityEn: "Bangkok", country: "Tayland", countryEn: "Thailand", flag: "🇹🇭", continent: "asya", lat: 13.738, lon: 100.5577, tz: "Asia/Bangkok", yt: "Q71sLS8h9a4", spot: "Sukhumvit Caddesi", spotEn: "Sukhumvit Road", source: "YouTube" },

  // Okyanusya
  { id: "melbourne", city: "Melbourne", cityEn: "Melbourne", country: "Avustralya", countryEn: "Australia", flag: "🇦🇺", continent: "okyanusya", lat: -37.8136, lon: 144.9631, tz: "Australia/Melbourne", yt: "gEbrHdFRgpQ", spot: "Şehir kavşağı", spotEn: "City intersection", source: "Cityscape Live" },
];
