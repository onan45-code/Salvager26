import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const Stack = createStackNavigator();

const CAR_DATA = {
  "Toyota": ["Camry", "Corolla", "RAV4", "Tacoma", "Tundra", "Highlander", "4Runner", "Sienna", "Prius", "Avalon", "Yaris", "Sequoia", "Land Cruiser", "Venza", "C-HR"],
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Edge", "Ranger", "Expedition", "Bronco", "Focus", "Fusion", "Taurus", "Maverick", "Transit", "EcoSport"],
  "Chevrolet": ["Silverado", "Equinox", "Malibu", "Traverse", "Colorado", "Tahoe", "Suburban", "Blazer", "Trailblazer", "Camaro", "Corvette", "Impala", "Spark", "Trax"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "Ridgeline", "HR-V", "Passport", "Fit", "Insight"],
  "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Titan", "Murano", "Maxima", "Versa", "Armada", "Kicks", "370Z", "GT-R"],
  "Dodge": ["Ram 1500", "Charger", "Challenger", "Durango", "Journey", "Grand Caravan", "Dakota"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator", "Liberty", "Patriot"],
  "GMC": ["Sierra", "Canyon", "Terrain", "Acadia", "Yukon", "Envoy", "Jimmy", "Safari"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M3", "M5", "4 Series", "2 Series"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "A-Class", "CLA", "GLA", "AMG GT"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Accent", "Veloster", "Ioniq"],
  "Kia": ["Optima", "Sorento", "Sportage", "Soul", "Forte", "Telluride", "Stinger", "Niro", "Carnival"],
  "Subaru": ["Outback", "Forester", "Crosstrek", "Impreza", "Legacy", "Ascent", "WRX", "BRZ"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "GTI", "Beetle", "Touareg"],
  "Chrysler": ["300", "Pacifica", "Town and Country", "200", "PT Cruiser"],
  "Buick": ["Enclave", "Encore", "LaCrosse", "Verano", "Envision", "Regal"],
  "Cadillac": ["Escalade", "XT5", "CTS", "ATS", "SRX", "Eldorado", "DeVille"],
  "Lexus": ["RX", "ES", "IS", "GX", "LX", "NX", "LS", "UX"],
  "Acura": ["MDX", "RDX", "TLX", "ILX", "NSX", "TSX", "TL"],
  "Infiniti": ["Q50", "Q60", "QX60", "QX80", "QX50", "G35", "G37"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5 Miata", "CX-3", "CX-30"],
  "Mitsubishi": ["Outlander", "Eclipse Cross", "Galant", "Lancer", "Montero"],
  "Pontiac": ["Grand Prix", "Grand Am", "Firebird", "Trans Am", "Bonneville", "G6"],
  "Saturn": ["Vue", "Ion", "Aura", "Sky"],
  "Oldsmobile": ["Alero", "Bravada", "Cutlass", "Intrigue", "Silhouette"],
  "Other": ["Other"]
};

const TRIM_DATA = {
  "Toyota": ["L", "LE", "XLE", "XSE", "SE", "TRD Off-Road", "TRD Sport", "TRD Pro", "Limited", "Platinum", "SR", "SR5", "Adventure", "Other"],
  "Ford": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor", "S", "SE", "SEL", "Titanium", "ST", "Tremor", "Other"],
  "Chevrolet": ["LS", "LT", "LTZ", "Z71", "Trail Boss", "High Country", "SS", "ZL1", "RST", "Premier", "Sport", "Custom", "Other"],
  "Honda": ["LX", "Sport", "EX", "EX-L", "Touring", "Sport Touring", "Type R", "Si", "Other"],
  "Nissan": ["S", "SV", "SL", "SR", "Platinum", "Pro-4X", "NISMO", "Other"],
  "Dodge": ["SXT", "GT", "R/T", "Scat Pack", "SRT 392", "SRT Hellcat", "Redeye", "SE", "Other"],
  "Jeep": ["Sport", "Sport S", "Sahara", "Rubicon", "Willys", "High Altitude", "Overland", "Summit", "Trailhawk", "Other"],
  "GMC": ["Base", "SLE", "SLT", "Denali", "AT4", "Pro", "Elevation", "Other"],
  "BMW": ["Base", "xDrive", "sDrive", "M Sport", "M", "M Competition", "Other"],
  "Mercedes-Benz": ["Base", "4MATIC", "AMG", "AMG Line", "Maybach", "Other"],
  "Hyundai": ["SE", "SEL", "N Line", "Limited", "Ultimate", "Sport", "Other"],
  "Kia": ["LX", "S", "EX", "GT-Line", "SX", "SX Prestige", "GT", "Other"],
  "Subaru": ["Base", "Premium", "Sport", "Limited", "Touring", "Onyx Edition", "Wilderness", "Other"],
  "Volkswagen": ["S", "SE", "SEL", "R-Line", "GTI", "GLI", "R", "Other"],
  "Chrysler": ["Touring", "Touring-L", "Limited", "Pinnacle", "300S", "300C", "Other"],
  "Buick": ["Preferred", "Essence", "Sport Touring", "Avenir", "Other"],
  "Cadillac": ["Luxury", "Premium Luxury", "Sport", "Platinum", "V-Series", "Other"],
  "Lexus": ["Base", "L", "F Sport", "Ultra Luxury", "Other"],
  "Acura": ["Base", "A-Spec", "Technology", "Advance", "Type S", "Other"],
  "Infiniti": ["Pure", "Luxe", "Sensory", "Autograph", "Sport", "Other"],
  "Mazda": ["Sport", "Select", "Preferred", "Premium", "Carbon Edition", "Other"],
  "Mitsubishi": ["ES", "LE", "SE", "SEL", "GT", "Other"],
  "Pontiac": ["Base", "GT", "GTP", "GXP", "Other"],
  "Saturn": ["Base", "XE", "XR", "Other"],
  "Oldsmobile": ["Base", "GL", "GLS", "GX", "Other"],
  "Other": ["Base", "Standard", "Sport", "Premium", "Limited", "Other"]
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId: "aa722540-034a-4737-9e73-1efc9e4dd59c" });
  return token.data;
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Welcome");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setInitialRoute("Dashboard");
      } else {
        setInitialRoute("Welcome");
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ffffff", fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="BrowseCars" component={BrowseCarsScreen} />
        <Stack.Screen name="SellerBids" component={SellerBidsScreen} />
        <Stack.Screen name="PlaceBid" component={PlaceBidScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>Salvager26</Text>
        <Text style={styles.tagline}>Buy and sell salvage cars fast.</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("Login", { mode: "login" })}>
          <Text style={styles.sellerButtonText}>Log In</Text>
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
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await registerForPushNotifications();
      if (token) {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", cred.user.uid)));
        if (!snap.empty) await updateDoc(doc(db, "users", snap.docs[0].id), { pushToken: token });
      }
      navigation.navigate("Dashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await registerForPushNotifications();
      await addDoc(collection(db, "users"), { uid: cred.user.uid, email, pushToken: token || "" });
      navigation.navigate("Dashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.logo}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>
      <Text style={styles.tagline}>Enter your details to continue</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaaaaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaaaaa" secureTextEntry value={password} onChangeText={setPassword} />
        {mode === "login" ? (
          <TouchableOpacity style={styles.sellerButton} onPress={handleLogin}>
            <Text style={styles.sellerButtonText}>{loading ? "Loading..." : "Log In"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.sellerButton} onPress={handleSignUp}>
            <Text style={styles.sellerButtonText}>{loading ? "Loading..." : "Create Account"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DashboardScreen({ navigation }) {
  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate("Welcome");
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.dashboardHeader}>
        <Text style={styles.logo}>Salvager26</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tagline}>What would you like to do?</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("MyListings")}>
          <Text style={styles.sellerButtonText}>My Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("BrowseCars")}>
          <Text style={styles.dealerButtonText}>Browse & Bid on Cars</Text>
        </TouchableOpacity>
      </View>
    </View>
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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(data);
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchListings);
    return unsubscribe;
  }, [navigation]);
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Listings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.sellerButtonText}>+ List a Car</Text>
      </TouchableOpacity>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No listings yet.</Text>
          <Text style={styles.emptyStateSubtext}>Tap List a Car to get started!</Text>
        </View>
      ) : listings.map(listing => (
        <TouchableOpacity key={listing.id} style={[styles.listingCard, listing.status === "sold" && styles.soldCard]} onPress={() => navigation.navigate("SellerBids", { listing })}>
          {listing.photos && listing.photos.length > 0 && (
            <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
          )}
          <View style={styles.listingCardHeader}>
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}</Text>
            {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD</Text>}
          </View>
          <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
          <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
          <Text style={styles.viewBidsText}>{listing.status === "sold" ? "View Deal" : "View Bids"} →</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SellerBidsScreen({ route, navigation }) {
  const { listing } = route.params;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  useEffect(() => {
    const fetchBids = async () => {
      try {
        const q = query(collection(db, "bids"), where("listingId", "==", listing.id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
          await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: bid.amount, soldToEmail: bid.buyerEmail });
          await updateDoc(doc(db, "bids", bid.id), { status: "accepted" });
          Alert.alert("Deal Done!", "Sold for $" + bid.amount + ". Buyer: " + bid.buyerEmail);
        } catch(e) { Alert.alert("Error", e.message); }
        setAccepting(false);
      }}
    ]);
  };
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Bids</Text>
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
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}</Text>
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD - ${listing.soldPrice}</Text>}
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : bids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No bids yet.</Text>
          <Text style={styles.emptyStateSubtext}>Buyers will be notified!</Text>
        </View>
      ) : bids.map((bid, index) => (
        <View key={bid.id} style={[styles.bidCard, bid.status === "accepted" && styles.acceptedCard]}>
          {index === 0 && listing.status !== "sold" && <Text style={styles.highestBadge}>HIGHEST OFFER</Text>}
          {bid.status === "accepted" && <Text style={styles.acceptedBadge}>ACCEPTED</Text>}
          <Text style={styles.bidAmount}>${bid.amount}</Text>

          {bid.towingIncluded !== undefined && <Text style={styles.listingDetail}>Towing: {bid.towingIncluded ? "Included in bid" : "Not included"}</Text>}
          {bid.status === "accepted" ? <Text style={styles.listingDetail}>Buyer: {bid.buyerEmail}</Text> : <Text style={styles.listingDetail}>Buyer: Contact hidden until offer accepted</Text>}
          {bid.note ? <Text style={styles.listingDetail}>Note: {bid.note}</Text> : null}
          {listing.status !== "sold" ? (
            <TouchableOpacity style={[styles.acceptButton, bid.status === "accepted" && styles.acceptedButton]} onPress={() => bid.status !== "accepted" && handleAcceptOffer(bid)} disabled={accepting || bid.status === "accepted"}>
              <Text style={styles.acceptButtonText}>{bid.status === "accepted" ? "Offer Accepted ✓" : accepting ? "Processing..." : "Accept Offer"}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </ScrollView>
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

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow location access to auto-detect your area");
        setLocationLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode && geocode[0] && geocode[0].postalCode) {
        setZipCode(geocode[0].postalCode);
        Alert.alert("Location detected!", "ZIP code set to " + geocode[0].postalCode);
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

  const applyRadiusFilter = async (allListings) => {
    if (!zipCode || zipCode.length < 5) {
      setFilteredListings(allListings);
      return;
    }
    setFiltering(true);
    try {
      const userCoords = await getZipCoords(zipCode);
      if (!userCoords) { Alert.alert("Error", "Invalid ZIP code"); setFilteredListings(allListings); setFiltering(false); return; }
      const nearby = [];
      const fromYear = yearFrom ? parseInt(yearFrom) : 0;
      const toYear = yearTo ? parseInt(yearTo) : 9999;
      for (const listing of allListings) {
        if (!listing.zip) { nearby.push(listing); continue; }
        const listingCoords = await getZipCoords(listing.zip);
        if (!listingCoords) { nearby.push(listing); continue; }
        const distanceMeters = getDistance(userCoords, listingCoords);
        const distanceMiles = distanceMeters / 1609.34;
        const listingYear = parseInt(listing.year) || 0;
        if (distanceMiles <= parseFloat(radius) && listingYear >= fromYear && listingYear <= toYear) {
          nearby.push({ ...listing, distanceMiles: Math.round(distanceMiles) });
        }
      }
      setFilteredListings(nearby);
    } catch(e) { setFilteredListings(allListings); }
    setFiltering(false);
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "listings"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = data.filter(l => l.sellerId !== auth.currentUser.uid && l.status !== "sold");
        setListings(filtered);
        setFilteredListings(filtered);
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    fetchListings();
  }, []);
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Browse Cars</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterContainer}>
        <View style={styles.zipRow}>
          <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
          <TouchableOpacity style={styles.locationButton} onPress={detectLocation}>
            <Text style={styles.locationButtonText}>{locationLoading ? "..." : "📍 Auto"}</Text>
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
              {Array.from({length: 46}, (_, i) => (2025 - i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={yearTo} onValueChange={(val) => setYearTo(val)} style={styles.picker}>
              <Picker.Item label="To Year" value="" />
              {Array.from({length: 46}, (_, i) => (2025 - i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => applyRadiusFilter(listings)}>
          <Text style={styles.filterButtonText}>{filtering ? "Filtering..." : "Search"}</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : filteredListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No listings found.</Text>
          <Text style={styles.emptyStateSubtext}>Try expanding your search radius!</Text>
        </View>
      ) : filteredListings.map(listing => (
        <TouchableOpacity key={listing.id} style={[styles.listingCard, listing.status === "sold" && styles.soldCard]} onPress={() => listing.status !== "sold" && navigation.navigate("PlaceBid", { listing })}>
          {listing.photos && listing.photos.length > 0 && (
            <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
          )}
          <View style={styles.listingCardHeader}>
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}</Text>
            {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD</Text>}
          </View>
          <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
          <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
          {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
          {listing.distanceMiles !== undefined && <Text style={styles.listingDetail}>{listing.distanceMiles} miles away</Text>}
          {listing.status !== "sold" && <Text style={styles.bidButton2}>Place Bid →</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PlaceBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [amount, setAmount] = useState("");
  const [towingIncluded, setTowingIncluded] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmitBid = async () => {
    if (!amount) { Alert.alert("Error", "Please enter a bid amount"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "bids"), {
        listingId: listing.id, buyerId: user.uid, buyerEmail: user.email,
        amount: parseFloat(amount), towingIncluded, note, status: "pending", createdAt: serverTimestamp(),
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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
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
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}</Text>
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        {listing.notes ? <Text style={styles.listingDetail}>{listing.notes}</Text> : null}
        {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
        {listing.hasTitle === false && <Text style={styles.conditionBadge}>No Title</Text>}
        {listing.needsTow === true && <Text style={styles.conditionBadge}>Needs Tow</Text>}
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Your Offer</Text>
        <TextInput style={styles.input} placeholder="Bid Amount ($)" placeholderTextColor="#aaaaaa" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        {listing.needsTow && (
          <TouchableOpacity style={[styles.secondaryButton, towingIncluded && styles.activeToggle]} onPress={() => setTowingIncluded(!towingIncluded)}>
            <Text style={styles.secondaryButtonText}>{towingIncluded ? "Towing Included in Bid" : "Towing NOT Included"}</Text>
          </TouchableOpacity>
        )}
        <TextInput style={styles.input} placeholder="Note to seller (optional)" placeholderTextColor="#aaaaaa" value={note} onChangeText={setNote} />
        <TouchableOpacity style={styles.sellerButton} onPress={handleSubmitBid}>
          <Text style={styles.sellerButtonText}>{loading ? "Placing Bid..." : "Submit Bid"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CreateListingScreen({ navigation }) {
  const years = Array.from({length: 46}, (_, i) => (2025 - i).toString());
  const makes = Object.keys(CAR_DATA).sort();
  const [year, setYear] = useState("2025");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [runs, setRuns] = useState(true);
  const [hasKeys, setHasKeys] = useState(true);
  const [hasTitle, setHasTitle] = useState(true);
  const [needsTow, setNeedsTow] = useState(false);
  const [damage, setDamage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= 8) { Alert.alert("Max 8 photos"); return; }
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Take Photo", onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed", "Please allow camera access in Settings"); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
      }},
      { text: "Choose from Library", onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access in Settings"); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
      }},
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const uploadPhotos = async (photoUris) => {
    const uploadedUrls = [];
    for (const uri of photoUris) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = "listings/" + auth.currentUser.uid + "/" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!year || !make || !model) { Alert.alert("Error", "Please enter year, make and model"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uploadedPhotos = photos.length > 0 ? await uploadPhotos(photos) : [];
      await addDoc(collection(db, "listings"), {
        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, photos: uploadedPhotos,
        sellerId: user.uid, sellerEmail: user.email, createdAt: serverTimestamp(), status: "active",
      });
      Alert.alert("Success", "Listing created!");
      navigation.goBack();
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>List Your Car</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Vehicle Info</Text>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={year} onValueChange={(val) => setYear(val)} style={styles.picker}>
              <Picker.Item label="Year" value="" />
              {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={make} onValueChange={(val) => { setMake(val); setModel(""); setTrim(""); }} style={styles.picker}>
              <Picker.Item label="Make" value="" />
              {makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
            </Picker>
          </View>
        </View>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={model} onValueChange={(val) => setModel(val)} style={styles.picker} enabled={make !== ""}>
              <Picker.Item label="Model" value="" />
              {make ? CAR_DATA[make].map(m => <Picker.Item key={m} label={m} value={m} />) : []}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={trim} onValueChange={(val) => setTrim(val)} style={styles.picker}>
              <Picker.Item label="Trim" value="" />
              {(make && TRIM_DATA[make] ? TRIM_DATA[make] : ["Base", "Sport", "Limited", "Premium", "Other"]).map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
        </View>
        <TextInput style={styles.input} placeholder="Mileage" placeholderTextColor="#aaaaaa" keyboardType="numeric" value={mileage} onChangeText={setMileage} />
        <Text style={styles.sectionLabel}>Location</Text>
        <TextInput style={styles.input} placeholder="City" placeholderTextColor="#aaaaaa" value={city} onChangeText={setCity} />
        <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#aaaaaa" keyboardType="numeric" value={zip} onChangeText={setZip} />
        <Text style={styles.sectionLabel}>Condition - tap to toggle</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, runs ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setRuns(!runs)}>
            <Text style={styles.toggleText}>{runs ? "Runs" : "Not Running"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, hasKeys ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasKeys(!hasKeys)}>
            <Text style={styles.toggleText}>{hasKeys ? "Has Keys" : "No Keys"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, hasTitle ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasTitle(!hasTitle)}>
            <Text style={styles.toggleText}>{hasTitle ? "Drivable" : "Not Drivable"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, needsTow ? styles.toggleActiveRed : styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={styles.toggleText}>{needsTow ? "Needs Tow" : "Will Deliver"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Damage Level</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={damage} onValueChange={(val) => setDamage(val)} style={styles.picker}>
            <Picker.Item label="Select Damage Level" value="" />
            <Picker.Item label="No Damage" value="none" />
            <Picker.Item label="Minor Damage" value="minor" />
            <Picker.Item label="Moderate Damage" value="moderate" />
            <Picker.Item label="Major Damage" value="major" />
          </Picker>
        </View>
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the condition, any issues, etc." placeholderTextColor="#aaaaaa" multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
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
        <TouchableOpacity style={styles.sellerButton} onPress={handleSubmit}>
          <Text style={styles.sellerButtonText}>{loading ? "Saving..." : "Submit Listing"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center", padding: 24 },
  scrollContainer: { flex: 1, backgroundColor: "#1a1a2e", padding: 24 },
  scrollContent: { paddingBottom: 60 },
  header: { alignItems: "center", marginBottom: 60 },
  logo: { fontSize: 42, fontWeight: "bold", color: "#ffffff", marginBottom: 12, letterSpacing: 1 },
  tagline: { fontSize: 16, color: "#aaaaaa", textAlign: "center", marginBottom: 40 },
  form: { width: "100%", gap: 16 },
  formContainer: { gap: 16 },
  input: { backgroundColor: "#2a2a3e", color: "#ffffff", padding: 16, borderRadius: 12, fontSize: 16, width: "100%" },
  textArea: { height: 120, textAlignVertical: "top" },
  buttons: { width: "100%", gap: 16 },
  sellerButton: { backgroundColor: "#e94560", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  sellerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  dealerButton: { backgroundColor: "#ffffff", padding: 18, borderRadius: 14, alignItems: "center" },
  dealerButtonText: { color: "#1a1a2e", fontSize: 18, fontWeight: "bold" },
  secondaryButton: { borderWidth: 1, borderColor: "#ffffff", padding: 18, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: "#ffffff", fontSize: 18 },
  activeToggle: { backgroundColor: "#e94560", borderColor: "#e94560" },
  backText: { color: "#aaaaaa", textAlign: "center", fontSize: 16, marginTop: 8 },
  dashboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 60, marginBottom: 24 },
  dashboardTitle: { fontSize: 30, fontWeight: "bold", color: "#ffffff" },
  logoutText: { color: "#e94560", fontSize: 16 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#ffffff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptyStateSubtext: { color: "#aaaaaa", fontSize: 14 },
  sectionLabel: { color: "#aaaaaa", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" },
  listingCard: { backgroundColor: "#2a2a3e", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  listingCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  listingTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  listingDetail: { color: "#aaaaaa", fontSize: 14, marginBottom: 4 },
  listingPhoto: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  bidListingPhoto: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  viewBidsText: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  bidButton2: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  soldCard: { opacity: 0.7, borderWidth: 1, borderColor: "#2ecc71" },
  soldBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold" },
  conditionBadge: { color: "#e94560", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  bidCard: { backgroundColor: "#2a2a3e", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  acceptedCard: { borderWidth: 2, borderColor: "#2ecc71" },
  bidAmount: { color: "#ffffff", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  highestBadge: { color: "#e94560", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptedBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
  acceptedButton: { backgroundColor: "#888888" },
  acceptButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 4, height: 58, overflow: "hidden", justifyContent: "center" },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerHalf: { flex: 1 },
  picker: { color: "#000000", fontSize: 18, fontWeight: "bold" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  toggleButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#2a2a3e", borderWidth: 1, borderColor: "#5a5a8e" },
  toggleActive: { backgroundColor: "#2ecc71", borderColor: "#2ecc71" },
  toggleActiveRed: { backgroundColor: "#e94560", borderColor: "#e94560" },
  toggleText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  photoButton: { backgroundColor: "#2a2a3e", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#5a5a8e", marginBottom: 8 },
  photoButtonText: { color: "#ffffff", fontSize: 16 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  photoWrapper: { position: "relative" },
  photoThumb: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: { position: "absolute", top: -8, right: -8, backgroundColor: "#e94560", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  filterContainer: { gap: 8, marginBottom: 16 },
  zipInput: { flex: 1, marginBottom: 0 },
  filterButton: { backgroundColor: "#e94560", padding: 14, borderRadius: 12, alignItems: "center" },
  filterButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  zipRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  locationButton: { backgroundColor: "#2a2a3e", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#5a5a8e", minWidth: 80 },
  locationButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
});
