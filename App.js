import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, setDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PLATFORM_FEE_PERCENT = 5;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function formatBidDate(createdAt) {
  if (!createdAt) return "";
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return "Bid placed " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

function formatListedDate(createdAt) {
  if (!createdAt) return "";
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return "Listed " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

const CAR_DATA = {
  "Toyota": ["4Runner", "86", "Avalon", "C-HR", "Camry", "Celica", "Corolla", "Cressida", "Crown", "Echo", "FJ Cruiser", "GR Corolla", "GR Supra", "GR86", "Highlander", "Land Cruiser", "Matrix", "Mirai", "MR2", "Paseo", "Pickup", "Previa", "Prius", "Prius C", "Prius Prime", "Prius V", "RAV4", "Sequoia", "Sienna", "Solara", "Stout", "Supra", "T100", "Tacoma", "Tercel", "Tundra", "Van", "Venza", "Yaris"],
  "Ford": ["Aerostar", "Aspire", "Bronco", "Bronco II", "Bronco Sport", "C-Max", "Contour", "Courier", "Crown Victoria", "E-150", "E-250", "E-350", "E-450", "EcoSport", "Econoline", "Edge", "Escape", "Escort", "Excursion", "Expedition", "Expedition Max", "Explorer", "Explorer Sport", "Explorer Sport Trac", "F-150", "F-250", "F-350", "F-450", "F-550", "Festiva", "Fiesta", "Five Hundred", "Flex", "Focus", "Freestar", "Freestyle", "Fusion", "Galaxie", "GT", "LTD", "Maverick", "Mustang", "Pinto", "Probe", "Ranger", "Super Duty", "Taurus", "Taurus X", "Tempo", "Thunderbird", "Transit", "Transit Connect", "Windstar"],
  "Chevrolet": ["Astro", "Avalanche", "Aveo", "Beretta", "Blazer", "Bolt", "Camaro", "Caprice", "Captiva", "Cavalier", "Cobalt", "Colorado", "Corsica", "Corvette", "Cruze", "Equinox", "Express", "HHR", "Impala", "Lumina", "Lumina APV", "Malibu", "Metro", "Monte Carlo", "Nova", "Prizm", "S-10", "Silverado", "Sonic", "Spark", "SS", "SSR", "Suburban", "Tahoe", "Tracker", "TrailBlazer", "Traverse", "Trax", "Uplander", "Venture", "Volt"],
  "Honda": ["Accord", "Accord Crosstour", "Civic", "Civic Type R", "Clarity", "CR-V", "CR-Z", "Crosstour", "del Sol", "Element", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Prelude", "Ridgeline", "S2000"],
  "Nissan": ["240SX", "280ZX", "300ZX", "350Z", "370Z", "Altima", "Armada", "Cube", "Frontier", "GT-R", "Hardbody", "Juke", "Kicks", "Leaf", "Maxima", "Murano", "NV1500", "NV200", "NV2500", "NV3500", "Pathfinder", "Pickup", "Pulsar", "Quest", "Rogue", "Rogue Sport", "Sentra", "Stanza", "Titan", "Titan XD", "Versa", "Versa Note", "Xterra", "Z"],
  "Dodge": ["Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Dakota", "Daytona", "Durango", "Grand Caravan", "Hornet", "Intrepid", "Journey", "Magnum", "Neon", "Nitro", "Omni", "Ram 1500", "Ram 2500", "Ram 3500", "Ram ProMaster", "Ram ProMaster City", "Stealth", "Stratus", "Viper"],
  "Jeep": ["Cherokee", "CJ-5", "CJ-7", "Comanche", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L", "Grand Wagoneer", "Liberty", "Patriot", "Renegade", "Wagoneer", "Wrangler", "Wrangler Unlimited"],
  "GMC": ["Acadia", "Acadia Limited", "Canyon", "Envoy", "Envoy XL", "Hummer", "Jimmy", "S-15", "Safari", "Savana", "Sierra", "Sierra 1500", "Sierra 2500HD", "Sierra 3500HD", "Sonoma", "Suburban", "Syclone", "Terrain", "Topkick", "Typhoon", "Yukon", "Yukon Denali", "Yukon XL"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i7", "i8", "iX", "M2", "M3", "M4", "M5", "M6", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z3", "Z4"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "B-Class", "C-Class", "CL-Class", "CLA", "CLK-Class", "CLS", "E-Class", "EQE", "EQS", "G-Class", "GL-Class", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "M-Class", "Metris", "ML-Class", "R-Class", "S-Class", "SL", "SLC", "SLK", "Sprinter"],
  "Hyundai": ["Accent", "Azera", "Elantra", "Elantra GT", "Entourage", "Equus", "Genesis", "Genesis Coupe", "IONIQ 5", "IONIQ 6", "Ioniq", "Kona", "Nexo", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Tiburon", "Tucson", "Veloster", "Venue", "Veracruz", "XG350"],
  "Kia": ["Amanti", "Borrego", "Cadenza", "Carnival", "EV6", "EV9", "Forte", "K5", "K900", "Niro", "Optima", "Rio", "Rondo", "Sedona", "Sephia", "Sorento", "Soul", "Spectra", "Sportage", "Stinger", "Telluride"],
  "Subaru": ["Ascent", "B9 Tribeca", "Baja", "Brat", "BRZ", "Crosstrek", "Forester", "Impreza", "Justy", "Legacy", "Outback", "SVX", "Tribeca", "WRX", "WRX STI", "XT", "XV Crosstrek"],
  "Volkswagen": ["Arteon", "Atlas", "Atlas Cross Sport", "Beetle", "Cabrio", "CC", "Corrado", "Eos", "Eurovan", "Golf", "GTI", "ID.4", "Jetta", "Passat", "Phaeton", "R32", "Rabbit", "Routan", "Tiguan", "Touareg", "Vanagon"],
  "Volvo": ["240", "850", "940", "960", "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"],
  "Chrysler": ["200", "300", "300C", "300M", "Aspen", "Cirrus", "Concorde", "Crossfire", "LeBaron", "LHS", "New Yorker", "Pacifica", "PT Cruiser", "Sebring", "Town and Country", "Voyager"],
  "Buick": ["Cascada", "Century", "Electra", "Enclave", "Encore", "Encore GX", "Envision", "LaCrosse", "LeSabre", "Lucerne", "Park Avenue", "Rainier", "Regal", "Rendezvous", "Riviera", "Roadmaster", "Skylark", "Terraza", "Verano"],
  "Cadillac": ["Allante", "ATS", "Brougham", "Catera", "Celestiq", "CT4", "CT5", "CT6", "CTS", "DeVille", "DTS", "Eldorado", "ELR", "Escalade", "Escalade ESV", "Escalade EXT", "Fleetwood", "Lyriq", "Seville", "SRX", "STS", "XLR", "XT4", "XT5", "XT6", "XTS"],
  "Lexus": ["CT", "ES", "GS", "GX", "HS", "IS", "LC", "LFA", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "TX", "UX"],
  "Acura": ["CL", "CSX", "EL", "ILX", "Integra", "Legend", "MDX", "NSX", "RDX", "RL", "RLX", "RSX", "SLX", "TL", "TLX", "TSX", "Vigor", "ZDX"],
  "Infiniti": ["EX", "FX", "G20", "G35", "G37", "I30", "I35", "J30", "JX35", "M30", "M35", "M37", "M45", "M56", "Q40", "Q45", "Q50", "Q60", "Q70", "QX30", "QX4", "QX50", "QX55", "QX56", "QX60", "QX70", "QX80"],
  "Mazda": ["2", "3", "5", "6", "626", "929", "B-Series", "CX-3", "CX-30", "CX-5", "CX-50", "CX-7", "CX-9", "CX-90", "Mazda3", "Mazda6", "MPV", "MX-3", "MX-30", "MX-5 Miata", "MX-6", "Protege", "RX-7", "RX-8", "Tribute"],
  "Mitsubishi": ["3000GT", "Diamante", "Eclipse", "Eclipse Cross", "Endeavor", "Galant", "i-MiEV", "Lancer", "Lancer Evolution", "Mighty Max", "Mirage", "Montero", "Montero Sport", "Outlander", "Outlander Sport", "Raider", "Sigma", "Starion"],
  "Pontiac": ["6000", "Aztek", "Bonneville", "Catalina", "Fiero", "Firebird", "G3", "G5", "G6", "G8", "Grand Am", "Grand Prix", "GTO", "Montana", "Parisienne", "Solstice", "Sunbird", "Sunfire", "Torrent", "Trans Am", "Trans Sport", "Vibe", "Wave"],
  "Saturn": ["Astra", "Aura", "Ion", "L-Series", "LS", "LW", "Outlook", "Relay", "SC", "SL", "Sky", "SW", "Vue"],
  "Oldsmobile": ["88", "98", "Achieva", "Alero", "Aurora", "Bravada", "Cutlass", "Cutlass Calais", "Cutlass Ciera", "Cutlass Supreme", "Eighty-Eight", "Firenza", "Intrigue", "Ninety-Eight", "Omega", "Silhouette", "Toronado"],
  "Other": ["Other"]
};

const TRIM_DATA = {
  "Toyota": ["Adventure", "Base", "CE", "DLX", "Hybrid", "L", "LE", "Limited", "Nightshade", "Platinum", "S", "SE", "SR", "SR5", "Standard", "TRD", "TRD Off-Road", "TRD Pro", "TRD Sport", "XLE", "XRT", "XSE", "Other"],
  "Ford": ["Base", "Bullitt", "Cobra", "EcoBoost", "FX2", "FX4", "GT", "Heritage", "King Ranch", "Lariat", "Lightning", "Limited", "LX", "Mach 1", "Platinum", "Premium", "Raptor", "S", "SE", "SEL", "Shelby GT350", "Shelby GT500", "ST", "ST-Line", "STX", "Super Cab", "Super Crew", "Titanium", "Tremor", "Wildtrak", "XL", "XLT", "Other"],
  "Chevrolet": ["Base", "Custom", "High Country", "LS", "LT", "LT Trail Boss", "LTZ", "Premier", "RS", "RST", "Sport", "SS", "Stingray", "Trail Boss", "Work Truck", "Z51", "Z71", "Z06", "ZL1", "ZR1", "ZR2", "Other"],
  "Honda": ["Base", "DX", "EX", "EX-L", "HF", "Hybrid", "LX", "Performance", "Si", "Sport", "Sport Touring", "Special Edition", "Touring", "Type R", "Other"],
  "Nissan": ["Base", "Midnight Edition", "NISMO", "Platinum", "Platinum Reserve", "Pro-4X", "S", "SE", "SL", "SR", "SV", "Other"],
  "Dodge": ["ACR", "Big Horn", "Crew", "Demon", "GT", "Laramie", "Limited", "Lone Star", "Longhorn", "Outdoorsman", "Power Wagon", "Rebel", "Redeye", "R/T", "Scat Pack", "SE", "SRT 392", "SRT Hellcat", "SRT-4", "SXT", "Tradesman", "TRX", "Other"],
  "Jeep": ["4xe", "75th Anniversary", "Altitude", "Freedom", "High Altitude", "Latitude", "Limited", "North Edition", "Overland", "Rubicon", "Rubicon 392", "Sahara", "Sport", "Sport S", "Summit", "Trailhawk", "Trailhawk Elite", "Unlimited", "Willys", "X", "Other"],
  "GMC": ["AT4", "AT4X", "Base", "Denali", "Denali Ultimate", "Edition 1", "Elevation", "Pro", "SLE", "SLT", "Other"],
  "BMW": ["Base", "M", "M Competition", "M Performance", "M Sport", "sDrive", "xDrive", "Other"],
  "Mercedes-Benz": ["4MATIC", "AMG", "AMG Black Series", "AMG Line", "AMG S", "Base", "Maybach", "Premium", "Other"],
  "Hyundai": ["Blue", "Calligraphy", "GLS", "Limited", "N", "N Line", "SE", "SEL", "SEL Plus", "Sport", "Sport Touring", "Ultimate", "Value Edition", "Other"],
  "Kia": ["EX", "GT", "GT-Line", "LX", "Nightfall", "Prestige", "S", "SX", "SX Prestige", "X-Line", "Other"],
  "Subaru": ["Base", "Limited", "Limited XT", "Onyx Edition", "Onyx Edition XT", "Premium", "Sport", "Sport XT", "STI", "Touring", "Touring XT", "Wilderness", "Other"],
  "Volkswagen": ["GLI", "GTI", "R", "R-Line", "S", "SE", "SEL", "SEL Premium", "Sport", "Trendline", "Other"],
  "Volvo": ["B5", "B6", "Core", "Cross Country", "Inscription", "Inscription Expression", "Momentum", "Plus", "Polestar Engineered", "R-Design", "Recharge", "T5", "T6", "T8", "Ultimate", "Other"],
  "Chrysler": ["300C", "300S", "Limited", "LX", "Pinnacle", "Platinum", "S", "Touring", "Touring-L", "Other"],
  "Buick": ["Avenir", "Base", "Essence", "Preferred", "Sport Touring", "ST", "Other"],
  "Cadillac": ["Base", "Blackwing", "Luxury", "Platinum", "Premium Luxury", "Sport", "V-Series", "Other"],
  "Lexus": ["Base", "F", "F Sport", "F Sport Handling", "F Sport Performance", "L", "Luxury", "Premium", "Ultra Luxury", "Other"],
  "Acura": ["A-Spec", "Advance", "Advance Package", "Base", "Technology", "Type S", "Other"],
  "Infiniti": ["Autograph", "Base", "Luxe", "Pure", "Red Sport", "Red Sport 400", "Sensory", "Sport", "Other"],
  "Mazda": ["Carbon Edition", "Grand Touring", "Preferred", "Premium", "Premium Plus", "Select", "Signature", "Sport", "Touring", "Other"],
  "Mitsubishi": ["BE", "DE", "ES", "GS", "GT", "GTS", "LE", "LS", "OZ Rally", "Ralliart", "SE", "SEL", "XLS", "Other"],
  "Pontiac": ["Base", "GT", "GTP", "GXP", "SE", "SLE", "V6", "Other"],
  "Saturn": ["Base", "Red Line", "SC", "SL", "SW", "XE", "XR", "Other"],
  "Oldsmobile": ["Base", "GL", "GLS", "GX", "SL", "SLE", "Other"],
  "Other": ["Base", "Limited", "Premium", "Sport", "Standard", "Other"]
};

const MODEL_TRIM_DATA = {
  "Dodge|Charger": ["Base", "GT", "GT Plus", "Pursuit", "R/T", "R/T Plus", "R/T Scat Pack", "R/T Scat Pack Widebody", "SE", "SRT 392", "SRT Hellcat", "SRT Hellcat Widebody", "SXT", "SXT Plus", "Other"],
  "Dodge|Challenger": ["Base", "GT", "R/T", "R/T Scat Pack", "R/T Scat Pack Widebody", "SE", "SRT 392", "SRT Demon", "SRT Hellcat", "SRT Hellcat Redeye", "SRT Hellcat Widebody", "SXT", "T/A", "Other"],
  "Dodge|Durango": ["Citadel", "GT", "Limited", "R/T", "R/T 392", "SRT 392", "SRT Hellcat", "SXT", "Other"],
  "Dodge|Ram 1500": ["Big Horn", "Laramie", "Laramie Longhorn", "Limited", "Lone Star", "Outdoorsman", "Rebel", "ST", "SXT", "Tradesman", "TRX", "Other"],
  "Dodge|Ram 2500": ["Big Horn", "Laramie", "Laramie Longhorn", "Limited", "Lone Star", "Outdoorsman", "Power Wagon", "ST", "SXT", "Tradesman", "Other"],
  "Dodge|Ram 3500": ["Big Horn", "Laramie", "Laramie Longhorn", "Limited", "Lone Star", "Outdoorsman", "Power Wagon", "ST", "SXT", "Tradesman", "Other"],
  "Dodge|Dakota": ["Base", "Big Horn", "Laramie", "R/T", "SLT", "Sport", "ST", "TRX", "Other"],
  "Dodge|Viper": ["ACR", "ACR-X", "GTC", "GTS", "RT/10", "SRT", "SRT-10", "TA", "Other"],
  "Dodge|Magnum": ["Base", "R/T", "SE", "SRT8", "SXT", "Other"],
  "Dodge|Neon": ["ACR", "Base", "ES", "Highline", "R/T", "SE", "Sport", "SRT-4", "SXT", "Other"],
  "Dodge|Caliber": ["Heat", "R/T", "Rush", "SE", "SRT4", "SXT", "Uptown", "Other"],
  "Dodge|Grand Caravan": ["AVP", "Crew", "GT", "SE", "SE Plus", "SXT", "Other"],
  "Dodge|Journey": ["AVP", "Crossroad", "GT", "R/T", "SE", "SXT", "Other"],
  "Dodge|Avenger": ["Base", "R/T", "SE", "SXT", "Other"],
  "Dodge|Stratus": ["ES", "R/T", "SE", "SXT", "Other"],
  "Dodge|Intrepid": ["Base", "ES", "R/T", "SE", "SXT", "Other"],
  "Dodge|Hornet": ["GT", "GT Plus", "R/T", "R/T Plus", "Other"],

  "Ford|Mustang": ["Base", "Bullitt", "Cobra", "EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Premium", "Shelby GT350", "Shelby GT500", "V6", "Other"],
  "Ford|F-150": ["FX4", "King Ranch", "Lariat", "Lightning", "Limited", "Platinum", "Raptor", "STX", "Tremor", "XL", "XLT", "Other"],
  "Ford|F-250": ["King Ranch", "Lariat", "Limited", "Platinum", "Tremor", "XL", "XLT", "Other"],
  "Ford|F-350": ["King Ranch", "Lariat", "Limited", "Platinum", "Tremor", "XL", "XLT", "Other"],
  "Ford|Ranger": ["FX2", "FX4", "Lariat", "Raptor", "STX", "Tremor", "XL", "XLT", "Other"],
  "Ford|Bronco": ["Badlands", "Base", "Big Bend", "Black Diamond", "Heritage", "Heritage Limited", "Outer Banks", "Raptor", "Wildtrak", "Other"],
  "Ford|Bronco Sport": ["Badlands", "Base", "Big Bend", "Free Wheeling", "Heritage", "Heritage Limited", "Outer Banks", "Other"],
  "Ford|Explorer": ["Base", "Limited", "Platinum", "ST", "ST-Line", "Timberline", "XLT", "Other"],
  "Ford|Escape": ["Active", "PHEV", "Platinum", "S", "SE", "SEL", "ST-Line", "Titanium", "Other"],
  "Ford|Fusion": ["S", "SE", "SEL", "Sport", "Titanium", "Other"],
  "Ford|Edge": ["SE", "SEL", "ST", "ST-Line", "Titanium", "Other"],
  "Ford|Maverick": ["Lariat", "Tremor", "XL", "XLT", "Other"],
  "Ford|Crown Victoria": ["LX", "LX Sport", "Police Interceptor", "S", "Other"],
  "Ford|Focus": ["Electric", "RS", "S", "SE", "SEL", "ST", "Titanium", "Other"],
  "Ford|Fiesta": ["S", "SE", "ST", "ST-Line", "Titanium", "Other"],

  "Chevrolet|Camaro": ["1LS", "1LT", "1SS", "2LT", "2SS", "3LT", "LT1", "Z/28", "ZL1", "Other"],
  "Chevrolet|Corvette": ["1LT", "2LT", "3LT", "Base", "E-Ray", "Grand Sport", "Stingray", "Z06", "ZR1", "Other"],
  "Chevrolet|Silverado": ["Custom", "Custom Trail Boss", "High Country", "LT", "LT Trail Boss", "LTZ", "RST", "Work Truck", "ZR2", "Other"],
  "Chevrolet|Colorado": ["LT", "Trail Boss", "Work Truck", "Z71", "ZR2", "Other"],
  "Chevrolet|Tahoe": ["High Country", "LS", "LT", "Premier", "RST", "Z71", "Other"],
  "Chevrolet|Suburban": ["High Country", "LS", "LT", "Premier", "RST", "Z71", "Other"],
  "Chevrolet|Malibu": ["1FL", "LS", "LT", "Premier", "RS", "Other"],
  "Chevrolet|Equinox": ["LS", "LT", "Premier", "RS", "Other"],
  "Chevrolet|Traverse": ["High Country", "LS", "LT", "Premier", "RS", "Other"],

  "GMC|Sierra": ["AT4", "AT4X", "Base", "Denali", "Denali Ultimate", "Elevation", "Pro", "SLE", "SLT", "Other"],
  "GMC|Canyon": ["AT4", "AT4X", "Denali", "Elevation", "Pro", "SLE", "SLT", "Other"],
  "GMC|Yukon": ["AT4", "Denali", "Denali Ultimate", "SLE", "SLT", "Other"],
  "GMC|Terrain": ["AT4", "Denali", "SLE", "SLT", "Other"],

  "Toyota|Tacoma": ["Limited", "PreRunner", "SR", "SR5", "TRD Off-Road", "TRD Pro", "TRD Sport", "Trailhunter", "Other"],
  "Toyota|Tundra": ["1794 Edition", "Capstone", "Limited", "Platinum", "SR", "SR5", "TRD Pro", "Other"],
  "Toyota|4Runner": ["Limited", "Nightshade", "SR5", "SR5 Premium", "TRD Off-Road", "TRD Off-Road Premium", "TRD Pro", "TRD Sport", "Trailhunter", "Other"],
  "Toyota|Camry": ["LE", "Nightshade", "SE", "TRD", "XLE", "XSE", "Other"],
  "Toyota|Corolla": ["Hybrid", "L", "LE", "Nightshade", "SE", "XLE", "XSE", "Other"],
  "Toyota|RAV4": ["Adventure", "Limited", "Hybrid LE", "Hybrid XLE", "Hybrid XSE", "LE", "Prime SE", "Prime XSE", "TRD Off-Road", "Woodland Edition", "XLE", "XLE Premium", "Other"],
  "Toyota|Highlander": ["Bronze Edition", "Hybrid Limited", "Hybrid Platinum", "L", "LE", "Limited", "Platinum", "XLE", "Other"],
  "Toyota|Sienna": ["LE", "Limited", "Platinum", "Woodland Edition", "XLE", "XSE", "Other"],

  "Honda|Civic": ["EX", "EX-L", "LX", "Si", "Sport", "Sport Touring Hybrid", "Touring", "Type R", "Other"],
  "Honda|Accord": ["EX", "EX-L", "Hybrid EX-L", "LX", "Sport", "Sport-L", "Sport-L Hybrid", "Touring", "Touring Hybrid", "Other"],
  "Honda|CR-V": ["EX", "EX-L", "LX", "Sport", "Sport-L Hybrid", "Sport Touring Hybrid", "Touring", "Other"],
  "Honda|Pilot": ["Black Edition", "EX-L", "Elite", "Sport", "Touring", "TrailSport", "Other"],
  "Honda|Ridgeline": ["Black Edition", "RTL", "RTL-E", "Sport", "TrailSport", "Other"],
  "Honda|Odyssey": ["Elite", "EX", "EX-L", "LX", "Sport", "Touring", "Other"],

  "Nissan|Titan": ["Platinum Reserve", "PRO-4X", "S", "SL", "SV", "Other"],
  "Nissan|Frontier": ["PRO-4X", "PRO-X", "S", "SL", "SV", "Other"],
  "Nissan|Altima": ["Platinum", "S", "SL", "SR", "SV", "Other"],
  "Nissan|Maxima": ["Platinum", "S", "SL", "SR", "SV", "Other"],
  "Nissan|Rogue": ["Platinum", "S", "SL", "SV", "Other"],
  "Nissan|Pathfinder": ["Platinum", "Rock Creek", "S", "SL", "SV", "Other"],

  "Jeep|Wrangler": ["High Tide", "Rubicon", "Rubicon 392", "Rubicon X", "Sahara", "Sport", "Sport S", "Willys", "Willys Sport", "Other"],
  "Jeep|Grand Cherokee": ["4xe", "Altitude", "Laredo", "Limited", "Overland", "Summit", "Summit Reserve", "Trailhawk", "Other"],
  "Jeep|Grand Cherokee L": ["Altitude", "Laredo", "Limited", "Overland", "Summit", "Summit Reserve", "Other"],
  "Jeep|Gladiator": ["High Altitude", "Mojave", "Rubicon", "Sport", "Sport S", "Willys", "Other"],
  "Jeep|Cherokee": ["80th Anniversary", "Altitude", "High Altitude", "Latitude", "Latitude Lux", "Limited", "Trailhawk", "Other"],
  "Jeep|Compass": ["Altitude", "High Altitude", "Latitude", "Latitude Lux", "Limited", "Sport", "Trailhawk", "Other"],
  "Jeep|Renegade": ["Altitude", "High Altitude", "Latitude", "Limited", "Sport", "Trailhawk", "Other"],
  "Jeep|Wagoneer": ["Base", "Carbide", "Series I", "Series II", "Series III", "Other"],
  "Jeep|Grand Wagoneer": ["Obsidian", "Series I", "Series II", "Series III", "Other"],
};

function trimsFor(make, model) {
  if (!make) return [];
  const specific = MODEL_TRIM_DATA[make + "|" + model];
  if (specific) return specific;
  return TRIM_DATA[make] || TRIM_DATA["Other"];
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  if (Platform.OS === 'web') return null;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId: "aa722540-034a-4737-9e73-1efc9e4dd59c" });
  return token.data;
}

async function getZipCoordsCached(zip, cache) {
  if (!zip) return null;
  if (cache[zip] !== undefined) return cache[zip];
  try {
    const r = await fetch("https://api.zippopotam.us/us/" + zip);
    if (!r.ok) { cache[zip] = null; return null; }
    const data = await r.json();
    const coords = { latitude: parseFloat(data.places[0].latitude), longitude: parseFloat(data.places[0].longitude) };
    cache[zip] = coords;
    return coords;
  } catch(e) { cache[zip] = null; return null; }
}

async function attachBidCounts(listings) {
  if (listings.length === 0) return listings;
  const ids = listings.map(l => l.id);
  const counts = {};
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, "bids"), where("listingId", "in", chunk)));
    snap.docs.forEach(d => {
      const lid = d.data().listingId;
      counts[lid] = (counts[lid] || 0) + 1;
    });
  }
  return listings.map(l => ({ ...l, bidCount: counts[l.id] || 0 }));
}

