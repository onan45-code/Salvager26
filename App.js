import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const Stack = createStackNavigator();

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
  "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30", "EX90", "S40", "C30", "C70", "XC70"],
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
  "Volvo": ["Momentum", "Inscription", "R-Design", "T5", "T6", "T8", "B5", "B6", "Cross Country", "Recharge", "Polestar Engineered", "Ultimate", "Plus", "Core", "Other"],
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
    shouldShowBanner: true,
    shouldShowList: true,
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
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="BrowseCars" component={BrowseCarsScreen} />
        <Stack.Screen name="SellerBids" component={SellerBidsScreen} />
        <Stack.Screen name="PlaceBid" component={PlaceBidScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditListing" component={EditListingScreen} />
        <Stack.Screen name="MyBid" component={MyBidScreen} />
        <Stack.Screen name="MyBids" component={MyBidsScreen} />
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await registerForPushNotifications();
      await addDoc(collection(db, "users"), {
        uid: cred.user.uid, email, firstName, lastName, phone, zipCode,
        companyName: companyName || "", pushToken: token || "",
        createdAt: serverTimestamp()
      });
      navigation.navigate("Dashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />
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
          <TouchableOpacity style={styles.dealerButton} onPress={handleSignUp}>
            <Text style={styles.dealerButtonText}>{loading ? "Loading..." : "Create Account"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DashboardScreen({ navigation }) {
  const [listingCount, setListingCount] = useState(0);
  const [bidCount, setBidCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const [myListings, setMyListings] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!userSnap.empty) setUserName(userSnap.docs[0].data().firstName || "");
        const listingsSnap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", user.uid)));
        const listingsData = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const activeListings = listingsData.filter(l => l.status !== "sold" && l.status !== "deleted");
        setListingCount(activeListings.length);
        const withCounts = await attachBidCounts(activeListings);
        withCounts.sort((a, b) => {
          if (b.bidCount !== a.bidCount) return b.bidCount - a.bidCount;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        setMyListings(withCounts);
        const bidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid)));
        setBidCount(bidsSnap.size);
        
      } catch(e) {}
      setLoading(false);
    };
    const unsubscribe = navigation.addListener("focus", fetchStats);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate("Welcome");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />
      <View style={styles.dashboardHeader}>
        <Text style={styles.logo}>Salvager</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tagline}>Welcome back{userName ? ", " + userName : ""}!</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{listingCount}</Text>
          <Text style={styles.statLabel}>My Listings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bidCount}</Text>
          <Text style={styles.statLabel}>Bids Placed</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.dealerButtonText}>My Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.sellerButtonText}>+ List a Car</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("BrowseCars")}>
        <Text style={styles.dealerButtonText}>Browse & Bid on Cars</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("MyBids")}>
        <Text style={styles.dealerButtonText}>My Bids</Text>
      </TouchableOpacity>
      {myListings.length > 0 && (
        <View>
          <Text style={{color: "#ffffff", fontSize: 18, fontWeight: "bold", textAlign: "center", marginTop: 0, marginBottom: 8, backgroundColor: "#1B2B5E", padding: 18, borderRadius: 14}}>My Active Listings</Text>
          {myListings.map(listing => (
            <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => navigation.navigate("SellerBids", { listing })}>
              {listing.photos && listing.photos.length > 0 && (
                <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
              )}
              <View style={styles.listingCardHeader}>
                <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
              </View>
              <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
              <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
              <Text style={styles.listingDetail}>{formatListedDate(listing.createdAt)}</Text>
              <Text style={styles.viewBidsText}>{listing.bidCount > 0 ? "View " + listing.bidCount + (listing.bidCount === 1 ? " Bid →" : " Bids →") : "No bids yet"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
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
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.status !== "deleted");
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
        <Text style={styles.dashboardTitle}>My Listings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.dealerButtonText}>My Profile</Text>
      </TouchableOpacity>
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
        <TouchableOpacity key={listing.id} style={[styles.listingCard, listing.status === "sold" && styles.soldCard]} onPress={() => navigation.navigate("SellerBids", { listing })}>
          {listing.photos && listing.photos.length > 0 && (
            <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
          )}
          <View style={styles.listingCardHeader}>
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
            {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD</Text>}
          </View>
          <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
          <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
          <Text style={styles.listingDetail}>{formatListedDate(listing.createdAt)}</Text>
          <Text style={styles.viewBidsText}>{listing.status === "sold" ? "View Deal →" : listing.bidCount > 0 ? "View " + listing.bidCount + (listing.bidCount === 1 ? " Bid →" : " Bids →") : "No bids yet"}</Text>
        </TouchableOpacity>
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
          let sellerPhone = "";
          let buyerToken = "";
          try {
            const buyerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", bid.buyerId)));
            if (!buyerSnap.empty) {
              const b = buyerSnap.docs[0].data();
              buyerPhone = b.phone || "";
              buyerToken = b.pushToken || "";
            }
            const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", auth.currentUser.uid)));
            if (!sellerSnap.empty) sellerPhone = sellerSnap.docs[0].data().phone || "";
          } catch(e) {}
          await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: bid.amount, soldToEmail: bid.buyerEmail, soldToPhone: buyerPhone, sellerPhone: sellerPhone });
          await updateDoc(doc(db, "bids", bid.id), { status: "accepted", buyerPhone: buyerPhone, sellerPhone: sellerPhone });
          setBids(bids.map(b => b.id === bid.id ? { ...b, status: "accepted", buyerPhone, sellerPhone } : b));
          setListing({ ...listing, status: "sold", soldPrice: bid.amount, soldToEmail: bid.buyerEmail, soldToPhone: buyerPhone, sellerPhone });
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
          {bid.towingIncluded !== undefined && <Text style={styles.listingDetail}>Towing: {bid.towingIncluded ? "Included in bid" : "Not included"}</Text>}
          {bid.pickupTime ? <Text style={styles.listingDetail}>Pickup: {bid.pickupTime === "morning" ? "Morning" : "Afternoon"}</Text> : null}
          {bid.status === "accepted" ? (
            <>
              <Text style={styles.listingDetail}>Buyer: {bid.buyerEmail}</Text>
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
        setListings(filtered);
        setFilteredListings(filtered);
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
        <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => myBidsByListing[listing.id] !== undefined ? navigation.navigate("MyBid", { listing }) : navigation.navigate("PlaceBid", { listing })}>
          {listing.photos && listing.photos.length > 0 && (
            <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
          )}
          <View style={styles.listingCardHeader}>
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
          </View>
          <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
          <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
          {listing.distanceMiles !== undefined && <Text style={styles.listingDetail}>{listing.distanceMiles} miles away</Text>}
          <Text style={styles.listingDetail}>{formatListedDate(listing.createdAt)}</Text>
          {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
          {listing.needsTow === true && <Text style={styles.conditionBadge}>Needs Tow</Text>}
          {myBidsByListing[listing.id] !== undefined ? <Text style={{color: "#27AE60", fontSize: 14, marginTop: 8, fontWeight: "bold"}}>You bid ${myBidsByListing[listing.id]} ✓</Text> : <Text style={styles.bidButton2}>Place Bid →</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PlaceBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [amount, setAmount] = useState("");
  const [towingIncluded, setTowingIncluded] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const user = auth.currentUser;
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
        amount: parseFloat(amount), towingIncluded, pickupTime, note, internalNote, status: "pending", createdAt: serverTimestamp(),
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
        <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
        <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
        {listing.notes ? <Text style={styles.listingDetail}>{listing.notes}</Text> : null}
        {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
        {listing.hasTitle === false && <Text style={styles.conditionBadge}>No Title</Text>}
        {listing.needsTow === true && <Text style={styles.conditionBadge}>Needs Tow</Text>}
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Your Offer</Text>
        <TextInput style={styles.input} placeholder="Bid Amount ($)" placeholderTextColor="#999999" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        {listing.needsTow && (
          <TouchableOpacity style={[styles.secondaryButton, towingIncluded && styles.activeToggle]} onPress={() => setTowingIncluded(!towingIncluded)}>
            <Text style={[styles.secondaryButtonText, towingIncluded && {color: "#ffffff"}]}>{towingIncluded ? "Towing Included in Bid" : "Towing NOT Included"}</Text>
          </TouchableOpacity>
        )}
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
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uploadedPhotos = photos.length > 0 ? await uploadPhotos(photos) : [];
      const listingData = {
        year, make, model, trim, vin, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, titleStatus, engineStatus, transStatus, airbags, tires, photos: uploadedPhotos,
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
            <Picker key={"make-" + pickerResetKey} selectedValue={make} onValueChange={(val) => { setMake(val); setModel(""); setTrim(""); }} style={styles.picker}>
              <Picker.Item label="Make" value="" />
              {makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
            </Picker>
          </View>
        </View>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"model-" + make + "-" + pickerResetKey} selectedValue={model} onValueChange={(val) => setModel(val)} style={styles.picker} enabled={make !== ""}>
              <Picker.Item label="Model" value="" />
              {make ? CAR_DATA[make].map(m => <Picker.Item key={m} label={m} value={m} />) : []}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker key={"trim-" + make + "-" + pickerResetKey} selectedValue={trim} onValueChange={(val) => setTrim(val)} style={styles.picker}>
              <Picker.Item label="Trim" value="" />
              {(make && TRIM_DATA[make] ? TRIM_DATA[make] : ["Base", "Sport", "Limited", "Premium", "Other"]).map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
        </View>
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
            <Text style={[styles.toggleText, titleStatus === "clean" && styles.toggleTextActive]}>Clean Title</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "rebuilt" && styles.toggleActive]} onPress={() => setTitleStatus("rebuilt")}>
            <Text style={[styles.toggleText, titleStatus === "rebuilt" && styles.toggleTextActive]}>Rebuilt Salvage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "salvage" && styles.toggleActive]} onPress={() => setTitleStatus("salvage")}>
            <Text style={[styles.toggleText, titleStatus === "salvage" && styles.toggleTextActive]}>Salvage Title</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Engine</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "good" && styles.toggleActive]} onPress={() => setEngineStatus("good")}>
            <Text style={[styles.toggleText, engineStatus === "good" && styles.toggleTextActive]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "bad" && styles.toggleActive]} onPress={() => setEngineStatus("bad")}>
            <Text style={[styles.toggleText, engineStatus === "bad" && styles.toggleTextActive]}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "unknown" && styles.toggleActive]} onPress={() => setEngineStatus("unknown")}>
            <Text style={[styles.toggleText, engineStatus === "unknown" && styles.toggleTextActive]}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Transmission</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "good" && styles.toggleActive]} onPress={() => setTransStatus("good")}>
            <Text style={[styles.toggleText, transStatus === "good" && styles.toggleTextActive]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "bad" && styles.toggleActive]} onPress={() => setTransStatus("bad")}>
            <Text style={[styles.toggleText, transStatus === "bad" && styles.toggleTextActive]}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "unknown" && styles.toggleActive]} onPress={() => setTransStatus("unknown")}>
            <Text style={[styles.toggleText, transStatus === "unknown" && styles.toggleTextActive]}>Unknown</Text>
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
        <TouchableOpacity style={styles.sellerButton} onPress={handleSubmit}>
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
  const user = auth.currentUser;

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
        }
      } catch(e) {}
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      if (userData && userData.id) {
        await updateDoc(doc(db, "users", userData.id), { firstName, lastName, phone, zipCode, companyName });
      } else {
        const newDoc = await addDoc(collection(db, "users"), {
          uid: user.uid, email: user.email, firstName, lastName, phone, zipCode, companyName,
          pushToken: "", createdAt: serverTimestamp()
        });
        setUserData({ id: newDoc.id, uid: user.uid, firstName, lastName, phone, zipCode, companyName });
      }
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch(e) { Alert.alert("Error", e.message); }
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logoutText}>Back</Text>
        </TouchableOpacity>
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
              <TextInput style={[styles.input, {flex: 1}]} placeholder="First Name" placeholderTextColor="#999999" value={firstName} onChangeText={setFirstName} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Last Name" placeholderTextColor="#999999" value={lastName} onChangeText={setLastName} />
            </View>
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#999999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#999999" keyboardType="numeric" value={zipCode} onChangeText={setZipCode} />
            <TextInput style={styles.input} placeholder="Company Name (optional)" placeholderTextColor="#999999" value={companyName} onChangeText={setCompanyName} />
            <TouchableOpacity style={styles.dealerButton} onPress={handleSave}>
              <Text style={styles.dealerButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.listingDetail}>Name: {firstName} {lastName}</Text>
            <Text style={styles.listingDetail}>Phone: {phone}</Text>
            <Text style={styles.listingDetail}>ZIP Code: {zipCode}</Text>
            {companyName ? <Text style={styles.listingDetail}>Company: {companyName}</Text> : null}
          </>
        )}
      </View>
      <View style={styles.listingCard}>
        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
          <Text style={styles.sectionLabel}>Buying Preferences</Text>
          <TouchableOpacity onPress={() => setEditingPrefs(!editingPrefs)}>
            <Text style={{color: "#1B2B5E", fontWeight: "bold"}}>{editingPrefs ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.listingDetail, {marginBottom: 12}]}>Get notified when a new listing matches your criteria.</Text>
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
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MyBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [towingIncluded, setTowingIncluded] = useState(false);
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
          setTowingIncluded(bidData.towingIncluded || false);
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
      let buyerPhone = "";
      let sellerToken = "";
      try {
        const sellerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", listing.sellerId)));
        if (!sellerSnap.empty) {
          const s = sellerSnap.docs[0].data();
          sellerPhone = s.phone || "";
          sellerToken = s.pushToken || "";
        }
        const buyerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!buyerSnap.empty) buyerPhone = buyerSnap.docs[0].data().phone || "";
      } catch(e) {}
      await updateDoc(doc(db, "bids", myBid.id), { amount: counterAmt, status: "accepted", counterStatus: "accepted", buyerPhone, sellerPhone });
      await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: counterAmt, soldToEmail: user.email, soldToPhone: buyerPhone, sellerPhone });
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
      setMyBid({ ...myBid, amount: counterAmt, status: "accepted", counterStatus: "accepted", buyerPhone, sellerPhone });
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
      await updateDoc(doc(db, "bids", myBid.id), { amount: parseFloat(amount), towingIncluded, pickupTime, note, internalNote });
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
          <Text style={styles.sectionLabel}>Your Current Bid</Text>
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
          {listing.needsTow && (
            <TouchableOpacity style={[styles.secondaryButton, towingIncluded && styles.activeToggle]} onPress={() => setTowingIncluded(!towingIncluded)}>
              <Text style={[styles.secondaryButtonText, towingIncluded && {color: "#ffffff"}]}>{towingIncluded ? "Towing Included" : "Towing NOT Included"}</Text>
            </TouchableOpacity>
          )}
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
      ) : bids.map(bid => (
        <TouchableOpacity key={bid.id} style={[styles.listingCard, bid.status === "accepted" && styles.acceptedCard]} onPress={() => bid.listingInfo && navigation.navigate("MyBid", { listing: bid.listingInfo })}>
          {bid.listingInfo && bid.listingInfo.photos && bid.listingInfo.photos.length > 0 && (
            <Image source={{ uri: bid.listingInfo.photos[0] }} style={styles.listingPhoto} />
          )}
          <Text style={styles.listingTitle}>{bid.listingInfo ? bid.listingInfo.year + " " + bid.listingInfo.make + " " + bid.listingInfo.model : "Vehicle"}</Text>
          <Text style={styles.bidAmount}>${bid.amount}</Text>
          {bid.status === "accepted" ? <Text style={styles.acceptedBadge}>ACCEPTED</Text> : <Text style={styles.listingDetail}>Status: Pending</Text>}
          {bid.towingIncluded && <Text style={styles.listingDetail}>Towing included</Text>}
          {bid.pickupTime ? <Text style={styles.listingDetail}>Pickup: {bid.pickupTime === "morning" ? "Morning" : "Afternoon"}</Text> : null}
          <Text style={styles.listingDetail}>{formatBidDate(bid.createdAt)}</Text>
        </TouchableOpacity>
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
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  statNumber: { fontSize: 36, fontWeight: "bold", color: "#1B2B5E" },
  statLabel: { fontSize: 14, color: "#555555", marginTop: 4 },
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
  pickerContainer: { backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 4, height: 58, overflow: "hidden", justifyContent: "center", borderWidth: 1, borderColor: "#dddddd" },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerHalf: { flex: 1 },
  picker: { color: "#000000" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  toggleButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#dddddd" },
  toggleActive: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleActiveRed: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleOrange: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleYellow: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
  toggleText: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold" },
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
});

