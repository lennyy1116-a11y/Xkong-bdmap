// ============ FIREBASE ============
const firebaseConfig = {
  apiKey: "AIzaSyAcrbmxkrzx8yK5V6dPLTQkAiT40ecBD5E",
  authDomain: "xkong-bd-map.firebaseapp.com",
  projectId: "xkong-bd-map",
  storageBucket: "xkong-bd-map.firebasestorage.app",
  messagingSenderId: "366179387711",
  appId: "1:366179387711:web:8e787e9de8cb1f669a6b8a",
  measurementId: "G-Y62D9VXL88"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const placesCollection = db.collection('places');
const mallMetaCollection = db.collection('mallMeta');
const appConfigCollection = db.collection('appConfig');
const auditLogsCollection = db.collection('auditLogs');

// ============ APP STATE ============
const STORAGE_KEY = 'bd_map_places';
const APIKEY_KEY = 'bd_map_google_key';
const DEFAULT_GOOGLE_MAPS_KEY = 'AIzaSyAQ4mpeoPh6KU1BZC2bfN6FzM_gMW3GsZM';
const USERNAME_KEY = 'bd_map_username';
const USER_AVATAR_KEY = 'bd_map_user_avatar';
const AVATAR_POOL = ['🦅','🏃','🌿','🧭','🐯','🦊','🐼','🐧','🐶','🐱','🐰','🦁','🐺','🐻','🐨','🐵','🦉','🦋','🐉','🔥','⭐','🌙','☀️','⚡','🌊','🍀','🌿','🌸','🌻','🍄','💊','🏥','🩺','🧬','🧪','📍','🗺️','🎯','🚀','💼','📊','🧩','💎','👑','🎧','🎮','🍵','☕','🥐','🍜'];
let places = [];
let deletedPlaces = [];
let baseClinics = [];
let map, markersLayer, comboResultLayer, myLocMarker;
let currentPos = { lat: 22.3193, lng: 114.1694 }; // default: HK
let editVisits = [];
let searchMarkers = [];
let currentFilter = '全部';
let ownerFilter = '全部';
let mallPanelSource = 'map';
let tapMode = false;
let sheetPickMode = false;
let selectedDistrict = 'current';
let _pagination = null;
let currentUsername = localStorage.getItem(USERNAME_KEY) || '';
let currentAvatar = localStorage.getItem(USER_AVATAR_KEY) || '👤';
let coverageCache = new Map();
let coverageCacheVersion = 0;
let lastInstitutionStatus = '已交流';
let leadSearchTerm = '';
let leadFilter = 'all';
let leadCategory = '全部';
let leadSecondaryCategory = '全部';
let editBaseRevision = null;
const COVERAGE_KM = 1;
const COVERAGE_LABEL = '1公里';
let singleCoverageKm = COVERAGE_KM;
const MALLS_KEY = 'bd_map_malls';
const MALL_DATA_VERSION_KEY = 'bd_map_malls_version';
const MALL_DATA_VERSION = 'link-hk-retail-2026-07-30-v2';
const BUILTIN_LINK_MALLS = [{"slug":"butterfly-plaza","nameEN":"Butterfly Plaza","nameZH":"蝴蝶廣場","addressEN":"Butterfly Plaza, 1 Wu Chui Road, Tuen Mun, New Territories","addressZH":"新界屯門湖翠路1號蝴蝶廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/butterfly-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/butterfly-plaza/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.374752,"lng":113.963308,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"蝴蝶廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Butterfly Plaza, 1 Wu Chui Road, Tuen Mun, New Territories","id":"link_hk_butterfly_plaza","no":1,"name":"蝴蝶廣場","address":"新界屯門湖翠路1號蝴蝶廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"cheung-fat-plaza","nameEN":"Cheung Fat Plaza","nameZH":"長發廣場","addressEN":"Cheung Fat Plaza, 6 Tam Kon Shan Road, Tsing Yi, New Territories","addressZH":"新界青衣擔桿山路6號長發廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/cheung-fat-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/cheung-fat-plaza/","tags":["Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong"],"lat":22.362378,"lng":114.103339,"districtZH":"葵青區","districtEN":"Kwai Tsing District","geocodeNameZH":"長發廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Cheung Fat Plaza, 6 Tam Kon Shan Road, Tsing Yi, New Territories","id":"link_hk_cheung_fat_plaza","no":2,"name":"長發廣場","address":"新界青衣擔桿山路6號長發廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"cheung-wah-shopping-centre","nameEN":"Cheung Wah Shopping Centre","nameZH":"祥華商場","addressEN":"Cheung Wah Shopping Centre, 38 San Wan Road, Fanling, New Territories","addressZH":"新界粉嶺新運路38號祥華商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/cheung-wah-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/cheung-wah-shopping-centre/","tags":["North","Hong Kong"],"lat":22.493161,"lng":114.141122,"districtZH":"北區","districtEN":"North District","geocodeNameZH":"祥華商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Cheung Wah Shopping Centre, 38 San Wan Road, Fanling, New Territories","id":"link_hk_cheung_wah_shopping_centre","no":3,"name":"祥華商場","address":"新界粉嶺新運路38號祥華商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"choi-ming-shopping-centre","nameEN":"Choi Ming Shopping Centre","nameZH":"彩明商場","addressEN":"Choi Ming Shopping Centre, 1 Choi Ming Street, Tiu Keng Leng, Tseung Kwan O, New Territories","addressZH":"新界將軍澳調景嶺彩明街1號彩明商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/choi-ming-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/choi-ming-shopping-centre/","tags":["Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.306839,"lng":114.252273,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"彩明商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Choi Ming Shopping Centre, 1 Choi Ming Street, Tiu Keng Leng, Tseung Kwan O, New Territories","id":"link_hk_choi_ming_shopping_centre","no":4,"name":"彩明商場","address":"新界將軍澳調景嶺彩明街1號彩明商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"choi-wan-commercial-complex","nameEN":"Choi Wan Commercial Complex","nameZH":"彩雲商場","addressEN":"Choi Wan Commercial Complex, 45 Clear Water Bay Road, Ngau Chi Wan, Kowloon","addressZH":"九龍牛池灣清水灣道45號彩雲商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/choi-wan-commercial-complex/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/choi-wan-commercial-complex/","tags":["Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong"],"lat":22.333312,"lng":114.215003,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"彩雲商場二期","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Choi Wan Commercial Complex, 45 Clear Water Bay Road, Ngau Chi Wan, Kowloon","id":"link_hk_choi_wan_commercial_complex","no":5,"name":"彩雲商場","address":"九龍牛池灣清水灣道45號彩雲商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"choi-yuen-plaza","nameEN":"Choi Yuen Plaza","nameZH":"彩園廣場","addressEN":"Choi Yuen Plaza, 8 Choi Yuen Road, Sheung Shui, New Territories","addressZH":"新界上水彩園路8號彩園廣場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/choi-yuen-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/choi-yuen-plaza/","tags":["North","Hong Kong"],"lat":22.500932,"lng":114.126435,"districtZH":"北區","districtEN":"North District","geocodeNameZH":"彩園廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Choi Yuen Plaza, 8 Choi Yuen Road, Sheung Shui, New Territories","id":"link_hk_choi_yuen_plaza","no":6,"name":"彩園廣場","address":"新界上水彩園路8號彩園廣場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"chuk-yuen-plaza","nameEN":"Chuk Yuen Plaza","nameZH":"竹園廣場","addressEN":"Chuk Yuen Plaza, 15 Chuk Yuen Road, Wong Tai Sin, Kowloon","addressZH":"九龍黃大仙竹園道15號竹園廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/chuk-yuen-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/chuk-yuen-plaza/","tags":["Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong"],"lat":22.345019,"lng":114.19298,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"竹園廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Chuk Yuen Plaza, 15 Chuk Yuen Road, Wong Tai Sin, Kowloon","id":"link_hk_chuk_yuen_plaza","no":7,"name":"竹園廣場","address":"九龍黃大仙竹園道15號竹園廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"chung-on-shopping-centre","nameEN":"Chung On Shopping Centre","nameZH":"頌安商場","addressEN":"Chung On Shopping Centre, 632 Sai Sha Road, Ma On Shan, Sha Tin, New Territories","addressZH":"新界沙田馬鞍山西沙路632號頌安商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/chung-on-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/chung-on-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.421347,"lng":114.22645,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"頌安商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Chung On Shopping Centre, 632 Sai Sha Road, Ma On Shan, Sha Tin, New Territories","id":"link_hk_chung_on_shopping_centre","no":8,"name":"頌安商場","address":"新界沙田馬鞍山西沙路632號頌安商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"fu-heng-shopping-centre","nameEN":"Fu Heng Shopping Centre","nameZH":"富亨商場","addressEN":"Fu Heng Shopping Centre, 6 Chung Nga Road, Tai Po, New Territories","addressZH":"新界大埔頌雅路6號富亨商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/fu-heng-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/fu-heng-shopping-centre/","tags":["Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong"],"lat":22.458235,"lng":114.171288,"districtZH":"大埔區","districtEN":"Tai Po District","geocodeNameZH":"富亨商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Fu Heng Shopping Centre, 6 Chung Nga Road, Tai Po, New Territories","id":"link_hk_fu_heng_shopping_centre","no":9,"name":"富亨商場","address":"新界大埔頌雅路6號富亨商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"fu-shin-shopping-centre","nameEN":"Fu Shin Shopping Centre","nameZH":"富善商場","addressEN":"Fu Shin Shopping Centre, 12 On Po Road, Tai Po, New Territories","addressZH":"新界大埔安埔路12號富善商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/fu-shin-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/fu-shin-shopping-centre/","tags":["Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong"],"lat":22.454036,"lng":114.174815,"districtZH":"大埔區","districtEN":"Tai Po District","geocodeNameZH":"富善商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Fu Shin Shopping Centre, 12 On Po Road, Tai Po, New Territories","id":"link_hk_fu_shin_shopping_centre","no":10,"name":"富善商場","address":"新界大埔安埔路12號富善商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"fu-tai-shopping-centre","nameEN":"Fu Tai Shopping Centre","nameZH":"富泰商場","addressEN":"Fu Tai Shopping Centre, 9 Tuen Kwai Road, Tuen Mun, New Territories","addressZH":"新界屯門屯貴路9號富泰商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/fu-tai-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/fu-tai-shopping-centre/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.413888,"lng":113.983275,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"富泰商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Fu Tai Shopping Centre, 9 Tuen Kwai Road, Tuen Mun, New Territories","id":"link_hk_fu_tai_shopping_centre","no":11,"name":"富泰商場","address":"新界屯門屯貴路9號富泰商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"fu-tung-plaza","nameEN":"Fu Tung Plaza","nameZH":"富東廣場","addressEN":"Fu Tung Plaza, 6 Fu Tung Street, Tung Chung, New Territories","addressZH":"新界東涌富東街6號富東廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/fu-tung-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/fu-tung-plaza/","tags":["Islands","Hong Kong"],"lat":22.288861,"lng":113.942449,"districtZH":"離島區","districtEN":"Islands District","geocodeNameZH":"富東廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Fu Tung Plaza, 6 Fu Tung Street, Tung Chung, New Territories","id":"link_hk_fu_tung_plaza","no":12,"name":"富東廣場","address":"新界東涌富東街6號富東廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"fung-tak-shopping-centre","nameEN":"Fung Tak Shopping Centre","nameZH":"鳳德商場","addressEN":"Fung Tak Shopping Centre, 111 Fung Tak Road, Diamond Hill, Kowloon","addressZH":"九龍鑽石山鳳德道111號鳳德商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/fung-tak-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/fung-tak-shopping-centre/","tags":["Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong"],"lat":22.343953,"lng":114.200095,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"鳳德商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Fung Tak Shopping Centre, 111 Fung Tak Road, Diamond Hill, Kowloon","id":"link_hk_fung_tak_shopping_centre","no":13,"name":"鳳德商場","address":"九龍鑽石山鳳德道111號鳳德商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"heng-on-commercial-centre","nameEN":"Heng On Commercial Centre","nameZH":"恆安商場","addressEN":"Heng On Commercial Centre, 1 Hang Kam Street, Ma On Shan, Sha Tin, New Territories","addressZH":"新界沙田馬鞍山恆錦街1號恆安商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/heng-on-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/heng-on-commercial-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.416687,"lng":114.227866,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"恆安商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Heng On Commercial Centre, 1 Hang Kam Street, Ma On Shan, Sha Tin, New Territories","id":"link_hk_heng_on_commercial_centre","no":14,"name":"恆安商場","address":"新界沙田馬鞍山恆錦街1號恆安商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"hin-keng-shopping-centre","nameEN":"Hin Keng Shopping Centre","nameZH":"顯徑商場","addressEN":"Hin Keng Shopping Centre, 69 Che Kung Miu Road, Tai Wai, Sha Tin, New Territories","addressZH":"新界沙田大圍車公廟道69號顯徑商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/hin-keng-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/hin-keng-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.363523,"lng":114.171952,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"顯徑商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Hin Keng Shopping Centre, 69 Che Kung Miu Road, Tai Wai, Sha Tin, New Territories","id":"link_hk_hin_keng_shopping_centre","no":15,"name":"顯徑商場","address":"新界沙田大圍車公廟道69號顯徑商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"hing-tung-shopping-centre","nameEN":"Hing Tung Shopping Centre","nameZH":"興東商場","addressEN":"Hing Tung Shopping Centre, 55 Yiu Hing Road, Shau Kei Wan, Hong Kong","addressZH":"香港筲箕灣耀興道55號興東商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/hing-tung-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/hing-tung-shopping-centre/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.280698,"lng":114.220093,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"興東商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Hing Tung Shopping Centre, 55 Yiu Hing Road, Shau Kei Wan, Hong Kong","id":"link_hk_hing_tung_shopping_centre","no":16,"name":"興東商場","address":"香港筲箕灣耀興道55號興東商場","developer":"領展","area":"港島","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"hing-wah-plaza","nameEN":"Hing Wah Plaza","nameZH":"興華廣場","addressEN":"Hing Wah Plaza, 11 Wan Tsui Road, Chai Wan, Hong Kong","addressZH":"香港柴灣環翠道11號興華廣場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/hing-wah-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/hing-wah-plaza/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.262415,"lng":114.236096,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"興華廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Hing Wah Plaza, 11 Wan Tsui Road, Chai Wan, Hong Kong","id":"link_hk_hing_wah_plaza","no":17,"name":"興華廣場","address":"香港柴灣環翠道11號興華廣場","developer":"領展","area":"港島","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"hiu-lai-shopping-centre","nameEN":"Hiu Lai Shopping Centre","nameZH":"曉麗商場","addressEN":"Hiu Lai Shopping Centre, 21 Hiu Kwong Street, Kwun Tong, Kowloon","addressZH":"九龍觀塘曉光街21號曉麗商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/hiu-lai-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/hiu-lai-shopping-centre/","tags":[],"lat":22.320791,"lng":114.229404,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"曉麗商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Hiu Lai Shopping Centre, 21 Hiu Kwong Street, Kwun Tong, Kowloon","id":"link_hk_hiu_lai_shopping_centre","no":18,"name":"曉麗商場","address":"九龍觀塘曉光街21號曉麗商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"hoi-fu-shopping-centre","nameEN":"Hoi Fu Shopping Centre","nameZH":"海富商場","addressEN":"Hoi Fu Shopping Centre, 2 Hoi Ting Road, Mong Kok, Kowloon","addressZH":"九龍旺角海庭路2號海富商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/hoi-fu-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/hoi-fu-shopping-centre/","tags":["Yau Tsim Mong","Hong Kong"],"lat":22.31548,"lng":114.164373,"districtZH":"油尖旺區","districtEN":"Yau Tsim Mong District","geocodeNameZH":"海富商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Hoi Fu Shopping Centre, 2 Hoi Ting Road, Mong Kok, Kowloon","id":"link_hk_hoi_fu_shopping_centre","no":19,"name":"海富商場","address":"九龍旺角海庭路2號海富商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"homantin-plaza","nameEN":"Homantin Plaza","nameZH":"何文田廣場","addressEN":"Homantin Plaza, 80 Fat Kwong Street, Ho Man Tin, Kowloon","addressZH":"九龍何文田佛光街80號何文田廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/homantin-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/homantin-plaza/","tags":["Kowloon City","Hong Kong","Kowloon City","Hong Kong","Kowloon City","Hong Kong"],"lat":22.316275,"lng":114.181815,"districtZH":"九龍城區","districtEN":"Kowloon City District","geocodeNameZH":"何文田廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Homantin Plaza, 80 Fat Kwong Street, Ho Man Tin, Kowloon","id":"link_hk_homantin_plaza","no":20,"name":"何文田廣場","address":"九龍何文田佛光街80號何文田廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"kai-tin-shopping-centre","nameEN":"Kai Tin Shopping Centre","nameZH":"啟田商場","addressEN":"Kai Tin Shopping Centre, 50 Kai Tin Road, Lam Tin, Kwun Tong, Kowloon","addressZH":"九龍觀塘藍田啟田道50號啟田商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/kai-tin-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/kai-tin-shopping-centre/","tags":[],"lat":22.308002,"lng":114.235435,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"啓田商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Kai Tin Shopping Centre, 50 Kai Tin Road, Lam Tin, Kwun Tong, Kowloon","id":"link_hk_kai_tin_shopping_centre","no":21,"name":"啟田商場","address":"九龍觀塘藍田啟田道50號啟田商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"kin-sang-shopping-centre","nameEN":"Kin Sang Shopping Centre","nameZH":"建生商場","addressEN":"Kin Sang Shopping Centre, 3 Leung Wan Street, Tuen Mun, New Territories","addressZH":"新界屯門良運街3號建生商場","assetTypeEN":"Retail, car park","assetTypeZH":"零售、停車場","officialUrl":"https://www.linkreit.com/en/business/properties/kin-sang-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/kin-sang-shopping-centre/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.407107,"lng":113.969522,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"建生商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Kin Sang Shopping Centre, 3 Leung Wan Street, Tuen Mun, New Territories","id":"link_hk_kin_sang_shopping_centre","no":22,"name":"建生商場","address":"新界屯門良運街3號建生商場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"kwong-fuk-commercial-centre","nameEN":"Kwong Fuk Commercial Centre","nameZH":"廣福商場","addressEN":"Kwong Fuk Commercial Centre, 28 Plover Cove Road, Tai Po, New Territories","addressZH":"新界大埔寶湖道28號廣福商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/kwong-fuk-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/kwong-fuk-commercial-centre/","tags":["Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong"],"lat":22.448708,"lng":114.174242,"districtZH":"大埔區","districtEN":"Tai Po District","geocodeNameZH":"廣福商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Kwong Fuk Commercial Centre, 28 Plover Cove Road, Tai Po, New Territories","id":"link_hk_kwong_fuk_commercial_centre","no":23,"name":"廣福商場","address":"新界大埔寶湖道28號廣福商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"kwong-yuen-shopping-centre","nameEN":"Kwong Yuen Shopping Centre","nameZH":"廣源商場","addressEN":"Kwong Yuen Shopping Centre, 68 Siu Lek Yuen Road, Sha Tin, New Territories","addressZH":"新界沙田小瀝源路68號廣源商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/kwong-yuen-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/kwong-yuen-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.380623,"lng":114.215366,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"廣源商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Kwong Yuen Shopping Centre, 68 Siu Lek Yuen Road, Sha Tin, New Territories","id":"link_hk_kwong_yuen_shopping_centre","no":24,"name":"廣源商場","address":"新界沙田小瀝源路68號廣源商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"lei-yue-mun-plaza","nameEN":"Lei Yue Mun Plaza","nameZH":"鯉魚門廣場","addressEN":"Lei Yue Mun Plaza, 80 Lei Yue Mun Road, Yau Tong, Kwun Tong, Kowloon","addressZH":"九龍觀塘油塘鯉魚門道80號鯉魚門廣場","assetTypeEN":"Retail and fresh market","assetTypeZH":"零售及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/lei-yue-mun-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/lei-yue-mun-plaza/","tags":[],"lat":22.296775,"lng":114.239293,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"鯉魚門廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Lei Yue Mun Plaza, 80 Lei Yue Mun Road, Yau Tong, Kwun Tong, Kowloon","id":"link_hk_lei_yue_mun_plaza","no":25,"name":"鯉魚門廣場","address":"九龍觀塘油塘鯉魚門道80號鯉魚門廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"lek-yuen-plaza","nameEN":"Lek Yuen Plaza","nameZH":"瀝源廣場","addressEN":"Lek Yuen Plaza, 6 Lek Yuen Street, Sha Tin, New Territories","addressZH":"新界沙田瀝源街6號瀝源廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/lek-yuen-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/lek-yuen-plaza/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.384681,"lng":114.191964,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"瀝源廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Lek Yuen Plaza, 6 Lek Yuen Street, Sha Tin, New Territories","id":"link_hk_lek_yuen_plaza","no":26,"name":"瀝源廣場","address":"新界沙田瀝源街6號瀝源廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"leung-king-plaza","nameEN":"Leung King Plaza","nameZH":"良景廣場","addressEN":"Leung King Plaza, 31 Tin King Road, Tuen Mun, New Territories","addressZH":"新界屯門田景路31號良景廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/leung-king-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/leung-king-plaza/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.406367,"lng":113.962793,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"良景廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Leung King Plaza, 31 Tin King Road, Tuen Mun, New Territories","id":"link_hk_leung_king_plaza","no":27,"name":"良景廣場","address":"新界屯門田景路31號良景廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"lok-fu-place","nameEN":"Lok Fu Place","nameZH":"樂富廣場","addressEN":"Lok Fu Place, 198 Junction Road, Wang Tau Hom, Kowloon","addressZH":"九龍橫頭磡聯合道198號樂富廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/lok-fu-place/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/lok-fu-place/","tags":["Wong Tai Sin","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Yau Tsim Mong","Hong Kong","Yuen Long","Hong Kong","Kwun Tong","Hong Kong","Wong Tai Sin","Hong Kong"],"lat":22.338346,"lng":114.186067,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"樂富廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Lok Fu Place, 198 Junction Road, Wang Tau Hom, Kowloon","id":"link_hk_lok_fu_place","no":28,"name":"樂富廣場","address":"九龍橫頭磡聯合道198號樂富廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"lok-wah-commercial-centre","nameEN":"Lok Wah Commercial Centre","nameZH":"樂華商場","addressEN":"Lok Wah Commercial Centre, 70 Chun Wah Road, Ngau Tau Kwok, Kwun Tong, Kowloon","addressZH":"九龍觀塘牛頭角振華道70號樂華商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/lok-wah-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/lok-wah-commercial-centre/","tags":[],"lat":22.321751,"lng":114.219882,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"樂華商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Lok Wah Commercial Centre, 70 Chun Wah Road, Ngau Tau Kwok, Kwun Tong, Kowloon","id":"link_hk_lok_wah_commercial_centre","no":29,"name":"樂華商場","address":"九龍觀塘牛頭角振華道70號樂華商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"long-ping-commercial-centre","nameEN":"Long Ping Commercial Centre","nameZH":"朗屏商場","addressEN":"Long Ping Commercial Centre, 1 Long Ping Road, Yuen Long, New Territories","addressZH":"新界元朗朗屏路1號朗屏商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/long-ping-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/long-ping-commercial-centre/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.450297,"lng":114.023192,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"朗屏商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Long Ping Commercial Centre, 1 Long Ping Road, Yuen Long, New Territories","id":"link_hk_long_ping_commercial_centre","no":30,"name":"朗屏商場","address":"新界元朗朗屏路1號朗屏商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"lung-hang-commercial-centre","nameEN":"Lung Hang Commercial Centre","nameZH":"隆亨商場","addressEN":"Lung Hang Commercial Centre, 1 Tin Sam Street, Tai Wai, Sha Tin, New Territories","addressZH":"新界沙田大圍田心街1號隆亨商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/lung-hang-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/lung-hang-commercial-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.368418,"lng":114.179923,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"隆亨商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Lung Hang Commercial Centre, 1 Tin Sam Street, Tai Wai, Sha Tin, New Territories","id":"link_hk_lung_hang_commercial_centre","no":31,"name":"隆亨商場","address":"新界沙田大圍田心街1號隆亨商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"maritime-bay","nameEN":"Maritime Bay","nameZH":"海悅豪園","addressEN":"Maritime Bay, 18 Pui Shing Road, Tseung Kwan O, New Territories","addressZH":"新界將軍澳培成路18號海悅豪園","assetTypeEN":"Retail","assetTypeZH":"零售","officialUrl":"https://www.linkreit.com/en/business/properties/maritime-bay/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/maritime-bay/","tags":["Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.314644,"lng":114.265545,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"新界將軍澳坑口培成路18號海悅豪園","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Maritime Bay, 18 Pui Shing Road, Tseung Kwan O, New Territories","id":"link_hk_maritime_bay","no":32,"name":"海悅豪園","address":"新界將軍澳培成路18號海悅豪園","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"mei-lam-commercial-centre","nameEN":"Mei Lam Commercial Centre","nameZH":"美林商場","addressEN":"Mei Lam Commercial Centre, 30 Mei Tin Road, Tai Wai, Sha Tin, New Territories","addressZH":"新界沙田大圍美田路30號美林商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/mei-lam-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/mei-lam-commercial-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.378216,"lng":114.17635,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"美林商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Mei Lam Commercial Centre, 30 Mei Tin Road, Tai Wai, Sha Tin, New Territories","id":"link_hk_mei_lam_commercial_centre","no":33,"name":"美林商場","address":"新界沙田大圍美田路30號美林商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"nam-cheong-place","nameEN":"Nam Cheong Place","nameZH":"南昌薈","addressEN":"Nam Cheong Place, 19 Sai Chuen Road, Sham Shui Po, Kowloon","addressZH":"九龍深水埗西邨路19號南昌薈","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/nam-cheong-place/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/nam-cheong-place/","tags":["Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong"],"lat":22.327571,"lng":114.154821,"districtZH":"深水埗區","districtEN":"Sham Shui Po District","geocodeNameZH":"南昌薈","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Nam Cheong Place, 19 Sai Chuen Road, Sham Shui Po, Kowloon","id":"link_hk_nam_cheong_place","no":34,"name":"南昌薈","address":"九龍深水埗西邨路19號南昌薈","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"nan-fung-plaza","nameEN":"Nan Fung Plaza","nameZH":"南豐廣場","addressEN":"Nan Fung Plaza, 8 Pui Shing Road, Tseung Kwan O, New Territories","addressZH":"新界將軍澳培成路8號南豐廣場","assetTypeEN":"Retail","assetTypeZH":"零售","officialUrl":"https://www.linkreit.com/en/business/properties/nan-fung-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/nan-fung-plaza/","tags":["Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.314554,"lng":114.263856,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"南豐廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Nan Fung Plaza, 8 Pui Shing Road, Tseung Kwan O, New Territories","id":"link_hk_nan_fung_plaza","no":35,"name":"南豐廣場","address":"新界將軍澳培成路8號南豐廣場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"oi-man-plaza","nameEN":"Oi Man Plaza","nameZH":"愛民廣場","addressEN":"Oi Man Plaza, 60 Chung Hau Street, Ho Man Tin, Kowloon","addressZH":"九龍何文田忠孝街60號愛民廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/oi-man-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/oi-man-plaza/","tags":["Kowloon City","Hong Kong","Kowloon City","Hong Kong","Kowloon City","Hong Kong"],"lat":22.312248,"lng":114.178699,"districtZH":"九龍城區","districtEN":"Kowloon City District","geocodeNameZH":"愛民廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Oi Man Plaza, 60 Chung Hau Street, Ho Man Tin, Kowloon","id":"link_hk_oi_man_plaza","no":36,"name":"愛民廣場","address":"九龍何文田忠孝街60號愛民廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"oi-tung-shopping-centre","nameEN":"Oi Tung Shopping Centre","nameZH":"愛東商場","addressEN":"Oi Tung Shopping Centre, 18 Oi Yin Street, Shau Kei Wan, Hong Kong","addressZH":"香港筲箕灣愛賢街18號愛東商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/oi-tung-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/oi-tung-shopping-centre/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.280858,"lng":114.227768,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"愛東商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Oi Tung Shopping Centre, 18 Oi Yin Street, Shau Kei Wan, Hong Kong","id":"link_hk_oi_tung_shopping_centre","no":37,"name":"愛東商場","address":"香港筲箕灣愛賢街18號愛東商場","developer":"領展","area":"港島","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"ping-tin-shopping-centre","nameEN":"Ping Tin Shopping Centre","nameZH":"平田商場","addressEN":"Ping Tin Shopping Centre, 23 On Tin Street, Lam Tin, Kwun Tong, Kowloon","addressZH":"九龍觀塘藍田安田街23號平田商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/ping-tin-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/ping-tin-shopping-centre/","tags":[],"lat":22.305852,"lng":114.237298,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"平田商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Ping Tin Shopping Centre, 23 On Tin Street, Lam Tin, Kwun Tong, Kowloon","id":"link_hk_ping_tin_shopping_centre","no":38,"name":"平田商場","address":"九龍觀塘藍田安田街23號平田商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"po-hei-court-commercial-centre","nameEN":"Po Hei Court Commercial Centre","nameZH":"寶熙苑商場","addressEN":"Po Hei Court Commercial Centre, 225 Po On Road, Cheung Sha Wan, Kowloon","addressZH":"九龍長沙灣保安道225號寶熙苑商場","assetTypeEN":"Retail","assetTypeZH":"零售","officialUrl":"https://www.linkreit.com/en/business/properties/po-hei-court-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/po-hei-court-commercial-centre/","tags":["Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong"],"lat":22.337379,"lng":114.158994,"districtZH":"深水埗區","districtEN":"Sham Shui Po District","geocodeNameZH":"寶熙苑商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Po Hei Court Commercial Centre, 225 Po On Road, Cheung Sha Wan, Kowloon","id":"link_hk_po_hei_court_commercial_centre","no":39,"name":"寶熙苑商場","address":"九龍長沙灣保安道225號寶熙苑商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"po-lam-shopping-centre","nameEN":"Po Lam Shopping Centre","nameZH":"寶林商場","addressEN":"Po Lam Shopping Centre, 18 Po Lam Road North, Tseung Kwan O, New Territories","addressZH":"新界將軍澳寶琳北路18號寶林商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/po-lam-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/po-lam-shopping-centre/","tags":["Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.325251,"lng":114.25604,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"寶林商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Po Lam Shopping Centre, 18 Po Lam Road North, Tseung Kwan O, New Territories","id":"link_hk_po_lam_shopping_centre","no":40,"name":"寶林商場","address":"新界將軍澳寶琳北路18號寶林商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"po-tat-shopping-centre","nameEN":"Po Tat Shopping Centre","nameZH":"寶達商場","addressEN":"Po Tat Shopping Centre, 2 Po Lam Road, Sau Mau Ping, Kwun Tong, Kowloon","addressZH":"九龍觀塘秀茂坪寶琳路2號寶達商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/po-tat-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/po-tat-shopping-centre/","tags":[],"lat":22.317448,"lng":114.236293,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"寶達商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Po Tat Shopping Centre, 2 Po Lam Road, Sau Mau Ping, Kwun Tong, Kowloon","id":"link_hk_po_tat_shopping_centre","no":41,"name":"寶達商場","address":"九龍觀塘秀茂坪寶琳路2號寶達商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"sam-shing-commercial-centre","nameEN":"Sam Shing Commercial Centre","nameZH":"三聖商場","addressEN":"Sam Shing Commercial Centre, 6 Sam Shing Street, Tuen Mun, New Territories","addressZH":"新界屯門三聖街6號三聖商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/sam-shing-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/sam-shing-commercial-centre/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.380677,"lng":113.978359,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"三聖商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Sam Shing Commercial Centre, 6 Sam Shing Street, Tuen Mun, New Territories","id":"link_hk_sam_shing_commercial_centre","no":42,"name":"三聖商場","address":"新界屯門三聖街6號三聖商場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"sau-mau-ping-shopping-centre","nameEN":"Sau Mau Ping Shopping Centre","nameZH":"秀茂坪商場","addressEN":"Sau Mau Ping Shopping Centre, 101 Sau Ming Road, Sau Mau Ping, Kwun Tong, Kowloon","addressZH":"九龍觀塘秀茂坪秀明道101號秀茂坪商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/sau-mau-ping-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/sau-mau-ping-shopping-centre/","tags":[],"lat":22.319625,"lng":114.232121,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"秀茂坪商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Sau Mau Ping Shopping Centre, 101 Sau Ming Road, Sau Mau Ping, Kwun Tong, Kowloon","id":"link_hk_sau_mau_ping_shopping_centre","no":43,"name":"秀茂坪商場","address":"九龍觀塘秀茂坪秀明道101號秀茂坪商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"sha-kok-commercial-centre","nameEN":"Sha Kok Commercial Centre","nameZH":"沙角商場","addressEN":"Sha Kok Commercial Centre, 5 Sha Kok Street, Sha Tin, New Territories","addressZH":"新界沙田沙角街5號沙角商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/sha-kok-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/sha-kok-commercial-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.378125,"lng":114.194615,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"沙角商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Sha Kok Commercial Centre, 5 Sha Kok Street, Sha Tin, New Territories","id":"link_hk_sha_kok_commercial_centre","no":44,"name":"沙角商場","address":"新界沙田沙角街5號沙角商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"shun-lee-commercial-centre","nameEN":"Shun Lee Commercial Centre","nameZH":"順利商場","addressEN":"Shun Lee Commercial Centre, 15 Lee On Road, Kwun Tong, Kowloon","addressZH":"九龍觀塘利安道15號順利商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/shun-lee-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/shun-lee-commercial-centre/","tags":[],"lat":22.331503,"lng":114.225253,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"順利商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Shun Lee Commercial Centre, 15 Lee On Road, Kwun Tong, Kowloon","id":"link_hk_shun_lee_commercial_centre","no":45,"name":"順利商場","address":"九龍觀塘利安道15號順利商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"shun-on-commercial-centre","nameEN":"Shun On Commercial Centre","nameZH":"順安商場","addressEN":"Shun On Commercial Centre, 1 Lee On Road, Kwun Tong, Kowloon","addressZH":"九龍觀塘利安道1號順安商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/shun-on-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/shun-on-commercial-centre/","tags":[],"lat":22.32836,"lng":114.226417,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"順安商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Shun On Commercial Centre, 1 Lee On Road, Kwun Tong, Kowloon","id":"link_hk_shun_on_commercial_centre","no":46,"name":"順安商場","address":"九龍觀塘利安道1號順安商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"siu-sai-wan-plaza","nameEN":"Siu Sai Wan Plaza","nameZH":"小西灣廣場","addressEN":"Siu Sai Wan Plaza, 10 Siu Sai Wan Road, Siu Sai Wan, Hong Kong","addressZH":"香港小西灣小西灣道10號小西灣廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/siu-sai-wan-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/siu-sai-wan-plaza/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.262663,"lng":114.248757,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"小西灣廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Siu Sai Wan Plaza, 10 Siu Sai Wan Road, Siu Sai Wan, Hong Kong","id":"link_hk_siu_sai_wan_plaza","no":47,"name":"小西灣廣場","address":"香港小西灣小西灣道10號小西灣廣場","developer":"領展","area":"港島","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"stanley-plaza","nameEN":"Stanley Plaza","nameZH":"赤柱廣場","addressEN":"Stanley Plaza, 23 Carmel Road, Stanley, Hong Kong","addressZH":"香港赤柱佳美道23號赤柱廣場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/stanley-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/stanley-plaza/","tags":["Wong Tai Sin","Hong Kong","Yuen Long","Hong Kong","Wong Tai Sin","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Yau Tsim Mong","Hong Kong"],"lat":22.219689,"lng":114.209618,"districtZH":"南區","districtEN":"Southern District","geocodeNameZH":"赤柱廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Stanley Plaza, 23 Carmel Road, Stanley, Hong Kong","id":"link_hk_stanley_plaza","no":48,"name":"赤柱廣場","address":"香港赤柱佳美道23號赤柱廣場","developer":"領展","area":"港島","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"sun-chui-shopping-centre","nameEN":"Sun Chui Shopping Centre","nameZH":"新翠商場","addressEN":"Sun Chui Shopping Centre, 2 Chui Tin Street, Tai Wai, Sha Tin, New Territories","addressZH":"新界沙田大圍翠田街2號新翠商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/sun-chui-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/sun-chui-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.369204,"lng":114.181166,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"新翠商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Sun Chui Shopping Centre, 2 Chui Tin Street, Tai Wai, Sha Tin, New Territories","id":"link_hk_sun_chui_shopping_centre","no":49,"name":"新翠商場","address":"新界沙田大圍翠田街2號新翠商場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"t-town","nameEN":"T Town","nameZH":"T Town","addressEN":"T Town, 30 & 33 Tin Wah Road, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天華路30及33號T Town","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/t-town/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/t-town/","tags":["Wong Tai Sin","Hong Kong","Southern","Hong Kong","Wong Tai Sin","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Yau Tsim Mong","Hong Kong"],"lat":22.46248,"lng":113.997849,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"T Town North","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"T Town, 30 & 33 Tin Wah Road, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_t_town","no":50,"name":"T Town","address":"新界元朗天水圍天華路30及33號T Town","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"top-this-is-our-place-700-nathan-road","nameEN":"T.O.P This is Our Place / 700 Nathan Road","nameZH":"T.O.P This is Our Place / 彌敦道700號","addressEN":"700 Nathan Road, Mong Kok, Kowloon","addressZH":"九龍旺角彌敦道700號","assetTypeEN":"Retail","assetTypeZH":"零售","officialUrl":"https://www.linkreit.com/en/business/properties/top-this-is-our-place-700-nathan-road/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/top-this-is-our-place-700-nathan-road/","tags":["Wong Tai Sin","Hong Kong","Southern","Hong Kong","Yuen Long","Hong Kong","Wong Tai Sin","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.320565,"lng":114.169342,"districtZH":"油尖旺區","districtEN":"Yau Tsim Mong District","geocodeNameZH":"T.O.P This is our place","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"700 Nathan Road, Mong Kok, Kowloon","id":"link_hk_top_this_is_our_place_700_nathan_road","no":51,"name":"T.O.P This is Our Place / 彌敦道700號","address":"九龍旺角彌敦道700號","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tko-gateway","nameEN":"TKO Gateway","nameZH":"TKO Gateway","addressEN":"TKO Gateway, 2 Sheung Ning Road, Tseung Kwan O, New Territories","addressZH":"新界將軍澳常寧路2號TKO Gateway","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tko-gateway/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tko-gateway/","tags":["Wong Tai Sin","Hong Kong","Southern","Hong Kong","Yuen Long","Hong Kong","Wong Tai Sin","Hong Kong","Yau Tsim Mong","Hong Kong"],"lat":22.317316,"lng":114.266352,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"TKO Gateway (East Wing)","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"TKO Gateway, 2 Sheung Ning Road, Tseung Kwan O, New Territories","id":"link_hk_tko_gateway","no":52,"name":"TKO Gateway","address":"新界將軍澳常寧路2號TKO Gateway","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tko-spot","nameEN":"TKO Spot","nameZH":"TKO Spot","addressEN":"TKO Spot, 2 Tong Ming Street, Tseung Kwan O, New Territories","addressZH":"新界將軍澳唐明街2號TKO Spot","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tko-spot/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tko-spot/","tags":["Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong"],"lat":22.311008,"lng":114.258914,"districtZH":"西貢區","districtEN":"Sai Kung District","geocodeNameZH":"TKO Spot","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"TKO Spot, 2 Tong Ming Street, Tseung Kwan O, New Territories","id":"link_hk_tko_spot","no":53,"name":"TKO Spot","address":"新界將軍澳唐明街2號TKO Spot","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tai-hing-commercial-centre","nameEN":"Tai Hing Commercial Centre","nameZH":"大興商場","addressEN":"Tai Hing Commercial Centre, 1 Tai Hing Street, Tuen Mun, New Territories","addressZH":"新界屯門大興街1號大興商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tai-hing-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tai-hing-commercial-centre/","tags":["Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong","Tuen Mun","Hong Kong"],"lat":22.402313,"lng":113.97018,"districtZH":"屯門區","districtEN":"Tuen Mun District","geocodeNameZH":"大興商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tai Hing Commercial Centre, 1 Tai Hing Street, Tuen Mun, New Territories","id":"link_hk_tai_hing_commercial_centre","no":54,"name":"大興商場","address":"新界屯門大興街1號大興商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tai-wo-plaza","nameEN":"Tai Wo Plaza","nameZH":"太和廣場","addressEN":"Tai Wo Plaza, 12 Tai Wo Road, Tai Po, New Territories","addressZH":"新界大埔太和路12號太和廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tai-wo-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tai-wo-plaza/","tags":["Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong"],"lat":22.451272,"lng":114.16167,"districtZH":"大埔區","districtEN":"Tai Po District","geocodeNameZH":"太和廣場東翼","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tai Wo Plaza, 12 Tai Wo Road, Tai Po, New Territories","id":"link_hk_tai_wo_plaza","no":55,"name":"太和廣場","address":"新界大埔太和路12號太和廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tai-yuen-commercial-centre","nameEN":"Tai Yuen Commercial Centre","nameZH":"大元商場","addressEN":"Tai Yuen Commercial Centre, 10 Ting Kok Road, Tai Po, New Territories","addressZH":"新界大埔汀角路10號大元商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tai-yuen-commercial-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tai-yuen-commercial-centre/","tags":["Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong","Tai Po","Hong Kong"],"lat":22.45521,"lng":114.168607,"districtZH":"大埔區","districtEN":"Tai Po District","geocodeNameZH":"大元商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tai Yuen Commercial Centre, 10 Ting Kok Road, Tai Po, New Territories","id":"link_hk_tai_yuen_commercial_centre","no":56,"name":"大元商場","address":"新界大埔汀角路10號大元商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tak-tin-plaza","nameEN":"Tak Tin Plaza","nameZH":"德田廣場","addressEN":"Tak Tin Plaza, 223 Pik Wan Road, Lam Tin, Kwun Tong, Kowloon","addressZH":"九龍觀塘藍田碧雲道223號德田廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tak-tin-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tak-tin-plaza/","tags":[],"lat":22.31025,"lng":114.237969,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"德田廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tak Tin Plaza, 223 Pik Wan Road, Lam Tin, Kwun Tong, Kowloon","id":"link_hk_tak_tin_plaza","no":57,"name":"德田廣場","address":"九龍觀塘藍田碧雲道223號德田廣場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"temple-mall","nameEN":"Temple Mall","nameZH":"黃大仙中心","addressEN":"Temple Mall, 136 Lung Cheung Road, Wong Tai Sin, Kowloon","addressZH":"九龍黃大仙龍翔道136號黃大仙中心","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/temple-mall/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/temple-mall/","tags":["Wong Tai Sin","Hong Kong","Southern","Hong Kong","Yuen Long","Hong Kong","Sai Kung and Tseung Kwan O","Hong Kong","Yau Tsim Mong","Hong Kong"],"lat":22.34194,"lng":114.192571,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"黃大仙中心北館","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Temple Mall, 136 Lung Cheung Road, Wong Tai Sin, Kowloon","id":"link_hk_temple_mall","no":58,"name":"黃大仙中心","address":"九龍黃大仙龍翔道136號黃大仙中心","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tin-chak-shopping-centre","nameEN":"Tin Chak Shopping Centre","nameZH":"天澤商場","addressEN":"Tin Chak Shopping Centre, 77 Tin Shui Road, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天瑞路77號天澤商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tin-chak-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tin-chak-shopping-centre/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.46845,"lng":113.998697,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"天澤商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tin Chak Shopping Centre, 77 Tin Shui Road, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_tin_chak_shopping_centre","no":59,"name":"天澤商場","address":"新界元朗天水圍天瑞路77號天澤商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tin-shing-shopping-centre","nameEN":"Tin Shing Shopping Centre","nameZH":"天盛商場","addressEN":"Tin Shing Shopping Centre, 3 Tin Ching Street, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天靖街3號天盛商場","assetTypeEN":"Retail, Car Park and Fresh Market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tin-shing-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tin-shing-shopping-centre/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.448813,"lng":114.002812,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"天盛商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tin Shing Shopping Centre, 3 Tin Ching Street, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_tin_shing_shopping_centre","no":60,"name":"天盛商場","address":"新界元朗天水圍天靖街3號天盛商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tin-shui-shopping-centre","nameEN":"Tin Shui Shopping Centre","nameZH":"天瑞商場","addressEN":"Tin Shui Shopping Centre, 9 Tin Shui Road, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天瑞路9號天瑞商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tin-shui-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tin-shui-shopping-centre/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.455987,"lng":113.998431,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"天瑞商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tin Shui Shopping Centre, 9 Tin Shui Road, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_tin_shui_shopping_centre","no":61,"name":"天瑞商場","address":"新界元朗天水圍天瑞路9號天瑞商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tin-tsz-shopping-centre","nameEN":"Tin Tsz Shopping Centre","nameZH":"天慈商場","addressEN":"Tin Tsz Shopping Centre, 9 Tin Hei Street, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天喜街9號天慈商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/tin-tsz-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tin-tsz-shopping-centre/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.453188,"lng":114.006547,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"天慈商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tin Tsz Shopping Centre, 9 Tin Hei Street, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_tin_tsz_shopping_centre","no":62,"name":"天慈商場","address":"新界元朗天水圍天喜街9號天慈商場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tin-yiu-plaza","nameEN":"Tin Yiu Plaza","nameZH":"天耀廣場","addressEN":"Tin Yiu Plaza, 2 Tin Wu Road, Tin Shui Wai, Yuen Long, New Territories","addressZH":"新界元朗天水圍天湖路2號天耀廣場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/tin-yiu-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tin-yiu-plaza/","tags":["Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong","Yuen Long","Hong Kong"],"lat":22.450728,"lng":114.003781,"districtZH":"元朗區","districtEN":"Yuen Long District","geocodeNameZH":"天耀廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tin Yiu Plaza, 2 Tin Wu Road, Tin Shui Wai, Yuen Long, New Territories","id":"link_hk_tin_yiu_plaza","no":63,"name":"天耀廣場","address":"新界元朗天水圍天湖路2號天耀廣場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tsui-ping-north-shopping-circuit","nameEN":"Tsui Ping North Shopping Circuit","nameZH":"翠屏(北)商場","addressEN":"Tsui Ping North Shopping Circuit, 19 Tsui Ping Road, Kwun Tong, Kowloon","addressZH":"九龍觀塘翠屏道19號翠屏(北)商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tsui-ping-north-shopping-circuit/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tsui-ping-north-shopping-circuit/","tags":[],"lat":22.316574,"lng":114.229489,"districtZH":"觀塘區","districtEN":"Kwun Tong District","geocodeNameZH":"翠屏(北)商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tsui Ping North Shopping Circuit, 19 Tsui Ping Road, Kwun Tong, Kowloon","id":"link_hk_tsui_ping_north_shopping_circuit","no":64,"name":"翠屏(北)商場","address":"九龍觀塘翠屏道19號翠屏(北)商場","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"tsz-wan-shan-shopping-centre","nameEN":"Tsz Wan Shan Shopping Centre","nameZH":"慈雲山中心","addressEN":"Tsz Wan Shan Shopping Centre, 23 Yuk Wah Street, Tsz Wan Shan, Kowloon","addressZH":"九龍慈雲山毓華街23號慈雲山中心","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/tsz-wan-shan-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/tsz-wan-shan-shopping-centre/","tags":["Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong","Wong Tai Sin","Hong Kong"],"lat":22.348405,"lng":114.20061,"districtZH":"黃大仙區","districtEN":"Wong Tai Sin District","geocodeNameZH":"慈雲山中心","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Tsz Wan Shan Shopping Centre, 23 Yuk Wah Street, Tsz Wan Shan, Kowloon","id":"link_hk_tsz_wan_shan_shopping_centre","no":65,"name":"慈雲山中心","address":"九龍慈雲山毓華街23號慈雲山中心","developer":"領展","area":"九龍","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"un-chau-shopping-centre","nameEN":"Un Chau Shopping Centre","nameZH":"元州商場","addressEN":"Un Chau Shopping Centre, 303 Un Chau Street, Cheung Sha Wan, Kowloon","addressZH":"九龍長沙灣元州街303號元州商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/un-chau-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/un-chau-shopping-centre/","tags":["Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong","Sham Shui Po","Hong Kong"],"lat":22.337315,"lng":114.156382,"districtZH":"深水埗區","districtEN":"Sham Shui Po District","geocodeNameZH":"元州商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Un Chau Shopping Centre, 303 Un Chau Street, Cheung Sha Wan, Kowloon","id":"link_hk_un_chau_shopping_centre","no":66,"name":"元州商場","address":"九龍長沙灣元州街303號元州商場","developer":"領展","area":"九龍","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"wan-tsui-shopping-centre","nameEN":"Wan Tsui Shopping Centre","nameZH":"環翠商場","addressEN":"Wan Tsui Shopping Centre, 2 Wah Ha Street, Chai Wan, Hong Kong","addressZH":"香港柴灣華廈街2號環翠商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/wan-tsui-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/wan-tsui-shopping-centre/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.262857,"lng":114.237677,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"環翠商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Wan Tsui Shopping Centre, 2 Wah Ha Street, Chai Wan, Hong Kong","id":"link_hk_wan_tsui_shopping_centre","no":67,"name":"環翠商場","address":"香港柴灣華廈街2號環翠商場","developer":"領展","area":"港島","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"wo-che-plaza","nameEN":"Wo Che Plaza","nameZH":"禾輋廣場","addressEN":"Wo Che Plaza, 3 Tak Hau Street, Sha Tin, New Territories","addressZH":"新界沙田德厚街3號禾輋廣場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/wo-che-plaza/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/wo-che-plaza/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.387977,"lng":114.19515,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"禾輋廣場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Wo Che Plaza, 3 Tak Hau Street, Sha Tin, New Territories","id":"link_hk_wo_che_plaza","no":68,"name":"禾輋廣場","address":"新界沙田德厚街3號禾輋廣場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"yat-tung-shopping-centre","nameEN":"Yat Tung Shopping Centre","nameZH":"逸東商場","addressEN":"Yat Tung Shopping Centre, 8 Yat Tung Street, Tung Chung, New Territories","addressZH":"新界東涌逸東街8號逸東商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/yat-tung-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/yat-tung-shopping-centre/","tags":["Islands","Hong Kong"],"lat":22.281616,"lng":113.934795,"districtZH":"離島區","districtEN":"Islands District","geocodeNameZH":"逸東商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Yat Tung Shopping Centre, 8 Yat Tung Street, Tung Chung, New Territories","id":"link_hk_yat_tung_shopping_centre","no":69,"name":"逸東商場","address":"新界東涌逸東街8號逸東商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"yin-lai-court-shopping-centre","nameEN":"Yin Lai Court Shopping Centre","nameZH":"賢麗苑購物中心","addressEN":"Yin Lai Court Shopping Centre, 180 Lai King Hill Road, Kwai Chung, New Territories","addressZH":"新界葵涌荔景山路180號賢麗苑購物中心","assetTypeEN":"Retail","assetTypeZH":"零售","officialUrl":"https://www.linkreit.com/en/business/properties/yin-lai-court-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/yin-lai-court-shopping-centre/","tags":["Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong","Kwai Chung and Tsing Yi","Hong Kong"],"lat":22.348471,"lng":114.1265,"districtZH":"葵青區","districtEN":"Kwai Tsing District","geocodeNameZH":"賢麗苑購物中心","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Yin Lai Court Shopping Centre, 180 Lai King Hill Road, Kwai Chung, New Territories","id":"link_hk_yin_lai_court_shopping_centre","no":70,"name":"賢麗苑購物中心","address":"新界葵涌荔景山路180號賢麗苑購物中心","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"yiu-on-shopping-centre","nameEN":"Yiu On Shopping Centre","nameZH":"耀安商場","addressEN":"Yiu On Shopping Centre, 2 Hang Hong Street, Ma On Shan, Sha Tin, New Territories","addressZH":"新界沙田馬鞍山恆康街2號耀安商場","assetTypeEN":"Retail and car park","assetTypeZH":"零售及停車場","officialUrl":"https://www.linkreit.com/en/business/properties/yiu-on-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/yiu-on-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.420253,"lng":114.230344,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"耀安商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Yiu On Shopping Centre, 2 Hang Hong Street, Ma On Shan, Sha Tin, New Territories","id":"link_hk_yiu_on_shopping_centre","no":71,"name":"耀安商場","address":"新界沙田馬鞍山恆康街2號耀安商場","developer":"領展","area":"新界","propertyType":"商場／零售物業","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"yiu-tung-shopping-centre","nameEN":"Yiu Tung Shopping Centre","nameZH":"耀東商場","addressEN":"Yiu Tung Shopping Centre, 12 Yiu Hing Road, Shau Kei Wan, Hong Kong","addressZH":"香港筲箕灣耀興道12號耀東商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/yiu-tung-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/yiu-tung-shopping-centre/","tags":["Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong","Eastern","Hong Kong"],"lat":22.277356,"lng":114.224186,"districtZH":"東區","districtEN":"Eastern District","geocodeNameZH":"耀東商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Yiu Tung Shopping Centre, 12 Yiu Hing Road, Shau Kei Wan, Hong Kong","id":"link_hk_yiu_tung_shopping_centre","no":72,"name":"耀東商場","address":"香港筲箕灣耀興道12號耀東商場","developer":"領展","area":"港島","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"},{"slug":"yu-chui-shopping-centre","nameEN":"Yu Chui Shopping Centre","nameZH":"愉翠商場","addressEN":"Yu Chui Shopping Centre, 2 Ngau Pei Sha Street, Siu Lek Yuen, Sha Tin, New Territories","addressZH":"新界沙田小瀝源牛皮沙街2號愉翠商場","assetTypeEN":"Retail, car park and fresh market","assetTypeZH":"零售、停車場及鮮活街巿","officialUrl":"https://www.linkreit.com/en/business/properties/yu-chui-shopping-centre/","officialUrlZH":"https://www.linkreit.com/tc/business/properties/yu-chui-shopping-centre/","tags":["Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong","Sha Tin","Hong Kong"],"lat":22.381988,"lng":114.205345,"districtZH":"沙田區","districtEN":"Sha Tin District","geocodeNameZH":"愉翠商場","geocodeSource":"香港地政總署 GeoInfo Map","geocodeQuery":"Yu Chui Shopping Centre, 2 Ngau Pei Sha Street, Siu Lek Yuen, Sha Tin, New Territories","id":"link_hk_yu_chui_shopping_centre","no":73,"name":"愉翠商場","address":"新界沙田小瀝源牛皮沙街2號愉翠商場","developer":"領展","area":"新界","propertyType":"街市及零售","datasetVersion":"link-hk-retail-2026-07-30-v2"}];
let malls = [];
let selectedMallId = null;
let editingMallId = null;
let mallSearchTerm = '';
let mallStatusFilter = '全部';
let placeSearchTerm = '';
let resourceKind = 'institution';
let mallPickMode = false;
let bulkMode = false;
let selectedPlaceIds = new Set();

const DISTRICTS = {
  current: { name: '当前位置', lat: null, lng: null },
  central: { name: '中西區', lat: 22.2862, lng: 114.1500 },
  wanchai: { name: '灣仔', lat: 22.2783, lng: 114.1747 },
  eastern: { name: '東區', lat: 22.2842, lng: 114.2241 },
  southern: { name: '南區', lat: 22.2468, lng: 114.1596 },
  ytm: { name: '油尖旺', lat: 22.3117, lng: 114.1694 },
  ssp: { name: '深水埗', lat: 22.3303, lng: 114.1622 },
  kcity: { name: '九龍城', lat: 22.3282, lng: 114.1915 },
  wts: { name: '黃大仙', lat: 22.3428, lng: 114.1939 },
  kt: { name: '觀塘', lat: 22.3121, lng: 114.2257 },
  kwaitsing: { name: '葵青', lat: 22.3545, lng: 114.1302 },
  tsuenwan: { name: '荃灣', lat: 22.3707, lng: 114.1138 },
  tuenmun: { name: '屯門', lat: 22.3910, lng: 113.9768 },
  yuenlong: { name: '元朗', lat: 22.4445, lng: 114.0224 },
  north: { name: '北區', lat: 22.4940, lng: 114.1388 },
  taipo: { name: '大埔', lat: 22.4513, lng: 114.1686 },
  shatin: { name: '沙田', lat: 22.3813, lng: 114.1886 },
  saikung: { name: '西貢', lat: 22.3817, lng: 114.2709 },
  islands: { name: '離島', lat: 22.2610, lng: 113.9456 }
};

const STATUS_COLORS = {
  '未接触': '#7f8c8d',
  '待跟进': '#7f8c8d',
  '基础池': '#7f8c8d',
  '点位': '#e67e22',
  '已交流': '#f1c40f',
  '有意向': '#2ecc71',
  '已合作': '#3498db',
  '暂不合作': '#e74c3c'
};


function hideHomeHint() {
  const el = document.getElementById('homeHint');
  if (el) el.style.display = 'none';
  localStorage.setItem('bd_map_hide_home_hint', '1');
}
function restoreHomeHintState() {
  if (localStorage.getItem('bd_map_hide_home_hint') === '1') {
    const el = document.getElementById('homeHint');
    if (el) el.style.display = 'none';
  }
}

let customTypes = [];
function normalizeTypeList(types) {
  return [...new Set((types || []).map(x => String(x || '').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'zh-Hant'));
}
function ensureTypeOption(type) {
  const select = document.getElementById('fType');
  const val = String(type || '').trim();
  if (!select || !val || val === '__custom__') return;
  if (![...select.options].some(o => o.value === val)) {
    const customOpt = [...select.options].find(o => o.value === '__custom__');
    const opt = new Option(val, val);
    select.add(opt, customOpt || null);
  }
}
function loadCustomTypeOptions(types) {
  customTypes = normalizeTypeList(types || customTypes);
  customTypes.forEach(ensureTypeOption);
}
function syncCustomTypesFromPlaces() {
  loadCustomTypeOptions(places.map(p => p && p.type));
}

function isInstitutionEntry(p) {
  if (!p) return false;
  if (isPointEntry(p)) return false;
  if (p.entryKind === 'institution') return true;
  if (p.importSource === 'batch_shop_import') return true;
  if (p.name && (p.address || p.phone || p.contact || p.type)) return true;
  return false;
}
async function saveCustomTypeToCloud(type) {
  const val = String(type || '').trim();
  if (!val) return;
  const next = normalizeTypeList([...customTypes, val]);
  customTypes = next;
  loadCustomTypeOptions(next);
  await appConfigCollection.doc('institutionTypes').set({ types: next, updatedAt: new Date().toISOString(), updatedBy: currentUsername || '匿名' }, { merge: true });
}
async function addCustomType(initialValue) {
  const val = prompt('请输入新的机构类型', initialValue || '');
  const type = String(val || '').trim();
  if (!type) return '';
  ensureTypeOption(type);
  try {
    await saveCustomTypeToCloud(type);
    toast('✅ 类型已同步给所有人');
  } catch (err) {
    console.error('Save custom type failed:', err);
    toast('⚠️ 类型云端同步失败，本机暂可使用');
  }
  return type;
}
function handlePrimaryCategoryChange() {
  const primary = document.getElementById('fPrimaryCategory').value;
  const secSelect = document.getElementById('fSecondaryCategory');
  const options = LEAD_CATEGORY_TAXONOMY[primary] || [];
  secSelect.innerHTML = options.length
    ? ['<option value="">请选择</option>', ...options.map(o => `<option value="${escAttr(o)}">${esc(o)}</option>`)].join('')
    : '<option value="">请先选一级类目</option>';
}
async function handleTypeSelectChange() {
  const select = document.getElementById('fType');
  if (!select || select.value !== '__custom__') return;
  const type = await addCustomType('');
  select.value = type || (document.getElementById('entryKind').value === 'point' ? '商场' : '中医诊所');
}
function initCustomTypesCloudListener() {
  appConfigCollection.doc('institutionTypes').onSnapshot(doc => {
    const data = doc.exists ? doc.data() : {};
    loadCustomTypeOptions(data.types || []);
    syncCustomTypesFromPlaces();
  }, err => {
    console.error('Custom types listener error:', err);
    syncCustomTypesFromPlaces();
  });
}
function getDataVersionKey() {
  const placesSig = places.map(p => [p.id, p.updatedAt, p.status, (p.visits||[]).length, p.ownerId, p.ownerAvatar].join(':')).join('|');
  return [places.length, baseClinics.length, coverageCacheVersion, placesSig.length].join('|');
}
function clearCoverageCache() {
  coverageCache = new Map();
  coverageCacheVersion++;
}
function coverageCacheKey(center, radiusKm = COVERAGE_KM) {
  return [center && center.id || 'unknown', Number(center && center.lat || 0).toFixed(6), Number(center && center.lng || 0).toFixed(6), Number(radiusKm).toFixed(2), getDataVersionKey()].join('|');
}
function shouldShowOnHome(p) {
  if (!p || p.deletedAt) return false;
  if (isPointEntry(p)) return true;
  if (isInstitutionEntry(p)) return true;
  if (isManualEntry(p)) return true;
  if ((p.visits || []).length > 0) return true;
  return !isHiddenColdImport(p);
}
// ============ INIT ============
function init() {
  map = L.map('map', {
    center: [currentPos.lat, currentPos.lng],
    zoom: 15,
    zoomControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  L.control.zoom({ position: 'topleft' }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  comboResultLayer = L.layerGroup().addTo(map);
  coverageLayer = L.layerGroup().addTo(map);
  mallLayer = L.layerGroup().addTo(map);
  loadMalls();
  loadBaseClinics();
  restoreHomeHintState();
  initCustomTypesCloudListener();
  setAppTab('leads');
  renderLeadHomeList();

  // Map click to add marker
  map.on('click', function(e) {
    if (sheetPickMode) {
      sheetPickMode = false;
      document.getElementById('editLat').value = e.latlng.lat;
      document.getElementById('editLng').value = e.latlng.lng;
      reverseGeocode(e.latlng.lat, e.latlng.lng);
      document.getElementById('pickLocationBar').classList.remove('active');
      openSheet();
      toast('📍 位置已回填');
      return;
    }
    if (mallPickMode) {
      mallPickMode = false;
      document.getElementById('mallLat').value = e.latlng.lat;
      document.getElementById('mallLng').value = e.latlng.lng;
      toast('🏬 商场位置已选定');
      openMallPanel();
      return;
    }
    if (tapMode) {
      tapMode = false;
      document.getElementById('editLat').value = e.latlng.lat;
      document.getElementById('editLng').value = e.latlng.lng;
      reverseGeocode(e.latlng.lat, e.latlng.lng);
      toast('📍 位置已选定');
    }
  });

  map.on('zoomend', function() {
    if (activeComboResultTab && lastComboAnalysis) {
      const rows = getStrictComboRows(activeComboResultTab, lastComboAnalysis);
      renderComboResultMarkers(rows, activeComboResultTab);
    }
  });

  // Long press to add
  let pressTimer;
  map.on('mousedown', function(e) {
    pressTimer = setTimeout(() => {
      openAddSheet(e.latlng.lat, e.latlng.lng);
    }, 600);
  });
  map.on('mouseup mousemove', () => clearTimeout(pressTimer));

  initCoveragePanelDrag();

  renderOwnerFilters();
  renderMarkers();
  renderMalls();
  updateStats();
  locateMe(true);

  // Ask for username if not set
  if (!currentUsername) {
    setTimeout(() => {
      const name = prompt('请输入你的名字（团队协同用）:');
      if (name && name.trim()) {
        currentUsername = name.trim();
        localStorage.setItem(USERNAME_KEY, currentUsername);
        updateCurrentUserBadge();
        toast('👋 你好 ' + currentUsername);
      }
    }, 500);
  } else {
    updateCurrentUserBadge();
  }

  // Firestore real-time listener
  placesCollection.onSnapshot(snapshot => {
    const allRecords = [];
    snapshot.forEach(doc => {
      allRecords.push({ id: doc.id, ...doc.data() });
    });
    places = allRecords.filter(p => !p.deletedAt);
    deletedPlaces = allRecords.filter(p => !!p.deletedAt);
    clearCoverageCache();
    // Also backup to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
    syncCustomTypesFromPlaces();
    renderOwnerFilters();
    updateMapFilterBar();
    renderMarkers();
    renderMalls();
    scheduleLeadHomeRender();
    updateStats();
    updateRecycleBinCount();
    if (document.getElementById('recycleBinPanel').classList.contains('active')) renderRecycleBin();
    document.getElementById('syncStatus').textContent = '✅ 实时同步中 · ' + places.length + ' 条有效数据';
  }, err => {
    console.error('Firestore listener error:', err);
    document.getElementById('syncStatus').textContent = '⚠️ 离线模式';
    // Fallback to localStorage
    const localRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    places = localRecords.filter(p => !p.deletedAt);
    deletedPlaces = localRecords.filter(p => !!p.deletedAt);
    syncCustomTypesFromPlaces();
    renderOwnerFilters();
    updateMapFilterBar();
    renderMarkers();
    scheduleLeadHomeRender();
    updateStats();
    updateRecycleBinCount();
  });
}

// ============ MARKERS ============
function getCoverageContactClass(p) {
  const s = normalizeStatus(p.status);
  if (s === '已合作') return 'coverage-coop';
  if (s === '有意向') return 'coverage-intent';
  if (s === '已交流') return 'coverage-contacted';
  return '';
}
function getCoverageListClass(p) {
  const s = normalizeStatus(p.status);
  if (s === '已合作') return 'coop';
  if (s === '有意向') return 'intent';
  if (s === '已交流') return 'warm';
  return '';
}
function getCoverageStatusBadge(p) {
  const s = normalizeStatus(p.status);
  if (s === '已合作') return '<span class="coverage-status-badge coop">已合作</span>';
  if (s === '有意向') return '<span class="coverage-status-badge intent">有意向</span>';
  if (s === '已交流') return '<span class="coverage-status-badge warm">已交流</span>';
  return '';
}
function getCoverageSortRank(p) {
  const s = normalizeStatus(p.status);
  if (s === '已合作') return 0;
  if (s === '有意向') return 1;
  if (s === '已交流') return 2;
  return 3;
}
function isMapWeakError(p) {
  const t = String((p && (p.dataQualityIssueType || p.dataQualityStatus)) || '').toLowerCase();
  return ['地址错误','重複店舖','重复店铺','已停业','已停業'].some(x => t.includes(x.toLowerCase()));
}
function createIcon(status, p, highlighted) {
  const color = STATUS_COLORS[status] || '#7f8c8d';
  const avatar = isPointEntry(p) ? '📍' : getOwnerAvatar(p);
  const mine = getOwnerId(p) === getCurrentOwnerId();
  const opacity = isMapWeakError(p) ? 0.52 : (mine ? 1 : 0.72);
  const coverageClass = highlighted ? getCoverageContactClass({ ...p, status }) : '';
  const errorClass = isMapWeakError(p) ? ' data-error' : '';
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${coverageClass}${errorClass}" style="background:${color};opacity:${opacity}">${avatarHtml(avatar)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
}

function setMapStatusFilter(status) {
  currentFilter = status || '全部';
  updateMapFilterBar();
  renderMarkers();
  updateStats();
}
function setMapOwnerFilter(ownerId) {
  ownerFilter = ownerId || '全部';
  updateMapFilterBar();
  renderMarkers();
  updateStats();
}
function updateMapFilterBar() {
  document.querySelectorAll('.map-filter-chip[data-kind="status"]').forEach(b => b.classList.toggle('active', normalizeStatus(b.dataset.value) === normalizeStatus(currentFilter)));
  renderOwnerSelectOptions('mapOwnerSelect');
}
function getFilteredPlaces() {
  const selectedMall = getCoverageTargetById(selectedMallId);
  return places.filter(p => {
    if (!p || p.deletedAt) return false;
    const status = normalizeStatus(p.status);
    const isUncontacted = isUncontactedPlace(p);
    const matchStatus = currentFilter === '全部' || status === normalizeStatus(currentFilter);
    const matchOwner = ownerFilter === '全部' || getOwnerId(p) === ownerFilter;
    if (!matchStatus || !matchOwner) return false;
    if (placeSearchTerm) {
      const hay = [p.name,p.address,p.contact,p.phone,p.type,p.ownerName].join(' ').toLowerCase();
      if (!hay.includes(placeSearchTerm)) return false;
    }
    // 首页只隐藏批量导入的冷线索；手动录入/有记录/点位即使未接触也显示，避免手动数据“消失”
    if (!selectedMall) return shouldShowOnHome(p);
    // 1km覆盖模式：保留已处理机构、手动录入和点位，同时额外展示当前覆盖中心1km内未交流诊所
    if (shouldShowOnHome(p)) return true;
    // 覆盖模式下也显示1km内所有已导入/批量导入机构类型，不再只显示中医诊所。
    return distanceKm(selectedMall.lat, selectedMall.lng, p.lat, p.lng) <= singleCoverageKm;
  });
}
function renderMarkers() {
  markersLayer.clearLayers();
  const selectedMall = getCoverageTargetById(selectedMallId);
  let renderPool = getFilteredPlaces().filter(p => !isPointEntry(p));
  if (selectedMall && baseClinics.length) {
    renderPool = mergeCoverageRenderPool(renderPool, getBaseMallClinics(selectedMall));
  }
  const coordGroups = new Map();
  const coordinatePlan = getRuntimeSafety().coordinateGroupPlan(renderPool);
  renderPool.forEach(p => {
    if (isNaN(parseFloat(p.lat)) || isNaN(parseFloat(p.lng))) return;
    const lat0 = parseFloat(p.lat), lng0 = parseFloat(p.lng);
    const coordKey = lat0.toFixed(6) + ',' + lng0.toFixed(6);
    const siblings = coordGroups.get(coordKey) || [];
    coordGroups.set(coordKey, siblings.concat([p.id || siblings.length]));
    const placement = coordinatePlan.get(p.id) || { index:siblings.length, total:1 };
    const idx = placement.index;
    const total = placement.total;
    const angle = (Math.PI * 2 * idx) / total;
    const offset = total > 1 ? 0.000045 : 0; // 约5米，解决同楼/同坐标 marker 互相盖住
    const markerLat = lat0 + Math.sin(angle) * offset;
    const markerLng = lng0 + Math.cos(angle) * offset;
    const isHighlighted = selectedMall && distanceKm(selectedMall.lat, selectedMall.lng, lat0, lng0) <= singleCoverageKm;
    const displayStatus = p.status || (p.isBaseClinic ? '基础池' : '未接触');
    const marker = L.marker([markerLat, markerLng], { icon: createIcon(displayStatus, p, isHighlighted) });
    const statusColor = STATUS_COLORS[displayStatus] || '#7f8c8d';
    const visitCount = (p.visits || []).length;
    const lastVisit = visitCount > 0 ? p.visits[visitCount-1] : null;
    let popupHtml = `
      <div class="popup-name">${esc(p.name)}</div>
      <div class="popup-type">${esc(p.type || '')}</div>
      <div class="popup-status" style="background:${statusColor};color:#fff">${esc(displayStatus)}</div>
    `;
    const pr = calcPriority(p);
    popupHtml += scoreBadgeWithDetailHtml(p.id, pr);
    if (selectedMall) popupHtml += `<div class="popup-detail" style="color:#ff9f1a">🏬 距 ${esc(selectedMall.name)} ${distanceKm(selectedMall.lat, selectedMall.lng, p.lat, p.lng).toFixed(2)} km</div>`;
    if (p.contact) popupHtml += `<div class="popup-detail">👤 ${esc(p.contact)}${p.phone ? ' · ' + esc(p.phone) : ''}</div>`;
    if (p.scale) popupHtml += `<div class="popup-detail">📏 ${esc(p.scale)}</div>`;
    if (p.staff) popupHtml += `<div class="popup-detail">👨‍⚕️ ${esc(p.staff)}人</div>`;
    if (visitCount > 0) {
      popupHtml += `<div class="popup-detail">📋 ${visitCount}次${isPointEntry(p) ? '记录' : '交流'}`;
      if (lastVisit) popupHtml += ` · 最近: ${esc(lastVisit.date)}`;
      popupHtml += `</div>`;
    }
    popupHtml += `<div class="popup-detail" style="color:var(--primary)">归属：${esc(getOwnerLabel(p))}</div>`;
    if (p.updatedBy) popupHtml += `<div class="popup-detail" style="color:var(--primary)">✍️ ${esc(p.updatedByName || p.updatedBy)}${p.updatedAt ? ' · ' + esc(String(p.updatedAt).slice(0,10)) : ''}</div>`;
    if (p.isBaseClinic) popupHtml += `<span class="popup-edit" onclick="promoteBaseClinic('${jsStr(p.id)}')">➕ 加入机构并跟进</span>`;
    else {
      popupHtml += `<span class="popup-edit" onclick="openEditSheet('${jsStr(p.id)}')">✏️ ${isPointEntry(p) ? '编辑点位' : '编辑'}</span>`;
      if (isPointEntry(p)) popupHtml += `<div class="point-actions"><button class="coverage-action-btn" onclick="selectPointCoverage('${jsStr(p.id)}')">查看1公里诊所</button><button onclick="addComboCenter('${jsStr(p.id)}')">加入组合</button></div>`;
    }
    marker.bindPopup(popupHtml, { maxWidth: 260 });
    markersLayer.addLayer(marker);
  });
}

// ============ GEOLOCATION ============
function locateMe(silent) {
  if (!navigator.geolocation) { if(!silent) toast('❌ 浏览器不支持定位'); return; }
  if(!silent) showLoading();
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      scheduleLeadHomeRender();
      map.setView([currentPos.lat, currentPos.lng], 16);
      if (myLocMarker) map.removeLayer(myLocMarker);
      myLocMarker = L.circleMarker([currentPos.lat, currentPos.lng], {
        radius: 8, fillColor: '#4A90D9', fillOpacity: 1, color: '#fff', weight: 3
      }).addTo(map).bindPopup('📍 你在这里');
      if(!silent) { hideLoading(); toast('📍 已定位'); }
    },
    err => {
      if(!silent) { hideLoading(); toast('📍 定位失败，使用默认位置'); }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ============ REVERSE GEOCODE ============
function reverseGeocode(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh`)
    .then(r => r.json())
    .then(d => {
      if (d.display_name) {
        document.getElementById('fAddr').value = d.display_name;
      }
    }).catch(() => {});
}

let sheetAddressRelocateTimer = null;
let lastRelocatedAddress = '';
function scheduleSheetAddressRelocate() {
  clearTimeout(sheetAddressRelocateTimer);
  sheetAddressRelocateTimer = setTimeout(() => geocodeAddressForSheet(false), 900);
}
async function geocodeAddressForSheet(forceToast) {
  const addrEl = document.getElementById('fAddr');
  if (!addrEl) return;
  const raw = addrEl.value.trim();
  if (!raw || raw.length < 3) return;
  if (!forceToast && raw === lastRelocatedAddress) return;
  const query = /香港|Hong Kong|HK/i.test(raw) ? raw : raw + ' 香港';
  try {
    if (forceToast) toast('📍 正在按地址定位...');
    const key = getGoogleMapsKey();
    let lat, lng, formatted;
    if (key) {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}&region=hk&language=zh-HK`);
      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length) {
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
        formatted = data.results[0].formatted_address;
      } else {
        console.warn('Google geocode failed:', data.status, data.error_message || '');
      }
    }
    if (lat === undefined || lng === undefined) {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=zh&q=${encodeURIComponent(query)}`);
      const rows = await res.json();
      if (!rows || !rows.length) {
        if (forceToast) toast('❌ 地址定位失败，请手动选点');
        return;
      }
      lat = parseFloat(rows[0].lat);
      lng = parseFloat(rows[0].lon);
      formatted = rows[0].display_name;
    }
    lat = parseFloat(lat); lng = parseFloat(lng);
    if (isNaN(lat) || isNaN(lng)) return;
    document.getElementById('editLat').value = lat;
    document.getElementById('editLng').value = lng;
    lastRelocatedAddress = raw;
    map.setView([lat, lng], Math.max(map.getZoom(), 17));
    if (forceToast) toast('✅ 已按地址定位，可保存或再修正');
  } catch (err) {
    console.error('Address geocode failed:', err);
    if (forceToast) toast('❌ 地址定位失败，请手动选点');
  }
}

function getActiveStatusValue() {
  const active = document.querySelector('.status-chip.active');
  return active ? active.dataset.status : '';
}
function setStatusChip(status) {
  let matched = false;
  document.querySelectorAll('.status-chip').forEach(c => {
    const on = c.dataset.status === status;
    c.classList.toggle('active', on);
    if (on) matched = true;
  });
  if (!matched) document.querySelectorAll('.status-chip').forEach((c,i) => c.classList.toggle('active', i===1)); // 默认“已交流”，避免首页隐藏
}
function setEntryKind(kind) {
  const currentKind = document.getElementById('entryKind').value || 'institution';
  const activeStatus = getActiveStatusValue();
  if (currentKind === 'institution' && activeStatus && activeStatus !== '点位') lastInstitutionStatus = activeStatus;
  const k = kind === 'point' ? 'point' : 'institution';
  document.getElementById('entryKind').value = k;
  document.getElementById('kindInstitution').classList.toggle('active', k === 'institution');
  document.getElementById('kindPoint').classList.toggle('active', k === 'point');
  document.body.classList.toggle('entry-point-mode', k === 'point');
  document.getElementById('sheetTitle').textContent = k === 'point' ? '新增点位' : '新增机构';
  document.getElementById('nameLabel').textContent = k === 'point' ? '点位名称 *' : '机构名称 *';
  document.getElementById('visitLabel').textContent = k === 'point' ? '点位记录' : '交流记录';
  document.getElementById('newVisitNote').placeholder = k === 'point' ? '添加点位备注、巡场记录、合作进展...' : '添加本次交流备注...';
  document.getElementById('fName').placeholder = k === 'point' ? '例如：朗豪坊 / 乐富广场活动点' : '例如：仁心堂中医诊所';
  const catRow = document.getElementById('institutionCategoryRow');
  const secRow = document.getElementById('institutionSecondaryRow');
  if (k === 'point') {
    if (activeStatus && activeStatus !== '点位') lastInstitutionStatus = activeStatus;
    if (['中医诊所','美容院','艾灸馆','养生馆','NGO'].includes(document.getElementById('fType').value)) document.getElementById('fType').value = '商场';
    if (catRow) catRow.style.display = 'none';
    if (secRow) secRow.style.display = 'none';
  } else {
    if (['商场','社区场地','活动地点','议员办事处'].includes(document.getElementById('fType').value)) document.getElementById('fType').value = '中医诊所';
    setStatusChip(lastInstitutionStatus || '已交流');
    if (catRow) catRow.style.display = '';
    if (secRow) secRow.style.display = '';
  }
}

function isPointEntry(p) { return (p.entryKind || p.kind) === 'point' || ['商场','社区场地','活动地点','议员办事处'].includes(p.type); }
function isManualEntry(p) {
  if (!p) return false;
  if (isPointEntry(p)) return true;
  if (p.entryKind === 'institution') return true;
  if ((p.createdBy && p.createdBy !== 'TCM导入' && p.createdBy !== '系统导入') || (p.updatedBy && p.updatedBy !== 'TCM导入' && p.updatedBy !== '系统导入')) return true;
  if ((p.visits || []).length > 0) return true;
  return false;
}
function isHiddenColdImport(p) {
  return isUncontactedPlace(p) && !isManualEntry(p);
}
// ============ SHEET ============
function openAddSheet(lat, lng) {
  resetForm();
  setEntryKind('institution');
  document.getElementById('btnDelete').style.display = 'none';
  if (lat !== undefined) {
    document.getElementById('editLat').value = lat;
    document.getElementById('editLng').value = lng;
    reverseGeocode(lat, lng);
  } else {
    document.getElementById('editLat').value = currentPos.lat;
    document.getElementById('editLng').value = currentPos.lng;
  }
  editVisits = [];
  renderVisits();
  openSheet();
}

function openEditSheet(id) {
  map.closePopup();
  const p = places.find(x => x.id === id);
  if (!p) return;
  editBaseRevision = Number(p.revision) || 0;

  lastInstitutionStatus = (p.lastInstitutionStatus && p.lastInstitutionStatus !== '点位') ? p.lastInstitutionStatus : (p.status && p.status !== '点位' ? p.status : '已交流');
  setEntryKind(isPointEntry(p) ? 'point' : 'institution');
  document.getElementById('sheetTitle').textContent = isPointEntry(p) ? '编辑点位' : '编辑机构';
  document.getElementById('editId').value = p.id;
  document.getElementById('editLat').value = p.lat;
  document.getElementById('editLng').value = p.lng;
  document.getElementById('fName').value = p.name || '';
  ensureTypeOption(p.type);
  document.getElementById('fType').value = p.type || '中医诊所';
  const catRow = document.getElementById('institutionCategoryRow');
  const secRow = document.getElementById('institutionSecondaryRow');
  if (!isPointEntry(p)) {
    if (catRow) catRow.style.display = '';
    if (secRow) secRow.style.display = '';
    document.getElementById('fPrimaryCategory').value = p.primaryCategory || '';
    handlePrimaryCategoryChange();
    document.getElementById('fSecondaryCategory').value = p.secondaryCategory || '';
  } else {
    if (catRow) catRow.style.display = 'none';
    if (secRow) secRow.style.display = 'none';
  }
  document.getElementById('fAddr').value = p.address || '';
  document.getElementById('fContact').value = p.contact || '';
  document.getElementById('fPhone').value = p.phone || '';
  document.getElementById('fScale').value = p.scale || '';
  document.getElementById('fStaff').value = p.staff || '';

  // Set status chip
  if (isPointEntry(p)) {
    setStatusChip(lastInstitutionStatus || '已交流');
  } else {
    setStatusChip(p.status || '已交流');
  }

  editVisits = JSON.parse(JSON.stringify(p.visits || []));
  renderVisits();

  document.getElementById('btnDelete').style.display = '';
  openSheet();
}

function openSheet() {
  document.getElementById('sheetOverlay').classList.add('active');
  document.getElementById('sheet').classList.add('active');
}

function closeSheet() {
  document.getElementById('sheetOverlay').classList.remove('active');
  document.getElementById('sheet').classList.remove('active');
}

function startSheetPickLocation() {
  sheetPickMode = true;
  closeSheet();
  const lat = parseFloat(document.getElementById('editLat').value);
  const lng = parseFloat(document.getElementById('editLng').value);
  if (!isNaN(lat) && !isNaN(lng)) map.setView([lat,lng], Math.max(map.getZoom(), 17));
  document.getElementById('pickLocationBar').classList.add('active');
  toast('拖动地图后点击目标位置');
}
function cancelSheetPickLocation() {
  sheetPickMode = false;
  document.getElementById('pickLocationBar').classList.remove('active');
  openSheet();
}
function pointToCoverageTarget(p) {
  return {
    id: p.id,
    name: p.name,
    area: inferArea(p),
    developer: p.type || '点位',
    coopStatus: p.status || '点位',
    traffic: '', trafficNote: '', note: p.address || '',
    lat: p.lat, lng: p.lng,
    isPointCoverage: true
  };
}
function clearComboModeSilent() {
  comboSelectedIds.clear();
  lastComboAnalysis = null;
  activeComboResultTab = null;
  if (comboResultLayer) comboResultLayer.clearLayers();
  const bar = document.getElementById('mapComboBar');
  if (bar) bar.classList.remove('active');
}
function clearSingleCoverageSilent() {
  selectedMallId = null;
  const panel = document.getElementById('coveragePanel');
  if (panel && !panel.classList.contains('combo-mode')) closeCoveragePanel();
}
function selectPointCoverage(id) {
  closeDashboard();
  const p = places.find(x => x.id === id);
  if (!p || !isPointEntry(p)) return;
  clearComboModeSilent();
  selectedMallId = id;
  map.setView([p.lat,p.lng],15);
  renderMalls(); renderMarkers(); renderMallList(); updateCoverageUi(); openCoveragePanel();
  const hits = getMallClinics(pointToCoverageTarget(p), singleCoverageKm).length;
  toast(`📍 ${p.name}：${singleCoverageKm}公里内 ${hits} 家诊所/机构`);
}
function getCoverageTargetById(id) {
  const mall = malls.find(m => m.id === id);
  if (mall) return mall;
  const point = places.find(p => p.id === id && isPointEntry(p));
  return point ? pointToCoverageTarget(point) : null;
}
function resetForm() {
  document.getElementById('editId').value = '';
  editBaseRevision = null;
  document.getElementById('fName').value = '';
  document.getElementById('fType').value = '中医诊所';
  document.getElementById('fPrimaryCategory').value = '';
  handlePrimaryCategoryChange();
  if (document.getElementById('entryKind')) setEntryKind('institution');
  document.getElementById('fAddr').value = '';
  document.getElementById('fContact').value = '';
  document.getElementById('fPhone').value = '';
  document.getElementById('fScale').value = '';
  document.getElementById('fStaff').value = '';
  setStatusChip('已交流');
  document.getElementById('newVisitNote').value = '';
}

// ============ VISIT LOG ============
function renderVisits() {
  const container = document.getElementById('visitLog');
  if (editVisits.length === 0) {
    container.innerHTML = '<div style="font-size:13px;color:var(--text2);padding:4px 0">暂无记录</div>';
    return;
  }
  container.innerHTML = editVisits.map((v, i) => `
    <div class="visit-entry">
      <div class="visit-date">${esc(v.date)}${v.by ? ' · ' + esc(v.by) : ''}</div>
      <div class="visit-note">${esc(v.note)}</div>
      <button class="visit-del" onclick="removeVisit(${i})">×</button>
    </div>
  `).join('');
}

function addVisitEntry() {
  const noteInput = document.getElementById('newVisitNote');
  const note = noteInput.value.trim();
  if (!note) { toast('请输入交流备注'); return; }
  const now = new Date();
  const date = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  editVisits.push({ date, note, by: currentUsername || '匿名', byAvatar: currentAvatar });
  noteInput.value = '';
  renderVisits();
}

function removeVisit(idx) {
  editVisits.splice(idx, 1);
  renderVisits();
}

// ============ SAVE / DELETE ============
async function savePlace() {
  const btn = document.getElementById('btnSavePlace');
  const fb = document.getElementById('saveFeedback');
  function feedback(type, msg) {
    if (!fb) return;
    fb.className = 'save-feedback show ' + type;
    fb.textContent = msg;
  }
  const name = document.getElementById('fName').value.trim();
  const entryKind = document.getElementById('entryKind').value || 'institution';
  if (!name) { feedback('err', entryKind === 'point' ? '请输入点位名称' : '请输入机构名称'); toast(entryKind === 'point' ? '请输入点位名称' : '请输入机构名称'); return; }
  const lat = parseFloat(document.getElementById('editLat').value);
  const lng = parseFloat(document.getElementById('editLng').value);
  if (isNaN(lat) || isNaN(lng)) { feedback('err','请先在地图上点选位置'); toast('请先在地图上点选位置'); return; }
  const activeChip = document.querySelector('.status-chip.active');
  const selectedInstitutionStatus = activeChip ? activeChip.dataset.status : (lastInstitutionStatus || '已交流');
  if (entryKind === 'institution') lastInstitutionStatus = selectedInstitutionStatus;
  const status = entryKind === 'point' ? '点位' : selectedInstitutionStatus;
  const editId = document.getElementById('editId').value;
  const oldPlace = editId ? places.find(p => p.id === editId) : null;
  let selectedType = document.getElementById('fType').value;
  if (selectedType === '__custom__') {
    selectedType = await addCustomType('');
    if (!selectedType) { feedback('err','请选择或新增机构类型'); toast('请选择或新增机构类型'); return; }
    document.getElementById('fType').value = selectedType;
  }
  const data = {
    id: editId || genId(),
    name,
    entryKind,
    lastInstitutionStatus: entryKind === 'point' ? (lastInstitutionStatus || selectedInstitutionStatus || '已交流') : selectedInstitutionStatus,
    type: selectedType,
    primaryCategory: entryKind === 'institution' ? (document.getElementById('fPrimaryCategory').value || '') : '',
    secondaryCategory: entryKind === 'institution' ? (document.getElementById('fSecondaryCategory').value || '') : '',
    address: document.getElementById('fAddr').value.trim(),
    contact: document.getElementById('fContact').value.trim(),
    phone: document.getElementById('fPhone').value.trim(),
    scale: document.getElementById('fScale').value,
    staff: document.getElementById('fStaff').value,
    status,
    lat, lng,
    visits: editVisits,
    ownerId: oldPlace ? (oldPlace.ownerId || getCurrentOwnerId()) : getCurrentOwnerId(),
    ownerName: oldPlace ? (oldPlace.ownerName || currentUsername || '匿名') : (currentUsername || '匿名'),
    ownerAvatar: oldPlace ? (oldPlace.ownerAvatar || currentAvatar) : currentAvatar,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUsername || '匿名',
    updatedByName: currentUsername || '匿名',
    updatedByAvatar: currentAvatar
  };
  const existIdx = places.findIndex(p => p.id === data.id);
  if (existIdx >= 0) {
    data.createdAt = places[existIdx].createdAt || new Date().toISOString();
    data.createdBy = places[existIdx].createdBy || currentUsername || '匿名';
    data.createdByAvatar = places[existIdx].createdByAvatar || currentAvatar || '👤';
  } else {
    data.createdAt = new Date().toISOString();
    data.createdBy = currentUsername || '匿名';
    data.createdByAvatar = currentAvatar;
  }
  try {
    if (btn) { btn.classList.add('loading'); btn.disabled = true; btn.textContent = '保存中...'; }
    feedback('info','正在保存到云端，请稍候...');
    const savedData = await saveToFirestore(data, editId ? editBaseRevision : null);
    const savedIdx = places.findIndex(p => p.id === savedData.id);
    if (savedIdx >= 0) places[savedIdx] = savedData; else places.push(savedData);
    editBaseRevision = savedData.revision;
    savePlaces();
    renderMarkers(); scheduleLeadHomeRender(); updateStats();
    feedback('ok', existIdx >= 0 ? '✅ 已更新并同步到云端' : '✅ 已添加并同步到云端');
    toast(existIdx >= 0 ? '✅ 已更新并同步' : '✅ 已添加并同步');
    map.setView([lat, lng], map.getZoom());
    setTimeout(() => closeSheet(), 450);
  } catch(err) {
    console.error(err);
    if (err && err.code === 'revision-conflict' && editId) {
      try {
        const latest = await placesCollection.doc(editId).get();
        if (latest.exists) {
          const latestData = { id: latest.id, ...latest.data() };
          const latestIdx = places.findIndex(p => p.id === editId);
          if (latestData.deletedAt) {
            if (latestIdx >= 0) places.splice(latestIdx, 1);
            const deletedIdx = deletedPlaces.findIndex(p => p.id === editId);
            if (deletedIdx >= 0) deletedPlaces[deletedIdx] = latestData; else deletedPlaces.push(latestData);
          } else if (latestIdx >= 0) places[latestIdx] = latestData;
          else places.push(latestData);
        }
      } catch (refreshErr) {
        console.warn('冲突后刷新最新记录失败:', refreshErr);
      }
    }
    clearCoverageCache(); savePlaces(); renderMarkers(); scheduleLeadHomeRender(); updateStats();
    feedback('err','❌ 云端保存失败：' + (err && err.message ? err.message : '请检查网络/权限'));
    document.getElementById('syncStatus').textContent = '⚠️ 同步失败';
    toast(err && err.code === 'revision-conflict' ? '⚠️ 记录已更新，请重新打开编辑' : '❌ 保存失败，未改动本地资料');
  } finally {
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; btn.textContent = '保存'; }
  }
}

function getDataSafety() {
  if (!window.BDMapDataSafety) throw new Error('安全删除模块尚未载入，请刷新后重试');
  return window.BDMapDataSafety;
}
function getDeleteActor() {
  const name = (currentUsername || '匿名').trim() || '匿名';
  return { id: normalizeOwnerId(name) || name, name };
}
function downloadDeletionBackup(records, operation) {
  const payload = getDataSafety().createBackupPayload(records, { actor: getDeleteActor(), operation: operation || 'soft-delete' });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bdmap-delete-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}
async function writeAuditLog(action, record, reason) {
  try {
    await auditLogsCollection.add({ action, recordId: record.id, recordName: record.name || '', actor: getDeleteActor(), at: new Date().toISOString(), reason: reason || '' });
  } catch (err) {
    console.warn('Audit log failed without blocking primary operation:', err);
  }
}
async function persistSoftDelete(record, reason, action = 'soft-delete') {
  return runRevisionedMutation(record.id, Number(record.revision) || 0, current => {
    if (!current) throw new Error('云端记录不存在，已阻止删除');
    if (current.deletedAt) throw new Error('记录已在回收站');
    return getDataSafety().softDeleteRecord(current, { actor: getDeleteActor(), reason });
  }, { action, reason });
}
async function deletePlace() {
  const id = document.getElementById('editId').value;
  if (!id) return;
  const record = places.find(p => p.id === id);
  if (!record) return toast('找不到这个机构');
  const reason = prompt('请输入删除原因（记录会进入回收站，可恢复）:', '资料清理');
  if (reason === null) return;
  if (!confirm(`确定将「${record.name || id}」移入回收站？删除前会下载JSON备份。`)) return;
  try {
    downloadDeletionBackup([record], 'single-soft-delete');
  } catch (err) {
    console.error(err); toast('❌ 备份下载失败，已阻止删除'); return;
  }
  document.getElementById('syncStatus').textContent = '🗑 正在移入回收站...';
  try {
    const deleted = await persistSoftDelete(record, reason.trim() || '用户删除');
    places = places.filter(p => p.id !== id);
    deletedPlaces.push(deleted);
    clearCoverageCache(); savePlaces(); renderMarkers(); scheduleLeadHomeRender(); updateStats(); updateRecycleBinCount();
    closeSheet();
    document.getElementById('syncStatus').textContent = '✅ 已移入回收站';
    toast('♻️ 已移入回收站并同步');
  } catch (err) {
    console.error(err);
    document.getElementById('syncStatus').textContent = '⚠️ 删除失败';
    toast('❌ 云端删除失败，原记录已保留');
  }
}

// ============ LIST ============
function openList() {
  openResourceCenter();
}
function openResourceCenter(kind) {
  closePrimaryPanels();
  document.body.classList.remove('home-mode');
  setAppTab('resources');
  const targetKind = kind || resourceKind || 'institution';
  setResourceTab(targetKind);
  if (targetKind !== 'mall') document.getElementById('listPanel').classList.add('active');
}
function setResourceTab(kind) {
  resourceKind = ['institution','point','mall'].includes(kind) ? kind : 'institution';
  document.querySelectorAll('#resourceTabs [data-resource-kind]').forEach(button => button.classList.toggle('active', button.dataset.resourceKind === resourceKind));
  if (resourceKind === 'mall') {
    setAppTab('resources');
    document.getElementById('listPanel').classList.remove('active');
    openMallPanel('resources');
    return;
  }
  hideMallPanel();
  document.getElementById('listPanel').classList.add('active');
  renderList();
}
function getResourceRows() {
  const rows = getFilteredPlaces();
  return rows.filter(place => resourceKind === 'point' ? isPointEntry(place) : !isPointEntry(place));
}
function closeList() {
  document.getElementById('listPanel').classList.remove('active');
}
function updateRecycleBinCount() {
  const count = deletedPlaces.length;
  const badge = document.getElementById('recycleBinCount');
  const header = document.getElementById('recycleBinHeaderCount');
  if (badge) badge.textContent = String(count);
  if (header) header.textContent = count + ' 条';
}
function openRecycleBin() {
  renderRecycleBin();
  document.getElementById('recycleBinPanel').classList.add('active');
}
function closeRecycleBin() {
  document.getElementById('recycleBinPanel').classList.remove('active');
}
function renderRecycleBin() {
  updateRecycleBinCount();
  const body = document.getElementById('recycleBinBody');
  if (!body) return;
  const rows = [...deletedPlaces].sort((a,b) => String(b.deletedAt || '').localeCompare(String(a.deletedAt || '')));
  if (!rows.length) {
    body.innerHTML = '<div class="list-empty">回收站为空</div>';
    return;
  }
  body.innerHTML = rows.map(p => `<div class="recycle-item">
    <div class="recycle-item-info">
      <div class="recycle-item-name">${esc(p.name || p.id)}</div>
      <div class="recycle-item-meta">删除时间：${esc(p.deletedAt || '未知')}<br>操作人：${esc(p.deletedByName || p.deletedBy || '未知')}<br>原因：${esc(p.deleteReason || '未填写')}</div>
    </div>
    <button class="recycle-restore" onclick="restoreDeletedPlace('${jsStr(p.id)}')">恢复</button>
  </div>`).join('');
}
async function restoreDeletedPlace(id) {
  const record = deletedPlaces.find(p => p.id === id);
  if (!record) return toast('找不到回收站记录');
  if (!confirm(`确定恢复「${record.name || id}」？`)) return;
  document.getElementById('syncStatus').textContent = '♻️ 正在恢复...';
  try {
    const restored = await runRevisionedMutation(id, Number(record.revision) || 0, current => {
      if (!current || !current.deletedAt) throw new Error('云端记录不在回收站，已阻止恢复');
      return getDataSafety().restoreRecord(current, { actor: getDeleteActor() });
    }, { action:'restore', reason:'从回收站恢复', deleteFields:['deletedAt','deletedBy','deletedByName','deleteReason'] });
    deletedPlaces = deletedPlaces.filter(p => p.id !== id);
    const idx = places.findIndex(p => p.id === id);
    if (idx >= 0) places[idx] = restored; else places.push(restored);
    clearCoverageCache(); savePlaces(); renderOwnerFilters(); renderMarkers(); renderList(); scheduleLeadHomeRender(); updateStats(); renderRecycleBin();
    document.getElementById('syncStatus').textContent = '✅ 已恢复并同步';
    toast('✅ 已从回收站恢复');
  } catch (err) {
    console.error(err);
    document.getElementById('syncStatus').textContent = '⚠️ 恢复失败';
    toast('❌ 云端恢复失败，回收站记录仍保留');
  }
}

function renderList() {
  const body = document.getElementById('listBody');
  let filtered = getResourceRows();
  const selectedMallForSort = getCoverageTargetById(selectedMallId);
  if (selectedMallForSort) {
    filtered.sort((a,b) => distanceKm(selectedMallForSort.lat, selectedMallForSort.lng, a.lat, a.lng) - distanceKm(selectedMallForSort.lat, selectedMallForSort.lng, b.lat, b.lng));
  } else {
    filtered.sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''));
  }

  if (filtered.length === 0) {
    const emptyText = resourceKind === 'point' ? '没有符合当前筛选的点位' : '没有符合当前筛选的机构';
    body.innerHTML = `<div class="list-empty">${emptyText}</div>`;
    return;
  }

  body.innerHTML = filtered.map(p => {
    const displayStatus = p.status || (isPointEntry(p) ? '点位' : '未接触');
    const color = STATUS_COLORS[displayStatus] || '#7f8c8d';
    const visitCount = (p.visits||[]).length;
    const ownerLabel = getOwnerLabel(p);
    const ownerBadgeHtml = ownerLabelHtml(p);
    const pr = calcPriority(p);
    return `
      <div class="list-item" onclick="goToPlace('${jsStr(p.id)}')">
        ${bulkMode ? `<input class="list-check" type="checkbox" ${selectedPlaceIds.has(p.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelectPlace('${jsStr(p.id)}', this.checked)">` : ''}
        <div class="list-dot" style="background:${color}"></div>
        <div class="list-info">
          <div class="list-name"><span>${esc(p.name)}</span><span class="priority-badge ${pr.level}">${pr.score} ${priorityLabel(pr.level)}</span><span class="owner-badge">${ownerBadgeHtml}</span></div>
          <div class="list-addr">${esc(p.address || p.type || '')}</div>
          <div class="list-meta">
            ${ownerBadgeHtml}${p.type ? ' · ' + esc(p.type) : ''} · ${visitCount}次${isPointEntry(p) ? '记录' : '交流'}
            ${p.contact ? ' · ' + esc(p.contact) : ''}
          </div>
        </div>
        <span class="list-status" style="background:${color};color:#fff">${esc(displayStatus)}</span>
      </div>`;
  }).join('');
}

function goToPlace(id) {
  closeDashboard();
  const p = places.find(x => x.id === id) || baseClinics.find(x => x.id === id);
  if (!p) { toast('找不到这个点位'); return; }
  closeList();
  const lat = Number(p.lat), lng = Number(p.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    toast('该机构已进入线索池，坐标待补充，暂不能地图定位');
    return;
  }
  map.setView([lat, lng], 18);
  let opened = false;
  markersLayer.eachLayer(layer => {
    const ll = layer.getLatLng();
    if (Math.abs(ll.lat - p.lat) < 0.000001 && Math.abs(ll.lng - p.lng) < 0.000001) {
      layer.openPopup(); opened = true;
    }
  });
  if (!opened) {
    const pr = calcPriority(p);
    L.popup({ maxWidth: 280 })
      .setLatLng([p.lat, p.lng])
      .setContent(`<div class="popup-name">${esc(p.name)}</div><div class="popup-type">${esc(p.type || '')}</div>${scoreBadgeWithDetailHtml(p.id, pr)}<div class="popup-detail">${esc(p.address || '')}</div>${p.isBaseClinic ? `<span class="popup-edit" onclick="promoteBaseClinic('${jsStr(p.id)}')">➕ 加入机构并跟进</span>` : ''}`)
      .openOn(map);
  }
}


// ============ BULK DELETE ============
function toggleBulkMode() {
  bulkMode = !bulkMode;
  if (!bulkMode) selectedPlaceIds.clear();
  renderList();
  toast(bulkMode ? '☑️ 批量选择已开启' : '已退出批量选择');
}
function toggleSelectPlace(id, checked) {
  if (checked) selectedPlaceIds.add(id); else selectedPlaceIds.delete(id);
}
function selectAllVisible() {
  getResourceRows().forEach(p => selectedPlaceIds.add(p.id));
  bulkMode = true; renderList(); toast('已选择当前筛选结果');
}
function clearSelection() { selectedPlaceIds.clear(); renderList(); toast('已取消选择'); }
async function deleteSelectedPlaces() {
  const ids = Array.from(selectedPlaceIds);
  if (!ids.length) { toast('还没选择机构'); return; }
  await bulkDeleteIds(ids);
}
async function deleteCurrentFilteredPlaces() {
  const ids = getResourceRows().map(p => p.id);
  if (!ids.length) { toast('当前筛选没有机构'); return; }
  await bulkDeleteIds(ids);
}
async function bulkDeleteIds(ids, options = {}) {
  const records = ids.map(id => places.find(p => p.id === id)).filter(Boolean);
  if (!records.length) return toast('找不到待删除记录');
  if (!options.confirmed) {
    const confirmation = prompt(`高风险操作：将 ${records.length} 条记录移入回收站。\n请输入「移入回收站 ${records.length}」继续：`);
    if (confirmation !== `移入回收站 ${records.length}`) return toast('已取消批量删除');
  }
  const reason = options.reason || prompt('请输入本次批量删除原因:', '批量资料清理');
  if (reason === null) return;
  try {
    downloadDeletionBackup(records, 'bulk-soft-delete');
  } catch (err) {
    console.error(err); toast('❌ 备份下载失败，已阻止批量删除'); return;
  }
  document.getElementById('syncStatus').textContent = `🗑 正在处理 0/${records.length}`;
  const result = await getDataSafety().runBulkSoftDelete(records, {
    actor: getDeleteActor(), reason: reason.trim() || '批量删除',
    persist: async (deleted, original) => {
      const persisted = await persistSoftDelete(original, reason, 'bulk-soft-delete');
      document.getElementById('syncStatus').textContent = `🗑 正在处理 ${deletedPlaces.length + 1}/${records.length}`;
      return persisted;
    }
  });
  const succeededIds = new Set(result.succeeded.map(p => p.id));
  places = places.filter(p => !succeededIds.has(p.id));
  deletedPlaces.push(...result.succeeded);
  result.succeeded.forEach(p => selectedPlaceIds.delete(p.id));
  clearCoverageCache(); savePlaces(); renderOwnerFilters(); renderMarkers(); renderList(); scheduleLeadHomeRender(); updateStats(); updateRecycleBinCount();
  const failedText = result.failed.slice(0,10).map(x => `${x.record.name || x.record.id}: ${x.error.message}`).join('\n');
  document.getElementById('syncStatus').textContent = result.failureCount ? '⚠️ 批量操作部分失败' : '✅ 已移入回收站';
  alert(`批量操作完成\n成功：${result.successCount}\n失败：${result.failureCount}${failedText ? '\n\n失败项：\n' + failedText : ''}`);
}

function initCoveragePanelDrag() {
  const handle = document.getElementById('coverageHandle');
  if (!handle || handle.dataset.bound === '1') return;
  handle.dataset.bound = '1';
  let startY = 0;
  let tracking = false;
  const start = e => {
    tracking = true;
    startY = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) || 0;
  };
  const end = e => {
    if (!tracking) return;
    tracking = false;
    const endY = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : e.clientY) || startY;
    const dy = endY - startY;
    if (dy < -35) setCoveragePanelExpanded(true);
    else if (dy > 35) setCoveragePanelExpanded(false);
  };
  handle.addEventListener('touchstart', start, { passive:true });
  handle.addEventListener('touchend', end, { passive:true });
  handle.addEventListener('mousedown', start);
  window.addEventListener('mouseup', end);
}


// ============ LEAD HOME ============
function setAppTab(tab) { document.querySelectorAll('#appNav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); }
function closePrimaryPanels() {
  ['listPanel','mallPanel','dashboardPanel','comboPanel','settingsPanel','recycleBinPanel'].forEach(id => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove('active');
  });
  const coverage = document.getElementById('coveragePanel');
  if (coverage) { coverage.classList.remove('active'); coverage.classList.remove('combo-mode'); }
  const search = document.getElementById('searchPanel');
  if (search) search.classList.remove('active');
  clearSearchMarkers();
}
function showLeadHome() {
  closePrimaryPanels();
  setAppTab('leads');
  document.body.classList.add('home-mode');
  renderLeadHomeList();
  if (navigator.geolocation && !window._leadHomeLocatedOnce) { window._leadHomeLocatedOnce = true; locateMe(true); }
}
function showMapHome() {
  closePrimaryPanels();
  setAppTab('map');
  document.body.classList.remove('home-mode');
  setTimeout(() => { if (map) map.invalidateSize(); }, 80);
}
function openDashboardFromHome() {
  openDashboardFromMy();
}
function openDashboardFromMy() {
  closePrimaryPanels();
  setAppTab('my');
  document.body.classList.remove('home-mode');
  setTimeout(() => openDashboard(), 90);
}
function openMyFromNav() {
  closePrimaryPanels();
  setAppTab('my');
  document.body.classList.remove('home-mode');
  openSettings();
}
function setLeadFilter(f) {
  leadFilter = f || 'all';
  document.querySelectorAll('.lead-filter-chip').forEach(b => b.classList.toggle('active', b.dataset.filter === leadFilter));
  renderLeadHomeList();
}
const LEAD_CATEGORY_TAXONOMY = {
  '医疗': ['中医诊所','体检中心','康复护理','口腔诊所','眼科中心','皮肤医美','辅助生殖','综合诊所'],
  '推拿按摩': ['正骨推拿','按摩足疗','SPA水疗','泰式按摩','拔罐刮痧','艾灸馆'],
  '健康养生': ['瑜伽馆','健身房','心理咨询','营养健康'],
  '餐饮': ['养生茶饮','轻食','药膳'],
  '美容美体': ['美体美容','美甲','美睫','半永久'],
  '待分类': ['待分类']
};
function getLeadCategory(row) {
  const raw = String(row.secondaryCategory || row.type || '').trim();
  const parts = raw.split(/[\/／]/).map(x => x.trim()).filter(Boolean);
  let primary = String(row.primaryCategory || (parts.length > 1 ? parts[0] : '')).trim();
  let secondary = String(row.secondaryCategory || (parts.length > 1 ? parts[parts.length - 1] : raw)).trim();
  if (LEAD_CATEGORY_TAXONOMY[primary] && LEAD_CATEGORY_TAXONOMY[primary].includes(secondary)) return { primary, secondary };
  const explicitPrimary = Object.keys(LEAD_CATEGORY_TAXONOMY).find(k => LEAD_CATEGORY_TAXONOMY[k].includes(secondary));
  if (explicitPrimary) return { primary:explicitPrimary, secondary };
  const text = [row.name,row.nameZH,row.nameEN,row.type,row.primaryCategory,row.secondaryCategory,row.tags,row.note].filter(Boolean).join(' ');
  const rules = [
    ['推拿按摩','泰式按摩',/泰式.*按摩|thai\s*massage/i],
    ['推拿按摩','SPA水疗',/\bspa\b|水療|水疗/i],
    ['推拿按摩','拔罐刮痧',/拔罐|刮痧/i],
    ['推拿按摩','艾灸馆',/艾灸/i],
    ['推拿按摩','正骨推拿',/正骨|推拿/i],
    ['推拿按摩','按摩足疗',/按摩|足療|足疗|massage/i],
    ['医疗','康复护理',/物理治療|物理治疗|康復|康复|復康|复康|痛症|護理|护理/i],
    ['医疗','口腔诊所',/牙科|齒科|齿科|口腔|dent(?:al|ist)/i],
    ['医疗','眼科中心',/眼科|視光|视光|optical|ophthalm/i],
    ['医疗','体检中心',/體檢|体检|身體檢查|身体检查|檢查中心|检查中心|health\s*check/i],
    ['医疗','皮肤医美',/皮膚|皮肤|醫美|医美|整形|derma/i],
    ['医疗','辅助生殖',/生殖|試管|试管|不孕|fertility|ivf/i],
    ['医疗','中医诊所',/中醫|中医|註冊中醫|注册中医|finddoc中醫師|ehealth醫護機構/i],
    ['医疗','综合诊所',/診所|诊所|醫務|医务|medical|clinic/i],
    ['健康养生','瑜伽馆',/瑜伽|yoga/i],
    ['健康养生','健身房',/健身|fitness|\bgym\b/i],
    ['健康养生','心理咨询',/心理|輔導|辅导|counsell|psycholog/i],
    ['健康养生','营养健康',/營養|营养|健康管理|養生|养生|wellness/i],
    ['美容美体','美甲',/美甲|nail/i],
    ['美容美体','美睫',/美睫|睫毛|lash/i],
    ['美容美体','半永久',/半永久|紋繡|纹绣|microblad/i],
    ['美容美体','美体美容',/美容|美體|美体|纖體|纤体|beauty|slimming/i],
    ['餐饮','养生茶饮',/養生茶|养生茶|茶飲|茶饮/i],
    ['餐饮','轻食',/輕食|轻食|沙律|沙拉/i],
    ['餐饮','药膳',/藥膳|药膳/i]
  ];
  const matched = rules.find(rule => rule[2].test(text));
  return matched ? { primary:matched[0], secondary:matched[1] } : { primary:'待分类', secondary:'待分类' };
}
function setLeadCategory(category) {
  leadCategory = LEAD_CATEGORY_TAXONOMY[category] ? category : '全部';
  leadSecondaryCategory = '全部';
  document.querySelectorAll('.lead-filter-chip[data-category]').forEach(b => b.classList.toggle('active', b.dataset.category === leadCategory));
  renderLeadSecondaryFilters();
  renderLeadHomeList();
}
function renderLeadSecondaryFilters() {
  const section = document.getElementById('leadSecondarySection');
  const row = document.getElementById('leadSecondaryRow');
  if (!section || !row) return;
  const categories = LEAD_CATEGORY_TAXONOMY[leadCategory] || [];
  section.classList.toggle('active', categories.length > 0);
  row.innerHTML = categories.length ? ['全部', ...categories].map(category => `<button class="lead-filter-chip${category === leadSecondaryCategory ? ' active' : ''}" data-secondary-category="${escAttr(category)}" onclick="setLeadSecondaryCategory('${jsStr(category)}')">${category === '全部' ? '全部二级' : esc(category)}</button>`).join('') : '';
}
function setLeadSecondaryCategory(category) {
  leadSecondaryCategory = (LEAD_CATEGORY_TAXONOMY[leadCategory] || []).includes(category) ? category : '全部';
  document.querySelectorAll('.lead-filter-chip[data-secondary-category]').forEach(b => b.classList.toggle('active', b.dataset.secondaryCategory === leadSecondaryCategory));
  renderLeadHomeList();
}
let leadRowsCache = null;
let leadRowsCacheKey = '';
function clearLeadRowsCache() { leadRowsCache = null; leadRowsCacheKey = ''; }
function leadRowsDataKey() { return [places.length, baseClinics.length, coverageCacheVersion, currentUsername, currentAvatar].join('|'); }
function enrichLeadRow(row) {
  const ownerId = getOwnerId(row);
  const category = getLeadCategory(row);
  const errorLabel = getLeadErrorLabel(row);
  const dist = getLeadDistanceKm(row);
  return {
    ...row,
    _leadOwnerId: ownerId,
    _leadClaimed: !isUnclaimedOwnerId(ownerId),
    _leadMine: !isUnclaimedOwnerId(ownerId) && ownerId === getCurrentOwnerId(),
    _leadPrimaryCategory: category.primary,
    _leadSecondaryCategory: category.secondary,
    _leadError: hasLeadError(row),
    _leadErrorLabel: errorLabel,
    _leadDistanceKm: dist,
    _leadWarm: getCoverageSortRank(row) < 3,
    _leadHaystack: [row.name,row.address,row.type,row.contact,row.phone,category.primary,category.secondary,getOwnerLabel(row)].join(' ').toLowerCase()
  };
}
function getLeadRows(force) {
  const cacheKey = leadRowsDataKey();
  if (!force && leadRowsCache && leadRowsCacheKey === cacheKey) return leadRowsCache;
  const byKey = new Map();
  function upsertLeadRow(raw) {
    // 线索池要覆盖所有机构类型：美容院、养生馆、药房、自定义类型等都要能搜索/认领。
    // 只排除点位/商场这类空间资源；官方基础池仍按 baseClinics 单独进入。
    if (!raw || !isInstitutionEntry(raw)) return;
    const row = { ...raw };
    const keys = [...clinicIdentityKeys(row)];
    const existingKey = keys.find(k => byKey.has(k));
    if (existingKey) {
      const preferred = preferCoverageRecord(byKey.get(existingKey), row);
      keys.forEach(k => byKey.set(k, preferred));
    } else keys.forEach(k => byKey.set(k, row));
  }
  places.forEach(upsertLeadRow);
  baseClinics.forEach(b => upsertLeadRow(mergeBaseClinicOwner(b)));
  const out = [], seen = new Set();
  byKey.forEach(row => {
    const key = clinicMatchKey(row) || row.id;
    if (seen.has(key)) return;
    seen.add(key); out.push(enrichLeadRow(row));
  });
  leadRowsCache = out;
  leadRowsCacheKey = cacheKey;
  return out;
}
function hasLeadError(p) {
  const status = String(p.dataQualityStatus || '').trim();
  const issue = String(p.dataQualityIssueType || '').trim();
  return !!(status || issue);
}
function getLeadErrorLabel(p) {
  return p.dataQualityIssueType || p.dataQualityStatus || '待核实';
}
function passLeadFilter(p) {
  if (leadFilter === 'unclaimed') return !p._leadClaimed;
  if (leadFilter === 'claimed') return p._leadClaimed;
  if (leadFilter === 'mine') return p._leadMine;
  if (leadFilter === 'phone') return !!p.phone;
  if (leadFilter === 'error') return p._leadError;
  return true;
}
function getLeadDistanceKm(p) {
  if (!p || !p.lat || !p.lng || !currentPos || !currentPos.lat || !currentPos.lng) return Infinity;
  return distanceKm(currentPos.lat, currentPos.lng, p.lat, p.lng);
}
function sortLeadRows(rows) {
  return rows.sort((a,b) => {
    const da = a._leadDistanceKm, db = b._leadDistanceKm;
    const aNear = Number.isFinite(da), bNear = Number.isFinite(db);
    if (aNear !== bNear) return bNear - aNear;
    if (aNear && bNear && Math.abs(da - db) > 0.05) return da - db;
    if (a._leadMine !== b._leadMine) return b._leadMine - a._leadMine;
    if (a._leadError !== b._leadError) return a._leadError - b._leadError;
    if (a._leadWarm !== b._leadWarm) return b._leadWarm - a._leadWarm;
    const phoneA = !!a.phone, phoneB = !!b.phone;
    if (phoneA !== phoneB) return phoneB - phoneA;
    return String(a.name||'').localeCompare(String(b.name||''));
  });
}
function scheduleLeadHomeRender() {
  clearLeadRowsCache();
  if (window._leadRenderTimer) clearTimeout(window._leadRenderTimer);
  window._leadRenderTimer = setTimeout(renderLeadHomeList, 40);
}
function renderLeadHomeList() {
  const body = document.getElementById('leadListBody');
  const summary = document.getElementById('leadHomeSummary');
  if (!body || !summary) return;
  const allRows = getLeadRows();
  let rows = allRows;
  const total = rows.length;
  if (leadSearchTerm) rows = rows.filter(p => p._leadHaystack.includes(leadSearchTerm));
  if (leadCategory !== '全部') rows = rows.filter(p => p._leadPrimaryCategory === leadCategory);
  if (leadSecondaryCategory !== '全部') rows = rows.filter(p => p._leadSecondaryCategory === leadSecondaryCategory);
  rows = sortLeadRows(rows.filter(passLeadFilter));
  const claimed = allRows.filter(p => p._leadClaimed).length;
  const errorCount = allRows.filter(p => p._leadError).length;
  const phone = allRows.filter(p => p.phone).length;
  const exportRow = document.getElementById('leadErrorExportRow');
  if (exportRow) exportRow.classList.toggle('active', leadFilter === 'error');
  const mineExportRow = document.getElementById('leadMineExportRow');
  if (mineExportRow) mineExportRow.classList.toggle('active', leadFilter === 'mine');
  const filterNames = { all:'全部', unclaimed:'未认领', claimed:'已认领', mine:'我的认领', error:'报错', phone:'有联系方式' };
  summary.textContent = `当前 ${rows.length} 条 · 已认领 ${claimed} · 有联系方式 ${phone}`;
  body.innerHTML = rows.length ? rows.slice(0,180).map(leadCardHtml).join('') : '<div class="lead-empty">没有符合条件的线索</div>';
}
async function exportLeadErrorRowsXlsx() {
  const rows = getLeadRows().filter(p => p._leadError).map(p => clinicExportRow(p, { coverage_mode:'lead_error_review' }));
  if (!rows.length) { toast('当前没有报错线索'); return; }
  await downloadXlsx('BDmap_报错线索核实表.xlsx', CLINIC_EXPORT_HEADERS, rows, { sheetName:'报错线索核实', errorValidation:true });
  toast('已导出报错线索核实表');
}

async function exportMyClaimedLeadsXlsx() {
  const rows = getLeadRows(true)
    .filter(p => p._leadMine)
    .map(p => clinicExportRow(p, { coverage_mode:'my_claimed' }));
  if (!rows.length) { toast('我的认领里暂无可导出线索'); return; }
  await downloadXlsx('BDmap_我的认领线索.xlsx', CLINIC_EXPORT_HEADERS, rows, { sheetName:'我的认领', errorValidation:true });
  toast('已导出我的认领 ' + rows.length + ' 条');
}
const POINT_EXPORT_HEADERS = ['point_id','name','type','address','lat','lng','owner_id','owner_name','status','contact','phone','note','visit_count','last_visit_date','last_visit_note','updated_at','updated_by'];
function pointExportRow(p) {
  const visits = p.visits || [];
  const last = visits.length ? visits[visits.length - 1] : null;
  return {
    point_id: p.id || '',
    name: p.name || '',
    type: p.type || '点位',
    address: p.address || '',
    lat: p.lat || '',
    lng: p.lng || '',
    owner_id: getOwnerId(p) || '',
    owner_name: getOwnerLabel(p) || '',
    status: p.status || '点位',
    contact: p.contact || '',
    phone: p.phone || '',
    note: p.note || '',
    visit_count: visits.length,
    last_visit_date: last ? (last.date || '') : '',
    last_visit_note: last ? (last.note || '') : '',
    updated_at: p.updatedAt || '',
    updated_by: p.updatedByName || p.updatedBy || ''
  };
}
async function exportPointsXlsx() {
  const rows = places.filter(isPointEntry).map(pointExportRow);
  if (!rows.length) { toast('当前没有点位可导出'); return; }
  await downloadXlsx('BDmap_点位清单.xlsx', POINT_EXPORT_HEADERS, rows, { sheetName:'点位清单' });
  toast('已导出点位 ' + rows.length + ' 条');
}
function leadCardHtml(p) {
  const ownerId = p._leadOwnerId || getOwnerId(p);
  const claimed = p._leadClaimed !== undefined ? p._leadClaimed : !isUnclaimedOwnerId(ownerId);
  const mine = p._leadMine !== undefined ? p._leadMine : (!isUnclaimedOwnerId(ownerId) && ownerId === getCurrentOwnerId());
  const category = p._leadPrimaryCategory ? { primary:p._leadPrimaryCategory, secondary:p._leadSecondaryCategory } : getLeadCategory(p);
  const err = p._leadError !== undefined ? p._leadError : hasLeadError(p);
  const owner = claimed ? `<span>${avatarInlineHtml(getOwnerAvatar(p))}${esc(getOwnerLabel(p))}</span>` : '<span>未认领</span>';
  const primaryBtn = mine
    ? `<button class="claim" onclick="editClaimedLead('${jsStr(p.id)}')">编辑详情</button>`
    : claimed
      ? `<button class="claim" onclick="locateLeadOnMap('${jsStr(p.id)}')">查看详情</button>`
      : `<button class="claim" onclick="claimLead('${jsStr(p.id)}')">认领</button>`;
  return `<div class="lead-card ${mine?'claimed-mine':''} ${err?'error':''}" onclick="locateLeadOnMap('${jsStr(p.id)}')">
    <div class="lead-card-top"><div class="lead-card-main">
      <div class="lead-card-name">${esc(p.name || '未命名店铺')}</div>
      <div class="lead-card-type">${esc(category.secondary)} · ${esc(p.district || '地区待核')}</div>
      <div class="lead-card-addr">${esc(p.address || '暂无地址')}</div>
      ${err ? '<div class="lead-error-line">资料待核实</div>' : ''}
    </div><div class="lead-owner-pill ${claimed?'':'unclaimed'}">${owner}</div></div>
    <div class="lead-actions" onclick="event.stopPropagation()">
      ${primaryBtn}
      <button class="map" onclick="locateLeadOnMap('${jsStr(p.id)}')">导航</button>
    </div>
  </div>`;
}
function findLeadRecord(id) { return places.find(x => x.id === id) || baseClinics.find(x => x.id === id) || getLeadRows().find(x => x.id === id); }
function getEditableLeadPlace(id) {
  const p = findLeadRecord(id);
  if (!p) return null;
  return places.find(x => x.id === id || x.id === 'place_' + id || clinicMatchKey(x) === clinicMatchKey(p)) || null;
}
function editClaimedLead(id) {
  const editable = getEditableLeadPlace(id);
  if (!editable) { toast('先认领后才能编辑'); return; }
  showMapHome();
  setTimeout(() => openEditSheet(editable.id), 80);
}
async function claimLead(id) {
  const p = findLeadRecord(id);
  if (!p) return toast('找不到线索');
  const ownerId = getOwnerId(p);
  if (ownerId === getCurrentOwnerId()) { editClaimedLead(id); return; }
  if (!isUnclaimedOwnerId(ownerId) && ownerId !== getCurrentOwnerId()) { toast('已被别人认领'); return; }
  const existing = places.find(x => x.id === id || x.id === 'place_' + id || clinicMatchKey(x) === clinicMatchKey(p));
  const now = new Date().toISOString();
  const recordId = existing ? existing.id : (p.isBaseClinic ? 'place_' + p.id : (p.id || 'place_' + Date.now().toString(36)));
  try {
    const saved = await runRevisionedMutation(recordId, existing ? (Number(existing.revision) || 0) : null, current => {
      const data = current ? { ...current } : { ...p, id:recordId, isBaseClinic:false, sourceBaseId:p.id, createdAt:now };
      const currentOwner = getOwnerId(data);
      if (!isUnclaimedOwnerId(currentOwner) && currentOwner !== getCurrentOwnerId()) throw new Error('已被别人认领');
      data.ownerId = getCurrentOwnerId(); data.ownerName = currentUsername || '匿名'; data.ownerAvatar = currentAvatar;
      data.claimedAt = now; data.claimedBy = currentUsername || '匿名'; data.status = data.status && data.status !== '基础池' ? data.status : '已交流';
      data.updatedAt = now; data.updatedBy = currentUsername || '匿名'; data.updatedByAvatar = currentAvatar;
      return data;
    });
    const idx = places.findIndex(x => x.id === saved.id);
    if (idx >= 0) places[idx] = saved; else places.push(saved);
    clearCoverageCache(); savePlaces(); scheduleLeadHomeRender(); renderMarkers(); updateStats(); toast('👤 已认领');
  } catch(e) { console.error(e); toast('⚠️ 认领失败：' + (e.message || '请刷新重试')); }
}
async function reportLeadError(id) {
  const p = findLeadRecord(id); if (!p) return toast('找不到线索');
  const type = prompt('报错类型：地址错误 / 电话错误 / 重复店铺 / 已停业 / 类型错误 / 其他', '地址错误');
  if (!type) return;
  const note = prompt('补充说明（可空）', '') || '';
  const existing = places.find(x => x.id === id || x.id === 'place_' + id || clinicMatchKey(x) === clinicMatchKey(p));
  const now = new Date().toISOString();
  const recordId = existing ? existing.id : (p.isBaseClinic ? 'place_' + p.id : (p.id || 'place_' + Date.now().toString(36)));
  try {
    const saved = await runRevisionedMutation(recordId, existing ? (Number(existing.revision) || 0) : null, current => {
      const data = current ? { ...current } : { ...p, id:recordId, isBaseClinic:false, sourceBaseId:p.id, createdAt:now };
      data.errorReports = [...(data.errorReports||[]), { type, note, by:currentUsername || '匿名', byAvatar:currentAvatar, at:now }];
      data.dataQualityStatus = '待核实'; data.dataQualityIssueType = type;
      data.updatedAt = now; data.updatedBy = currentUsername || '匿名'; data.updatedByAvatar = currentAvatar;
      return data;
    });
    const idx = places.findIndex(x => x.id === saved.id);
    if (idx >= 0) places[idx] = saved; else places.push(saved);
    clearCoverageCache(); savePlaces(); scheduleLeadHomeRender(); renderMarkers(); updateStats(); toast('⚠️ 已提交报错');
  } catch(e) { console.error(e); toast('⚠️ 报错提交失败：' + (e.message || '请刷新重试')); }
}

async function resolveLeadError(id) {
  const p = findLeadRecord(id); if (!p) return toast('找不到线索');
  const existing = places.find(x => x.id === id || x.id === 'place_' + id || clinicMatchKey(x) === clinicMatchKey(p));
  if (!existing) return toast('这条线索还没有运营记录，无法修正');
  const note = prompt('修正说明（可空）', '已核实/已修正') || '';
  const now = new Date().toISOString();
  try {
    const saved = await runRevisionedMutation(existing.id, Number(existing.revision) || 0, current => {
      if (!current) throw new Error('云端记录不存在');
      const data = { ...current };
      data.resolvedReports = [...(data.resolvedReports||[]), { type:data.dataQualityIssueType || data.dataQualityStatus || '报错', note, by:currentUsername || '匿名', byAvatar:currentAvatar, at:now }];
      data.dataQualityStatus = ''; data.dataQualityIssueType = ''; data.resolvedAt = now; data.resolvedBy = currentUsername || '匿名'; data.resolveNote = note;
      data.updatedAt = now; data.updatedBy = currentUsername || '匿名'; data.updatedByAvatar = currentAvatar;
      return data;
    });
    const idx = places.findIndex(x => x.id === saved.id);
    if (idx >= 0) places[idx] = saved;
    clearCoverageCache(); savePlaces(); scheduleLeadHomeRender(); renderMarkers(); updateStats(); toast('✅ 已标记修正');
  } catch(e) { console.error(e); toast('⚠️ 修正失败：' + (e.message || '请刷新重试')); }
}
function locateLeadOnMap(id) {
  const p = findLeadRecord(id); if (!p || !p.lat || !p.lng) return toast('没有坐标');
  showMapHome();
  setTimeout(() => { map.setView([p.lat,p.lng], 17); goToPlace(p.id); }, 100);
}

// ============ MALL COVERAGE ============
function updateCoverageUi() {
  const reopen = document.getElementById('btnReopenCoverage');
  const panel = document.getElementById('coveragePanel');
  if (reopen) {
    const panelOpen = panel && panel.classList.contains('active');
    reopen.style.display = (selectedMallId && !panelOpen) ? 'block' : 'none';
  }
  updateStats();
}
function exitCoverageMode() {
  selectedMallId = null;
  renderMalls();
  renderMarkers();
  renderMallList();
  updateCoverageUi();
  const panel = document.getElementById('coveragePanel');
  if (panel) panel.classList.remove('active');
  toast(`已退出${singleCoverageKm}km覆盖模式`);
}
function loadMalls() {
  const stored = JSON.parse(localStorage.getItem(MALLS_KEY) || '[]');
  const datasetChanged = localStorage.getItem(MALL_DATA_VERSION_KEY) !== MALL_DATA_VERSION;
  const local = datasetChanged ? stored.filter(m => m.source !== 'builtin' && String(m.id || '').startsWith('mall_custom_')) : stored;
  const localMap = {};
  local.forEach(m => localMap[m.id] = m);
  const builtinIds = new Set(BUILTIN_LINK_MALLS.map(m => m.id));
  const merged = BUILTIN_LINK_MALLS.map(b => {
    const l = localMap[b.id] || {};
    return {
      ...b,
      traffic: l.traffic || b.traffic || '',
      trafficNote: l.trafficNote || b.trafficNote || '',
      coopStatus: l.coopStatus || b.coopStatus || '待评估',
      nextStep: l.nextStep || b.nextStep || '',
      note: l.note || b.note || '',
      userNote: l.userNote || '',
      updatedAt: l.updatedAt || b.updatedAt || '',
      updatedBy: l.updatedBy || b.updatedBy || ''
    };
  });
  local.forEach(m => { if (!builtinIds.has(m.id)) merged.push(m); });
  malls = merged.sort((a,b) => (a.no||9999) - (b.no||9999));
  localStorage.setItem(MALLS_KEY, JSON.stringify(malls));
  localStorage.setItem(MALL_DATA_VERSION_KEY, MALL_DATA_VERSION);
  renderMalls(); renderMallList();
  loadMallMetaFromCloud();
}
async function loadMallMetaFromCloud() {
  try {
    const snap = await mallMetaCollection.get();
    if (snap.empty) return;
    const meta = {};
    snap.forEach(doc => meta[doc.id] = doc.data());
    malls = malls.map(m => meta[m.id] ? { ...m, ...meta[m.id], id: m.id, lat: m.lat, lng: m.lng, address: m.address, name: m.name, no: m.no, developer: m.developer, area: m.area } : m);
    localStorage.setItem(MALLS_KEY, JSON.stringify(malls));
    renderMalls(); renderMallList();
  } catch(e) {
    console.error('mall meta load failed', e);
  }
}
function saveMallsLocal() { localStorage.setItem(MALLS_KEY, JSON.stringify(malls)); }
function openMallPanel(source) { mallPanelSource = source === 'resources' ? 'resources' : 'map'; setAppTab(mallPanelSource); closeDashboard(); renderMallList(); document.getElementById('mallPanel').classList.add('active'); }
function hideMallPanel() { document.getElementById('mallPanel').classList.remove('active'); }
function closeMallPanel() {
  const returnTarget = mallPanelSource;
  hideMallPanel();
  if (returnTarget === 'resources') openResourceCenter('institution');
  else setAppTab('map');
}
function startMallPick() { mallPickMode = true; hideMallPanel(); setAppTab('map'); toast('在地图上点击商场位置'); }
function resetMallForm() {
  editingMallId = null;
  ['mallName','mallTraffic','mallTrafficNote','mallAddress','mallLat','mallLng','mallNextStep','mallNote'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('mallCoopStatus').value = '待评估';
  const btn = document.getElementById('mallSaveBtn');
  if (btn) btn.textContent = '保存商场';
}
async function saveMall() {
  const name = document.getElementById('mallName').value.trim();
  const lat = Number(document.getElementById('mallLat').value), lng = Number(document.getElementById('mallLng').value);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) { toast('请填写商场名称并点选位置'); return; }
  const payload = {
    name, lat, lng,
    traffic: document.getElementById('mallTraffic').value.trim(),
    trafficNote: document.getElementById('mallTrafficNote').value.trim(),
    coopStatus: document.getElementById('mallCoopStatus').value,
    nextStep: document.getElementById('mallNextStep').value.trim(),
    note: document.getElementById('mallNote').value.trim(),
    address: document.getElementById('mallAddress').value.trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: currentUsername || '匿名'
  };
  if (editingMallId) {
    const idx = malls.findIndex(m => m.id === editingMallId);
    if (idx >= 0) {
      malls[idx] = { ...malls[idx], ...payload };
      selectedMallId = editingMallId;
      toast('🏬 商场已更新');
    }
  } else {
    const mall = { id: 'mall_custom_' + Date.now().toString(36), ...payload };
    malls.push(mall);
    selectedMallId = mall.id;
    toast('🏬 已新增商场');
  }
  clearCoverageCache(); saveMallsLocal(); renderMalls(); renderMallList(); renderMarkers();
  try {
    const saved = malls.find(m => m.id === selectedMallId) || malls[malls.length-1];
    if (saved) await saveMallMetaToCloud(saved);
    toast('🏬 商场已保存并同步');
  } catch(e) { console.error(e); toast('⚠️ 商场本地已保存，云端同步失败：请检查 Firestore mallMeta 权限'); }
  resetMallForm();
}
function editMall(id) {
  const m = malls.find(x => x.id === id);
  if (!m) return;
  editingMallId = id;
  document.getElementById('mallName').value = m.name || '';
  document.getElementById('mallTraffic').value = m.traffic || '';
  document.getElementById('mallTrafficNote').value = m.trafficNote || '';
  document.getElementById('mallCoopStatus').value = m.coopStatus || '待评估';
  document.getElementById('mallNextStep').value = m.nextStep || '';
  document.getElementById('mallNote').value = m.note || '';
  document.getElementById('mallAddress').value = m.address || '';
  document.getElementById('mallLat').value = m.lat || '';
  document.getElementById('mallLng').value = m.lng || '';
  const btn = document.getElementById('mallSaveBtn');
  if (btn) btn.textContent = '更新商场';
  selectedMallId = id;
  renderMalls(); renderMarkers(); renderMallList(); updateCoverageUi();
  toast('正在编辑：' + m.name);
}

async function saveMallMetaToCloud(m) {
  const meta = cleanForFirestore({
    traffic: m.traffic || '',
    trafficNote: m.trafficNote || '',
    coopStatus: m.coopStatus || '待评估',
    nextStep: m.nextStep || '',
    note: m.note || '',
    updatedAt: m.updatedAt || new Date().toISOString(),
    updatedBy: m.updatedBy || currentUsername || '匿名'
  });
  await mallMetaCollection.doc(m.id).set(meta, { merge: true });
}
function setMallStatusFilter(status) {
  mallStatusFilter = status;
  document.querySelectorAll('.mall-status-filter').forEach(b => b.classList.toggle('active', b.dataset.status === status));
  renderMallList();
}
function renderMalls() {
  if (!mallLayer || !coverageLayer) return;
  mallLayer.clearLayers(); coverageLayer.clearLayers();
  malls.forEach(m => {
    const marker = L.marker([m.lat,m.lng], { icon: L.divIcon({ className:'', html:'<div class="mall-marker">🏬</div>', iconSize:[34,34], iconAnchor:[17,17] }) });
    marker.bindPopup(`<div class="popup-name">🏬 ${esc(m.name)}</div><div class="popup-detail">${m.no ? esc(m.no) + '. ' : ''}${esc(m.area || '')} · ${esc(m.developer || '')}</div><div class="popup-detail">状态：${esc(m.coopStatus || '待评估')}</div><div class="popup-detail">客流：${esc(m.traffic || '-')} ${esc(m.trafficNote || '')}</div>${m.note ? '<div class="popup-detail">📝 ' + esc(m.note) + '</div>' : ''}<div class="point-actions"><button class="coverage-action-btn" onclick="selectMall('${jsStr(m.id)}')">查看1公里诊所</button><button onclick="addComboCenter('${jsStr(m.id)}')">加入组合</button></div>`);
    mallLayer.addLayer(marker);
  });
  places.filter(p => isPointEntry(p)).forEach(p => {
    const marker = L.marker([p.lat,p.lng], { icon: L.divIcon({ className:'', html:`<div class="point-marker-wrap"><div class="point-marker">📍</div><div class="point-label">${esc(p.name || '点位')}</div></div>`, iconSize:[112,42], iconAnchor:[17,21] }) });
    marker.bindPopup(`<div class="popup-name">📍 ${esc(p.name)}</div><div class="popup-detail">${esc(p.type || '点位')}</div><div class="popup-detail">${esc(p.address || '')}</div><div class="point-actions"><button class="coverage-action-btn" onclick="selectPointCoverage('${jsStr(p.id)}')">查看1公里诊所</button><button onclick="addComboCenter('${jsStr(p.id)}')">加入组合</button><button onclick="openEditSheet('${jsStr(p.id)}')">编辑点位</button></div>`);
    mallLayer.addLayer(marker);
  });
  comboSelectedIds.forEach(id => {
    const c = getCoverageTargetById(id);
    if (c) L.circle([c.lat,c.lng], { radius:COVERAGE_KM*1000, color:'#f1c40f', weight:3, fillColor:'#f1c40f', fillOpacity:.065, dashArray:'5,5' }).addTo(coverageLayer);
  });
  const selected = getCoverageTargetById(selectedMallId);
  if (selected) L.circle([selected.lat, selected.lng], { radius:singleCoverageKm*1000, color:'#e67e22', weight:2, fillColor:'#e67e22', fillOpacity:.08 }).addTo(coverageLayer);
}
function renderMallList() {
  const box = document.getElementById('mallList');
  const summary = document.getElementById('mallSummary');
  if (!box) return;
  if (!malls.length) {
    box.innerHTML = '<div class="list-empty">暂无商场数据异常。请刷新页面；也可以点右上角📍新增自定义商场。</div>';
    summary.textContent='已内置116个重点商场；选择商场后，可查看1公里内未接触诊所。';
    return;
  }
  const selected = getCoverageTargetById(selectedMallId);
  summary.textContent = selected
    ? `当前覆盖：${selected.name}。可点“退出1km”退出覆盖。`
    : '已内置116个重点商场；选择商场后，可查看1公里内未接触诊所。';
  const shownMalls = malls.filter(m => {
    if (mallStatusFilter !== '全部' && (m.coopStatus || '待评估') !== mallStatusFilter) return false;
    if (!mallSearchTerm) return true;
    const hay = [m.name,m.area,m.developer,m.address,m.no,m.coopStatus,m.nextStep,m.note].join(' ').toLowerCase();
    return hay.includes(mallSearchTerm);
  });
  if (!shownMalls.length) { box.innerHTML = '<div class="list-empty">没有匹配的商场</div>'; return; }
  box.innerHTML = shownMalls.map((m, idx) => {
    const hits = idx < 40 ? getMallClinics(m).length : '—';
    const active = m.id === selectedMallId;
    return `<div class="mall-item ${active?'active':''}" onclick="selectMall('${jsStr(m.id)}')">
      <div class="mall-name">🏬 ${esc(m.name)} <span class="mall-status-badge ${esc(m.coopStatus || '待评估')}">${esc(m.coopStatus || '待评估')}</span></div>
      <div class="mall-meta">${m.no ? esc(m.no) + '. ' : ''}${esc(m.area || '')} · ${esc(m.developer || '')}<br>1公里未接触诊所：${hits} 家 · 客流：${esc(m.traffic || '-')} ${esc(m.trafficNote || '')}<br>${m.nextStep ? '下一步：' + esc(m.nextStep) + '<br>' : ''}${esc(m.address || '')}</div>${m.note ? '<div class="mall-note-line">📝 ' + esc(m.note) + '</div>' : ''}
      <div class="mall-actions"><button class="primary" onclick="event.stopPropagation(); selectMall('${jsStr(m.id)}')">${active ? '退出1km覆盖' : '查看1km诊所'}</button><button onclick="event.stopPropagation(); editMall('${jsStr(m.id)}')">编辑状态/备注</button><button onclick="event.stopPropagation(); deleteMall('${jsStr(m.id)}')">删除</button></div>
    </div>`;
  }).join('');
}
function selectMall(id) {
  closeDashboard();
  const m = malls.find(x => x.id === id);
  if (!m) return;
  // 再次点击同一个商场 = 退出覆盖模式
  if (selectedMallId === id) {
    exitCoverageMode();
    renderMallList();
    closeCoveragePanel();
    return;
  }
  clearComboModeSilent();
  selectedMallId = id;
  map.setView([m.lat, m.lng], 15);
  renderMalls(); renderMarkers(); renderMallList(); updateCoverageUi();
  openCoveragePanel();
  const hits = getMallClinics(m, singleCoverageKm).length;
  toast(`🏬 ${m.name}：${singleCoverageKm}公里内 ${hits} 家诊所/机构`);
}
function setCoveragePanelExpanded(expanded) {
  const p = document.getElementById('coveragePanel');
  const hint = document.getElementById('coverageDragHint');
  if (!p) return;
  p.classList.toggle('expanded', !!expanded);
  if (hint) hint.textContent = expanded ? '下拉回到 1/3 屏' : '上拉全屏 / 下拉收起';
}
function toggleCoveragePanelSize() {
  const p = document.getElementById('coveragePanel');
  if (!p) return;
  setCoveragePanelExpanded(!p.classList.contains('expanded'));
}
function openCoveragePanel() { const p=document.getElementById('coveragePanel'); p.classList.remove('combo-mode'); setCoveragePanelExpanded(false); renderCoverageClinicPage(); p.classList.add('active'); updateCoverageUi(); }
function closeCoveragePanel() { const p=document.getElementById('coveragePanel'); p.classList.remove('active'); p.classList.remove('combo-mode'); setCoveragePanelExpanded(false); updateCoverageUi(); }
function getClinicCategoryLabel(p) {
  const cat = getLeadCategory(p);
  return cat.primary === '待分类' ? '' : `${cat.primary}／${cat.secondary}`;
}
function passCoverageFilter(p) {
  const f = coverageFilter || 'all';
  if (f === 'all') return true;
  if (f === 'claimed') return !isUnclaimedOwnerId(getOwnerId(p));
  const cat = getLeadCategory(p);
  if (f === '医疗') return cat.primary === '医疗';
  if (f === '推拿按摩') return cat.primary === '推拿按摩';
  if (f === '健康养生') return cat.primary === '健康养生';
  if (f === '美容美体') return cat.primary === '美容美体';
  if (f === '餐饮') return cat.primary === '餐饮';
  return true;
}
function setCoverageFilter(f) {
  coverageFilter = f || 'all';
  document.querySelectorAll('.coverage-filter-chip').forEach(b => b.classList.toggle('active', b.dataset.filter === coverageFilter));
  if (document.getElementById('coveragePanel').classList.contains('combo-mode') && activeComboResultTab) renderComboCoveragePage(activeComboResultTab);
  else renderCoverageClinicPage();
}
function setCoverageRadius(km) {
  const next = Number(km);
  if (![1, 4].includes(next) || next === singleCoverageKm) return;
  singleCoverageKm = next;
  document.querySelectorAll('.coverage-radius-chip').forEach(b => b.classList.toggle('active', Number(b.dataset.radius) === singleCoverageKm));
  renderMalls();
  renderMarkers();
  renderCoverageClinicPage();
  updateCoverageUi();
}
function clinicBadges(p) {
  const phone = p.phone ? '<span class="phone-badge">电话</span>' : '';
  const cat = getClinicCategoryLabel(p);
  const category = cat ? `<span class="source-badge">${esc(cat)}</span>` : '';
  return phone + category;
}
function openCoverageClinicDetails(id) {
  const selected = getCoverageTargetById(selectedMallId);
  const row = selected ? getMallClinics(selected, singleCoverageKm).find(p => p.id === id || p._promotedPlaceId === id) : null;
  if (!row) { goToPlace(id); return; }
  const promoted = row._promotedPlaceId ? places.find(p => p.id === row._promotedPlaceId) : getPromotedPlaceForBaseClinic(row);
  const targetId = (promoted && promoted.id) || row.id;
  closeCoveragePanel();
  goToPlace(targetId);
}
function renderCoverageClinicPage() {
  const selected = getCoverageTargetById(selectedMallId);
  const title = document.getElementById('coverageTitle');
  const summary = document.getElementById('coverageSummary');
  const box = document.getElementById('coverageClinicList');
  if (!selected || !box) return;
  const allHits = getMallClinics(selected, singleCoverageKm);
  const hits = allHits.filter(passCoverageFilter).sort((a,b) => {
    const da = a._distanceKm !== undefined ? a._distanceKm : distanceKm(selected.lat, selected.lng, a.lat, a.lng);
    const db = b._distanceKm !== undefined ? b._distanceKm : distanceKm(selected.lat, selected.lng, b.lat, b.lng);
    return getCoverageSortRank(a) - getCoverageSortRank(b) || da - db;
  });
  const warmCount = hits.filter(p => getCoverageSortRank(p) < 3).length;
  const claimedCount = allHits.filter(p => !isUnclaimedOwnerId(getOwnerId(p))).length;
  title.textContent = `${selected.name} · ${singleCoverageKm}公里诊所/机构`;
  summary.textContent = `当前 ${hits.length}/${allHits.length} 家｜已认领 ${claimedCount} 家｜已沟通/意向/合作 ${warmCount} 家置顶`;
  box.innerHTML = hits.length ? hits.map((p,i) => {
    const d = p._distanceKm !== undefined ? p._distanceKm : distanceKm(selected.lat, selected.lng, p.lat, p.lng);
    const rowClass = getCoverageListClass(p);
    return `<div class="coverage-clinic-item ${rowClass}" onclick="openCoverageClinicDetails('${jsStr(p.id)}')">
      <div><span class="rank">${i+1}</span><strong>${esc(p.name)}</strong>${getCoverageStatusBadge(p)}${clinicBadges(p)} <span class="distance">${d.toFixed(2)} km</span></div>
      <div class="meta">${esc(p.address || '')}<br>${esc(p.contact || '')}${p.phone ? ' · ' + esc(p.phone) : ''}</div>
      <div class="copy-row" onclick="event.stopPropagation()">
        <button class="copy-btn" onclick="copyText('${jsStr(p.id)}','address')">复制地址</button>
        <button class="copy-btn" onclick="copyText('${jsStr(p.id)}','phone')">复制电话</button>
        <button class="copy-btn" onclick="copyText('${jsStr(p.id)}','all')">复制整条</button>
      </div>
    </div>`;
  }).join('') : `<div class="list-empty">这个点位${singleCoverageKm}公里内暂未命中诊所/机构</div>`;
}


let comboSelectedIds = new Set();
let comboSearchTerm = '';
let comboTab = 'union';
let activeComboResultTab = null;
let coverageFilter = 'all';
let lastComboAnalysis = null;
function getAllCoverageCenters() {
  const pointCenters = places.filter(p => isPointEntry(p)).map(pointToCoverageTarget);
  return [...malls, ...pointCenters].filter(c => c && c.lat && c.lng);
}
function clinicKey(p) {
  return String(p.id || ((p.name||'').trim().toLowerCase() + '|' + (p.address||'').trim().toLowerCase()));
}
function analyzeCoverageCombo() {
  const centers = getAllCoverageCenters().filter(c => comboSelectedIds.has(c.id));
  if (centers.length < 2) return null;
  const centerSets = centers.map(c => {
    const clinics = getMallClinics(c);
    const map = new Map();
    clinics.forEach(p => map.set(clinicKey(p), { ...p, _centerId:c.id, _centerName:c.name, _distanceKm:p._distanceKm !== undefined ? p._distanceKm : distanceKm(c.lat,c.lng,p.lat,p.lng) }));
    return { center:c, clinics, map };
  });
  const unionMap = new Map();
  const coverageMap = new Map();
  centerSets.forEach(cs => {
    cs.map.forEach((p,k) => {
      if (!unionMap.has(k) || p._distanceKm < unionMap.get(k)._nearestDistance) unionMap.set(k, { ...p, _nearestCenter:cs.center.name, _nearestDistance:p._distanceKm });
      if (!coverageMap.has(k)) coverageMap.set(k, []);
      coverageMap.get(k).push({ center:cs.center, clinic:p, distanceKm:p._distanceKm });
    });
  });
  const union = [...unionMap.entries()].map(([k,p]) => ({ ...p, _key:k, _coveredBy:coverageMap.get(k) })).sort((a,b) => b._coveredBy.length - a._coveredBy.length || a._nearestDistance - b._nearestDistance);
  const intersection = union.filter(p => p._coveredBy.length === centers.length);
  const exclusiveByCenter = centerSets.map(cs => {
    const rows = [];
    cs.map.forEach((p,k) => { if ((coverageMap.get(k)||[]).length === 1) rows.push({ ...p, _key:k, _exclusiveCenter:cs.center.name, _coveredBy:coverageMap.get(k) }); });
    rows.sort((a,b) => a._distanceKm - b._distanceKm);
    return { center:cs.center, rows };
  });
  const sumCount = centerSets.reduce((s,cs)=>s+cs.clinics.length,0);
  const unionCount = union.length;
  const duplicateCount = Math.max(0, sumCount - unionCount);
  const overlapRate = sumCount ? duplicateCount / sumCount : 0;
  return { centers, centerSets, union, intersection, exclusiveByCenter, sumCount, unionCount, duplicateCount, overlapRate };
}

function showMapComboHint() {
  clearSingleCoverageSilent();
  document.getElementById('mapComboBar').classList.add('active');
  renderMalls(); renderMarkers(); renderMapComboBar(); updateCoverageUi();
  toast('点地图上的商场/点位，再点“加入组合”');
}
function addComboCenter(id) {
  clearSingleCoverageSilent();
  if (comboSelectedIds.has(id)) { toast('已在组合中'); renderMapComboBar(); return; }
  if (comboSelectedIds.size >= 5) { toast('最多选择5个覆盖中心'); return; }
  comboSelectedIds.add(id);
  document.getElementById('mapComboBar').classList.add('active');
  renderMalls(); renderMarkers(); renderMapComboBar(); updateCoverageUi();
  const c = getCoverageTargetById(id);
  toast(`已加入组合：${c ? c.name : ''}`);
}
function removeComboCenter(id) {
  comboSelectedIds.delete(id);
  lastComboAnalysis = null;
  if (comboResultLayer) comboResultLayer.clearLayers();
  activeComboResultTab = null;
  renderMalls(); renderMapComboBar();
  if (comboSelectedIds.size < 2) closeCoveragePanel();
}
function clearMapCombo() {
  comboSelectedIds.clear();
  lastComboAnalysis = null;
  if (comboResultLayer) comboResultLayer.clearLayers();
  activeComboResultTab = null;
  document.getElementById('mapComboBar').classList.remove('active');
  document.querySelectorAll('.map-combo-actions button[data-tab]').forEach(b => b.classList.remove('active'));
  closeCoveragePanel();
  renderMalls(); updateCoverageUi();
  toast('已清空组合');
}
function renderMapComboBar() {
  const bar = document.getElementById('mapComboBar');
  const title = document.getElementById('mapComboTitle');
  const stats = document.getElementById('mapComboStats');
  const centersBox = document.getElementById('mapComboCenters');
  if (!bar || !title || !stats || !centersBox) return;
  const centers = getAllCoverageCenters().filter(c => comboSelectedIds.has(c.id));
  if (!centers.length) {
    title.textContent = '组合覆盖';
    centersBox.innerHTML = '';
    stats.textContent = '从商场/点位弹窗加入组合；选2-5个后可看并集/交集/独占。';
    return;
  }
  title.textContent = `已选 ${centers.length} 个覆盖中心`;
  centersBox.innerHTML = centers.map(c => `<span class="combo-center-chip"><span>${c.isPointCoverage?'📍':'🏬'}</span><span class="name">${esc(c.name)}</span><button onclick="removeComboCenter('${jsStr(c.id)}')">×</button></span>`).join('');
  const a = analyzeCoverageCombo();
  if (!a) { stats.textContent = '再加入至少1个覆盖中心即可分析。'; return; }
  lastComboAnalysis = a;
  stats.textContent = `并集 ${a.unionCount} 家｜交集 ${a.intersection.length} 家｜重复 ${a.duplicateCount}｜重叠率 ${Math.round(a.overlapRate*100)}%（${overlapLabel(a.overlapRate)}）`;
}
function syncComboResultMode(tab) {
  document.querySelectorAll('.combo-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.map-combo-actions button[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}
function openComboResultOnMap(tab) {
  clearSingleCoverageSilent();
  comboTab = tab;
  activeComboResultTab = tab;
  const a = analyzeCoverageCombo();
  lastComboAnalysis = a;
  if (!a) { toast('请先加入至少2个覆盖中心'); return; }
  renderComboCoveragePage(tab);
  document.getElementById('coveragePanel').classList.add('combo-mode');
  setCoveragePanelExpanded(false);
  document.getElementById('coveragePanel').classList.add('active');
  updateCoverageUi();
}
function renderComboResultMarkers(rows, tab) {
  if (!comboResultLayer) return;
  comboResultLayer.clearLayers();
  const color = tab === 'intersection' ? '#9b59b6' : tab === 'exclusive' ? '#2ecc71' : '#3498db';
  const label = tab === 'intersection' ? '交集' : tab === 'exclusive' ? '独占' : '并集';
  rows.slice(0,120).forEach(p => {
    if (!p.lat || !p.lng) return;
    if (p._coveredBy && !p._coveredBy.length) return;
    // 用 Leaflet 原生 circleMarker，而不是 fixed-pixel HTML divIcon；缩放时不会出现视觉漂移。
    const marker = L.circleMarker([p.lat,p.lng], {
      radius: 7,
      color: '#fff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.96,
      pane: 'markerPane'
    });
    marker.bindTooltip(label, { permanent:false, direction:'top', offset:[0,-8] });
    marker.bindPopup(`<div class="popup-name">${esc(p.name)}</div><div class="popup-detail">组合${label}</div><div class="popup-detail">${esc(p.address || '')}</div>`);
    comboResultLayer.addLayer(marker);
  });
}

function getStrictComboRows(tab, a) {
  if (!a || !a.centers || !a.centers.length) return [];
  const rows = [];
  a.union.forEach(p => {
    if (!p.lat || !p.lng) return;
    const hits = a.centers
      .map(c => ({ center:c, distanceKm: distanceKm(c.lat, c.lng, p.lat, p.lng) }))
      .filter(x => x.distanceKm <= COVERAGE_KM + 0.001)
      .sort((x,y) => x.distanceKm - y.distanceKm);
    if (!hits.length) return;
    if (tab === 'intersection' && hits.length !== a.centers.length) return;
    if (tab === 'exclusive' && hits.length !== 1) return;
    const nearest = hits[0];
    rows.push({
      ...p,
      _coveredBy: hits.map(h => ({ center:h.center, distanceKm:h.distanceKm })),
      _nearestCenter: nearest.center.name,
      _nearestDistance: nearest.distanceKm,
      _exclusiveCenter: hits.length === 1 ? nearest.center.name : p._exclusiveCenter
    });
  });
  return rows.sort((x,y) => {
    if (tab === 'intersection') return x._nearestDistance - y._nearestDistance;
    if (tab === 'exclusive') return String(x._exclusiveCenter||'').localeCompare(String(y._exclusiveCenter||'')) || x._nearestDistance - y._nearestDistance;
    return y._coveredBy.length - x._coveredBy.length || x._nearestDistance - y._nearestDistance;
  });
}
function renderComboCoveragePage(tab) {
  const a = lastComboAnalysis || analyzeCoverageCombo();
  const title = document.getElementById('coverageTitle');
  const summary = document.getElementById('coverageSummary');
  const box = document.getElementById('coverageClinicList');
  if (!a || !box) return;
  const label = tab === 'intersection' ? '交集' : tab === 'exclusive' ? '独占' : '并集';
  title.textContent = `组合${label}`;
  const strictUnion = getStrictComboRows('union', a);
  const strictIntersection = getStrictComboRows('intersection', a);
  let rows = getStrictComboRows(tab, a).filter(passCoverageFilter).sort((a,b) => getCoverageSortRank(a) - getCoverageSortRank(b) || ((a._nearestDistance||0) - (b._nearestDistance||0)));
  const warmCount = rows.filter(p => getCoverageSortRank(p) < 3).length;
  const strictDuplicate = Math.max(0, a.sumCount - strictUnion.length);
  const strictRate = a.sumCount ? strictDuplicate / a.sumCount : 0;
  summary.textContent = `${a.centers.length}个中心｜并集${strictUnion.length}｜交集${strictIntersection.length}｜已沟通/意向/合作${warmCount}｜重叠${Math.round(strictRate*100)}%`;
  renderComboResultMarkers(rows, tab);
  box.innerHTML = rows.length ? rows.slice(0,80).map((p,i) => {
    const covered = (p._coveredBy||[]).map(x=>x.center.name).join(' / ');
    const meta = tab === 'exclusive' ? `独占：${esc(p._exclusiveCenter || '')}` : `${p._coveredBy.length}点覆盖：${esc(covered)}`;
    const dist = ((p._nearestDistance!==undefined?p._nearestDistance:p._distanceKm)||0).toFixed(2);
    const rowClass = getCoverageListClass(p);
    return `<div class="coverage-clinic-item ${rowClass}" onclick="goToPlace('${jsStr(p.id)}')"><div><span class="rank">${i+1}</span><strong>${esc(p.name)}</strong>${getCoverageStatusBadge(p)}${clinicBadges(p)} <span class="combo-badge">${label}</span></div><div class="meta">${meta}｜近${esc(p._nearestCenter || p._centerName || '')} ${dist}km<br>${esc(p.address || '')}</div><div class="copy-row" onclick="event.stopPropagation()"><button class="copy-btn" onclick="copyText('${jsStr(p.id)}','address')">复制地址</button><button class="copy-btn" onclick="copyText('${jsStr(p.id)}','phone')">复制电话</button></div></div>`;
  }).join('') : '<div class="list-empty">当前分类没有诊所</div>';
}
function openComboPanel() { clearSingleCoverageSilent(); closeMallPanel(); renderComboPicker(); renderComboAnalysis(); renderMapComboBar(); renderMalls(); renderMarkers(); document.getElementById('comboPanel').classList.add('active'); }
function closeComboPanel() { document.getElementById('comboPanel').classList.remove('active'); }
function toggleComboCenter(id, checked) {
  if (checked && comboSelectedIds.size >= 5) { toast('最多选择5个覆盖中心'); renderComboPicker(); return; }
  if (checked) comboSelectedIds.add(id); else comboSelectedIds.delete(id);
  renderComboPicker(); renderComboAnalysis(); renderMapComboBar(); renderMalls();
}
function renderComboPicker() {
  const box = document.getElementById('comboPickList');
  const hint = document.getElementById('comboSelectedHint');
  if (!box) return;
  const centers = getAllCoverageCenters().map(c => ({...c, hitCount:getMallClinics(c).length})).filter(c => {
    if (!comboSearchTerm) return true;
    return [c.name,c.area,c.developer,c.address,c.note,c.coopStatus].join(' ').toLowerCase().includes(comboSearchTerm);
  }).sort((a,b) => (comboSelectedIds.has(b.id)-comboSelectedIds.has(a.id)) || b.hitCount-a.hitCount).slice(0,80);
  hint.textContent = `已选 ${comboSelectedIds.size} 个覆盖中心；请选择2-5个。`;
  box.innerHTML = centers.map(c => `<label class="combo-pick-item"><input type="checkbox" ${comboSelectedIds.has(c.id)?'checked':''} onchange="toggleComboCenter('${jsStr(c.id)}', this.checked)"><div><strong>${c.isPointCoverage?'📍':'🏬'} ${esc(c.name)}</strong><div class="combo-row-meta">${esc(c.area||'')}｜${esc(c.developer||'')}｜单点覆盖 ${c.hitCount} 家</div></div></label>`).join('') || '<div class="list-empty">没有匹配的覆盖中心</div>';
}
function setComboTab(tab) {
  syncComboResultMode(tab);
  renderComboAnalysis();
}
function overlapLabel(rate) {
  if (rate < .2) return '互补性强';
  if (rate < .45) return '正常重叠';
  if (rate < .65) return '高度重叠';
  return '覆盖过密';
}
function renderComboAnalysis() {
  const stats = document.getElementById('comboStats'), ex = document.getElementById('comboExclusiveStats'), list = document.getElementById('comboResultList');
  if (!stats || !list) return;
  const a = analyzeCoverageCombo();
  lastComboAnalysis = a;
  if (!a) {
    stats.innerHTML = '';
    ex.innerHTML = '';
    list.innerHTML = '<div class="list-empty">请先选择至少2个覆盖中心。</div>';
    return;
  }
  stats.innerHTML = [
    ['单点合计', a.sumCount], ['并集去重', a.unionCount], ['重复覆盖', a.duplicateCount], ['重叠率', Math.round(a.overlapRate*100)+'%'], ['共同交集', a.intersection.length], ['判断', overlapLabel(a.overlapRate)]
  ].map(([label,num]) => `<div class="combo-stat"><div class="num">${esc(num)}</div><div class="label">${label}</div></div>`).join('');
  ex.innerHTML = '<div class="dash-section-title">独占覆盖</div>' + a.exclusiveByCenter.map(x => `<div class="combo-row"><div class="combo-row-title"><span>${esc(x.center.name)}</span><span>${x.rows.length} 家</span></div></div>`).join('');
  let rows = [];
  if (comboTab === 'union') rows = a.union;
  else if (comboTab === 'intersection') rows = a.intersection;
  else rows = a.exclusiveByCenter.flatMap(x => x.rows.map(r => ({...r, _exclusiveCenter:x.center.name})));
  list.innerHTML = rows.length ? rows.slice(0,120).map((p,i) => {
    const coveredNames = (p._coveredBy||[]).map(x=>x.center.name).join(' / ');
    const meta = comboTab === 'exclusive' ? `独占：${esc(p._exclusiveCenter || '')}` : `被 ${p._coveredBy.length} 个中心覆盖：${esc(coveredNames)}`;
    return `<div class="coverage-clinic-item" onclick="goToPlace('${jsStr(p.id)}')"><div><span class="rank">${i+1}</span><strong>${esc(p.name)}</strong> <span class="combo-badge">${comboTab==='union'?'并集':comboTab==='intersection'?'交集':'独占'}</span></div><div class="meta">${meta}<br>最近：${esc(p._nearestCenter || p._centerName || '')} ${((p._nearestDistance!==undefined?p._nearestDistance:p._distanceKm)||0).toFixed(2)}km<br>${esc(p.address || '')}</div><div class="copy-row" onclick="event.stopPropagation()"><button class="copy-btn" onclick="copyText('${jsStr(p.id)}','address')">复制地址</button><button class="copy-btn" onclick="copyText('${jsStr(p.id)}','phone')">复制电话</button></div></div>`;
  }).join('') : '<div class="list-empty">当前分类没有诊所</div>';
}
async function copyComboSummary() {
  const a = lastComboAnalysis || analyzeCoverageCombo();
  if (!a) { toast('请先选择至少2个覆盖中心'); return; }
  const text = `覆盖组合分析\n覆盖中心：${a.centers.map(c=>c.name).join(' + ')}\n单点合计：${a.sumCount}\n并集去重：${a.unionCount}\n重复覆盖：${a.duplicateCount}\n重叠率：${Math.round(a.overlapRate*100)}%（${overlapLabel(a.overlapRate)}）\n共同交集：${a.intersection.length}\n独占覆盖：\n` + a.exclusiveByCenter.map(x=>`- ${x.center.name}: ${x.rows.length}家`).join('\n');
  await navigator.clipboard.writeText(text); toast('组合摘要已复制');
}

const CLINIC_EXPORT_HEADERS = ['clinic_id','source_base_id','name','address','type','source','contact','phone','lat','lng','owner_id','owner_name','status','distance_km','coverage_center','coverage_mode','data_quality_status','error_type','error_note','error_upload_action'];
const ERROR_UPLOAD_ACTIONS = ['','地址错误','电话错误','重复店铺','已停业','类型错误','其他','已修正'];
function csvEscape(v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g,'""') + '"'; }
function downloadCsv(filename, headers, rows) {
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');
  const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
async function downloadXlsx(filename, headers, rows, options={}) {
  if (!window.ExcelJS) { downloadCsv(filename.replace(/\.xlsx$/i,'.csv'), headers, rows); toast('Excel组件未加载，已导出兼容表格'); return; }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(options.sheetName || '数据');
  ws.addRow(headers);
  rows.forEach(r => ws.addRow(headers.map(h => r[h] || '')));
  ws.views = [{ state:'frozen', ySplit:1 }];
  ws.getRow(1).font = { bold:true, color:{argb:'FFFFFFFF'} };
  ws.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1F4E78'} };
  ws.getRow(1).alignment = { vertical:'middle', horizontal:'center' };
  headers.forEach((h,i) => { ws.getColumn(i+1).width = Math.min(Math.max(String(h).length + 4, 14), 36); });
  if (options.errorValidation) applyErrorActionValidation(ws, headers, Math.max(rows.length + 1, 300));
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function applyErrorActionValidation(ws, headers, maxRow) {
  const actionCol = headers.indexOf('error_upload_action') + 1;
  const noteCol = headers.indexOf('error_note') + 1;
  const errorTypeCol = headers.indexOf('error_type') + 1;
  if (!actionCol) return;
  ws.getColumn(actionCol).width = 18;
  if (noteCol) ws.getColumn(noteCol).width = 34;
  if (errorTypeCol) ws.getColumn(errorTypeCol).width = 18;
  const allowed = ERROR_UPLOAD_ACTIONS.filter(Boolean).join(',');
  for (let r=2; r<=maxRow; r++) {
    ws.getCell(r, actionCol).dataValidation = { type:'list', allowBlank:true, formulae:[`"${allowed}"`], showErrorMessage:true, errorTitle:'只能选择固定报错类型', error:'请选择：' + allowed, promptTitle:'报错动作', prompt:'只能从下拉中选择；不处理请留空。' };
  }
  ws.getCell(1, actionCol).note = '只能选择：' + allowed + '；空白=不处理';
  if (noteCol) ws.getCell(1, noteCol).note = '自由填写说明，例如：正确地址、空号、与哪条重复等';
}
function clinicExportRow(p, extra={}) {
  return {
    clinic_id: p.id || '',
    source_base_id: p.sourceBaseId || (p.isBaseClinic ? p.id : '') || '',
    name: p.name || '',
    address: p.address || '',
    type: p.type || '',
    source: getClinicCategoryLabel(p) || (p.isBaseClinic ? '医疗／中医诊所' : ''),
    contact: p.contact || '',
    phone: p.phone || '',
    lat: p.lat || '',
    lng: p.lng || '',
    owner_id: getOwnerId(p) || '',
    owner_name: getOwnerLabel(p) || '',
    status: p.status || (p.isBaseClinic ? '基础池' : ''),
    distance_km: extra.distance_km || '',
    coverage_center: extra.coverage_center || '',
    coverage_mode: extra.coverage_mode || '',
    data_quality_status: p.dataQualityStatus || '',
    error_type: p.dataQualityIssueType || '',
    error_note: '',
    error_upload_action: ''
  };
}
async function exportErrorUploadTemplate(rows, filename) {
  const out = rows.map(r => ({...r, error_upload_action:'', error_type:'', error_note:''}));
  const xlsxName = filename.replace(/\.csv$/i, '.xlsx');
  await downloadXlsx(xlsxName, CLINIC_EXPORT_HEADERS, out, { sheetName:'报错上传', errorValidation:true });
  toast('已导出Excel报错上传模板，下拉列已锁定选项');
}
async function exportComboCsv() {
  const a = lastComboAnalysis || analyzeCoverageCombo();
  if (!a) { toast('请先选择至少2个覆盖中心'); return; }
  const headers = [...CLINIC_EXPORT_HEADERS, 'combo_mode','covered_by','nearest_center','nearest_distance_km'];
  const rows = [];
  a.union.forEach(p => rows.push({
    ...clinicExportRow(p, { coverage_mode:'combo_union', coverage_center:a.centers.map(c=>c.name).join(' + '), distance_km:(p._nearestDistance||0).toFixed(3) }),
    combo_mode:'union', covered_by:(p._coveredBy||[]).map(x=>x.center.name).join('/'), nearest_center:p._nearestCenter||'', nearest_distance_km:(p._nearestDistance||0).toFixed(3)
  }));
  a.intersection.forEach(p => rows.push({
    ...clinicExportRow(p, { coverage_mode:'combo_intersection', coverage_center:a.centers.map(c=>c.name).join(' + '), distance_km:(p._nearestDistance||0).toFixed(3) }),
    combo_mode:'intersection', covered_by:(p._coveredBy||[]).map(x=>x.center.name).join('/'), nearest_center:p._nearestCenter||'', nearest_distance_km:(p._nearestDistance||0).toFixed(3)
  }));
  a.exclusiveByCenter.forEach(x => x.rows.forEach(p => rows.push({
    ...clinicExportRow(p, { coverage_mode:'combo_exclusive', coverage_center:x.center.name, distance_km:(p._distanceKm||0).toFixed(3) }),
    combo_mode:'exclusive:' + x.center.name, covered_by:x.center.name, nearest_center:x.center.name, nearest_distance_km:(p._distanceKm||0).toFixed(3)
  })));
  await downloadXlsx('覆盖组合分析_统一字段.xlsx', headers, rows, { sheetName:'覆盖组合分析', errorValidation:true });
  toast('已导出组合分析表格');
}
function getCurrentCoverageRows() {
  const selected = getCoverageTargetById(selectedMallId);
  if (!selected) return [];
  return getMallClinics(selected, singleCoverageKm).filter(passCoverageFilter).map((p,i) => clinicExportRow(p, {
    distance_km: (p._distanceKm !== undefined ? p._distanceKm : distanceKm(selected.lat, selected.lng, p.lat, p.lng)).toFixed(3),
    coverage_center: selected.name,
    coverage_mode: `single_${singleCoverageKm}km`
  }));
}
async function exportCurrentCoverageCsv() {
  const rows = getCurrentCoverageRows();
  if (!rows.length) { toast('当前没有可导出的诊所'); return; }
  await downloadXlsx(`${rows[0].coverage_center}_${singleCoverageKm}km诊所机构清单_统一字段.xlsx`, CLINIC_EXPORT_HEADERS, rows, { sheetName:`${singleCoverageKm}km诊所机构`, errorValidation:true });
  toast('已按统一字段导出Excel，error_upload_action已加下拉');
}
function exportCurrentCoverageErrorTemplate() {
  const rows = getCurrentCoverageRows();
  if (!rows.length) { toast('当前没有可导出的诊所'); return; }
  exportErrorUploadTemplate(rows, `${rows[0].coverage_center}_报错上传模板.csv`);
}
async function copyCurrentCoverageSummary() {
  const rows = getCurrentCoverageRows();
  if (!rows.length) { toast('当前没有诊所'); return; }
  const text = `${rows[0].coverage_center} ${singleCoverageKm}公里内诊所/机构：${rows.length}家\n` + rows.slice(0,20).map(r => `${r.rank}. ${r.clinic} ${r.distance_km}km｜${r.address}`).join('\n');
  await navigator.clipboard.writeText(text);
  toast('已复制摘要');
}
async function copyText(id, field) {
  const p = places.find(x => x.id === id) || baseClinics.find(x => x.id === id);
  if (!p) { toast('找不到这条诊所数据'); return; }
  let text = '';
  if (field === 'address') text = p.address || '';
  else if (field === 'phone') text = p.phone || p.contact || '';
  else text = `${p.name || ''}\n地址：${p.address || ''}\n联系人：${p.contact || ''}\n电话：${p.phone || ''}`.trim();
  if (!text) { toast('没有可复制内容'); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toast('已复制');
  }
}

async function deleteMall(id) {
  if (!confirm('删除这个商场标注？')) return;
  malls = malls.filter(m => m.id !== id); if (selectedMallId === id) selectedMallId = null;
  clearCoverageCache(); saveMallsLocal(); renderMalls(); renderMarkers(); renderMallList(); updateCoverageUi();
  try {
    await mallMetaCollection.doc(id).delete();
    toast('商场已删除并同步');
  } catch(e) {
    console.error(e);
    toast('商场本地已删除，云端记录删除失败：请检查 mallMeta 权限');
  }
}
function normalizeClinicText(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g,'').replace(/[，,。．.\-–—_()（）\[\]【】]/g,'');
}
function clinicMatchKey(p) {
  const name = normalizeClinicText(p && p.name);
  const addr = normalizeClinicText(p && p.address);
  if (!name && !addr) return String((p && p.id) || '');
  return name + '|' + addr;
}
function clinicExactAddressKey(p) {
  const addr = normalizeClinicText(p && p.address);
  return addr ? 'addr|' + addr : '';
}
function clinicIdentityKeys(p) {
  const keys = new Set();
  if (!p) return keys;
  if (p.id) {
    keys.add(String(p.id));
    if (String(p.id).startsWith('place_')) keys.add(String(p.id).slice(6));
    else keys.add('place_' + String(p.id));
  }
  // 不再用「名称+地址」做地图/线索去重 key。医生同楼不同室（302/309）或同地址多医生，
  // 很容易被误判成同一家，导致其中一个 marker 消失。除非是基础池和已晋升记录的直接 id 对应，否则保留多条。
  return keys;
}
function hasClinicIdentity(seen, p) {
  for (const k of clinicIdentityKeys(p)) if (seen.has(k)) return true;
  return false;
}
function addClinicIdentity(seen, p) {
  clinicIdentityKeys(p).forEach(k => seen.add(k));
}
function isWarmCoverageClinic(p) { return getCoverageSortRank(p) < 3; }
function preferCoverageRecord(a, b) {
  if (!a) return b;
  if (!b) return a;
  const warmA = isWarmCoverageClinic(a), warmB = isWarmCoverageClinic(b);
  if (warmA !== warmB) return warmB ? b : a;
  const placeA = !a.isBaseClinic || !!a._promotedPlaceId;
  const placeB = !b.isBaseClinic || !!b._promotedPlaceId;
  if (placeA !== placeB) return placeB ? b : a;
  const va = (a.visits||[]).length, vb = (b.visits||[]).length;
  if (va !== vb) return vb > va ? b : a;
  return a;
}
function mergeCoverageRenderPool(primaryRows, baseRows) {
  const rows = [];
  const seen = new Set();
  primaryRows.forEach(p => { rows.push(p); addClinicIdentity(seen, p); });
  baseRows.forEach(p => {
    if (!hasClinicIdentity(seen, p)) { rows.push(p); addClinicIdentity(seen, p); }
  });
  return rows;
}
function getPromotedPlaceForBaseClinic(base) {
  if (!base) return null;
  const directId = 'place_' + base.id;
  const baseKey = clinicMatchKey(base);
  return places.find(x => x.id === directId || x.sourceBaseId === base.id) || places.find(x => clinicMatchKey(x) === baseKey && clinicExactAddressKey(x) === clinicExactAddressKey(base));
}
function mergeBaseClinicOwner(base) {
  const promoted = getPromotedPlaceForBaseClinic(base);
  if (!promoted) return base;
  return {
    ...base,
    ownerId: promoted.ownerId,
    ownerName: promoted.ownerName || promoted.createdBy || promoted.updatedBy,
    ownerAvatar: promoted.ownerAvatar || promoted.createdByAvatar || promoted.updatedByAvatar,
    createdBy: promoted.createdBy,
    createdByAvatar: promoted.createdByAvatar,
    updatedBy: promoted.updatedBy,
    updatedByAvatar: promoted.updatedByAvatar,
    status: promoted.status || base.status || '基础池',
    visits: promoted.visits || base.visits || [],
    phone: promoted.phone || base.phone,
    contact: promoted.contact || base.contact,
    _promotedPlaceId: promoted.id
  };
}
function getBaseMallClinics(mall, radiusKm = COVERAGE_KM) {
  return baseClinics
    .filter(p => isClinicLike(p) && distanceKm(mall.lat, mall.lng, p.lat, p.lng) <= radiusKm)
    .map(p => {
      const merged = mergeBaseClinicOwner(p);
      return { ...merged, _distanceKm: distanceKm(mall.lat, mall.lng, p.lat, p.lng), status: merged.status || '基础池' };
    })
    .sort((a,b) => a._distanceKm - b._distanceKm);
}
function computeMallClinics(mall, radiusKm = COVERAGE_KM) {
  const byKey = new Map();
  function upsertCoverageRow(raw) {
    const row = { ...raw, _distanceKm: raw._distanceKm !== undefined ? raw._distanceKm : distanceKm(mall.lat, mall.lng, raw.lat, raw.lng) };
    const keys = [...clinicIdentityKeys(row)];
    const existingKey = keys.find(k => byKey.has(k));
    if (existingKey) {
      const preferred = preferCoverageRecord(byKey.get(existingKey), row);
      keys.forEach(k => byKey.set(k, preferred));
    } else {
      keys.forEach(k => byKey.set(k, row));
    }
  }
  places.filter(p => isClinicLike(p) && distanceKm(mall.lat, mall.lng, p.lat, p.lng) <= radiusKm).forEach(upsertCoverageRow);
  getBaseMallClinics(mall, radiusKm).forEach(upsertCoverageRow);
  const unique = [];
  const outSeen = new Set();
  byKey.forEach(row => {
    const key = clinicMatchKey(row) || row.id;
    if (outSeen.has(key)) return;
    outSeen.add(key);
    unique.push(row);
  });
  return unique.sort((a,b) => getCoverageSortRank(a) - getCoverageSortRank(b) || a._distanceKm - b._distanceKm);
}
function getMallClinics(mall, radiusKm = COVERAGE_KM) {
  if (!mall || !mall.lat || !mall.lng) return [];
  const key = coverageCacheKey(mall, radiusKm);
  if (coverageCache.has(key)) return coverageCache.get(key);
  const result = computeMallClinics(mall, radiusKm);
  coverageCache.set(key, result);
  return result;
}
async function loadBaseClinics() {
  try {
    const res = await fetch('./tcm-base-clinics.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const loaded = await res.json();
    if (!Array.isArray(loaded)) throw new Error('JSON根节点不是数组');
    baseClinics = loaded;
  } catch(e) {
    console.error('Base clinic pool file failed', e);
    baseClinics = [];
    toast(`基础诊所池文件加载失败：${e && e.message ? e.message : '未知错误'}`);
    return;
  }
  try {
    clearCoverageCache();
    renderMarkers();
    renderMallList();
    scheduleLeadHomeRender();
    updateStats();
  } catch(e) {
    console.error('Base clinic pool render failed', e);
    toast(`基础诊所池已加载，但地图渲染失败：${e && e.message ? e.message : '未知错误'}`);
  }
}
async function promoteBaseClinic(id) {
  const p = baseClinics.find(x => x.id === id);
  if (!p) return;
  const now = new Date().toISOString();
  const data = {
    ...p,
    id: 'place_' + p.id,
    status: '已交流',
    ownerId: getCurrentOwnerId(),
    ownerName: currentUsername || '匿名',
    ownerAvatar: currentAvatar,
    isBaseClinic: false,
    createdAt: now,
    createdBy: currentUsername || '匿名',
    createdByAvatar: currentAvatar,
    updatedAt: now,
    updatedBy: currentUsername || '匿名',
    updatedByName: currentUsername || '匿名',
    updatedByAvatar: currentAvatar,
    visits: [{ date: now.slice(0,16).replace('T',' '), by: currentUsername || '匿名', note: '从官方基础诊所池加入跟进，已标记为已交流' }]
  };
  if (places.some(x => x.id === data.id)) return toast('该诊所已在机构池，请直接编辑');
  try {
    const saved = await saveToFirestore(data, null);
    places.push(saved);
    clearCoverageCache();
    savePlaces();
    toast('已加入机构池并显示在首页');
    selectedMallId = null;
    closeCoveragePanel();
    renderMarkers(); renderList(); updateStats();
    openEditSheet(saved.id);
  } catch (e) {
    console.error(e);
    toast('加入失败：' + (e.message || '请刷新重试'));
  }
}

function resetMallCache() {
  localStorage.removeItem(MALLS_KEY);
  clearCoverageCache();
  loadMalls();
  selectedMallId = null;
  renderMalls(); renderMarkers(); renderMallList(); updateCoverageUi();
  toast('商场坐标缓存已重置为最新版');
}
function normalizeStatus(s) { return String(s || '未接触').trim().replace('待跟進','待跟进'); }
function isUncontactedPlace(p) { const s = normalizeStatus(p.status); return s === '未接触' || s === '待跟进' || s === '未交流' || s === '待跟進' || s === '待聯絡' || s === '待联系'; }
function isClinicLike(p) { const s = ((p.type||'')+' '+(p.name||'')).toLowerCase(); return s.includes('中醫') || s.includes('中医') || s.includes('clinic') || s.includes('診所') || s.includes('诊所'); }
function distanceKm(lat1,lng1,lat2,lng2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ============ SEARCH (Google Places) ============
function getGoogleMapsKey() {
  return localStorage.getItem(APIKEY_KEY) || DEFAULT_GOOGLE_MAPS_KEY;
}
function openSearch() {
  document.getElementById('searchPanel').classList.add('active');
  document.getElementById('searchInput').focus();
  const key = getGoogleMapsKey();
  document.getElementById('searchHint').innerHTML = key
    ? '<p>🔍 选区域 → 输关键词 → 搜索</p><p style="margin-top:8px;font-size:12px;color:var(--green)">✅ Google API 已可用</p>'
    : '<p>🔍 选区域 → 输关键词 → 搜索</p><p style="margin-top:12px;font-size:12px">需要Google Maps API Key<br>请在 ⚙ 设置中配置</p>';
}
function closeSearch() {
  document.getElementById('searchPanel').classList.remove('active');
  clearSearchMarkers();
}

function selectDistrict(el) {
  document.querySelectorAll('.district-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedDistrict = el.dataset.district;
  const d = DISTRICTS[selectedDistrict];
  if (d && d.lat) {
    map.setView([d.lat, d.lng], 15);
    toast('📍 ' + d.name);
  } else {
    map.setView([currentPos.lat, currentPos.lng], 15);
    toast('📍 当前位置');
  }
}

function getSearchCenter() {
  const d = DISTRICTS[selectedDistrict];
  if (d && d.lat) return { lat: d.lat, lng: d.lng };
  return currentPos;
}

function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) { toast('请输入搜索关键词'); return; }

  const key = getGoogleMapsKey();
  if (!key) { toast('请先在设置中配置 Google Maps API Key'); return; }

  showLoading();

  // Use Google Places Text Search via a script-injected approach
  if (!window._gService) {
    loadGooglePlaces(key, () => searchPlaces(query));
  } else {
    searchPlaces(query);
  }
}

function loadGooglePlaces(key, callback) {
  if (document.getElementById('gmapsScript')) {
    if (window.google && window.google.maps) { callback(); return; }
  }
  window._gmapsCallback = function() {
    // Create a DOM-attached div for PlacesService (pagination requires it)
    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    window._gService = new google.maps.places.PlacesService(div);
    callback();
  };
  const s = document.createElement('script');
  s.id = 'gmapsScript';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_gmapsCallback`;
  s.onerror = () => { hideLoading(); toast('❌ API Key无效或网络错误'); };
  document.head.appendChild(s);
}

function searchPlaces(query) {
  const center = getSearchCenter();
  window._searchAllResults = [];
  window._searchSeenIds = new Set();
  clearSearchMarkers();

  // 9-point grid scan: center + 8 surrounding points, spread ~1.5km apart, 1km radius each
  // Covers roughly a 4km x 4km area with minimal overlap
  const offsets = [
    { lat: 0, lng: 0 },
    { lat: 0.015, lng: 0 },
    { lat: -0.015, lng: 0 },
    { lat: 0, lng: 0.015 },
    { lat: 0, lng: -0.015 },
    { lat: 0.015, lng: 0.015 },
    { lat: 0.015, lng: -0.015 },
    { lat: -0.015, lng: 0.015 },
    { lat: -0.015, lng: -0.015 }
  ];

  let completedScans = 0;
  const totalScans = offsets.length;

  offsets.forEach(function(offset, idx) {
    var scanLat = center.lat + offset.lat;
    var scanLng = center.lng + offset.lng;

    // Use nearbySearch (more location-sensitive) with keyword
    var req = {
      location: new google.maps.LatLng(scanLat, scanLng),
      radius: 1200,
      keyword: query,
      language: 'zh-HK'
    };

    setTimeout(function() {
      window._gService.nearbySearch(req, function(results, status) {
        completedScans++;
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          for (var j = 0; j < results.length; j++) {
            var r = results[j];
            if (!window._searchSeenIds.has(r.place_id)) {
              window._searchSeenIds.add(r.place_id);
              window._searchAllResults.push(r);
            }
          }
        }
        toast('\ud83d\udd0d ' + completedScans + '/' + totalScans + ' \u00b7 ' + window._searchAllResults.length + ' \u5bb6');

        if (completedScans >= totalScans) {
          hideLoading();
          if (window._searchAllResults.length === 0) {
            document.getElementById('searchBody').innerHTML = '<div class="search-hint"><p>\u672a\u627e\u5230\u7ed3\u679c</p><p style="margin-top:8px;font-size:12px">\u8bd5\u8bd5\u6362\u4e2a\u5173\u952e\u8bcd\u6216\u533a\u57df\uff1f</p></div>';
          } else {
            window._searchAllResults.sort(function(a, b) {
              var da = calcDistNum(center.lat, center.lng, a.geometry.location.lat(), a.geometry.location.lng());
              var db = calcDistNum(center.lat, center.lng, b.geometry.location.lat(), b.geometry.location.lng());
              return da - db;
            });
            renderSearchResults(window._searchAllResults, false);
            toast('\u2705 \u5171 ' + window._searchAllResults.length + ' \u5bb6');
          }
        }
      });
    }, idx * 400);
  });
}

function loadMoreResults() {
  toast('\u5df2\u5728\u81ea\u52a8\u52a0\u8f7d');
}

function renderSearchResults(allResults, hasMore) {
  hideLoading();
  clearSearchMarkers();
  const center = getSearchCenter();
  const bounds = L.latLngBounds();
  bounds.extend([center.lat, center.lng]);
  const safeResults = [];

  const body = document.getElementById('searchBody');
  const selectedDistrictName = (DISTRICTS[selectedDistrict] && DISTRICTS[selectedDistrict].name) || '当前位置';
  body.innerHTML = '<div style="padding:6px 4px;font-size:13px;color:var(--text2)">找到 ' + allResults.length + ' 家 · ' + esc(selectedDistrictName) + '</div>' +
    allResults.map((r, i) => {
      const lat = r.geometry.location.lat();
      const lng = r.geometry.location.lng();
      safeResults.push({ name:String(r.name || ''), address:String(r.formatted_address || ''), lat, lng });
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="custom-marker" style="background:var(--orange);opacity:0.8">${i+1}</div>`,
          iconSize: [28,28], iconAnchor: [14,14]
        })
      }).addTo(map);
      marker.bindPopup(`<div class="popup-name">${esc(r.name)}</div><div class="popup-detail">${esc(r.formatted_address||'')}</div>`, {maxWidth:220});
      searchMarkers.push(marker);
      bounds.extend([lat, lng]);

      const dist = calcDist(center.lat, center.lng, lat, lng);
      const exists = places.some(p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001);

      return `
        <div class="search-result">
          <div style="width:24px;height:24px;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
          <div class="search-result-info">
            <div class="search-result-name">${esc(r.name)}</div>
            <div class="search-result-addr">${esc(r.formatted_address || '')}</div>
            <div class="search-result-dist">${dist}</div>
          </div>
          ${exists
            ? '<span style="font-size:12px;color:var(--green)">已录入</span>'
            : `<button class="btn btn-primary" style="flex-shrink:0" type="button" data-search-add-index="${i}">+ 添加</button>`
          }
          <button class="btn btn-ghost" style="flex-shrink:0;padding:8px 10px;font-size:12px" type="button" data-search-focus-index="${i}">定位</button>
        </div>`;
    }).join('');

  if (hasMore) {
    body.innerHTML += '<div style="text-align:center;padding:12px;font-size:13px;color:var(--text2)">⏳ 正在加载更多结果...</div>';
  }
  if (body._searchResultClickHandler) body.removeEventListener('click', body._searchResultClickHandler);
  body._searchResultClickHandler = event => {
    const addButton = event.target.closest('[data-search-add-index]');
    if (addButton && body.contains(addButton)) {
      const result = safeResults[Number(addButton.dataset.searchAddIndex)];
      if (result) addFromSearch(result);
      return;
    }
    const focusButton = event.target.closest('[data-search-focus-index]');
    if (focusButton && body.contains(focusButton)) focusSearchMarker(Number(focusButton.dataset.searchFocusIndex));
  };
  body.addEventListener('click', body._searchResultClickHandler);

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

function addFromSearch(data) {
  closeSearch();
  resetForm();
  document.getElementById('sheetTitle').textContent = '新增机构';
  document.getElementById('btnDelete').style.display = 'none';
  document.getElementById('fName').value = data.name;
  document.getElementById('fAddr').value = data.address;
  document.getElementById('editLat').value = data.lat;
  document.getElementById('editLng').value = data.lng;
  editVisits = [];
  renderVisits();
  openSheet();
  map.setView([data.lat, data.lng], 17);
}

function clearSearchMarkers() {
  searchMarkers.forEach(m => map.removeLayer(m));
  searchMarkers = [];
}

function focusSearchMarker(idx) {
  if (searchMarkers[idx]) {
    const ll = searchMarkers[idx].getLatLng();
    map.setView(ll, 17);
    searchMarkers[idx].openPopup();
  }
}

function calcDist(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? Math.round(d*1000) + 'm' : d.toFixed(1) + 'km';
}
function calcDistNum(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ============ SETTINGS ============
const ADMIN_PASSWORD_SHA256 = '14a416a8e528e251d4ef703311b02d4b43984264092c7f9a3eb0fc43185e7c8d';
let adminAreaUnlocked = false;
function setAdminGateState(unlocked, message = '') {
  adminAreaUnlocked = unlocked;
  const gate = document.getElementById('adminGate');
  const controls = document.getElementById('adminControls');
  const error = document.getElementById('adminGateError');
  const summary = document.querySelector('#adminArea > summary');
  if (gate) gate.hidden = unlocked;
  if (controls) controls.hidden = !unlocked;
  if (error) error.textContent = message;
  if (summary) summary.textContent = unlocked ? '管理员与危险操作 🔓' : '管理员与危险操作 🔒';
}
async function unlockAdminArea() {
  const input = document.getElementById('adminPasswordInput');
  const value = input ? input.value : '';
  if (!value) { setAdminGateState(false, '请输入管理员密码'); return; }
  try {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== ADMIN_PASSWORD_SHA256) {
      if (input) { input.value = ''; input.focus(); }
      setAdminGateState(false, '密码错误');
      return;
    }
    if (input) input.value = '';
    setAdminGateState(true);
    renderAdminUsers();
  } catch (error) {
    console.error('admin unlock failed', error);
    setAdminGateState(false, '当前浏览器无法验证密码');
  }
}
function lockAdminArea() {
  const area = document.getElementById('adminArea');
  const input = document.getElementById('adminPasswordInput');
  if (input) input.value = '';
  setAdminGateState(false);
  if (area) area.open = false;
}
function handleAdminAreaToggle(event) {
  if (event.currentTarget.open && !adminAreaUnlocked) {
    setAdminGateState(false);
    setTimeout(() => document.getElementById('adminPasswordInput')?.focus(), 0);
  }
}
function openSettings() {
  lockAdminArea();
  document.getElementById('apiKeyInput').value = localStorage.getItem(APIKEY_KEY) || '';
  document.getElementById('usernameInput').value = currentUsername || '';
  renderAvatarGrid();
  document.getElementById('settingsPanel').classList.add('active');
  refreshMySystemStatus();
  renderAdminUsers();
}
function closeSettings() {
  lockAdminArea();
  document.getElementById('settingsPanel').classList.remove('active');
}
function refreshMySystemStatus() {
  const user = document.getElementById('myStatusUser');
  const sync = document.getElementById('myStatusSync');
  const network = document.getElementById('myStatusNetwork');
  const counts = document.getElementById('myStatusCounts');
  const syncSource = document.getElementById('syncStatus');
  if (user) user.textContent = `${currentAvatar || '👤'} ${currentUsername || '未设置'}`;
  if (sync) sync.textContent = syncSource ? syncSource.textContent : '等待同步状态';
  if (network) network.textContent = navigator.onLine ? '在线' : '离线';
  if (counts) counts.textContent = `机构/点位 ${places.length} · 回收站 ${deletedPlaces.length} · 基础池 ${baseClinics.length} · 商场 ${malls.length}`;
}
function renderAvatarGrid() {
  const box = document.getElementById('avatarGrid');
  if (!box) return;
  const custom = isImageAvatar(currentAvatar) ? `<button type="button" class="avatar-btn active" title="当前自定义头像">${avatarHtml(currentAvatar)}</button>` : '';
  box.innerHTML = custom + AVATAR_POOL.map(a => `<button type="button" class="avatar-btn ${a===currentAvatar?'active':''}" onclick="selectAvatar('${a}')">${avatarHtml(a)}</button>`).join('');
}
function selectAvatar(a) {
  currentAvatar = a;
  localStorage.setItem(USER_AVATAR_KEY, a);
  renderAvatarGrid();
  updateCurrentUserBadge();
}
function resetAvatarToEmoji() {
  currentAvatar = '👤';
  localStorage.setItem(USER_AVATAR_KEY, currentAvatar);
  renderAvatarGrid();
  updateCurrentUserBadge();
  toast('已恢复默认头像');
}
function handleAvatarUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      currentAvatar = canvas.toDataURL('image/jpeg', 0.78);
      localStorage.setItem(USER_AVATAR_KEY, currentAvatar);
      renderAvatarGrid();
      updateCurrentUserBadge();
      toast('✅ 自定义头像已载入，记得保存用户资料');
    };
    img.onerror = function(){ toast('头像读取失败'); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}
function saveUsername() {
  const name = document.getElementById('usernameInput').value.trim();
  if (name) {
    currentUsername = name;
    localStorage.setItem(USERNAME_KEY, name);
    localStorage.setItem(USER_AVATAR_KEY, currentAvatar);
    updateCurrentUserBadge();
    renderOwnerFilters();
    renderMarkers();
    renderList();
    toast('✅ 用户资料已保存: ' + currentAvatar + ' ' + name);
  } else {
    toast('请输入名称');
  }
}
function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (key) {
    localStorage.setItem(APIKEY_KEY, key);
    // Reset Google service so it reloads with new key
    window._gService = null;
    const old = document.getElementById('gmapsScript');
    if (old) old.remove();
    toast('✅ API Key 已保存');
  } else {
    localStorage.removeItem(APIKEY_KEY);
    toast('已清除 API Key');
  }
}

// ============ EXPORT / IMPORT ============
function exportData() {
  const json = JSON.stringify(places, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `bd-map-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📤 已导出 ' + places.length + ' 条数据');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('格式错误');
      if (!window.BDMapImportSafety) throw new Error('导入安全模块未加载');
      const normalized = data.map((item, index) => ({ ...item, rowNumber:index + 1, lat:Number(item.lat), lng:Number(item.lng) }));
      const review = window.BDMapImportSafety.reviewImportRows(normalized, [...places, ...deletedPlaces], { forbiddenCoordinates:[currentPos] });
      const ready = review.rows.filter(row => row.importable);
      const blocked = review.rows.filter(row => !row.importable);
      importFailureRows = blocked.map(row => ({...row, failureMessage:(row.messages||[]).join('；')}));
      if (!ready.length) {
        alert(`JSON预审完成，但没有安全可导入记录。\n拦截：${blocked.length}\n请导出原文件修正重复、名称或坐标后再导入。`);
        return;
      }
      if (!confirm(`JSON预审：共 ${review.summary.total} 条，安全可导入 ${ready.length} 条，拦截 ${blocked.length} 条。\n确认只写入安全记录？`)) return;
      const result = await window.BDMapImportSafety.runSafeImport(ready, {
        persist: async row => {
          const record = window.BDMapImportSafety.prepareNewImportedRecord(row, { id:genId(), actor:currentUsername||'匿名' });
          const saved = await saveToFirestore(record, null);
          places.push(saved);
        }
      });
      importFailureRows.push(...result.failed.map(x=>({...x.row,failureMessage:x.error.message})));
      clearCoverageCache(); savePlaces(); renderOwnerFilters(); updateMapFilterBar(); renderMarkers(); updateStats();
      alert(`JSON导入完成\n成功：${result.successCount}\n云端失败：${result.failureCount}\n预审拦截：${blocked.length}`);
    } catch(err) {
      console.error(err);
      toast('❌ 导入失败：' + (err && err.message ? err.message : '文件格式不正确'));
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function syncImportedToFirestore(items) {
  if (!items || items.length === 0) return;
  const chunkSize = 100;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(item => placesCollection.doc(item.id).set(item)));
    const done = Math.min(i + chunk.length, items.length);
    document.getElementById('syncStatus').textContent = `☁️ 正在同步 ${done}/${items.length}`;
  }
  document.getElementById('syncStatus').textContent = '✅ 已同步';
}

function clearAllData() {
  if (!confirm('确定清除所有数据？此操作不可撤销！')) return;
  if (!confirm('再次确认：清除后无法恢复，确定吗？')) return;
  places = [];
  savePlaces();
  renderOwnerFilters();
  renderMarkers();
  updateStats();
  toast('🗑 数据已清除');
}


// ============ ADMIN USER CLEANUP ============
function renderAdminUsers() {
  const box = document.getElementById('adminUsers');
  if (!box) return;
  const owners = getOwners().filter(o => o.id !== '全部');
  if (!owners.length) {
    box.innerHTML = '<div class="list-empty">暂无用户数据</div>';
    return;
  }
  box.innerHTML = owners.map(o => {
    const ids = places.filter(p => getOwnerId(p) === o.id).map(p => p.id);
    return `<div class="admin-user-row">
      <div class="info"><div class="name">${avatarInlineHtml(o.avatar)}${esc(o.name)}</div><div class="meta">ownerId: ${esc(o.id)} · ${ids.length} 个机构</div></div>
      <div class="admin-user-actions">
        <button class="avatar-edit" onclick="changeOwnerAvatar('${jsStr(o.id)}','${jsStr(o.name)}')">改头像</button>
        <button onclick="deleteOwnerData('${jsStr(o.id)}','${jsStr(o.name)}')">删除用户数据</button>
      </div>
    </div>`;
  }).join('');
}
async function changeOwnerAvatar(ownerId, ownerName) {
  const avatar = prompt('输入新的头像 emoji（例如 🐯、🦊、🔥）：', getOwnerAvatar({ ownerId, ownerName }));
  if (!avatar) return;
  const next = String(avatar).trim();
  if (!next) return;
  const affected = places.filter(p => getOwnerId(p) === ownerId || normalizeOwnerId(getOwnerName(p)) === ownerId);
  if (!affected.length) { toast('没有找到该用户的数据'); return; }
  if (!confirm(`确认把「${ownerName}」名下 ${affected.length} 个机构头像改为 ${next}？`)) return;
  const succeeded = [];
  const failed = [];
  for (const original of affected) {
    try {
      const saved = await runRevisionedMutation(original.id, Number(original.revision) || 0, current => {
        if (!current) throw new Error('云端记录不存在');
        const updated = { ...current, ownerAvatar:next, updatedAt:new Date().toISOString() };
        if ((updated.createdBy || updated.ownerName || '') === ownerName) updated.createdByAvatar = next;
        if ((updated.updatedBy || updated.ownerName || '') === ownerName) updated.updatedByAvatar = next;
        if (Array.isArray(updated.visits)) updated.visits = updated.visits.map(v => v.by === ownerName ? { ...v, byAvatar:next } : v);
        return updated;
      }, { action:'owner-avatar-update', reason:`修改「${ownerName}」头像` });
      const idx = places.findIndex(p => p.id === saved.id);
      if (idx >= 0) places[idx] = saved; else places.push(saved);
      succeeded.push(saved);
    } catch (err) {
      console.error(err);
      failed.push({ record:original, error:err });
    }
  }
  savePlaces(); renderAdminUsers(); renderOwnerFilters(); renderMarkers(); renderList();
  if (failed.length) toast(`⚠️ 头像已同步 ${succeeded.length}/${affected.length} 条，${failed.length} 条冲突或失败`);
  else toast(`✅ 已同步头像到云端：${succeeded.length} 条`);
}
async function deleteOwnerData(ownerId, ownerName) {
  const records = places.filter(p => getOwnerId(p) === ownerId);
  const isCurrentLocalProfile = ownerId === getCurrentOwnerId();
  if (!records.length && !isCurrentLocalProfile) { toast('该用户没有认领资料'); return; }
  const confirmText = prompt(`将移除「${ownerName}」对 ${records.length} 条机构的认领。\n机构及底池资料会保留，不会进入回收站。\n请输入 RELEASE 确认：`);
  if (confirmText !== 'RELEASE') { toast('已取消'); return; }
  const released = [];
  const failed = [];
  for (const original of records) {
    try {
      const baseOwner = getBasePoolOwner(original);
      const saved = await runRevisionedMutation(original.id, Number(original.revision) || 0, current => {
        if (!current) throw new Error('云端记录不存在');
        return { ...current, ...baseOwner, updatedAt:new Date().toISOString(), updatedBy:currentUsername || '管理员' };
      }, { action:'owner-release', reason:`管理员移除「${ownerName}」认领`, deleteFields:['claimedAt','claimedBy'] });
      const idx = places.findIndex(p => p.id === saved.id);
      if (idx >= 0) places[idx] = saved;
      released.push(saved);
    } catch (err) { console.error(err); failed.push(original.id); }
  }
  clearCoverageCache(); clearLeadRowsCache(); savePlaces();
  if (isCurrentLocalProfile) {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(USER_AVATAR_KEY);
    currentUsername = '';
    currentAvatar = '👤';
    updateCurrentUserBadge();
  }
  renderAdminUsers();
  renderOwnerFilters();
  renderMarkers(); renderList(); renderLeadHomeList(); updateStats();
  if (failed.length) toast(`⚠️ 已移除认领 ${released.length}/${records.length} 条，${failed.length} 条失败`);
  else toast(`✅ 已移除认领 ${released.length} 条，机构资料已保留`);
}
async function cleanupLegacyTcmImport() {
  const legacyIds = places.filter(p => {
    const owner = String(p.ownerName || p.createdBy || '').toLowerCase();
    const oid = String(p.ownerId || '').toLowerCase();
    const id = String(p.id || '').toLowerCase();
    return oid.includes('system_tcm_import') || oid.includes('base_tcm_pool') || owner.includes('tcm') || owner.includes('tmc') || owner.includes('名錄導入') || owner.includes('名录导入') || id.startsWith('tcm_');
  }).map(p => p.id);
  if (!legacyIds.length) { toast('没有发现旧 TCM/TMC 导入数据'); return; }
  const confirmText = prompt(`将清理旧 TCM/TMC 导入数据 ${legacyIds.length} 条。\n新版基础诊所池不会受影响。\n请输入 CLEAN 确认：`);
  if (confirmText !== 'CLEAN') { toast('已取消'); return; }
  await bulkDeleteIds(legacyIds);
  renderAdminUsers();
  renderOwnerFilters();
  toast(`已清理旧 TCM/TMC 导入数据 ${legacyIds.length} 条`);
}

// ============ UTILS ============
function normalizeOwnerId(name) {
  return String(name || '匿名').trim().toLowerCase().replace(/[^a-z0-9一-龥_-]+/g, '_') || 'anonymous';
}
function getCurrentOwnerId() { return normalizeOwnerId(currentUsername || '匿名'); }
function getOwnerId(p) { return p.ownerId || normalizeOwnerId(p.ownerName || p.createdBy || p.updatedBy || '匿名'); }
function isUnclaimedOwnerId(ownerId) {
  return !ownerId || ownerId === 'base_tcm_pool' || ownerId === 'base_health_pool' || ownerId === normalizeOwnerId('匿名');
}
function getBasePoolOwner(record) {
  const baseId = record && (record.sourceBaseId || (String(record.id || '').startsWith('place_') ? String(record.id).slice(6) : ''));
  const base = baseClinics.find(item => item.id === baseId || clinicMatchKey(item) === clinicMatchKey(record));
  return base ? { ownerId:base.ownerId || '', ownerName:base.ownerName || '', ownerAvatar:base.ownerAvatar || '' } : { ownerId:normalizeOwnerId('匿名'), ownerName:'匿名', ownerAvatar:'👤' };
}
function getOwnerName(p) { return p.ownerName || p.createdBy || p.updatedBy || '匿名'; }
function getOwnerAvatar(p) { return p.ownerAvatar || p.createdByAvatar || p.updatedByAvatar || '👤'; }
function getOwnerLabel(p) { return (isImageAvatar(getOwnerAvatar(p)) ? '头像' : getOwnerAvatar(p)) + ' ' + getOwnerName(p); }
function isImageAvatar(v) { return typeof v === 'string' && (v.indexOf('data:image/') === 0 || v.indexOf('http://') === 0 || v.indexOf('https://') === 0); }
function avatarHtml(v) {
  if (isImageAvatar(v)) return '<img class="avatar-img" src="' + escAttr(safeHttpUrl(v)) + '" alt="头像">';
  return esc(v || '👤');
}
function avatarInlineHtml(v) {
  if (isImageAvatar(v)) return '<img class="avatar-inline" src="' + escAttr(safeHttpUrl(v)) + '" alt="头像">';
  return esc(v || '👤') + ' ';
}
function ownerLabelHtml(p) { return avatarInlineHtml(getOwnerAvatar(p)) + esc(getOwnerName(p)); }
function updateCurrentUserBadge() {
  document.getElementById('currentUser').innerHTML = '<span class="user-badge">' + avatarInlineHtml(currentAvatar) + esc(currentUsername || '未命名') + '</span>';
}
function getOwners() {
  const map = {};
  places.forEach(p => {
    const id = getOwnerId(p);
    if (!map[id]) map[id] = { id, name: getOwnerName(p), avatar: getOwnerAvatar(p), count: 0 };
    map[id].count++;
  });
  if (currentUsername) {
    const id = getCurrentOwnerId();
    if (!map[id]) map[id] = { id, name: currentUsername, avatar: currentAvatar, count: 0 };
  }
  return Object.values(map).sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));
}
function renderOwnerFilters() {
  renderOwnerSelectOptions('ownerSelect');
  renderOwnerSelectOptions('mapOwnerSelect');
}
function renderOwnerSelectOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const owners = getOwners();
  const validIds = new Set(owners.map(o => o.id));
  if (ownerFilter !== '全部' && !validIds.has(ownerFilter)) ownerFilter = '全部';
  select.innerHTML = '<option value="全部">👥 全部人员 (' + owners.length + ')</option>' + owners.map(o =>
    '<option value="' + escAttr(o.id) + '">' + esc((isImageAvatar(o.avatar) ? '👤' : (o.avatar || '👤')) + ' ' + o.name + ' · ' + o.count) + '</option>'
  ).join('');
  select.value = ownerFilter;
}
function setOwnerFilter(ownerId) {
  ownerFilter = ownerId || '全部';
  renderOwnerFilters();
  renderMarkers();
  renderList();
}
function savePlaces() {
  // Also save to localStorage as offline backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...places, ...deletedPlaces]));
}
function cleanForFirestore(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(cleanForFirestore).filter(v => v !== undefined);
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(k => {
      const v = cleanForFirestore(value[k]);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }
  return value;
}
function getRuntimeSafety() {
  if (!window.BDMapRuntimeSafety) throw new Error('运行安全模块尚未载入，请刷新后重试');
  return window.BDMapRuntimeSafety;
}
function runRevisionedMutation(id, expectedRevision, mutate, options = {}) {
  if (!id) return Promise.reject(new Error('缺少记录ID'));
  const docRef = placesCollection.doc(id);
  const auditRef = options.action ? auditLogsCollection.doc() : null;
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(docRef);
    const current = snapshot.exists ? { id:snapshot.id, ...snapshot.data() } : null;
    getRuntimeSafety().assertExpectedRevision(current, expectedRevision);
    const proposed = await mutate(current ? { ...current } : null);
    if (!proposed) throw new Error('写入内容为空');
    const cleanData = cleanForFirestore({ ...proposed, id });
    const revisioned = getRuntimeSafety().prepareRevisionedWrite(cleanData, current);
    const writeData = { ...revisioned };
    for (const field of (options.deleteFields || [])) writeData[field] = firebase.firestore.FieldValue.delete();
    transaction.set(docRef, writeData, { merge:true });
    if (auditRef) {
      transaction.set(auditRef, {
        action: options.action,
        recordId: id,
        recordName: revisioned.name || (current && current.name) || '',
        actor: getDeleteActor(),
        at: new Date().toISOString(),
        reason: options.reason || '',
        fromRevision: Number(current && current.revision) || 0,
        toRevision: revisioned.revision
      });
    }
    return revisioned;
  });
}
function saveToFirestore(data, expectedRevision) {
  document.getElementById('syncStatus').textContent = '☁️ 正在同步...';
  const cleanData = cleanForFirestore(data);
  if (!cleanData.createdAt) cleanData.createdAt = new Date().toISOString();
  if (!cleanData.updatedAt) cleanData.updatedAt = new Date().toISOString();
  return runRevisionedMutation(cleanData.id, expectedRevision, current => ({ ...(current || {}), ...cleanData }))
    .then(saved => {
      document.getElementById('syncStatus').textContent = '✅ 已同步';
      return saved;
    }).catch(err => {
      console.error('Firestore save error:', err);
      document.getElementById('syncStatus').textContent = '⚠️ 同步失败';
      throw err;
    });
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function outputSafety() {
  return window.BDMapOutputSafety || {
    escapeHtml: value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),
    escapeHtmlAttribute: value => String(value ?? '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/`/g,'&#96;'),
    escapeInlineJsString: value => String(value ?? '').replace(/\\/g,'\\x5C').replace(/'/g,'\\x27').replace(/"/g,'\\x22').replace(/</g,'\\x3C').replace(/>/g,'\\x3E').replace(/&/g,'\\x26').replace(/\r/g,'\\r').replace(/\n/g,'\\n'),
    safeHttpUrl: value => { try { const raw=String(value ?? '').trim(), u=new URL(raw, location.href); return raw && (u.protocol==='http:' || u.protocol==='https:') ? raw : ''; } catch { return ''; } },
    safeTelephone: value => { const raw=String(value ?? '').trim(); return /^[+0-9()\-\s.]{3,40}$/.test(raw) ? raw : ''; }
  };
}
function escAttr(s) { return outputSafety().escapeHtmlAttribute(s); }
function esc(s) { return outputSafety().escapeHtml(s); }
function jsStr(s) { return outputSafety().escapeInlineJsString(s); }
function safeHttpUrl(s) { return outputSafety().safeHttpUrl(s); }
function safeTelephone(s) { return outputSafety().safeTelephone(s); }

function mallTrafficScore(m) {
  const n = parseFloat(m.traffic || 0);
  if (!n) return 2;
  if (n >= 80000) return 6;
  if (n >= 40000) return 4;
  if (n >= 15000) return 3;
  return 2;
}
function normalizeText(p) { return [p.type,p.name,p.address,p.scale,p.note,(p.visits||[]).map(v=>v.note||'').join(' ')].join(' ').toLowerCase(); }
function hasTrialSignal(p) { const t = normalizeText(p); return t.includes('试用') || t.includes('試用') || t.includes('trial'); }
function hasPositiveSignal(p) { const t = normalizeText(p); return t.includes('有意向') || t.includes('感兴趣') || t.includes('感興趣') || t.includes('想试') || t.includes('想試') || t.includes('愿意') || t.includes('願意') || t.includes('可约') || t.includes('可約'); }
function hasNegativeSignal(p) { const t = normalizeText(p); return t.includes('拒绝') || t.includes('拒絕') || t.includes('不需要') || t.includes('暂不') || t.includes('暫不') || t.includes('没兴趣') || t.includes('無興趣'); }
function parseVisitDate(v) {
  if (!v || !v.date) return null;
  const s = String(v.date).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function daysSinceLastVisit(p) {
  const dates = (p.visits||[]).map(parseVisitDate).filter(Boolean).sort((a,b)=>b-a);
  if (!dates.length) return null;
  return Math.max(0, Math.floor((Date.now() - dates[0].getTime()) / 86400000));
}
function inferArea(p) {
  const text = [p.area,p.district,p.address,p.name].join(' ');
  for (const k in DISTRICTS) { if (k !== 'current' && text.includes(DISTRICTS[k].name.replace('區',''))) return DISTRICTS[k].name; }
  if (text.includes('Kowloon') || text.includes('九龍') || text.includes('九龙')) return '九龙';
  if (text.includes('Hong Kong Island') || text.includes('港島') || text.includes('港岛') || text.includes('灣仔') || text.includes('銅鑼灣')) return '港岛';
  if (text.includes('New Territories') || text.includes('新界') || text.includes('沙田') || text.includes('屯門') || text.includes('荃灣')) return '新界';
  return p.area || '未识别';
}
function nearestMallInfo(p) {
  let best = null;
  malls.forEach(m => {
    const d = distanceKm(m.lat,m.lng,p.lat,p.lng);
    if (!best || d < best.distanceKm) best = { mall:m, distanceKm:d };
  });
  return best;
}
function calcBusinessValue(p, text) {
  let score = 4, notes = [];
  if (isClinicLike(p)) { score += 16; notes.push('中医诊所，核心匹配'); }
  if (text.includes('ngo') || text.includes('社區') || text.includes('社区') || text.includes('老人') || text.includes('長者') || text.includes('长者') || text.includes('中心')) { score += 14; notes.push('社区/NGO/老人服务入口'); }
  if (text.includes('連鎖') || text.includes('连锁') || p.scale === '连锁') { score += 8; notes.push('连锁/多点复制潜力'); }
  if (p.scale === '大型') { score += 6; notes.push('大型机构'); }
  else if (p.scale === '中型') { score += 4; notes.push('中型机构'); }
  else if (p.scale === '小型') { score += 2; notes.push('小型机构'); }
  if (text.includes('養生') || text.includes('养生') || text.includes('理疗') || text.includes('理療') || text.includes('康復') || text.includes('康复') || text.includes('美容')) { score += 6; notes.push('健康相关业态'); }
  score = Math.min(30, score);
  return { score, note: notes.length ? notes.join('；') : '普通商户基础价值' };
}
function calcDealChance(p, text) {
  const s = normalizeStatus(p.status);
  let score = 3, notes = [];
  if (hasTrialSignal(p)) { score += 18; notes.push('出现试用信号'); }
  if (s === '有意向') { score += 18; notes.push('状态为有意向'); }
  else if (s === '已交流') { score += 10; notes.push('已交流，可二次推进'); }
  else if (s === '未接触' || s === '待跟进') { score += 3; notes.push('冷线索，待首触'); }
  if (p.phone) { score += 4; notes.push('有电话'); }
  if (p.contact) { score += 3; notes.push('有联系人'); }
  if (hasPositiveSignal(p)) { score += 5; notes.push('备注含正向意向'); }
  if (hasNegativeSignal(p)) { score -= 12; notes.push('备注含拒绝/暂不信号'); }
  score = Math.max(0, Math.min(30, score));
  return { score, note: notes.join('；') || '成交信号较弱' };
}
function calcCoverageStrategy(p, near) {
  let score = 6, notes = [];
  if (near && near.distanceKm <= 1) {
    const st = near.mall.coopStatus || '待评估';
    const add = st === '已合作' ? 10 : 8;
    score += add + mallTrafficScore(near.mall);
    notes.push(`距${near.mall.name}${near.distanceKm.toFixed(1)}km，可做商场/周边联动`);
  } else if (near && near.distanceKm <= 2) {
    score += 7;
    notes.push(`距重点商场${near.mall.name}${near.distanceKm.toFixed(1)}km，可纳入周边扫街`);
  } else {
    score += 8;
    notes.push('不在重点商场近圈，适合作为空白区域补点');
  }
  score = Math.min(20, score);
  return { score, note: notes.join('；') };
}
function calcUrgency(p) {
  const s = normalizeStatus(p.status);
  const days = daysSinceLastVisit(p);
  let score = 2, notes = [];
  if (hasTrialSignal(p)) { score += 4; notes.push('试用相关线索，需要防止冷掉'); }
  if (s === '有意向') { score += 4; notes.push('有意向，应优先推进'); }
  else if (s === '已交流') { score += 2; notes.push('已交流，适合二次触达'); }
  if (days !== null) {
    if (hasTrialSignal(p) && days >= 3) { score += 3; notes.push(`${days}天未跟进试用反馈`); }
    else if (s === '有意向' && days >= 5) { score += 3; notes.push(`${days}天未推进有意向线索`); }
    else if (s === '已交流' && days >= 7) { score += 3; notes.push(`${days}天未二次跟进`); }
    else if (days <= 3) { score += 2; notes.push('最近3天内有动作，热度仍在'); }
  } else {
    notes.push('暂无交流时间记录');
  }
  score = Math.min(10, score);
  return { score, note: notes.join('；') };
}
function calcExecutability(p) {
  let score = 0, notes = [];
  if (p.phone) { score += 4; notes.push('有电话'); } else notes.push('缺电话');
  if (p.contact) { score += 2; notes.push('有联系人'); } else notes.push('缺联系人');
  if (p.address) { score += 2; notes.push('有地址'); } else notes.push('缺地址');
  if (p.lat && p.lng) { score += 2; notes.push('有坐标'); } else notes.push('缺坐标');
  return { score: Math.min(10, score), note: notes.join(' / ') };
}
function recommendAction(p, parts) {
  const s = normalizeStatus(p.status);
  if (normalizeStatus(p.status) === '已合作') return '转运营维护，不参与BD优先排序';
  if (hasNegativeSignal(p) || s === '暂不合作') return '暂缓，后续有新活动/新权益再重新激活';
  if (hasTrialSignal(p)) return '今日跟进试用反馈，确认是否推进合作/设备留存';
  if (s === '有意向') return p.phone ? '今日电话跟进，争取约试用或面谈' : '先补电话/联系人，再推进意向转化';
  if (s === '已交流') return '二次触达，补充案例/方案，确认下一步动作';
  if (!p.phone && parts.business.score >= 22) return '高价值冷线索，先补电话或安排扫街拜访';
  if (p.phone) return '今日首轮电话联系，验证合作兴趣';
  return '纳入扫街清单，先补联系方式';
}
function actionCategory(action) {
  const a = String(action || '');
  if (a.includes('试用')) return '试用反馈';
  if (a.includes('电话')) return '电话联系';
  if (a.includes('二次')) return '二次触达';
  if (a.includes('补电话') || a.includes('补联系方式')) return '补资料';
  if (a.includes('扫街')) return '扫街拜访';
  if (a.includes('暂缓')) return '暂缓';
  if (a.includes('运营')) return '运营维护';
  return '其他';
}
function riskFlags(p, pr) {
  const flags = [];
  if (!p.phone) flags.push('缺电话');
  if (!p.contact && pr.score >= 70) flags.push('高分缺联系人');
  if (!p.address) flags.push('缺地址');
  if (hasNegativeSignal(p)) flags.push('备注含拒绝/暂不');
  const days = daysSinceLastVisit(p);
  if (days !== null && days >= 14 && normalizeStatus(p.status) !== '未接触') flags.push(days + '天未跟进');
  return flags;
}
function calcPriority(p) {
  if (isPointEntry(p)) {
    return { score: 0, level: 'low', action: '点位资源：用于商场/活动/社区场地覆盖，不参与机构BD优先级排序', reasons:['点位资源'], breakdown:[
      { name:'点位属性', points:0, max:0, note:'这是点位，不是机构线索' },
      { name:'用途', points:0, max:0, note:'用于记录商场、社区场地、活动地点等空间资源' }
    ], nearestMall:'', distanceKm:null, area: inferArea(p) };
  }

  const text = normalizeText(p);
  const near = nearestMallInfo(p);
  const business = calcBusinessValue(p, text);
  const deal = calcDealChance(p, text);
  const coverage = calcCoverageStrategy(p, near);
  const urgency = calcUrgency(p);
  const executable = calcExecutability(p);
  const parts = { business, deal, coverage, urgency, executable };
  const rawTotal = business.score + deal.score + coverage.score + urgency.score + executable.score;
  const score = Math.max(0, Math.min(100, Math.round(rawTotal)));
  const level = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  const action = recommendAction(p, parts);
  const breakdown = [
    { name:'业务价值', points:Math.round(business.score), max:30, note:business.note },
    { name:'成交可能', points:Math.round(deal.score), max:30, note:deal.note },
    { name:'覆盖战略', points:Math.round(coverage.score), max:20, note:coverage.note },
    { name:'推进紧迫', points:Math.round(urgency.score), max:10, note:urgency.note },
    { name:'数据可执行性', points:Math.round(executable.score), max:10, note:executable.note }
  ];
  const reasons = [business.note, deal.note, coverage.note].filter(Boolean).slice(0,3);
  return { score, level, action, reasons, breakdown, nearestMall: near && near.mall ? near.mall.name : '', distanceKm: near ? near.distanceKm : null, area: inferArea(p) };
}
function priorityLabel(level) { return level === 'high' ? '高' : level === 'mid' ? '中' : '低'; }
function scoreBreakdownHtml(pr) {
  return `<div class="score-breakdown">${pr.breakdown.map(x => `<div class="score-line"><span><b>${esc(x.name)}</b><br>${esc(x.note)}</span><span class="pts">${x.points}/${x.max}</span></div>`).join('')}<div class="score-total-line"><span>总分</span><span>${pr.score}｜${priorityLabel(pr.level)}优先级</span></div><div class="score-note">建议动作：${esc(pr.action || '')}</div></div>`;
}
function safeDomId(s) { return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '_'); }
function toggleScoreDetail(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}
function scoreBadgeWithDetailHtml(id, pr) {
  const domId = 'score_detail_' + safeDomId(id);
  return `<div class="popup-detail"><span class="priority-badge clickable ${pr.level}" onclick="event.stopPropagation(); toggleScoreDetail('${jsStr(domId)}')">${pr.score} ${priorityLabel(pr.level)}</span></div><div class="score-breakdown-wrap" id="${esc(domId)}">${scoreBreakdownHtml(pr)}</div>`;
}
function enrichPriority(list) { return list.map(p => ({...p, _priority: calcPriority(p)})); }
function openDashboard() { setAppTab('dashboard'); closeList(); closeMallPanel(); closeCoveragePanel(); renderDashboard(); document.getElementById('dashboardPanel').classList.add('active'); }
function closeDashboard() { document.getElementById('dashboardPanel').classList.remove('active'); if (!document.body.classList.contains('home-mode')) setAppTab('map'); }
function getPriorityPool() {
  return enrichPriority([...places, ...baseClinics.filter(p => !places.some(x => x.id === 'place_'+p.id || (x.name===p.name && x.address===p.address)))])
    .filter(p => !isPointEntry(p) && normalizeStatus(p.status) !== '已合作' && normalizeStatus(p.status) !== '暂不合作')
    .sort((a,b) => b._priority.score - a._priority.score);
}
function renderDashboard() {
  const pool = getPriorityPool();
  const high = pool.filter(p => p._priority.score >= 80).length;
  const contacted = places.filter(p => !isUncontactedPlace(p)).length;
  const interested = places.filter(p => normalizeStatus(p.status) === '有意向').length;
  const coop = places.filter(p => normalizeStatus(p.status) === '已合作').length;
  const trial = places.filter(p => (p.visits||[]).some(v => String(v.note||'').includes('试用') || String(v.note||'').includes('試用'))).length;
  const coveredMalls = malls.filter(m => (m.coopStatus||'') === '已合作').length;
  const gapMalls = malls.filter(m => (m.coopStatus||'待评估') !== '已合作').length;
  document.getElementById('dashboardCards').innerHTML = [
    ['总线索', pool.length], ['高优先级', high], ['有意向/试用', interested + trial], ['待突破商场', gapMalls]
  ].map(([label,num]) => `<div class="dash-card"><div class="num">${num}</div><div class="label">${label}</div></div>`).join('');
  document.getElementById('priorityUpdated').textContent = new Date().toLocaleString('zh-HK',{hour12:false}).slice(0,16);
  document.getElementById('priorityList').innerHTML = pool.slice(0,20).map((p,i) => {
    const pr=p._priority;
    return `<div class="dash-row" onclick="goToPlace('${jsStr(p.id)}')"><div class="dash-row-title"><span>${i+1}. ${esc(p.name)}</span><span class="priority-badge ${pr.level}">${pr.score} ${priorityLabel(pr.level)}</span></div><div class="dash-meta">${esc(pr.action || '')}<br>${esc(p.type||'')}｜${esc(pr.area)}${pr.distanceKm!==null?'｜近 '+esc(pr.nearestMall)+' '+pr.distanceKm.toFixed(1)+'km':''}</div></div>`;
  }).join('') || '<div class="list-empty">暂无优先级线索</div>';
  const riskRows = pool.map(p => ({ p, flags:riskFlags(p, p._priority) })).filter(x => x.flags.length).slice(0,8);
  document.getElementById('riskLeadList').innerHTML = riskRows.map((x,i)=>`<div class="dash-row" onclick="goToPlace('${jsStr(x.p.id)}')"><div class="dash-row-title"><span>${i+1}. ${esc(x.p.name)}</span><span class="warn-tag">${esc(x.flags[0])}</span></div><div class="dash-meta">${esc(x.p.type||'')}｜${x.p._priority.score}分｜${x.flags.map(esc).join(' / ')}</div></div>`).join('') || '<div class="list-empty">暂无明显风险/待补资料线索</div>';
  const mallGaps = malls.map(m => ({...m, hits:getMallClinics(m).length})).filter(m => (m.coopStatus||'待评估') !== '已合作').sort((a,b)=>b.hits-a.hits).slice(0,8);
  document.getElementById('mallGapList').innerHTML = mallGaps.map((m,i)=>`<div class="dash-row" onclick="selectMall('${jsStr(m.id)}')"><div class="dash-row-title"><span>${i+1}. ${esc(m.name)}</span><span>${m.hits}家</span></div><div class="dash-meta">${esc(m.area||'')}｜${esc(m.developer||'')}｜状态：${esc(m.coopStatus||'待评估')}</div></div>`).join('');
  const stages=['未接触','已交流','有意向','已合作','暂不合作']; const max=Math.max(1,...stages.map(s=>places.filter(p=>normalizeStatus(p.status)===s).length));
  document.getElementById('funnelStats').innerHTML = stages.map(s=>{ const n=places.filter(p=>normalizeStatus(p.status)===s).length; return `<div class="dash-row"><div class="dash-row-title"><span>${s}</span><span>${n}</span></div><div class="funnel-bar"><div class="funnel-fill" style="width:${n/max*100}%"></div></div></div>`; }).join('');
  const leadActions = pool.slice(0,8).map(p => ({ kind:'lead', id:p.id, text:`${p.name}｜${p._priority.score}分｜${p._priority.action}` }));
  const mallActions = mallGaps.slice(0,3).map(m => ({ kind:'mall', id:m.id, text:`扫商场：${m.name}｜1km内${m.hits}家未接触诊所` }));
  const actions = [...leadActions, ...mallActions];
  document.getElementById('actionList').innerHTML = actions.map((a,i)=>`<div class="dash-row" onclick="${a.kind==='lead' ? `goToPlace('${jsStr(a.id)}')` : `selectMall('${jsStr(a.id)}')`}"><div class="dash-row-title"><span>${i+1}. ${esc(a.text)}</span></div></div>`).join('');
}
async function exportPriorityCsv() {
  const rows = getPriorityPool().slice(0,200).map((p,i) => ({
    ...clinicExportRow(p, { distance_km: p._priority.distanceKm || '', coverage_center: p._priority.nearestMall || '', coverage_mode: 'priority_top' }),
    priority_rank: i+1,
    priority_score: p._priority.score,
    priority_action: p._priority.action,
    priority_reasons: p._priority.reasons.join(' + ')
  }));
  const headers = [...CLINIC_EXPORT_HEADERS, 'priority_rank','priority_score','priority_action','priority_reasons'];
  await downloadXlsx('BDmap_v3.4.8_priority_top200_统一字段.xlsx', headers, rows, { sheetName:'优先线索' });
  toast('已导出优先线索统一字段Excel');
}
function groupOwnerKey(p) {
  const id = getOwnerId(p);
  if (!id || id === 'base_tcm_pool' || id === normalizeOwnerId('匿名')) return 'unclaimed';
  return id;
}
function groupOwnerLabel(key, rows) {
  if (key === 'unclaimed') return '未认领';
  const p = rows.find(x => groupOwnerKey(x) === key);
  return p ? getOwnerLabel(p) : key;
}
async function copyDashboardSummary() {
  const pool = getPriorityPool();
  const pushed = places.filter(p => !isPointEntry(p));
  const totalHigh = pool.filter(p => p._priority.score >= 80).length;
  const totalInterested = pushed.filter(p => normalizeStatus(p.status) === '有意向').length;
  const totalCoop = pushed.filter(p => normalizeStatus(p.status) === '已合作').length;
  const totalError = pushed.filter(hasLeadError).length;
  const ownerKeys = [...new Set([...pushed.map(groupOwnerKey), ...pool.slice(0,80).map(groupOwnerKey)])];
  ownerKeys.sort((a,b) => {
    if (a === 'unclaimed') return 1;
    if (b === 'unclaimed') return -1;
    const ac = pushed.filter(p => groupOwnerKey(p) === a).length;
    const bc = pushed.filter(p => groupOwnerKey(p) === b).length;
    return bc - ac;
  });
  const ownerBlocks = ownerKeys.map(key => {
    const ownerPlaces = pushed.filter(p => groupOwnerKey(p) === key);
    const ownerPool = pool.filter(p => groupOwnerKey(p) === key);
    const label = groupOwnerLabel(key, [...ownerPlaces, ...ownerPool]);
    const stats = [
      `线索${ownerPlaces.length}`,
      `高优先${ownerPool.filter(p => p._priority.score >= 80).length}`,
      `已交流${ownerPlaces.filter(p => normalizeStatus(p.status) === '已交流').length}`,
      `有意向${ownerPlaces.filter(p => normalizeStatus(p.status) === '有意向').length}`,
      `已合作${ownerPlaces.filter(p => normalizeStatus(p.status) === '已合作').length}`,
      `待核实${ownerPlaces.filter(hasLeadError).length}`
    ].join('｜');
    const top = ownerPool.slice(0,3).map((p,i)=>`  ${i+1}. ${p.name}｜${p._priority.score}分｜${p._priority.action}`).join('\n') || '  - 暂无优先线索';
    return `【${label}】${stats}\n${top}`;
  }).join('\n\n');
  const unclaimedPool = pool.filter(p => groupOwnerKey(p) === 'unclaimed');
  const text = `BDmap v3.5.8 今日BD汇报摘要\n总优先池：${pool.length}\n高优先级：${totalHigh}\n已推进机构：${pushed.filter(p=>!isUncontactedPlace(p)).length}\n有意向：${totalInterested}\n已合作：${totalCoop}\n待核实：${totalError}\n未认领优先线索：${unclaimedPool.length}\n\n按用户拆分：\n${ownerBlocks}`;
  await navigator.clipboard.writeText(text); toast('已复制按用户拆分的汇报摘要');
}


// ============ BATCH SHOP IMPORT v3.6.10 ============
let batchShopPreviewRows = [];
let importFailureRows = [];
const BATCH_SHOP_HEADERS = ['店铺名称','类型','地址','区域','联系人','电话','来源','备注','认领人','状态','lat','lng'];
function openBatchShopImport(){
  const m=document.getElementById('batchShopModal'); if(m) m.classList.add('active'); renderBatchShopPreview();
}
function closeBatchShopImport(){ const m=document.getElementById('batchShopModal'); if(m) m.classList.remove('active'); }
function triggerBatchShopUpload(){ const input=document.getElementById('batchShopFile'); if(input){ input.value=''; input.click(); } }
function getRowAny(row, names){
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && String(row[n]).trim() !== '') return String(row[n]).trim();
  }
  return '';
}
function normalizePhoneText(s){ return String(s||'').replace(/[^0-9+]/g,''); }
function isCoarseAddress(addr){
  const a=String(addr||'').trim();
  if (!a) return true;
  if (a.length < 8) return true;
  if (/附近|某|一帶|一带|周邊|周边|商場內|商场内/.test(a)) return true;
  return false;
}
function findPotentialDuplicatesForShop(draft, stagedRows=[]){
  const nameKey=normalizeClinicText(draft.name), addrKey=normalizeClinicText(draft.address), phoneKey=normalizePhoneText(draft.phone);
  const all=[...places, ...deletedPlaces, ...baseClinics, ...stagedRows];
  return all.filter(p=>{
    const pn=normalizeClinicText(p.name), pa=normalizeClinicText(p.address), pp=normalizePhoneText(p.phone || p.contact);
    if (nameKey && addrKey && pn===nameKey && pa===addrKey) return true;
    if (phoneKey && phoneKey.length>=6 && pp && pp===phoneKey) return true;
    if (nameKey && addrKey && pn===nameKey && (pa.includes(addrKey) || addrKey.includes(pa))) return true;
    return false;
  }).slice(0,3);
}
function makeBatchShopId(name,address){
  const raw=(String(name||'shop')+'_'+String(address||'')).toLowerCase();
  let h=0; for(let i=0;i<raw.length;i++) h=((h<<5)-h+raw.charCodeAt(i))|0;
  return 'batch_' + Math.abs(h).toString(36) + '_' + Date.now().toString(36).slice(-4);
}
async function geocodeBatchShopAddress(address){
  const q=String(address||'').trim();
  if (!q) return null;
  const url='https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=hk&accept-language=zh&q=' + encodeURIComponent(q);
  const r=await fetch(url, { headers:{ 'Accept':'application/json' }});
  if (!r.ok) throw new Error('geocode failed');
  const arr=await r.json();
  if (!arr || !arr.length) return null;
  const lat=parseFloat(arr[0].lat), lng=parseFloat(arr[0].lon);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng, displayName: arr[0].display_name || '' };
}
async function handleBatchShopFile(event){
  const file=event.target.files && event.target.files[0];
  if (!file) return;
  if (!window.ExcelJS) { toast('Excel组件未加载，无法上传xlsx'); return; }
  openBatchShopImport();
  const summary=document.getElementById('batchShopSummary'); if(summary) summary.textContent='正在读取Excel...';
  try{
    const buf=await file.arrayBuffer();
    const wb=new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    const ws=wb.worksheets[0]; if(!ws){ toast('Excel没有工作表'); return; }
    const rows=[];
    for(let r=2;r<=ws.rowCount;r++){
      const obj=rowObjectFromWorksheet(ws,r);
      const name=getRowAny(obj,['店铺名称','店鋪名稱','机构名称','機構名稱','诊所名称','診所名稱','name','Name']);
      const address=getRowAny(obj,['地址','address','Address']);
      const phone=getRowAny(obj,['电话','電話','phone','Phone','联系电话','聯絡電話']);
      const type=getRowAny(obj,['类型','類型','type','Type']) || '中医诊所';
      const district=getRowAny(obj,['区域','區域','district','District']);
      const contact=getRowAny(obj,['联系人','聯絡人','contact','Contact']);
      const source=getRowAny(obj,['来源','來源','source','Source']) || '批量导入';
      const note=getRowAny(obj,['备注','備註','note','Note']);
      const ownerName=getRowAny(obj,['认领人','認領人','owner_name','ownerName']) || (currentUsername || '匿名');
      const status=getRowAny(obj,['状态','狀態','status','Status']) || '待跟进';
      const latRaw=getRowAny(obj,['lat','纬度','緯度','latitude']);
      const lngRaw=getRowAny(obj,['lng','经度','經度','longitude','lon']);
      if(!name && !address && !phone) continue;
      const item={ rowNumber:r, name, address, phone, type, district, contact, source, note, ownerName, status, lat:parseFloat(latRaw), lng:parseFloat(lngRaw), messages:[], importable:true, coordStatus:'待处理', duplicateMatches:[] };
      if(!name){ item.importable=false; item.messages.push('缺店铺名称'); }
      if(!address){ item.messages.push('缺地址'); }
      const hasCoords=window.BDMapImportSafety && window.BDMapImportSafety.isValidHongKongCoordinate(item.lat,item.lng);
      if(hasCoords){ item.coordStatus='已提供坐标'; }
      else if(!address){ item.coordStatus='坐标待核点'; item.lat=null; item.lng=null; item.importable=false; item.messages.push('无地址且无有效坐标，默认拦截'); }
      else { item.coordStatus='等待自动定位'; }
      item.duplicateMatches=findPotentialDuplicatesForShop(item, rows);
      if(item.duplicateMatches.length){ item.importable=false; item.messages.push('疑似重复，默认拦截：'+item.duplicateMatches.map(x=>x.name).join(' / ')); }
      rows.push(item);
    }
    batchShopPreviewRows=rows;
    renderBatchShopPreview();
    await geocodeBatchShopRows();
  }catch(err){ console.error(err); toast('批量导入读取失败'); if(summary) summary.textContent='读取失败：请检查Excel格式'; }
  event.target.value='';
}
async function geocodeBatchShopRows(){
  const targets=batchShopPreviewRows.filter(x=>x.importable && x.coordStatus==='等待自动定位');
  for(let i=0;i<targets.length;i++){
    const row=targets[i];
    const summary=document.getElementById('batchShopSummary'); if(summary) summary.textContent=`正在自动定位 ${i+1}/${targets.length}：${row.name}`;
    if(isCoarseAddress(row.address)){ row.coordStatus='坐标待核点'; row.importable=false; row.messages.push('地址偏粗，需核点，默认拦截'); row.lat=null; row.lng=null; renderBatchShopPreview(); continue; }
    try{
      const geo=await geocodeBatchShopAddress(row.address + ' 香港');
      if(geo && window.BDMapImportSafety.isValidHongKongCoordinate(geo.lat,geo.lng)){ row.lat=geo.lat; row.lng=geo.lng; row.coordStatus='自动定位'; row.geocodeAddress=geo.displayName; }
      else { row.coordStatus='坐标待核点'; row.importable=false; row.messages.push('自动定位失败，默认拦截'); row.lat=null; row.lng=null; }
    }catch(e){ row.coordStatus='坐标待核点'; row.importable=false; row.messages.push('定位服务失败，默认拦截'); row.lat=null; row.lng=null; }
    renderBatchShopPreview();
    await new Promise(res=>setTimeout(res, 350));
  }
  renderBatchShopPreview();
}
function renderBatchShopPreview(){
  const tbody=document.querySelector('#batchShopTable tbody');
  const summary=document.getElementById('batchShopSummary');
  if(!tbody || !summary) return;
  const rows=batchShopPreviewRows;
  if(!rows.length){ tbody.innerHTML='<tr><td colspan="7" class="muted">等待上传Excel</td></tr>'; summary.textContent='还没上传文件。建议销售至少填写：店铺名称、地址、电话。'; return; }
  const importable=rows.filter(x=>x.importable).length, dup=rows.filter(x=>x.duplicateMatches.length).length, pending=rows.filter(x=>String(x.coordStatus).includes('待核')).length, bad=rows.filter(x=>!x.importable).length;
  summary.textContent=`读取 ${rows.length} 行｜安全可导入 ${importable}｜疑似重复拦截 ${dup}｜坐标待核拦截 ${pending}｜不可导入 ${bad}`;
  tbody.innerHTML=rows.slice(0,220).map(x=>{
    const cls=!x.importable?'err':(x.duplicateMatches.length || String(x.coordStatus).includes('待核')?'warn':'ok');
    const status=!x.importable?'不可导入':(x.duplicateMatches.length?'疑似重复':'可导入');
    const coord=(x.lat&&x.lng)?`${Number(x.lat).toFixed(6)},${Number(x.lng).toFixed(6)}<br><span class="muted">${esc(x.coordStatus)}</span>`:esc(x.coordStatus);
    return `<tr><td>${x.rowNumber}</td><td class="${cls}">${status}</td><td><b>${esc(x.name)}</b><br><span class="muted">${esc(x.type)} · ${esc(x.source)}</span></td><td>${esc(x.address||'')}</td><td>${esc(x.phone||'')}</td><td>${coord}</td><td>${esc(x.messages.join('；') || '—')}</td></tr>`;
  }).join('');
}
async function downloadBatchShopTemplate(){
  const rows=[{ '店铺名称':'示例中医诊所', '类型':'中医诊所', '地址':'香港九龙观塘开源道XX号XX大厦地下X号铺', '区域':'观塘', '联系人':'陈生', '电话':'91234567', '来源':'销售扫街', '备注':'示例行，可删除', '认领人':currentUsername||'销售A', '状态':'待跟进', 'lat':'', 'lng':'' }];
  await downloadXlsx('BDmap_批量导入店铺模板.xlsx', BATCH_SHOP_HEADERS, rows, { sheetName:'批量导入店铺' });
  toast('已下载批量导入模板');
}
async function confirmBatchShopImport(){
  const rows=batchShopPreviewRows.filter(x=>x.importable && x.importStatus!=='已导入');
  if(!rows.length){ toast('没有可导入行'); return; }
  if(!confirm(`确认只导入 ${rows.length} 条安全行？疑似重复和坐标待核默认不会写入。`)) return;
  const now=new Date().toISOString();
  let ok=0, fail=0;
  for(const r of rows){
    const latestDuplicates=findPotentialDuplicatesForShop(r);
    if(latestDuplicates.length){
      fail++;
      r.importStatus='最终查重拦截';
      r.failureMessage='确认前发现疑似重复：'+latestDuplicates.map(x=>x.name||x.id).join(' / ');
      importFailureRows.push({...r});
      continue;
    }
    const ownerName=r.ownerName || currentUsername || '匿名';
    const data={ id:makeBatchShopId(r.name,r.address), name:r.name, entryKind:'institution', type:r.type||'中医诊所', address:r.address||'', district:r.district||'', contact:r.contact||'', phone:r.phone||'', status:r.status||'待跟进', lat:Number(r.lat), lng:Number(r.lng), source:r.source||'批量导入', note:r.note||'', visits:[{date:now.slice(0,10), by:currentUsername||'匿名', byAvatar:currentAvatar, note:'批量导入' + (r.note ? '：'+r.note : '')}], ownerId:normalizeOwnerId(ownerName), ownerName, ownerAvatar: ownerName===(currentUsername||'匿名') ? currentAvatar : '👤', createdAt:now, createdBy:currentUsername||'匿名', createdByAvatar:currentAvatar, updatedAt:now, updatedBy:currentUsername||'匿名', updatedByAvatar:currentAvatar, importSource:'batch_shop_import', geocodeStatus:r.coordStatus, geocodeAddress:r.geocodeAddress||'', revision:0 };
    try{
      const saved = await saveToFirestore(data, null);
      places.push(saved);
      r.importStatus='已导入';
      r.failureMessage='';
      ok++;
    }catch(e){
      console.error(e);
      fail++;
      r.importStatus='云端失败';
      r.failureMessage=e && e.message ? e.message : '云端写入失败';
      importFailureRows.push({...r});
    }
  }
  clearCoverageCache(); savePlaces(); renderOwnerFilters(); updateMapFilterBar(); scheduleLeadHomeRender(); renderMarkers(); updateStats();
  toast(`批量导入完成：成功 ${ok}，失败 ${fail}`);
  alert(`批量导入完成\n成功：${ok}\n失败：${fail}\n预审拦截：${batchShopPreviewRows.length-rows.length}\n失败项可导出后修正重试。`);
}
async function exportBatchShopReviewXlsx(){
  const reviewRows=[...batchShopPreviewRows, ...importFailureRows];
  if(!reviewRows.length){ toast('还没有预览或失败数据'); return; }
  const headers=['row','name','address','type','phone','contact','source','status','lat','lng','coord_status','import_status','importable','messages','failure_message'];
  const seen=new Set();
  const rows=reviewRows.filter(x=>{
    const key=[x.rowNumber,x.name,x.address,x.failureMessage||''].join('|');
    if(seen.has(key)) return false;
    seen.add(key); return true;
  }).map(x=>({ row:x.rowNumber, name:x.name, address:x.address, type:x.type, phone:x.phone, contact:x.contact, source:x.source, status:x.status, lat:x.lat||'', lng:x.lng||'', coord_status:x.coordStatus, import_status:x.importStatus||'', importable:x.importable?'Y':'N', messages:(x.messages||[]).join('；'), failure_message:x.failureMessage||'' }));
  await downloadXlsx('BDmap_批量导入店铺_待核失败表.xlsx', headers, rows, { sheetName:'待核失败表' });
  toast('已导出待核/失败表');
}

function triggerBatchErrorImport() {
  const input = document.getElementById('batchErrorFile');
  if (input) { input.value = ''; input.click(); }
}
function rowObjectFromWorksheet(ws, rowNumber) {
  const headers = [];
  ws.getRow(1).eachCell((cell, col) => headers[col] = String(cell.value || '').trim());
  const obj = { _rowNumber: rowNumber };
  ws.getRow(rowNumber).eachCell({ includeEmpty:true }, (cell, col) => {
    const h = headers[col]; if (!h) return;
    obj[h] = cell.value && typeof cell.value === 'object' && cell.value.text ? cell.value.text : (cell.value || '');
  });
  return obj;
}
function findClinicForImport(row) {
  const id = String(row.clinic_id || '').trim();
  const baseId = String(row.source_base_id || '').trim();
  const name = String(row.name || '').trim();
  const address = String(row.address || '').trim();
  if (id) {
    const hit = places.find(p => p.id === id || p.id === 'place_' + id) || baseClinics.find(p => p.id === id);
    if (hit) return hit;
  }
  if (baseId) {
    const hit = places.find(p => p.sourceBaseId === baseId || p.id === 'place_' + baseId) || baseClinics.find(p => p.id === baseId);
    if (hit) return hit;
  }
  if (name || address) {
    const key = clinicMatchKey({ name, address });
    return places.find(p => clinicMatchKey(p) === key) || baseClinics.find(p => clinicMatchKey(p) === key) || null;
  }
  return null;
}
function makeImportEditableRecord(match, row) {
  const existing = places.find(x => x.id === match.id || x.id === 'place_' + match.id || x.sourceBaseId === match.id || clinicMatchKey(x) === clinicMatchKey(match));
  const now = new Date().toISOString();
  if (existing) return { ...existing };
  return { ...match, id: match.isBaseClinic ? 'place_' + match.id : (match.id || 'place_' + Date.now().toString(36)), isBaseClinic:false, sourceBaseId: match.id, createdAt:now };
}
async function handleBatchErrorImport(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!window.ExcelJS) { toast('Excel组件未加载，无法上传xlsx'); return; }
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) { toast('Excel没有工作表'); return; }
  const allowed = new Set(ERROR_UPLOAD_ACTIONS.filter(Boolean));
  const now = new Date().toISOString();
  const stats = { total:0, processed:0, skipped:0, failed:0, fixed:0 };
  const byType = {};
  const failures = [];
  for (let r=2; r<=ws.rowCount; r++) {
    const row = rowObjectFromWorksheet(ws, r);
    const action = String(row.error_upload_action || '').trim();
    const note = String(row.error_note || '').trim();
    if (!action) { stats.skipped++; continue; }
    stats.total++;
    if (!allowed.has(action)) { stats.failed++; failures.push(`第${r}行：无效动作 ${action}`); continue; }
    const match = findClinicForImport(row);
    if (!match) { stats.failed++; failures.push(`第${r}行：找不到匹配诊所 ${row.name || row.clinic_id || ''}`); continue; }
    const data = makeImportEditableRecord(match, row);
    const original = places.find(x => x.id === data.id);
    const expectedRevision = original ? (Number(original.revision) || 0) : null;
    if (action === '已修正') {
      data.resolvedReports = [...(data.resolvedReports||[]), { type:data.dataQualityIssueType || data.dataQualityStatus || '报错', note, by:currentUsername || '匿名', byAvatar:currentAvatar, at:now, source:'batch_upload' }];
      data.dataQualityStatus = ''; data.dataQualityIssueType = ''; data.resolvedAt = now; data.resolvedBy = currentUsername || '匿名'; data.resolveNote = note;
      stats.fixed++;
    } else {
      data.errorReports = [...(data.errorReports||[]), { type:action, note, by:currentUsername || '匿名', byAvatar:currentAvatar, at:now, source:'batch_upload' }];
      data.dataQualityStatus = '待核实'; data.dataQualityIssueType = action;
      byType[action] = (byType[action] || 0) + 1;
    }
    data.updatedAt = now; data.updatedBy = currentUsername || '匿名'; data.updatedByAvatar = currentAvatar;
    try {
      const saved = await saveToFirestore(data, expectedRevision);
      const idx = places.findIndex(x => x.id === saved.id);
      if (idx >= 0) places[idx] = saved; else places.push(saved);
      stats.processed++;
    } catch(e) { console.error(e); stats.failed++; failures.push(`第${r}行：云端保存失败 ${data.name || data.id}`); }
  }
  clearCoverageCache(); savePlaces(); scheduleLeadHomeRender(); renderMarkers(); updateStats();
  const typeText = Object.entries(byType).map(([k,v])=>`${k}:${v}`).join('，') || '无';
  const report = `批量报错上传完成\n有效动作行：${stats.total}\n已处理：${stats.processed}\n跳过空白：${stats.skipped}\n已修正：${stats.fixed}\n失败：${stats.failed}\n分类：${typeText}${failures.length ? '\n\n失败明细：\n' + failures.slice(0,20).join('\n') : ''}`;
  alert(report);
  toast('批量报错上传完成');
}
function openTopPriorityOnMap() {
  const top=getPriorityPool()[0]; if(!top){toast('暂无线索');return;} closeDashboard(); goToPlace(top.id);
}
function updateStats() {
  const el = document.getElementById('statsText');
  const selectedMall = getCoverageTargetById(selectedMallId);
  if (selectedMall) {
    el.textContent = `${COVERAGE_LABEL}覆盖 · ${getFilteredPlaces().length} 显示`;
  } else {
    const high = getPriorityPool().filter(p => p._priority.score >= 80).length;
    el.textContent = getFilteredPlaces().length + ' 显示 / 高优先 ' + high;
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}


function showLoading() { document.getElementById('loading').classList.add('show'); }
function hideLoading() { document.getElementById('loading').classList.remove('show'); }

// ============ EVENT BINDINGS ============
document.getElementById('btnAdd').onclick = () => {
  toast('📍 点击地图选择位置，或直接使用当前位置');
  tapMode = true;
  // Also open sheet with current position after a short delay if no tap
  setTimeout(() => {
    if (tapMode) {
      tapMode = false;
      openAddSheet();
    }
  }, 5000);
};

document.getElementById('btnGps').onclick = () => locateMe(false);
document.getElementById('btnMall').onclick = openMallPanel;
document.getElementById('btnSettings').onclick = openSettings;
document.getElementById('btnSearch').onclick = openSearch;
document.getElementById('sheetOverlay').onclick = closeSheet;

// Status chips
document.querySelectorAll('.status-chip').forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll('.status-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  };
});

// List filters (only bind to list panel chips, not district chips)
document.querySelectorAll('#listFilters .filter-chip').forEach(chip => {
  chip.onclick = () => {
    if (!chip.dataset.filter) return;
    document.querySelectorAll('#listFilters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderMarkers();
    renderList();
  };
});

// Search on enter
document.getElementById('searchInput').onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };

// District buttons
document.querySelectorAll('.district-chip').forEach(chip => {
  chip.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    selectDistrict(this);
  });
});

// Init
renderOwnerFilters();
init();