async function notifyMatchingUsers(listing) {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const cache = {};
    const listingCoords = await getZipCoordsCached(listing.zip, cache);
    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      if (u.uid === listing.sellerId) continue;
      if (u.role === "seller") continue;
      if (!u.pushToken) continue;
      const prefs = u.buyingPreferences;
      if (!prefs || !prefs.zip) continue;
      if (Array.isArray(prefs.makes) && prefs.makes.length > 0 && !prefs.makes.includes(listing.make)) continue;
      const yr = parseInt(listing.year) || 0;
      if (prefs.yearFrom && yr < parseInt(prefs.yearFrom)) continue;
      if (prefs.yearTo && yr > parseInt(prefs.yearTo)) continue;
      if (prefs.runsOnly && listing.runs !== true) continue;
      if (prefs.cleanTitleOnly && listing.titleStatus !== "clean") continue;
      const radius = parseFloat(prefs.radius || "99999");
      if (radius < 99999) {
        if (!listingCoords) continue;
        const userCoords = await getZipCoordsCached(prefs.zip, cache);
        if (!userCoords) continue;
        const distMiles = getDistance(userCoords, listingCoords) / 1609.34;
        if (distMiles > radius) continue;
      }
      try {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: u.pushToken,
            title: "New car matching your preferences",
            body: listing.year + " " + listing.make + " " + listing.model + (listing.city ? " in " + listing.city : ""),
          }),
        });
      } catch(e) {}
    }
  } catch(e) {}
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Welcome");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setInitialRoute("MainTabs");
      } else {
        setInitialRoute("Welcome");
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#1a1a1a", fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="SellerBids" component={SellerBidsScreen} />
        <Stack.Screen name="PlaceBid" component={PlaceBidScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
        <Stack.Screen name="EditListing" component={EditListingScreen} />
        <Stack.Screen name="MyBid" component={MyBidScreen} />
        <Stack.Screen name="MySoldListings" component={MySoldListingsScreen} />
        <Stack.Screen name="MyPurchases" component={MyPurchasesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Image source={require("./assets/logo.png")} style={{width: 280, height: 280, resizeMode: "contain"}} />
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Login", { mode: "login" })}>
          <Text style={styles.dealerButtonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Login", { mode: "signup" })}>
          <Text style={styles.dealerButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LoginScreen({ navigation, route }) {
  const mode = route.params?.mode || "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("both");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupStage, setSignupStage] = useState("form");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert("Enter Email", "Type your email above first, then tap Forgot Password again."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Check Your Email", "A password reset link has been sent to " + email);
    } catch (error) { Alert.alert("Error", error.message); }
  };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try {
        const token = await registerForPushNotifications();
        if (token) {
          const snap = await getDocs(query(collection(db, "users"), where("uid", "==", cred.user.uid)));
          if (!snap.empty) await updateDoc(doc(db, "users", snap.docs[0].id), { pushToken: token });
        }
      } catch (e) {}
      navigation.navigate("MainTabs");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  const handleContinueToVerify = async () => {
    if (!email || !password || !firstName || !lastName || !phone || !zipCode) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const send = httpsCallable(getFunctions(), "sendPhoneVerification");
      await send({ phoneNumber: phone });
      setSignupStage("verify");
      setVerifyCode("");
      setVerifyError("");
      setResendCooldown(30);
    } catch (e) {
      const msg = e?.code === "functions/resource-exhausted"
        ? "Too many attempts. Please wait a few minutes and try again."
        : e?.code === "functions/invalid-argument"
          ? "That phone number doesn't look right. Please check and try again."
          : "Couldn't send verification code. Check the phone number and try again.";
      Alert.alert("Error", msg);
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || verifying) return;
    setVerifyError("");
    try {
      const send = httpsCallable(getFunctions(), "sendPhoneVerification");
      await send({ phoneNumber: phone });
      setResendCooldown(30);
    } catch (e) {
      const msg = e?.code === "functions/resource-exhausted"
        ? "Too many attempts. Please wait a few minutes and try again."
        : "Couldn't resend code. Try again in a moment.";
      setVerifyError(msg);
    }
  };

  const handleVerifyAndCreateAccount = async () => {
    if (!verifyCode || verifyCode.length < 4) {
      setVerifyError("Enter the code we sent you.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    try {
      const check = httpsCallable(getFunctions(), "checkPhoneVerification");
      const result = await check({ phoneNumber: phone, code: verifyCode });
      if (!result?.data?.approved) {
        setVerifyError("That code didn't match. Try again or resend.");
        setVerifying(false);
        return;
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      let token = null;
      try { token = await registerForPushNotifications(); } catch (e) {}
      await addDoc(collection(db, "users"), {
        uid: cred.user.uid, email, firstName, lastName, phone, zipCode,
        companyName: companyName || "", role, pushToken: token || "",
        phoneVerified: true,
        createdAt: serverTimestamp()
      });
      navigation.navigate("MainTabs");
    } catch (e) {
      const msg = e?.code === "functions/resource-exhausted"
        ? "Too many attempts. Please wait a few minutes and try again."
        : (e?.message || "Could not create account. Please try again.");
      setVerifyError(msg);
    }
    setVerifying(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />
      {mode === "signup" && signupStage === "verify" ? (
        <>
          <Text style={styles.logo}>Verify your phone</Text>
          <Text style={styles.tagline}>We sent a 6-digit code to {phone}.</Text>
          <View style={styles.form}>
            <TextInput
              style={[styles.input, {fontSize: 22, letterSpacing: 6, textAlign: "center"}]}
              placeholder="6-digit code"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              maxLength={6}
              value={verifyCode}
              onChangeText={(t) => { setVerifyCode(t.replace(/\D/g, "")); setVerifyError(""); }}
            />
            {verifyError ? <Text style={{color: "#c0392b", fontSize: 14, marginTop: -4}}>{verifyError}</Text> : null}
            <TouchableOpacity style={styles.dealerButton} onPress={handleVerifyAndCreateAccount} disabled={verifying}>
              <Text style={styles.dealerButtonText}>{verifying ? "Verifying..." : "Verify and create account"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendCode} disabled={resendCooldown > 0 || verifying}>
              <Text style={[styles.backText, (resendCooldown > 0 || verifying) && {color: "#bbb"}]}>{resendCooldown > 0 ? "Resend code (" + resendCooldown + "s)" : "Resend code"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSignupStage("form"); setVerifyCode(""); setVerifyError(""); }}>
              <Text style={styles.backText}>Change number</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
      <Text style={styles.logo}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>
      <Text style={styles.tagline}>Enter your details to continue</Text>
      <View style={styles.form}>
        {mode === "signup" && (
          <>
            <View style={{flexDirection: "row", gap: 8}}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="First Name" placeholderTextColor="#999999" value={firstName} onChangeText={setFirstName} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Last Name" placeholderTextColor="#999999" value={lastName} onChangeText={setLastName} />
            </View>
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#999999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#999999" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
            <TextInput style={styles.input} placeholder="Company Name (optional)" placeholderTextColor="#999999" value={companyName} onChangeText={setCompanyName} />
            <Text style={styles.sectionLabel}>I want to</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleButton, role === "buyer" && styles.toggleActive]} onPress={() => setRole("buyer")}>
                <Text style={[styles.toggleText, role === "buyer" && styles.toggleTextActive]}>Buy cars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, role === "seller" && styles.toggleActive]} onPress={() => setRole("seller")}>
                <Text style={[styles.toggleText, role === "seller" && styles.toggleTextActive]}>Sell cars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, role === "both" && styles.toggleActive]} onPress={() => setRole("both")}>
                <Text style={[styles.toggleText, role === "both" && styles.toggleTextActive]}>Both</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Password" placeholderTextColor="#999999" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        {mode === "signup" && (
          <View style={styles.passwordRow}>
            <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Confirm Password" placeholderTextColor="#999999" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
        )}
        {mode === "login" ? (
          <>
            <TouchableOpacity style={styles.dealerButton} onPress={handleLogin}>
              <Text style={styles.dealerButtonText}>{loading ? "Loading..." : "Log In"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.backText}>Forgot Password?</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.dealerButton} onPress={handleContinueToVerify} disabled={loading}>
            <Text style={styles.dealerButtonText}>{loading ? "Sending code..." : "Continue"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MainTabs() {
  const [role, setRole] = useState("both");

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(collection(db, "users"), where("uid", "==", u.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) setRole(snap.docs[0].data().role || "both");
    });
    return unsub;
  }, []);

  const showBrowse = role === "buyer" || role === "both";
  const showListings = role === "seller" || role === "both";
  const showBids = role === "buyer" || role === "both";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1B2B5E",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6, backgroundColor: "#ffffff", borderTopColor: "#eee" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused, color }) => {
          let name = "ellipse-outline";
          if (route.name === "Home") name = focused ? "home" : "home-outline";
          else if (route.name === "Browse") name = focused ? "search" : "search-outline";
          else if (route.name === "Listings") name = focused ? "list" : "list-outline";
          else if (route.name === "Bids") name = focused ? "pricetag" : "pricetag-outline";
          else if (route.name === "Profile") name = focused ? "person" : "person-outline";
          return <Ionicons name={name} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Browse"
        component={BrowseCarsScreen}
        options={showBrowse ? {} : { tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Listings"
        component={SellTabPlaceholder}
        options={{ tabBarLabel: "Listings", ...(showListings ? {} : { tabBarButton: () => null }) }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("MyListings");
          },
        })}
      />
      <Tab.Screen
        name="Bids"
        component={MyBidsScreen}
        options={showBids ? {} : { tabBarButton: () => null }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SellTabPlaceholder() {
  return <View style={{flex: 1, backgroundColor: "#f5f5f5"}} />;
}

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const secs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return secs + "s ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  const months = Math.floor(days / 30);
  return months + "mo ago";
}

function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("both");
  const [featured, setFeatured] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [bidsPlacedCount, setBidsPlacedCount] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!userSnap.empty) {
          setUserName(userSnap.docs[0].data().firstName || "");
          setRole(userSnap.docs[0].data().role || "both");
        }

        const listingsSnap = await getDocs(collection(db, "listings"));
        const allListings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const listingByIdAll = Object.fromEntries(allListings.map(l => [l.id, l]));
        const listings = allListings.filter(l => l.sellerId !== user.uid && l.status !== "sold" && l.status !== "deleted");
        const filteredOwnCount = allListings.filter(l => l.sellerId === user.uid && l.status !== "sold" && l.status !== "deleted").length;
        if (filteredOwnCount > 0) console.log("[HomeScreen] hid " + filteredOwnCount + " own listing(s) from buy-side feed");

        const myListings = allListings.filter(l => l.sellerId === user.uid);
        setActiveCount(myListings.filter(l => l.status !== "sold" && l.status !== "deleted").length);
        setSoldCount(myListings.filter(l => l.status === "sold").length);

        const myBidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid)));
        setBidsPlacedCount(myBidsSnap.size);

        const ids = listings.map(l => l.id);
        const bidStats = {};
        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += 30) {
            const chunk = ids.slice(i, i + 30);
            const snap = await getDocs(query(collection(db, "bids"), where("listingId", "in", chunk)));
            snap.docs.forEach(d => {
              const b = d.data();
              const s = bidStats[b.listingId] || { count: 0, max: 0 };
              s.count++;
              if (b.amount > s.max) s.max = b.amount;
              bidStats[b.listingId] = s;
            });
          }
        }
        listings.forEach(l => {
          const s = bidStats[l.id] || { count: 0, max: 0 };
          l.bidCount = s.count;
          l.highestBid = s.max;
        });

        const featuredSorted = [...listings]
          .sort((a, b) => {
            const aHasPhoto = a.photos && a.photos.length > 0 ? 0 : 1;
            const bHasPhoto = b.photos && b.photos.length > 0 ? 0 : 1;
            if (aHasPhoto !== bHasPhoto) return aHasPhoto - bHasPhoto;
            if (b.bidCount !== a.bidCount) return b.bidCount - a.bidCount;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
          })
          .slice(0, 8);
        setFeatured(featuredSorted);

        const events = [];
        const recentBidsSnap = await getDocs(query(collection(db, "bids"), orderBy("createdAt", "desc"), limit(15)));
        for (const d of recentBidsSnap.docs) {
          const b = d.data();
          const l = listingByIdAll[b.listingId];
          events.push({
            id: "bid-" + d.id,
            type: "bid",
            ts: b.createdAt,
            amount: b.amount,
            label: l ? l.year + " " + l.make + " " + l.model : "a vehicle",
          });
        }
        for (const l of allListings) {
          if (l.status === "sold") {
            events.push({
              id: "sold-" + l.id,
              type: "sold",
              ts: l.createdAt,
              amount: l.soldPrice,
              label: l.year + " " + l.make + " " + l.model,
            });
          }
        }
        events.sort((a, b) => (b.ts?.seconds || 0) - (a.ts?.seconds || 0));
        setActivity(events.slice(0, 12));
      } catch(e) {}
    };
    const unsubscribe = navigation.addListener("focus", fetchHome);
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.homeContainer} contentContainerStyle={{paddingBottom: 32}}>
      <StatusBar style="dark" />
      <View style={styles.homeHeader}>
        <Text style={styles.heroBrand}>Salvager</Text>
        <Text style={styles.heroGreeting}>Welcome back{userName ? ", " + userName : ""}</Text>
      </View>

      <View style={[styles.statsRow, {paddingHorizontal: 16}]}>
        {(role === "seller" || role === "both") && (
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate("MyListings")} activeOpacity={0.7}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIconCircle, {backgroundColor: "#1B2B5E"}]}>
                <Ionicons name="car" size={16} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{activeCount}</Text>
            </View>
            <Text style={styles.statLabel}>Listings</Text>
            <Text style={styles.statLink}>View all →</Text>
          </TouchableOpacity>
        )}
        {(role === "seller" || role === "both") && (
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate("MySoldListings")} activeOpacity={0.7}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIconCircle, {backgroundColor: "#27AE60"}]}>
                <Ionicons name="cash" size={16} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{soldCount}</Text>
            </View>
            <Text style={styles.statLabel}>Sold</Text>
            <Text style={styles.statLink}>View all →</Text>
          </TouchableOpacity>
        )}
        {(role === "buyer" || role === "both") && (
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate("Bids")} activeOpacity={0.7}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIconCircle, {backgroundColor: "#c0392b"}]}>
                <Ionicons name="hammer" size={16} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{bidsPlacedCount}</Text>
            </View>
            <Text style={styles.statLabel}>Bids</Text>
            <Text style={styles.statLink}>View all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {(role === "seller" || role === "both") && (
        <TouchableOpacity style={styles.heroCta} onPress={() => navigation.navigate("CreateListing")}>
          <View style={{flexDirection: "row", alignItems: "center"}}>
            <Ionicons name="add-circle" size={36} color="#ffffff" style={{marginRight: 12}} />
            <View style={{flex: 1}}>
              <Text style={styles.heroCtaTitle}>List a Car</Text>
              <Text style={styles.heroCtaSubtitle}>Get offers from multiple dealers</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}
      {role === "buyer" && (
        <TouchableOpacity style={[styles.heroCta, {backgroundColor: "#1B2B5E"}]} onPress={() => navigation.navigate("Browse")}>
          <View style={{flexDirection: "row", alignItems: "center"}}>
            <Ionicons name="search" size={36} color="#ffffff" style={{marginRight: 12}} />
            <View style={{flex: 1}}>
              <Text style={styles.heroCtaTitle}>Browse Cars</Text>
              <Text style={styles.heroCtaSubtitle}>Find your next salvage find</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Featured Listings</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs", { screen: "Browse" })}>
          <Text style={styles.sectionLink}>See all</Text>
        </TouchableOpacity>
      </View>
      {featured.length === 0 ? (
        <Text style={styles.softText}>No active listings yet. Be the first to list a car.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 8}}>
          {featured.map(l => (
            <TouchableOpacity key={l.id} style={styles.featuredCard} onPress={() => navigation.navigate("PlaceBid", { listing: l })}>
              {l.photos && l.photos.length > 0 ? (
                <Image source={{ uri: l.photos[0] }} style={styles.featuredPhoto} />
              ) : (
                <View style={[styles.featuredPhoto, {alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}]}>
                  <Ionicons name="car-outline" size={36} color="#aaa" />
                </View>
              )}
              <View style={styles.featuredBidPill}>
                <Text style={styles.featuredBidPillText}>{l.bidCount} {l.bidCount === 1 ? "bid" : "bids"}</Text>
              </View>
              <View style={{padding: 10}}>
                <Text style={styles.featuredTitle} numberOfLines={1}>{l.year} {l.make} {l.model}</Text>
                <Text style={styles.featuredHighest}>{l.highestBid > 0 ? "Top bid $" + l.highestBid : "No bids yet"}</Text>
                <View style={{flexDirection: "row", alignItems: "center", marginTop: 4}}>
                  <Ionicons name="location-outline" size={12} color="#888" />
                  <Text style={styles.featuredLocation} numberOfLines={1}>{l.city || "—"}{l.zip ? " · " + l.zip : ""}</Text>
                </View>
                <View style={{flexDirection: "row", alignItems: "center", marginTop: 4}}>
                  <Ionicons name={l.needsTow ? "warning-outline" : "checkmark-circle-outline"} size={12} color={l.needsTow ? "#c0392b" : "#27AE60"} />
                  <Text style={[styles.featuredPickup, {color: l.needsTow ? "#c0392b" : "#27AE60"}]}>{l.needsTow ? "Buyer pickup" : "Will deliver"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Live Activity</Text>
      </View>
      {activity.length === 0 ? (
        <Text style={styles.softText}>No recent activity yet.</Text>
      ) : (
        <View style={{paddingHorizontal: 16}}>
          {activity.map(e => (
            <View key={e.id} style={styles.activityRow}>
              <Ionicons
                name={e.type === "sold" ? "checkmark-done-circle" : "pricetag"}
                size={20}
                color={e.type === "sold" ? "#27AE60" : "#1B2B5E"}
                style={{marginRight: 10}}
              />
              <View style={{flex: 1}}>
                <Text style={styles.activityLabel}>
                  {e.type === "sold"
                    ? <><Text style={{fontWeight: "bold"}}>{e.label}</Text> sold for ${e.amount}</>
                    : <>New bid <Text style={{fontWeight: "bold"}}>${e.amount}</Text> on {e.label}</>}
                </Text>
                <Text style={styles.activityTime}>{timeAgo(e.ts)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchListings = async () => {
    try {
      const user = auth.currentUser;
      const q = query(collection(db, "listings"), where("sellerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.status !== "deleted" && l.status !== "sold");
      const active = data.filter(l => l.status !== "sold");
      const activeWithCounts = await attachBidCounts(active);
      const countById = Object.fromEntries(activeWithCounts.map(l => [l.id, l.bidCount]));
      const withCounts = data.map(l => ({ ...l, bidCount: countById[l.id] || 0 }));
      withCounts.sort((a, b) => {
        const aSold = a.status === "sold" ? 1 : 0;
        const bSold = b.status === "sold" ? 1 : 0;
        if (aSold !== bSold) return aSold - bSold;
        if (b.bidCount !== a.bidCount) return b.bidCount - a.bidCount;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setListings(withCounts);
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchListings);
    return unsubscribe;
  }, [navigation]);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Active Listings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.sellerButtonText}>+ List a Car</Text>
      </TouchableOpacity>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>🔧</Text>
          <Text style={styles.emptyStateText}>Got a car to sell?</Text>
          <Text style={styles.emptyStateSubtext}>Tap "List a Car" above to post your first vehicle and start receiving bids.</Text>
        </View>
      ) : listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          style={listing.status === "sold" && styles.soldCard}
          onPress={() => navigation.navigate("SellerBids", { listing })}
        >
          {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD</Text>}
          <Text style={styles.viewBidsText}>{listing.status === "sold" ? "View Deal →" : listing.bidCount > 0 ? "View Bids →" : "No bids yet"}</Text>
        </ListingCard>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SellerBidsScreen({ route, navigation }) {
  const [listing, setListing] = useState(route.params.listing);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [counteringBidId, setCounteringBidId] = useState(null);
  const [counterAmt, setCounterAmt] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [counteringSubmit, setCounteringSubmit] = useState(false);

  const handleCounter = async (bid) => {
    if (!counterAmt) { Alert.alert("Error", "Please enter a counter amount"); return; }
    setCounteringSubmit(true);
    try {
      const amt = parseFloat(counterAmt);
      await updateDoc(doc(db, "bids", bid.id), { counterAmount: amt, counterNote: counterMsg, counterStatus: "pending" });
      try {
        const buyerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", bid.buyerId)));
        if (!buyerSnap.empty) {
          const buyerToken = buyerSnap.docs[0].data().pushToken;
          if (buyerToken) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: buyerToken,
                title: "Counteroffer received",
                body: "Seller countered at $" + amt + " for the " + listing.year + " " + listing.make + " " + listing.model,
              }),
            });
          }
        }
      } catch(e) {}
      setBids(bids.map(b => b.id === bid.id ? { ...b, counterAmount: amt, counterNote: counterMsg, counterStatus: "pending" } : b));
      setCounteringBidId(null);
      setCounterAmt("");
      setCounterMsg("");
      Alert.alert("Sent", "Counteroffer sent to buyer.");
    } catch(e) { Alert.alert("Error", e.message); }
    setCounteringSubmit(false);
  };

  const handleDeleteListing = async () => {
    Alert.alert("Delete Listing", "Are you sure you want to delete this listing?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setDeleting(true);
        try {
          await updateDoc(doc(db, "listings", listing.id), { status: "deleted" });
          Alert.alert("Deleted", "Your listing has been removed.");
          navigation.goBack();
        } catch(e) { Alert.alert("Error", e.message); }
        setDeleting(false);
      }}
    ]);
  };

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const q = query(collection(db, "bids"), where("listingId", "==", listing.id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => b.amount - a.amount);
        setBids(data);
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    fetchBids();
  }, []);
  const handleAcceptOffer = async (bid) => {
    Alert.alert("Accept Offer", "Accept this offer for $" + bid.amount + "?", [
      { text: "Cancel", style: "cancel" },
      { text: "Accept", onPress: async () => {
        setAccepting(true);
        try {
          let buyerPhone = "";
          let buyerName = "";
          let sellerPhone = "";
          let sellerName = "";
          let buyerToken = "";
          try {
            const buyerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", bid.buyerId)));
            if (!buyerSnap.empty) {
              const b = buyerSnap.docs[0].data();
              buyerPhone = b.phone || "";
              buyerToken = b.pushToken || "";
              buyerName = ((b.firstName || "") + " " + (b.lastName || "")).trim();
            }
            const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", auth.currentUser.uid)));
            if (!sellerSnap.empty) {
              const s = sellerSnap.docs[0].data();
              sellerPhone = s.phone || "";
              sellerName = ((s.firstName || "") + " " + (s.lastName || "")).trim();
            }
          } catch(e) {}
          await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: bid.amount, soldToEmail: bid.buyerEmail, soldToPhone: buyerPhone, soldToName: buyerName, sellerPhone, sellerName });
          await updateDoc(doc(db, "bids", bid.id), { status: "accepted", buyerPhone, buyerName, sellerPhone, sellerName });
          setBids(bids.map(b => b.id === bid.id ? { ...b, status: "accepted", buyerPhone, buyerName, sellerPhone, sellerName } : b));
          setListing({ ...listing, status: "sold", soldPrice: bid.amount, soldToEmail: bid.buyerEmail, soldToPhone: buyerPhone, soldToName: buyerName, sellerPhone, sellerName });
          try {
            if (buyerToken) {
              await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: buyerToken,
                  title: "Your offer was accepted!",
                  body: "Your $" + bid.amount + " bid on the " + listing.year + " " + listing.make + " " + listing.model + " was accepted. Seller: " + auth.currentUser.email,
                }),
              });
            }
          } catch(e) {}
          Alert.alert("Deal Done!", "Sold for $" + bid.amount + ". Buyer: " + bid.buyerEmail);
        } catch(e) { Alert.alert("Error", e.message); }
        setAccepting(false);
      }}
    ]);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Bids</Text>
        <View style={{flexDirection: "row", gap: 16}}>
          {listing.status !== "sold" && <TouchableOpacity onPress={() => navigation.navigate("EditListing", { listing })}>
            <Text style={{color: "#1B2B5E", fontSize: 20, fontWeight: "bold"}}>Edit</Text>
          </TouchableOpacity>}
          {listing.status !== "sold" && <TouchableOpacity onPress={handleDeleteListing}>
            <Text style={{color: "#c0392b", fontSize: 20, fontWeight: "bold"}}>Delete</Text>
          </TouchableOpacity>}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.logoutText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.listingCard}>
        {listing.photos && listing.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {listing.photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.bidListingPhoto} />
            ))}
          </ScrollView>
        )}
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        {listing.status === "sold" && (
          <>
            <Text style={styles.soldBadge}>SOLD - ${listing.soldPrice}</Text>
            <Text style={styles.listingDetail}>Platform fee ({PLATFORM_FEE_PERCENT}%): -${Math.round(listing.soldPrice * PLATFORM_FEE_PERCENT / 100)}</Text>
            <Text style={[styles.listingDetail, {fontWeight: "bold", color: "#1a1a1a"}]}>Seller net: ${listing.soldPrice - Math.round(listing.soldPrice * PLATFORM_FEE_PERCENT / 100)}</Text>
          </>
        )}
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : bids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>⏳</Text>
          <Text style={styles.emptyStateText}>Waiting on offers</Text>
          <Text style={styles.emptyStateSubtext}>No bids on this listing yet. We'll notify you the moment a buyer makes an offer.</Text>
        </View>
      ) : bids.map((bid, index) => (
        <View key={bid.id} style={[styles.bidCard, bid.status === "accepted" && styles.acceptedCard]}>
          {index === 0 && listing.status !== "sold" && <Text style={styles.highestBadge}>HIGHEST OFFER</Text>}
          {bid.status === "accepted" && <Text style={styles.acceptedBadge}>ACCEPTED</Text>}
          <Text style={styles.bidAmount}>${bid.amount}</Text>
          {bid.towingIncluded !== undefined && (bid.towingIncluded
            ? <View style={styles.towingBadgeIn}><Text style={styles.towingBadgeText}>Towing included</Text></View>
            : <View style={styles.towingBadgeOut}><Text style={styles.towingBadgeText}>Towing not included</Text></View>)}
          {bid.pickupTime ? <Text style={styles.listingDetail}>Pickup: {bid.pickupTime === "morning" ? "Morning" : "Afternoon"}</Text> : null}
          {bid.status === "accepted" ? (
            <>
              {bid.buyerName ? <Text style={styles.listingDetail}>Buyer: {bid.buyerName}</Text> : null}
              <Text style={styles.listingDetail}>Email: {bid.buyerEmail}</Text>
              {bid.buyerPhone ? <Text style={styles.listingDetail}>Phone: {bid.buyerPhone}</Text> : null}
            </>
          ) : <Text style={styles.listingDetail}>Buyer: Contact hidden until offer accepted</Text>}
          {bid.note ? <Text style={styles.listingDetail}>Note: {bid.note}</Text> : null}
          <Text style={styles.listingDetail}>{formatBidDate(bid.createdAt)}</Text>
          {listing.status !== "sold" && bid.status !== "accepted" && (
            bid.counterStatus === "pending" ? (
              <View style={styles.counterPending}>
                <Text style={[styles.listingDetail, {fontWeight: "bold"}]}>Counter sent: ${bid.counterAmount}</Text>
                <Text style={styles.listingDetail}>Awaiting buyer response</Text>
              </View>
            ) : counteringBidId === bid.id ? (
              <View style={{marginTop: 12, gap: 8}}>
                <TextInput style={styles.input} placeholder="Counter amount ($)" placeholderTextColor="#999999" keyboardType="numeric" value={counterAmt} onChangeText={setCounterAmt} />
                <TextInput style={styles.input} placeholder="Note to buyer (optional)" placeholderTextColor="#999999" value={counterMsg} onChangeText={setCounterMsg} />
                <TouchableOpacity style={styles.dealerButton} onPress={() => handleCounter(bid)} disabled={counteringSubmit}>
                  <Text style={styles.dealerButtonText}>{counteringSubmit ? "Sending..." : "Send Counter"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCounteringBidId(null)}>
                  <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {bid.counterStatus === "declined" && <Text style={[styles.listingDetail, {color: "#c0392b", marginTop: 8}]}>Buyer declined your ${bid.counterAmount} counter</Text>}
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptOffer(bid)} disabled={accepting}>
                  <Text style={styles.acceptButtonText}>{accepting ? "Processing..." : "Accept Offer"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dealerButton, {marginTop: 8, marginBottom: 0}]} onPress={() => { setCounteringBidId(bid.id); setCounterAmt(""); setCounterMsg(""); }}>
                  <Text style={styles.dealerButtonText}>Counteroffer</Text>
                </TouchableOpacity>
              </>
            )
          )}
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BrowseCarsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("50");
  const [filtering, setFiltering] = useState(false);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [myBidsByListing, setMyBidsByListing] = useState({});

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow location access");
        setLocationLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode && geocode[0] && geocode[0].postalCode) {
        const detectedZip = geocode[0].postalCode;
        setZipCode(detectedZip);
        await applyFilter(listings, detectedZip);
      }
    } catch(e) {
      Alert.alert("Error", "Could not detect location. Please enter ZIP manually.");
    }
    setLocationLoading(false);
  };

  const getZipCoords = async (zip) => {
    const response = await fetch("https://api.zippopotam.us/us/" + zip);
    if (!response.ok) return null;
    const data = await response.json();
    return { latitude: parseFloat(data.places[0].latitude), longitude: parseFloat(data.places[0].longitude) };
  };

  const applyFilter = async (allListings, zipOverride) => {
    const effectiveZip = zipOverride || zipCode;
    if (!effectiveZip || effectiveZip.length < 5) {
      setFilteredListings(allListings);
      return;
    }
    setFiltering(true);
    const userCoords = await getZipCoords(effectiveZip);
    if (!userCoords) {
      Alert.alert("Error", "Could not look up your ZIP code (" + effectiveZip + "). Check your internet connection.");
      setFilteredListings(allListings);
      setFiltering(false);
      return;
    }
    const nearby = [];
    const fromYear = yearFrom ? parseInt(yearFrom) : 0;
    const toYear = yearTo ? parseInt(yearTo) : 9999;
    const radiusMiles = parseFloat(radius);
    for (const listing of allListings) {
      const listingYear = parseInt(listing.year) || 0;
      if (listingYear < fromYear || listingYear > toYear) continue;
      if (!listing.zip) continue;
      let listingCoords = null;
      try {
        listingCoords = await getZipCoords(listing.zip);
      } catch(e) { continue; }
      if (!listingCoords) continue;
      const distanceMeters = getDistance(userCoords, listingCoords);
      const distanceMiles = distanceMeters / 1609.34;
      console.log("Distance check:", listing.zip, "->", Math.round(distanceMiles), "miles, radius:", radiusMiles);
      if (distanceMiles <= radiusMiles) {
        nearby.push({ ...listing, distanceMiles: Math.round(distanceMiles) });
      }
    }
    setFilteredListings(nearby);
    setFiltering(false);
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "listings"));
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = data.filter(l => l.sellerId !== auth.currentUser.uid && l.status !== "sold" && l.status !== "deleted");
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const myBidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", auth.currentUser.uid)));
        const bidMap = {};
        myBidsSnap.docs.forEach(d => { const b = d.data(); bidMap[b.listingId] = b.amount; });
        setMyBidsByListing(bidMap);
        const withCounts = await attachBidCounts(filtered);
        try {
          const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", auth.currentUser.uid)));
          const profileZip = userSnap.empty ? "" : (userSnap.docs[0].data().zipCode || "");
          if (profileZip) {
            const cache = {};
            const userCoords = await getZipCoordsCached(profileZip, cache);
            if (userCoords) {
              for (const listing of withCounts) {
                if (!listing.zip) continue;
                const c = await getZipCoordsCached(listing.zip, cache);
                if (c) listing.distanceMiles = Math.round(getDistance(userCoords, c) / 1609.34);
              }
            }
          }
        } catch(e) {}
        setListings(withCounts);
        setFilteredListings(withCounts);
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    const unsubscribe = navigation.addListener("focus", fetchListings);
    return unsubscribe;
  }, [navigation]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Browse Cars</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterContainer}>
        <View style={styles.zipRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Your ZIP code" placeholderTextColor="#999999" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
          <TouchableOpacity style={styles.locationButton} onPress={detectLocation}>
            <Text style={styles.locationButtonText}>{locationLoading ? "..." : "Auto"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={radius} onValueChange={(val) => setRadius(val)} style={styles.picker}>
            <Picker.Item label="25 miles" value="25" />
            <Picker.Item label="50 miles" value="50" />
            <Picker.Item label="100 miles" value="100" />
            <Picker.Item label="200 miles" value="200" />
            <Picker.Item label="Any distance" value="99999" />
          </Picker>
        </View>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={yearFrom} onValueChange={(val) => setYearFrom(val)} style={styles.picker}>
              <Picker.Item label="From Year" value="" />
              {Array.from({length: 36}, (_, i) => (1990 + i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={yearTo} onValueChange={(val) => setYearTo(val)} style={styles.picker}>
              <Picker.Item label="To Year" value="" />
              {Array.from({length: 36}, (_, i) => (1990 + i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => applyFilter(listings)}>
          <Text style={styles.filterButtonText}>{filtering ? "Searching..." : "Search"}</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : filteredListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>🚗</Text>
          <Text style={styles.emptyStateText}>No cars match your filters</Text>
          <Text style={styles.emptyStateSubtext}>Try expanding your search radius or year range, or check back later for new listings.</Text>
        </View>
      ) : filteredListings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onPress={() => myBidsByListing[listing.id] !== undefined ? navigation.navigate("MyBid", { listing }) : navigation.navigate("PlaceBid", { listing })}
        >
          {listing.distanceMiles !== undefined && <Text style={styles.listingDetail}>{listing.distanceMiles} miles away</Text>}
          {myBidsByListing[listing.id] !== undefined ? <Text style={{color: "#27AE60", fontSize: 14, marginTop: 8, fontWeight: "bold"}}>You bid ${myBidsByListing[listing.id]} ✓</Text> : <Text style={styles.bidButton2}>Place Bid →</Text>}
        </ListingCard>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PlaceBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [amount, setAmount] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const user = auth.currentUser;
        if (listing.sellerId === user.uid) {
          Alert.alert("Your listing", "You can't bid on your own listing.");
          navigation.replace("SellerBids", { listing });
          return;
        }
        const snap = await getDocs(query(collection(db, "bids"), where("listingId", "==", listing.id), where("buyerId", "==", user.uid)));
        if (!snap.empty) {
          navigation.replace("MyBid", { listing });
          return;
        }
      } catch(e) {}
      setCheckingExisting(false);
    };
    checkExisting();
  }, []);

  if (checkingExisting) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyStateText}>Loading...</Text>
      </View>
    );
  }

  const handleSubmitBid = async () => {
    if (loading) return;
    if (!amount) { Alert.alert("Error", "Please enter a bid amount"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const dupSnap = await getDocs(query(collection(db, "bids"), where("listingId", "==", listing.id), where("buyerId", "==", user.uid)));
      if (!dupSnap.empty) {
        setLoading(false);
        Alert.alert("Already bid", "You've already placed a bid on this listing. Opening it now.");
        navigation.replace("MyBid", { listing });
        return;
      }
      const bidId = listing.id + "_" + user.uid;
      await setDoc(doc(db, "bids", bidId), {
        listingId: listing.id, buyerId: user.uid, buyerEmail: user.email,
        amount: parseFloat(amount), towingIncluded: listing.needsTow === true, pickupTime, note, internalNote, status: "pending", createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Your bid has been placed!");
      try {
        const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", listing.sellerId)));
        if (!sellerSnap.empty) {
          const sellerToken = sellerSnap.docs[0].data().pushToken;
          if (sellerToken) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: sellerToken,
                title: "New Bid Received!",
                body: "Someone offered $" + amount + " for your " + listing.year + " " + listing.make + " " + listing.model,
              }),
            });
          }
        }
      } catch(e) {}
      navigation.goBack();
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Place Bid</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listingCard}>
        {listing.photos && listing.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {listing.photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.bidListingPhoto} />
            ))}
          </ScrollView>
        )}
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
        {listing.vin ? <Text style={styles.listingDetail}>VIN: {listing.vin}</Text> : null}
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        <Text style={styles.listingDetail}>Runs: {listing.runs ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Keys: {listing.hasKeys ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Drivable: {listing.hasTitle ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Delivery: {listing.needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
        {listing.titleStatus ? <Text style={styles.listingDetail}>Title: {listing.titleStatus}</Text> : null}
        {listing.engineStatus ? <Text style={styles.listingDetail}>Engine: {listing.engineStatus}</Text> : null}
        {listing.transStatus ? <Text style={styles.listingDetail}>Transmission: {listing.transStatus}</Text> : null}
        {listing.airbags ? <Text style={styles.listingDetail}>Airbags: {listing.airbags}</Text> : null}
        {listing.tires ? <Text style={styles.listingDetail}>Tires: {listing.tires}</Text> : null}
        {listing.damage ? <Text style={styles.listingDetail}>Damage: {listing.damage}</Text> : null}
        {listing.notes ? <Text style={styles.listingDetail}>Notes: {listing.notes}</Text> : null}
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Your Offer</Text>
        <TextInput style={styles.input} placeholder="Bid Amount ($)" placeholderTextColor="#999999" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <Text style={styles.sectionLabel}>Pickup Time</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, pickupTime === "morning" && styles.toggleActive]} onPress={() => setPickupTime("morning")}>
            <Text style={[styles.toggleText, pickupTime === "morning" && styles.toggleTextActive]}>Morning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, pickupTime === "afternoon" && styles.toggleActive]} onPress={() => setPickupTime("afternoon")}>
            <Text style={[styles.toggleText, pickupTime === "afternoon" && styles.toggleTextActive]}>Afternoon</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Note to seller (optional)" placeholderTextColor="#999999" value={note} onChangeText={setNote} />
        <TextInput style={styles.input} placeholder="Private note for yourself (optional)" placeholderTextColor="#999999" value={internalNote} onChangeText={setInternalNote} />
        <TouchableOpacity style={styles.dealerButton} onPress={handleSubmitBid} disabled={loading}>
          <Text style={styles.dealerButtonText}>{loading ? "Placing Bid..." : "Submit Bid"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CreateListingScreen({ navigation }) {
  const years = Array.from({length: 36}, (_, i) => (1990 + i).toString());
  const makes = Object.keys(CAR_DATA).sort();
  const [year, setYear] = useState("1990");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [trim, setTrim] = useState("");
  const [vin, setVin] = useState("");
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinError, setVinError] = useState("");
  const [vinDecoded, setVinDecoded] = useState("");
  const [pickerResetKey, setPickerResetKey] = useState(0);
  const [mileage, setMileage] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [runs, setRuns] = useState(true);
  const [hasKeys, setHasKeys] = useState(true);
  const [hasTitle, setHasTitle] = useState(true);
  const [needsTow, setNeedsTow] = useState(false);
  const [damage, setDamage] = useState("");
  const [titleStatus, setTitleStatus] = useState("");
  const [engineStatus, setEngineStatus] = useState("");
  const [transStatus, setTransStatus] = useState("");
  const [airbags, setAirbags] = useState("");
  const [tires, setTires] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= 8) { Alert.alert("Max 8 photos"); return; }
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Take Photo", onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed"); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
      }},
      { text: "Choose from Library", onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed"); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
      }},
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const decodeVin = async (v) => {
    if (v.length !== 17) return;
    setDecodingVin(true);
    setVinError("");
    try {
      const response = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/" + v + "?format=json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      const result = (data.Results && data.Results[0]) || {};
      const decodedYear = (result.ModelYear || "").trim();
      const decodedMake = (result.Make || "").trim();
      const decodedModel = (result.Model || "").trim();
      console.log("VIN decode:", { decodedYear, decodedMake, decodedModel });
      if (!decodedYear && !decodedMake && !decodedModel) {
        setVinError("Couldn't decode this VIN. Please fill in the fields manually.");
        setDecodingVin(false);
        return;
      }
      let matchedMake = "";
      if (decodedMake) {
        const lower = decodedMake.toLowerCase();
        matchedMake =
          Object.keys(CAR_DATA).find(k => k.toLowerCase() === lower) ||
          Object.keys(CAR_DATA).find(k => lower.includes(k.toLowerCase())) ||
          Object.keys(CAR_DATA).find(k => k.toLowerCase().includes(lower)) ||
          "Other";
      }
      let matchedModel = "";
      if (decodedModel && matchedMake) {
        const models = CAR_DATA[matchedMake] || [];
        const lower = decodedModel.toLowerCase();
        matchedModel =
          models.find(m => m.toLowerCase() === lower) ||
          models.find(m => lower.includes(m.toLowerCase())) ||
          models.find(m => m.toLowerCase().includes(lower)) ||
          "Other";
      }
      setPickerResetKey(k => k + 1);
      if (decodedYear) setYear(decodedYear);
      if (matchedMake) setMake(matchedMake);
      if (matchedModel) setModel(matchedModel);
      setVinDecoded([decodedYear, decodedMake, decodedModel].filter(Boolean).join(" "));
    } catch(e) {
      setVinError("Couldn't decode this VIN. Please fill in the fields manually.");
    }
    setDecodingVin(false);
  };

  const uploadPhotos = async (photoUris) => {
    const uploadedUrls = [];
    for (const uri of photoUris) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = "listings/" + auth.currentUser.uid + "/" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!year || !make || !model) { Alert.alert("Error", "Please enter year, make and model"); return; }
    if (model === "Other" && !modelOther.trim()) { Alert.alert("Error", "Please enter the model name"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uploadedPhotos = photos.length > 0 ? await uploadPhotos(photos) : [];
      const finalModel = model === "Other" ? modelOther.trim() : model;
      const listingData = {
        year, make, model: finalModel, trim, vin, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, titleStatus, engineStatus, transStatus, airbags, tires, photos: uploadedPhotos,
        sellerId: user.uid, sellerEmail: user.email, createdAt: serverTimestamp(), status: "active",
      };
      await addDoc(collection(db, "listings"), listingData);
      Alert.alert("Success", "Listing created!");
      notifyMatchingUsers(listingData).catch(() => {});
      navigation.goBack();
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>List Your Car</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Vehicle Info</Text>
        <TextInput
          style={styles.input}
          placeholder="VIN (optional, auto-fills below)"
          placeholderTextColor="#999999"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={17}
          value={vin}
          onChangeText={(t) => {
            const clean = t.toUpperCase().replace(/\s/g, "");
            setVin(clean);
            setVinError("");
            setVinDecoded("");
            if (clean.length === 17) decodeVin(clean);
          }}
        />
        {decodingVin ? <Text style={styles.listingDetail}>Decoding VIN...</Text> : null}
        {vinError ? <Text style={{color: "#c0392b", fontSize: 14, marginTop: 4}}>{vinError}</Text> : null}
        {vinDecoded ? <Text style={{color: "#27AE60", fontSize: 14, marginTop: 4}}>Decoded: {vinDecoded}</Text> : null}
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"year-" + pickerResetKey} selectedValue={year} onValueChange={(val) => setYear(val)} style={styles.picker}>
              <Picker.Item label="Year" value="" />
              {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"make-" + pickerResetKey} selectedValue={make} onValueChange={(val) => { setMake(val); setModel(""); setModelOther(""); setTrim(""); }} style={styles.picker}>
              <Picker.Item label="Make" value="" />
              {makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
            </Picker>
          </View>
        </View>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"model-" + make + "-" + pickerResetKey} selectedValue={model} onValueChange={(val) => { setModel(val); if (val !== "Other") setModelOther(""); setTrim(""); }} style={styles.picker} enabled={make !== ""}>
              <Picker.Item label="Model" value="" />
              {make ? CAR_DATA[make].map(m => <Picker.Item key={m} label={m} value={m} />) : []}
              {make && !(CAR_DATA[make] || []).includes("Other") ? <Picker.Item key="__other__" label="Other" value="Other" /> : null}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"trim-" + make + "-" + model + "-" + pickerResetKey} selectedValue={trim} onValueChange={(val) => setTrim(val)} style={styles.picker} enabled={make !== ""}>
              <Picker.Item label="Trim" value="" />
              {trimsFor(make, model).map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
        </View>
        {model === "Other" && (
          <TextInput style={styles.input} placeholder="e.g. Econoline" placeholderTextColor="#999999" autoCapitalize="words" value={modelOther} onChangeText={setModelOther} />
        )}
        <TextInput style={styles.input} placeholder="Mileage" placeholderTextColor="#999999" keyboardType="numeric" value={mileage} onChangeText={setMileage} />
        <Text style={styles.sectionLabel}>Location</Text>
        <View style={{flexDirection: "row", gap: 8}}>
          <TextInput style={[styles.input, {flex: 2}]} placeholder="City" placeholderTextColor="#999999" value={city} onChangeText={setCity} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="ZIP" placeholderTextColor="#999999" keyboardType="numeric" value={zip} onChangeText={setZip} />
        </View>
        <Text style={styles.sectionLabel}>Condition - tap to toggle</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]} onPress={() => setRuns(!runs)}>
            <Text style={[styles.toggleText, styles.toggleTextActive]}>{runs ? "Runs" : "Not Running"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]} onPress={() => setHasKeys(!hasKeys)}>
            <Text style={[styles.toggleText, styles.toggleTextActive]}>{hasKeys ? "Has Keys" : "No Keys"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]} onPress={() => setHasTitle(!hasTitle)}>
            <Text style={[styles.toggleText, styles.toggleTextActive]}>{hasTitle ? "Drivable" : "Not Drivable"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Title Status</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "clean" && styles.toggleActive]} onPress={() => setTitleStatus("clean")}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.toggleText, titleStatus === "clean" && styles.toggleTextActive]}>Clean Title</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "rebuilt" && styles.toggleActive]} onPress={() => setTitleStatus("rebuilt")}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.toggleText, titleStatus === "rebuilt" && styles.toggleTextActive]}>Rebuilt Salvage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "salvage" && styles.toggleActive]} onPress={() => setTitleStatus("salvage")}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.toggleText, titleStatus === "salvage" && styles.toggleTextActive]}>Salvage Title</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Engine</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "good" && styles.toggleActive]} onPress={() => setEngineStatus("good")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, engineStatus === "good" && styles.toggleTextActive]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "bad" && styles.toggleActive]} onPress={() => setEngineStatus("bad")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, engineStatus === "bad" && styles.toggleTextActive]}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "unknown" && styles.toggleActive]} onPress={() => setEngineStatus("unknown")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, engineStatus === "unknown" && styles.toggleTextActive]}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Transmission</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "good" && styles.toggleActive]} onPress={() => setTransStatus("good")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, transStatus === "good" && styles.toggleTextActive]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "bad" && styles.toggleActive]} onPress={() => setTransStatus("bad")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, transStatus === "bad" && styles.toggleTextActive]}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "unknown" && styles.toggleActive]} onPress={() => setTransStatus("unknown")}>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.toggleText, transStatus === "unknown" && styles.toggleTextActive]}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Airbags</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, airbags === "deployed" && styles.toggleActive]} onPress={() => setAirbags("deployed")}>
            <Text style={[styles.toggleText, airbags === "deployed" && styles.toggleTextActive]}>One or more deployed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, airbags === "none" && styles.toggleActive]} onPress={() => setAirbags("none")}>
            <Text style={[styles.toggleText, airbags === "none" && styles.toggleTextActive]}>No airbags deployed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Tires</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, tires === "all4" && styles.toggleActive]} onPress={() => setTires("all4")}>
            <Text style={[styles.toggleText, tires === "all4" && styles.toggleTextActive]}>All 4 tires</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, tires === "missing" && styles.toggleActive]} onPress={() => setTires("missing")}>
            <Text style={[styles.toggleText, tires === "missing" && styles.toggleTextActive]}>Missing 1 or more</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Vehicle Delivery</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, {paddingVertical: 18}, styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={[styles.toggleText, styles.toggleTextActive]}>{needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Damage Level</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "none" && styles.toggleActive]} onPress={() => setDamage("none")}>
            <Text style={[styles.toggleText, damage === "none" && styles.toggleTextActive]}>No Damage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "minor" && styles.toggleActive]} onPress={() => setDamage("minor")}>
            <Text style={[styles.toggleText, damage === "minor" && styles.toggleTextActive]}>Minor</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "moderate" && styles.toggleActive]} onPress={() => setDamage("moderate")}>
            <Text style={[styles.toggleText, damage === "moderate" && styles.toggleTextActive]}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "major" && styles.toggleActive]} onPress={() => setDamage("major")}>
            <Text style={[styles.toggleText, damage === "major" && styles.toggleTextActive]}>Major Damage</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the condition, any issues, etc." placeholderTextColor="#999999" multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
        <Text style={styles.sectionLabel}>Photos ({photos.length}/8)</Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>+ Add Photo</Text>
        </TouchableOpacity>
        <View style={styles.photoGrid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                <Text style={styles.removePhotoText}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.sellerButton, (model === "Other" && !modelOther.trim()) && {opacity: 0.5}]} onPress={handleSubmit} disabled={loading || (model === "Other" && !modelOther.trim())}>
          <Text style={styles.sellerButtonText}>{loading ? "Saving..." : "Submit Listing"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefZip, setPrefZip] = useState("");
  const [prefRadius, setPrefRadius] = useState("50");
  const [prefYearFrom, setPrefYearFrom] = useState("");
  const [prefYearTo, setPrefYearTo] = useState("");
  const [prefMakes, setPrefMakes] = useState([]);
  const [prefRunsOnly, setPrefRunsOnly] = useState(false);
  const [prefCleanTitleOnly, setPrefCleanTitleOnly] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [role, setRole] = useState("both");
  const [activeCount, setActiveCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [bidsPlacedCount, setBidsPlacedCount] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const listingsSnap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", user.uid)));
        const data = listingsSnap.docs.map(d => d.data());
        setActiveCount(data.filter(l => l.status !== "sold" && l.status !== "deleted").length);
        setSoldCount(data.filter(l => l.status === "sold").length);
        const bidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid)));
        setBidsPlacedCount(bidsSnap.size);
      } catch(e) {}
    };
    const unsub = navigation.addListener("focus", fetchCounts);
    return unsub;
  }, [navigation]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setUserData({ id: snap.docs[0].id, ...data });
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhone(data.phone || "");
          setOrigPhone(data.phone || "");
          setZipCode(data.zipCode || "");
          setCompanyName(data.companyName || "");
          const bp = data.buyingPreferences || {};
          setPrefZip(bp.zip || "");
          setPrefRadius(bp.radius || "50");
          setPrefYearFrom(bp.yearFrom || "");
          setPrefYearTo(bp.yearTo || "");
          setPrefMakes(Array.isArray(bp.makes) ? bp.makes : []);
          setPrefRunsOnly(!!bp.runsOnly);
          setPrefCleanTitleOnly(!!bp.cleanTitleOnly);
          setSmsNotifications(!!data.smsNotifications);
          setRole(data.role || "both");
        }
      } catch(e) {}
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const [origPhone, setOrigPhone] = useState("");
  const [phoneVerifyStage, setPhoneVerifyStage] = useState("none");
  const [phoneVerifyCode, setPhoneVerifyCode] = useState("");
  const [phoneVerifyError, setPhoneVerifyError] = useState("");
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const saveProfileFields = async () => {
    if (userData && userData.id) {
      await updateDoc(doc(db, "users", userData.id), { firstName, lastName, zipCode, companyName, role });
    } else {
      const newDoc = await addDoc(collection(db, "users"), {
        uid: user.uid, email: user.email, firstName, lastName, phone, zipCode, companyName, role,
        pushToken: "", createdAt: serverTimestamp()
      });
      setUserData({ id: newDoc.id, uid: user.uid, firstName, lastName, phone, zipCode, companyName, role });
    }
  };

  const handleSave = async () => {
    try {
      if (phone !== origPhone) {
        setPhoneVerifying(true);
        try {
          const send = httpsCallable(getFunctions(), "sendPhoneVerification");
          await send({ phoneNumber: phone });
          setPhoneVerifyStage("code");
          setPhoneVerifyCode("");
          setPhoneVerifyError("");
        } catch (e) {
          const msg = e?.code === "functions/resource-exhausted"
            ? "Too many attempts. Please wait a few minutes and try again."
            : e?.code === "functions/invalid-argument"
              ? "That phone number doesn't look right. Please check and try again."
              : "Couldn't send verification code. Check the phone number and try again.";
          Alert.alert("Error", msg);
        }
        setPhoneVerifying(false);
        return;
      }
      await saveProfileFields();
      if (userData && userData.id) {
        await updateDoc(doc(db, "users", userData.id), { phone });
      }
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch(e) { Alert.alert("Error", e.message); }
  };

  const handleConfirmPhoneVerification = async () => {
    if (!phoneVerifyCode || phoneVerifyCode.length < 4) {
      setPhoneVerifyError("Enter the code we sent you.");
      return;
    }
    setPhoneVerifying(true);
    setPhoneVerifyError("");
    try {
      const check = httpsCallable(getFunctions(), "checkPhoneVerification");
      const result = await check({ phoneNumber: phone, code: phoneVerifyCode });
      if (!result?.data?.approved) {
        setPhoneVerifyError("That code didn't match. Try again or resend.");
        setPhoneVerifying(false);
        return;
      }
      await saveProfileFields();
      setOrigPhone(phone);
      setPhoneVerifyStage("none");
      setPhoneVerifyCode("");
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch (e) {
      const msg = e?.code === "functions/resource-exhausted"
        ? "Too many attempts. Please wait a few minutes and try again."
        : (e?.message || "Couldn't verify code. Please try again.");
      setPhoneVerifyError(msg);
    }
    setPhoneVerifying(false);
  };

  const handleResendProfileCode = async () => {
    if (phoneVerifying) return;
    setPhoneVerifyError("");
    try {
      const send = httpsCallable(getFunctions(), "sendPhoneVerification");
      await send({ phoneNumber: phone });
    } catch (e) {
      setPhoneVerifyError("Couldn't resend code. Try again in a moment.");
    }
  };

  const roleLabel = role === "buyer" ? "Buyer" : role === "seller" ? "Seller" : "Buyer + Seller";

  const handleSavePrefs = async () => {
    try {
      const prefs = { zip: prefZip, radius: prefRadius, yearFrom: prefYearFrom, yearTo: prefYearTo, makes: prefMakes, runsOnly: prefRunsOnly, cleanTitleOnly: prefCleanTitleOnly };
      if (userData && userData.id) {
        await updateDoc(doc(db, "users", userData.id), { buyingPreferences: prefs });
      } else {
        const newDoc = await addDoc(collection(db, "users"), {
          uid: user.uid, email: user.email, firstName, lastName, phone, zipCode, companyName,
          pushToken: "", buyingPreferences: prefs, createdAt: serverTimestamp()
        });
        setUserData({ id: newDoc.id, uid: user.uid, buyingPreferences: prefs });
      }
      Alert.alert("Saved", "We'll notify you when matching listings are posted.");
      setEditingPrefs(false);
    } catch(e) { Alert.alert("Error", e.message); }
  };

  const toggleMake = (m) => {
    setPrefMakes(prefMakes.includes(m) ? prefMakes.filter(x => x !== m) : [...prefMakes, m]);
  };

  const toggleSms = async () => {
    const next = !smsNotifications;
    setSmsNotifications(next);
    try {
      if (userData && userData.id) {
        await updateDoc(doc(db, "users", userData.id), { smsNotifications: next });
      } else {
        const newDoc = await addDoc(collection(db, "users"), {
          uid: user.uid, email: user.email, firstName, lastName, phone, zipCode, companyName,
          pushToken: "", smsNotifications: next, createdAt: serverTimestamp()
        });
        setUserData({ id: newDoc.id, uid: user.uid, smsNotifications: next });
      }
    } catch(e) {
      setSmsNotifications(!next);
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return (
    <View style={styles.container}>
      <Text style={styles.emptyStateText}>Loading...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Profile</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{soldCount}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bidsPlacedCount}</Text>
          <Text style={styles.statLabel}>Bids Placed</Text>
        </View>
      </View>

      <View style={styles.listingCard}>
        <Text style={styles.sectionLabel}>My Activity</Text>
        {(role === "seller" || role === "both") && (
          <TouchableOpacity style={styles.profileLinkRow} onPress={() => navigation.navigate("MyListings")}>
            <Ionicons name="car-outline" size={20} color="#1B2B5E" style={{width: 28}} />
            <Text style={styles.profileLinkText}>My Active Listings</Text>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
        {(role === "seller" || role === "both") && (
          <TouchableOpacity style={styles.profileLinkRow} onPress={() => navigation.navigate("MySoldListings")}>
            <Ionicons name="checkmark-done-circle-outline" size={20} color="#1B2B5E" style={{width: 28}} />
            <Text style={styles.profileLinkText}>My Sold Listings</Text>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
        {(role === "buyer" || role === "both") && (
          <TouchableOpacity style={styles.profileLinkRow} onPress={() => navigation.getParent()?.navigate("Bids") || navigation.navigate("Bids")}>
            <Ionicons name="pricetag-outline" size={20} color="#1B2B5E" style={{width: 28}} />
            <Text style={styles.profileLinkText}>My Bids</Text>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
        {(role === "buyer" || role === "both") && (
          <TouchableOpacity style={[styles.profileLinkRow, {borderBottomWidth: 0}]} onPress={() => navigation.navigate("MyPurchases")}>
            <Ionicons name="bag-check-outline" size={20} color="#1B2B5E" style={{width: 28}} />
            <Text style={styles.profileLinkText}>My Purchases</Text>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listingCard}>
        <Text style={styles.sectionLabel}>Account Info</Text>
        <Text style={styles.listingDetail}>Email: {user.email}</Text>
      </View>
      <View style={styles.listingCard}>
        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
          <Text style={styles.sectionLabel}>Personal Info</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={{color: "#1B2B5E", fontWeight: "bold"}}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <>
            <View style={{flexDirection: "row", gap: 8}}>
              <View style={{flex: 1}}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#999999" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#999999" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#999999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Text style={styles.fieldLabel}>ZIP Code</Text>
            <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#999999" keyboardType="numeric" value={zipCode} onChangeText={setZipCode} />
            <Text style={styles.fieldLabel}>Company Name (optional)</Text>
            <TextInput style={styles.input} placeholder="Company Name (optional)" placeholderTextColor="#999999" value={companyName} onChangeText={setCompanyName} />
            <Text style={styles.sectionLabel}>I want to</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleButton, role === "buyer" && styles.toggleActive]} onPress={() => setRole("buyer")}>
                <Text style={[styles.toggleText, role === "buyer" && styles.toggleTextActive]}>Buy cars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, role === "seller" && styles.toggleActive]} onPress={() => setRole("seller")}>
                <Text style={[styles.toggleText, role === "seller" && styles.toggleTextActive]}>Sell cars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, role === "both" && styles.toggleActive]} onPress={() => setRole("both")}>
                <Text style={[styles.toggleText, role === "both" && styles.toggleTextActive]}>Both</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dealerButton} onPress={handleSave} disabled={phoneVerifying}>
              <Text style={styles.dealerButtonText}>{phoneVerifying && phoneVerifyStage === "none" ? "Sending code..." : "Save Changes"}</Text>
            </TouchableOpacity>
            {phoneVerifyStage === "code" && (
              <View style={[styles.listingCard, {marginTop: 8, borderColor: "#1B2B5E", borderWidth: 2}]}>
                <Text style={styles.sectionLabel}>Verify new phone</Text>
                <Text style={styles.listingDetail}>We sent a 6-digit code to {phone}.</Text>
                <TextInput
                  style={[styles.input, {fontSize: 22, letterSpacing: 6, textAlign: "center"}]}
                  placeholder="6-digit code"
                  placeholderTextColor="#999999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={phoneVerifyCode}
                  onChangeText={(t) => { setPhoneVerifyCode(t.replace(/\D/g, "")); setPhoneVerifyError(""); }}
                />
                {phoneVerifyError ? <Text style={{color: "#c0392b", fontSize: 14, marginTop: -4}}>{phoneVerifyError}</Text> : null}
                <TouchableOpacity style={styles.dealerButton} onPress={handleConfirmPhoneVerification} disabled={phoneVerifying}>
                  <Text style={styles.dealerButtonText}>{phoneVerifying ? "Verifying..." : "Verify and save"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResendProfileCode} disabled={phoneVerifying}>
                  <Text style={styles.backText}>Resend code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setPhoneVerifyStage("none"); setPhoneVerifyCode(""); setPhoneVerifyError(""); }}>
                  <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.listingDetail}>Name: {firstName} {lastName}</Text>
            <Text style={styles.listingDetail}>Phone: {phone}</Text>
            <Text style={styles.listingDetail}>ZIP Code: {zipCode}</Text>
            {companyName ? <Text style={styles.listingDetail}>Company: {companyName}</Text> : null}
            <Text style={styles.listingDetail}>Role: {roleLabel}</Text>
          </>
        )}
      </View>
      {(role === "buyer" || role === "both") && (
      <View style={styles.listingCard}>
        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
          <Text style={styles.sectionLabel}>Buying Preferences</Text>
          <TouchableOpacity onPress={() => setEditingPrefs(!editingPrefs)}>
            <Text style={{color: "#1B2B5E", fontWeight: "bold"}}>{editingPrefs ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.listingDetail, {marginBottom: 12}]}>Get notified when a new listing matches your criteria.</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, smsNotifications && styles.toggleActive]} onPress={toggleSms}>
            <Text style={[styles.toggleText, smsNotifications && styles.toggleTextActive]}>{smsNotifications ? "SMS notifications: ON" : "SMS notifications: OFF"}</Text>
          </TouchableOpacity>
        </View>
        {editingPrefs ? (
          <>
            <Text style={styles.sectionLabel}>ZIP Code</Text>
            <TextInput style={styles.input} placeholder="Your ZIP" placeholderTextColor="#999999" keyboardType="numeric" maxLength={5} value={prefZip} onChangeText={setPrefZip} />
            <Text style={styles.sectionLabel}>Radius</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={prefRadius} onValueChange={setPrefRadius} style={styles.picker}>
                <Picker.Item label="25 miles" value="25" />
                <Picker.Item label="50 miles" value="50" />
                <Picker.Item label="100 miles" value="100" />
                <Picker.Item label="200 miles" value="200" />
                <Picker.Item label="Any distance" value="99999" />
              </Picker>
            </View>
            <Text style={styles.sectionLabel}>Year Range</Text>
            <View style={styles.pickerRow}>
              <View style={[styles.pickerContainer, styles.pickerHalf]}>
                <Picker selectedValue={prefYearFrom} onValueChange={setPrefYearFrom} style={styles.picker}>
                  <Picker.Item label="From Year" value="" />
                  {Array.from({length: 36}, (_, i) => (1990 + i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
                </Picker>
              </View>
              <View style={[styles.pickerContainer, styles.pickerHalf]}>
                <Picker selectedValue={prefYearTo} onValueChange={setPrefYearTo} style={styles.picker}>
                  <Picker.Item label="To Year" value="" />
                  {Array.from({length: 36}, (_, i) => (1990 + i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
                </Picker>
              </View>
            </View>
            <Text style={styles.sectionLabel}>Makes (none = all)</Text>
            <View style={styles.chipsContainer}>
              {Object.keys(CAR_DATA).sort().map(m => (
                <TouchableOpacity key={m} style={[styles.chip, prefMakes.includes(m) && styles.chipActive]} onPress={() => toggleMake(m)}>
                  <Text style={[styles.chipText, prefMakes.includes(m) && styles.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>Condition</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleButton, prefRunsOnly && styles.toggleActive]} onPress={() => setPrefRunsOnly(!prefRunsOnly)}>
                <Text style={[styles.toggleText, prefRunsOnly && styles.toggleTextActive]}>Runs only</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, prefCleanTitleOnly && styles.toggleActive]} onPress={() => setPrefCleanTitleOnly(!prefCleanTitleOnly)}>
                <Text style={[styles.toggleText, prefCleanTitleOnly && styles.toggleTextActive]}>Clean title only</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dealerButton} onPress={handleSavePrefs}>
              <Text style={styles.dealerButtonText}>Save Preferences</Text>
            </TouchableOpacity>
          </>
        ) : prefZip ? (
          <>
            <Text style={styles.listingDetail}>Within {prefRadius === "99999" ? "any distance" : prefRadius + " miles"} of {prefZip}</Text>
            <Text style={styles.listingDetail}>Years: {prefYearFrom || "any"} – {prefYearTo || "any"}</Text>
            <Text style={styles.listingDetail}>Makes: {prefMakes.length === 0 ? "All makes" : prefMakes.join(", ")}</Text>
            {prefRunsOnly ? <Text style={styles.listingDetail}>Runs only</Text> : null}
            {prefCleanTitleOnly ? <Text style={styles.listingDetail}>Clean title only</Text> : null}
          </>
        ) : (
          <Text style={styles.listingDetail}>No preferences set. Tap Edit to get notified about new listings.</Text>
        )}
      </View>
      )}

      <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#c0392b" style={{marginRight: 8}} />
        <Text style={styles.logoutCardText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MyBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [counterRespSubmit, setCounterRespSubmit] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMyBid = async () => {
      try {
        const snap = await getDocs(query(collection(db, "bids"), where("listingId", "==", listing.id), where("buyerId", "==", user.uid)));
        if (!snap.empty) {
          const bidData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setMyBid(bidData);
          setAmount(bidData.amount.toString());
          setPickupTime(bidData.pickupTime || "");
          setNote(bidData.note || "");
          setInternalNote(bidData.internalNote || "");
        }
      } catch(e) {}
      setLoading(false);
    };
    fetchMyBid();
  }, []);

  const handleAcceptCounter = async () => {
    setCounterRespSubmit(true);
    try {
      const counterAmt = myBid.counterAmount;
      let sellerPhone = "";
      let sellerName = "";
      let buyerPhone = "";
      let buyerName = "";
      let sellerToken = "";
      try {
        const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", listing.sellerId)));
        if (!sellerSnap.empty) {
          const s = sellerSnap.docs[0].data();
          sellerPhone = s.phone || "";
          sellerToken = s.pushToken || "";
          sellerName = ((s.firstName || "") + " " + (s.lastName || "")).trim();
        }
        const buyerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!buyerSnap.empty) {
          const b = buyerSnap.docs[0].data();
          buyerPhone = b.phone || "";
          buyerName = ((b.firstName || "") + " " + (b.lastName || "")).trim();
        }
      } catch(e) {}
      await updateDoc(doc(db, "bids", myBid.id), { amount: counterAmt, status: "accepted", counterStatus: "accepted", buyerPhone, buyerName, sellerPhone, sellerName });
      await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: counterAmt, soldToEmail: user.email, soldToPhone: buyerPhone, soldToName: buyerName, sellerPhone, sellerName });
      try {
        if (sellerToken) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: sellerToken,
              title: "Counter accepted!",
              body: "Buyer accepted your $" + counterAmt + " counter on the " + listing.year + " " + listing.make + " " + listing.model + ". Buyer: " + user.email,
            }),
          });
        }
      } catch(e) {}
      setMyBid({ ...myBid, amount: counterAmt, status: "accepted", counterStatus: "accepted", buyerPhone, buyerName, sellerPhone, sellerName });
      Alert.alert("Deal Done!", "You've accepted the counter at $" + counterAmt);
    } catch(e) { Alert.alert("Error", e.message); }
    setCounterRespSubmit(false);
  };

  const handleDeclineCounter = () => {
    Alert.alert("Decline Counter", "Decline this counteroffer? Your original bid will remain active.", [
      { text: "Cancel", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: async () => {
        setCounterRespSubmit(true);
        try {
          await updateDoc(doc(db, "bids", myBid.id), { counterStatus: "declined" });
          try {
            const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", listing.sellerId)));
            if (!sellerSnap.empty) {
              const sellerToken = sellerSnap.docs[0].data().pushToken;
              if (sellerToken) {
                await fetch("https://exp.host/--/api/v2/push/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: sellerToken,
                    title: "Counter declined",
                    body: "Buyer declined your $" + myBid.counterAmount + " counter on the " + listing.year + " " + listing.make + " " + listing.model,
                  }),
                });
              }
            }
          } catch(e) {}
          setMyBid({ ...myBid, counterStatus: "declined" });
        } catch(e) { Alert.alert("Error", e.message); }
        setCounterRespSubmit(false);
      }}
    ]);
  };

  const handleRaiseBid = async () => {
    if (!amount) { Alert.alert("Error", "Please enter a bid amount"); return; }
    if (parseFloat(amount) <= (myBid?.amount || 0)) {
      Alert.alert("Error", "New bid must be higher than your current bid of $" + myBid.amount);
      return;
    }
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "bids", myBid.id), { amount: parseFloat(amount), pickupTime, note, internalNote });
      Alert.alert("Success", "Your bid has been updated!");
      navigation.goBack();
    } catch(e) { Alert.alert("Error", e.message); }
    setSubmitting(false);
  };

  if (loading) return (
    <View style={styles.container}>
      <Text style={styles.emptyStateText}>Loading...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Bids</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listingCard}>
        {listing.photos && listing.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {listing.photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.bidListingPhoto} />
            ))}
          </ScrollView>
        )}
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model} {listing.trim}</Text>
        {listing.vin ? <Text style={styles.listingDetail}>VIN: {listing.vin}</Text> : null}
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        <Text style={styles.listingDetail}>Runs: {listing.runs ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Keys: {listing.hasKeys ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Drivable: {listing.hasTitle ? "Yes" : "No"}</Text>
        <Text style={styles.listingDetail}>Delivery: {listing.needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
        {listing.titleStatus ? <Text style={styles.listingDetail}>Title: {listing.titleStatus}</Text> : null}
        {listing.engineStatus ? <Text style={styles.listingDetail}>Engine: {listing.engineStatus}</Text> : null}
        {listing.transStatus ? <Text style={styles.listingDetail}>Transmission: {listing.transStatus}</Text> : null}
        {listing.airbags ? <Text style={styles.listingDetail}>Airbags: {listing.airbags}</Text> : null}
        {listing.tires ? <Text style={styles.listingDetail}>Tires: {listing.tires}</Text> : null}
        {listing.damage ? <Text style={styles.listingDetail}>Damage: {listing.damage}</Text> : null}
        {listing.notes ? <Text style={styles.listingDetail}>Notes: {listing.notes}</Text> : null}
      </View>
      {myBid && (
        <View style={styles.listingCard}>
          <Text style={styles.sectionLabel}>{myBid.status === "accepted" ? "Sold for" : "Your Current Bid"}</Text>
          <Text style={styles.bidAmount}>${myBid.amount}</Text>
          <Text style={styles.listingDetail}>Status: {myBid.status === "accepted" ? "Accepted" : "Pending"}</Text>
          {myBid.towingIncluded && <Text style={styles.listingDetail}>Towing included in bid</Text>}
          {myBid.pickupTime ? <Text style={styles.listingDetail}>Pickup: {myBid.pickupTime === "morning" ? "Morning" : "Afternoon"}</Text> : null}
          {myBid.note ? <Text style={styles.listingDetail}>Note: {myBid.note}</Text> : null}
          {myBid.internalNote ? <Text style={styles.listingDetail}>Private: {myBid.internalNote}</Text> : null}
        </View>
      )}
      {myBid && myBid.status === "accepted" && (
        <View style={styles.listingCard}>
          <Text style={styles.sectionLabel}>Seller Contact</Text>
          {myBid.sellerName ? <Text style={styles.listingDetail}>Name: {myBid.sellerName}</Text> : null}
          <Text style={styles.listingDetail}>Email: {listing.sellerEmail}</Text>
          {myBid.sellerPhone ? <Text style={styles.listingDetail}>Phone: {myBid.sellerPhone}</Text> : null}
        </View>
      )}
      {myBid && myBid.status !== "accepted" && myBid.counterStatus === "pending" && (
        <View style={[styles.listingCard, {borderColor: "#1B2B5E", borderWidth: 2}]}>
          <Text style={styles.sectionLabel}>Seller Counteroffer</Text>
          <Text style={styles.bidAmount}>${myBid.counterAmount}</Text>
          {myBid.counterNote ? <Text style={styles.listingDetail}>Note: {myBid.counterNote}</Text> : null}
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptCounter} disabled={counterRespSubmit}>
            <Text style={styles.acceptButtonText}>{counterRespSubmit ? "Processing..." : "Accept Counter"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dealerButton, {backgroundColor: "#c0392b", marginTop: 8, marginBottom: 0}]} onPress={handleDeclineCounter} disabled={counterRespSubmit}>
            <Text style={styles.dealerButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {myBid && myBid.status !== "accepted" && myBid.counterStatus !== "pending" && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Raise Your Bid</Text>
          <TextInput style={styles.input} placeholder="New Bid Amount ($)" placeholderTextColor="#999999" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Text style={styles.sectionLabel}>Pickup Time</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleButton, pickupTime === "morning" && styles.toggleActive]} onPress={() => setPickupTime("morning")}>
              <Text style={[styles.toggleText, pickupTime === "morning" && styles.toggleTextActive]}>Morning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, pickupTime === "afternoon" && styles.toggleActive]} onPress={() => setPickupTime("afternoon")}>
              <Text style={[styles.toggleText, pickupTime === "afternoon" && styles.toggleTextActive]}>Afternoon</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionLabel}>Message to Seller</Text>
          <TextInput style={styles.input} placeholder="Note to seller (optional)" placeholderTextColor="#999999" value={note} onChangeText={setNote} />
          <TextInput style={styles.input} placeholder="Private note for yourself (optional)" placeholderTextColor="#999999" value={internalNote} onChangeText={setInternalNote} />
          <TouchableOpacity style={styles.dealerButton} onPress={handleRaiseBid}>
            <Text style={styles.dealerButtonText}>{submitting ? "Updating..." : "Update Bid"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MyBidsScreen({ navigation }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      const user = auth.currentUser;
      const bidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid)));
      const bidsData = bidsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const bidsWithListings = await Promise.all(bidsData.map(async bid => {
        try {
          const listingSnap = await getDocs(query(collection(db, "listings"), where("__name__", "==", bid.listingId)));
          const listing = listingSnap.empty ? null : { id: listingSnap.docs[0].id, ...listingSnap.docs[0].data() };
          return { ...bid, listingInfo: listing };
        } catch(e) { return bid; }
      }));
      const listings = bidsWithListings.map(b => b.listingInfo).filter(Boolean);
      const listingsWithCounts = await attachBidCounts(listings);
      const countById = Object.fromEntries(listingsWithCounts.map(l => [l.id, l.bidCount || 0]));
      for (const b of bidsWithListings) {
        if (b.listingInfo) b.listingInfo.bidCount = countById[b.listingInfo.id] || 0;
      }
      bidsWithListings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBids(bidsWithListings);
    } catch(e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchBids);
    return unsubscribe;
  }, [navigation]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Bids</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : bids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>💰</Text>
          <Text style={styles.emptyStateText}>You haven't placed any bids</Text>
          <Text style={styles.emptyStateSubtext}>Find a car you like and make an offer. Sellers will be notified instantly.</Text>
        </View>
      ) : bids.map(bid => bid.listingInfo ? (
        <ListingCard
          key={bid.id}
          listing={bid.listingInfo}
          style={bid.status === "accepted" && styles.acceptedCard}
          onPress={() => navigation.navigate("MyBid", { listing: bid.listingInfo })}
        >
          {bid.counterStatus === "pending" && bid.status !== "accepted" && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>Counteroffer received: ${bid.counterAmount}</Text>
            </View>
          )}
          <Text style={styles.bidAmount}>${bid.amount}</Text>
          {bid.status === "accepted" ? <Text style={styles.acceptedBadge}>ACCEPTED</Text> : <Text style={styles.listingDetail}>Status: Pending</Text>}
          {bid.towingIncluded && <Text style={styles.listingDetail}>Towing included</Text>}
          {bid.pickupTime ? <Text style={styles.listingDetail}>Pickup: {bid.pickupTime === "morning" ? "Morning" : "Afternoon"}</Text> : null}
          <Text style={styles.listingDetail}>{formatBidDate(bid.createdAt)}</Text>
        </ListingCard>
      ) : (
        <View key={bid.id} style={styles.listingCard}>
          <Text style={styles.listingTitle}>Vehicle</Text>
          <Text style={styles.bidAmount}>${bid.amount}</Text>
          <Text style={styles.listingDetail}>Listing no longer available</Text>
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MySoldListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSold = async () => {
    try {
      const user = auth.currentUser;
      const snap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", user.uid), where("status", "==", "sold")));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const withCounts = await attachBidCounts(data);
      setListings(withCounts);
    } catch(e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", fetchSold);
    return unsub;
  }, [navigation]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Sold Listings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>🏷️</Text>
          <Text style={styles.emptyStateText}>No sales yet</Text>
          <Text style={styles.emptyStateSubtext}>Once you accept an offer on one of your listings, it'll show up here.</Text>
        </View>
      ) : listings.map(l => {
        const fee = Math.round((l.soldPrice || 0) * PLATFORM_FEE_PERCENT / 100);
        return (
          <ListingCard key={l.id} listing={l} style={styles.acceptedCard}>
            <Text style={styles.bidAmount}>SOLD - ${l.soldPrice}</Text>
            {l.soldToName ? <Text style={styles.listingDetail}>Buyer: {l.soldToName}</Text> : null}
            <Text style={styles.listingDetail}>Email: {l.soldToEmail || "—"}</Text>
            {l.soldToPhone ? <Text style={styles.listingDetail}>Phone: {l.soldToPhone}</Text> : null}
            <Text style={styles.listingDetail}>Platform fee ({PLATFORM_FEE_PERCENT}%): -${fee}</Text>
            <Text style={[styles.listingDetail, {fontWeight: "bold", color: "#1a1a1a"}]}>Net: ${(l.soldPrice || 0) - fee}</Text>
          </ListingCard>
        );
      })}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MyPurchasesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      const user = auth.currentUser;
      const bidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid), where("status", "==", "accepted")));
      const bids = bidsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const enriched = await Promise.all(bids.map(async bid => {
        try {
          const listingSnap = await getDocs(query(collection(db, "listings"), where("__name__", "==", bid.listingId)));
          const listing = listingSnap.empty ? null : { id: listingSnap.docs[0].id, ...listingSnap.docs[0].data() };
          return { ...bid, listingInfo: listing };
        } catch(e) { return bid; }
      }));
      const listings = enriched.map(b => b.listingInfo).filter(Boolean);
      const listingsWithCounts = await attachBidCounts(listings);
      const countById = Object.fromEntries(listingsWithCounts.map(l => [l.id, l.bidCount || 0]));
      for (const b of enriched) {
        if (b.listingInfo) b.listingInfo.bidCount = countById[b.listingInfo.id] || 0;
      }
      enriched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(enriched);
    } catch(e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", fetchPurchases);
    return unsub;
  }, [navigation]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Purchases</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{fontSize: 60, marginBottom: 16}}>🛒</Text>
          <Text style={styles.emptyStateText}>No purchases yet</Text>
          <Text style={styles.emptyStateSubtext}>When a seller accepts one of your bids, the deal will show up here.</Text>
        </View>
      ) : items.map(item => item.listingInfo ? (
        <ListingCard key={item.id} listing={item.listingInfo} style={styles.acceptedCard}>
          <Text style={styles.bidAmount}>${item.amount}</Text>
          <Text style={styles.listingDetail}>Seller: {item.listingInfo.sellerEmail || "—"}</Text>
          {item.sellerPhone ? <Text style={styles.listingDetail}>Phone: {item.sellerPhone}</Text> : null}
          {item.towingIncluded !== undefined && (item.towingIncluded
            ? <View style={styles.towingBadgeIn}><Text style={styles.towingBadgeText}>Towing included</Text></View>
            : <View style={styles.towingBadgeOut}><Text style={styles.towingBadgeText}>Towing not included</Text></View>)}
        </ListingCard>
      ) : (
        <View key={item.id} style={[styles.listingCard, styles.acceptedCard]}>
          <Text style={styles.listingTitle}>Vehicle</Text>
          <Text style={styles.bidAmount}>${item.amount}</Text>
          <Text style={styles.listingDetail}>Listing no longer available</Text>
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EditListingScreen({ route, navigation }) {
  const { listing } = route.params;
  const [mileage, setMileage] = useState(listing.mileage || "");
  const [city, setCity] = useState(listing.city || "");
  const [zip, setZip] = useState(listing.zip || "");
  const [notes, setNotes] = useState(listing.notes || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "listings", listing.id), { mileage, city, zip, notes });
      Alert.alert("Success", "Listing updated!");
      navigation.goBack();
    } catch(e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Edit Listing</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Vehicle</Text>
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model} {listing.trim}</Text>
        <Text style={styles.sectionLabel}>Mileage</Text>
        <TextInput style={styles.input} placeholder="Mileage" placeholderTextColor="#999999" keyboardType="numeric" value={mileage} onChangeText={setMileage} />
        <Text style={styles.sectionLabel}>Location</Text>
        <View style={{flexDirection: "row", gap: 8}}>
          <TextInput style={[styles.input, {flex: 2}]} placeholder="City" placeholderTextColor="#999999" value={city} onChangeText={setCity} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="ZIP" placeholderTextColor="#999999" keyboardType="numeric" value={zip} onChangeText={setZip} />
        </View>
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the condition, any issues, etc." placeholderTextColor="#999999" multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
        <TouchableOpacity style={styles.dealerButton} onPress={handleSave}>
          <Text style={styles.dealerButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ListingCard({ listing, onPress, style, children }) {
  const bidCount = listing.bidCount || 0;
  return (
    <TouchableOpacity style={[styles.listingCard, style]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {listing.photos && listing.photos.length > 0 && (
        <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
      )}
      <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
      {listing.mileage ? <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text> : null}
      {(listing.city || listing.zip) ? <Text style={styles.listingDetail}>{listing.city}{listing.city && listing.zip ? ", " : ""}{listing.zip}</Text> : null}
      <Text style={styles.listingDetail}>Runs: {listing.runs ? "Yes" : "No"}</Text>
      <Text style={styles.listingDetail}>Has Title: {listing.hasTitle ? "Yes" : "No"}</Text>
      <Text style={[styles.listingDetail, {fontWeight: "bold", color: "#1B2B5E"}]}>{bidCount === 1 ? "1 bid" : bidCount + " bids"}</Text>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", padding: 24 },
  scrollContainer: { flex: 1, backgroundColor: "#f5f5f5", padding: 24 },
  scrollContent: { paddingBottom: 60 },
  header: { alignItems: "center", marginBottom: 60 },
  logo: { fontSize: 42, fontWeight: "bold", color: "#1B2B5E", marginBottom: 12, letterSpacing: 1 },
  tagline: { fontSize: 16, color: "#555555", textAlign: "center", marginBottom: 40 },
  form: { width: "100%", gap: 16 },
  formContainer: { gap: 16 },
  input: { backgroundColor: "#ffffff", color: "#1a1a1a", padding: 16, borderRadius: 12, fontSize: 16, width: "100%", borderWidth: 1, borderColor: "#dddddd" },
  textArea: { height: 120, textAlignVertical: "top" },
  buttons: { width: "100%", gap: 16 },
  sellerButton: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  sellerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  dealerButton: { backgroundColor: "#1B2B5E", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  dealerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  secondaryButton: { borderWidth: 1, borderColor: "#1B2B5E", padding: 18, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: "#1B2B5E", fontSize: 18 },
  activeToggle: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  backText: { color: "#555555", textAlign: "center", fontSize: 16, marginTop: 8 },
  dashboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 60, marginBottom: 24 },
  dashboardTitle: { fontSize: 30, fontWeight: "bold", color: "#1B2B5E" },
  logoutText: { color: "#c0392b", fontSize: 20, fontWeight: "bold" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptyStateSubtext: { color: "#555555", fontSize: 14 },
  sectionLabel: { color: "#1B2B5E", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" },
  fieldLabel: { color: "#666666", fontSize: 13, fontWeight: "500", marginTop: 6, marginBottom: 4 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, padding: 12, alignItems: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: "#eeeeee" },
  statTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 8 },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#666666", fontWeight: "500" },
  statLink: { fontSize: 11, color: "#1B2B5E", fontWeight: "600", marginTop: 4 },
  listingCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  listingCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  listingTitle: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold" },
  listingDetail: { color: "#555555", fontSize: 14, marginBottom: 4 },
  listingPhoto: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  bidListingPhoto: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  viewBidsText: { color: "#1B2B5E", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  bidButton2: { color: "#1B2B5E", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  soldCard: { opacity: 0.7, borderWidth: 1, borderColor: "#27AE60" },
  soldBadge: { color: "#27AE60", fontSize: 12, fontWeight: "bold" },
  conditionBadge: { color: "#1B2B5E", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  bidCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  acceptedCard: { borderWidth: 2, borderColor: "#27AE60" },
  bidAmount: { color: "#1a1a1a", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  highestBadge: { color: "#1B2B5E", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  counterPending: { padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8, marginTop: 12 },
  acceptedBadge: { color: "#27AE60", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptButton: { backgroundColor: "#27AE60", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
  acceptedButton: { backgroundColor: "#888888" },
  acceptButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 4, height: 64, overflow: "hidden", justifyContent: "center", paddingHorizontal: 8, borderWidth: 1, borderColor: "#dddddd" },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerHalf: { flex: 1 },
  picker: { color: "#000000" },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  toggleButton: { flex: 1, minWidth: 100, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, alignItems: "center", backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#dddddd" },
  toggleActive: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleActiveRed: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleOrange: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleYellow: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleText: { color: "#1a1a1a", fontSize: 14, fontWeight: "bold" },
  toggleTextActive: { color: "#ffffff" },
  photoButton: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1B2B5E", marginBottom: 8 },
  photoButtonText: { color: "#1B2B5E", fontSize: 16 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  photoWrapper: { position: "relative" },
  photoThumb: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: { position: "absolute", top: -8, right: -8, backgroundColor: "#c0392b", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  filterContainer: { gap: 8, marginBottom: 16 },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },
  eyeText: { color: "#1B2B5E", fontSize: 14, fontWeight: "bold" },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },
  eyeText: { color: "#1B2B5E", fontSize: 14, fontWeight: "bold" },
  filterButton: { backgroundColor: "#1B2B5E", padding: 14, borderRadius: 12, alignItems: "center" },
  filterButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  zipRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  locationButton: { backgroundColor: "#1B2B5E", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", minWidth: 80 },
  locationButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#dddddd" },
  chipActive: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  chipText: { color: "#1a1a1a", fontSize: 14 },
  chipTextActive: { color: "#ffffff", fontWeight: "bold" },
  towingBadgeOut: { alignSelf: "flex-start", backgroundColor: "#c0392b", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginVertical: 4 },
  towingBadgeIn: { alignSelf: "flex-start", backgroundColor: "#27AE60", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginVertical: 4 },
  towingBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  counterBadge: { alignSelf: "flex-start", backgroundColor: "#1B2B5E", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginVertical: 4 },
  counterBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  towingToggleIn: { backgroundColor: "#27AE60", padding: 18, borderRadius: 14, alignItems: "center" },
  towingToggleOut: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center" },
  towingToggleText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  homeContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  homeHeader: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 16 },
  heroBrand: { fontSize: 32, fontWeight: "bold", color: "#1B2B5E", letterSpacing: 0.5 },
  heroGreeting: { fontSize: 16, color: "#666", marginTop: 2 },
  heroCta: { backgroundColor: "#c0392b", marginHorizontal: 16, padding: 18, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  heroCtaTitle: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  heroCtaSubtitle: { color: "#ffeae6", fontSize: 13, marginTop: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 28, marginBottom: 8 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", color: "#1B2B5E" },
  sectionLink: { fontSize: 13, color: "#1B2B5E", fontWeight: "600" },
  softText: { color: "#888", fontSize: 14, paddingHorizontal: 20, marginTop: 4 },
  featuredCard: { width: 220, backgroundColor: "#ffffff", borderRadius: 14, marginRight: 12, borderWidth: 1, borderColor: "#eee", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  featuredPhoto: { width: "100%", height: 130, resizeMode: "cover", backgroundColor: "#eee" },
  featuredBidPill: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(27,43,94,0.92)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  featuredBidPillText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  featuredTitle: { fontSize: 14, fontWeight: "bold", color: "#1a1a1a" },
  featuredHighest: { fontSize: 13, color: "#1B2B5E", fontWeight: "600", marginTop: 2 },
  featuredLocation: { fontSize: 12, color: "#888", marginLeft: 4 },
  featuredPickup: { fontSize: 11, fontWeight: "600", marginLeft: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  activityLabel: { fontSize: 14, color: "#1a1a1a" },
  activityTime: { fontSize: 12, color: "#888", marginTop: 2 },
  profileLinkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  profileLinkText: { flex: 1, fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  logoutCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: "#c0392b", backgroundColor: "#ffffff" },
  logoutCardText: { color: "#c0392b", fontSize: 16, fontWeight: "bold" },
  towingLockedNote: { color: "#555555", fontSize: 13, fontStyle: "italic", marginTop: -4 },
});

