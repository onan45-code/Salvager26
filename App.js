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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!email || !password || !firstName || !lastName || !phone || !zipCode) {
      Alert.alert("Error", "Please fill in all required fields");
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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
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
    </ScrollView>
  );
}

function DashboardScreen({ navigation }) {
  const [listingCount, setListingCount] = useState(0);
  const [bidCount, setBidCount] = useState(0);
  const [myBids, setMyBids] = useState([]);
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
        setListingCount(listingsSnap.size);
        const listingsData = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyListings(listingsData.filter(l => l.status !== "sold"));
        const bidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", user.uid)));
        setBidCount(bidsSnap.size);
        const bidsData = bidsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const bidsWithListings = await Promise.all(bidsData.slice(0, 3).map(async bid => {
          try {
            const listingSnap = await getDocs(query(collection(db, "listings"), where("__name__", "==", bid.listingId)));
            const listing = listingSnap.empty ? null : listingSnap.docs[0].data();
            return { ...bid, listingInfo: listing };
          } catch(e) { return bid; }
        }));
        setMyBids(bidsWithListings);
      } catch(e) {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate("Welcome");
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <StatusBar style="dark" />
      <View style={styles.dashboardHeader}>
        <Text style={styles.logo}>Salvager26</Text>
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
      <View style={{height: 12}} />
      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.sellerButtonText}>+ List a Car</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("BrowseCars")}>
        <Text style={styles.dealerButtonText}>Browse & Bid on Cars</Text>
      </TouchableOpacity>
      {myListings.length > 0 && (
        <View>
          <Text style={{color: "#1a3a6b", fontSize: 18, fontWeight: "bold", textAlign: "center", marginTop: 24, marginBottom: 8}}>My Active Listings</Text>
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
              <Text style={styles.viewBidsText}>View Bids →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {myBids.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>My Recent Bids</Text>
          {myBids.map(bid => (
            <View key={bid.id} style={styles.listingCard}>
              <Text style={styles.listingTitle}>{bid.listingInfo ? bid.listingInfo.year + " " + bid.listingInfo.make + " " + bid.listingInfo.model : "Vehicle"}</Text>
              <Text style={styles.listingDetail}>Your bid: ${bid.amount}</Text>
              <Text style={styles.listingDetail}>Status: {bid.status === "accepted" ? "Accepted" : "Pending"}</Text>
              {bid.towingIncluded && <Text style={styles.listingDetail}>Towing included</Text>}
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
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.dealerButtonText}>My Profile</Text>
      </TouchableOpacity>
      <View style={{height: 12}} />
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
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
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
        <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
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
              <Text style={styles.acceptButtonText}>{bid.status === "accepted" ? "Offer Accepted" : accepting ? "Processing..." : "Accept Offer"}</Text>
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
  const [myBidListingIds, setMyBidListingIds] = useState([]);

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

  const applyFilter = async (allListings) => {
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
        const listingYear = parseInt(listing.year) || 0;
        if (listingYear < fromYear || listingYear > toYear) continue;
        if (!listing.zip) { nearby.push(listing); continue; }
        const listingCoords = await getZipCoords(listing.zip);
        if (!listingCoords) { nearby.push(listing); continue; }
        const distanceMeters = getDistance(userCoords, listingCoords);
        const distanceMiles = distanceMeters / 1609.34;
        if (distanceMiles <= parseFloat(radius)) {
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
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = data.filter(l => l.sellerId !== auth.currentUser.uid && l.status !== "sold");
        const myBidsSnap = await getDocs(query(collection(db, "bids"), where("buyerId", "==", auth.currentUser.uid)));
        setMyBidListingIds(myBidsSnap.docs.map(d => d.data().listingId));
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
          <Text style={styles.emptyStateText}>No listings found.</Text>
          <Text style={styles.emptyStateSubtext}>Try expanding your search radius!</Text>
        </View>
      ) : filteredListings.map(listing => (
        <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => navigation.navigate("PlaceBid", { listing })}>
          {listing.photos && listing.photos.length > 0 && (
            <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
          )}
          <View style={styles.listingCardHeader}>
            <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}{listing.trim ? " " + listing.trim : ""}</Text>
          </View>
          <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
          <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
          {listing.distanceMiles !== undefined && <Text style={styles.listingDetail}>{listing.distanceMiles} miles away</Text>}
          {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
          {listing.needsTow === true && <Text style={styles.conditionBadge}>Needs Tow</Text>}
          {myBidListingIds.includes(listing.id) ? <Text style={{color: "#2ecc71", fontSize: 14, marginTop: 8, fontWeight: "bold"}}>You bid on this ✓</Text> : <Text style={styles.bidButton2}>Place Bid →</Text>}
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
        <TextInput style={styles.input} placeholder="Note to seller (optional)" placeholderTextColor="#999999" value={note} onChangeText={setNote} />
        <TouchableOpacity style={styles.sellerButton} onPress={handleSubmitBid}>
          <Text style={styles.sellerButtonText}>{loading ? "Placing Bid..." : "Submit Bid"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CreateListingScreen({ navigation }) {
  const years = Array.from({length: 36}, (_, i) => (1990 + i).toString());
  const makes = Object.keys(CAR_DATA).sort();
  const [year, setYear] = useState("1990");
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
        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, titleStatus, engineStatus, transStatus, airbags, tires, photos: uploadedPhotos,
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
          <Text style={styles.logoutText}>Back</Text>
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
        <TextInput style={styles.input} placeholder="Mileage" placeholderTextColor="#999999" keyboardType="numeric" value={mileage} onChangeText={setMileage} />
        <Text style={styles.sectionLabel}>Location</Text>
        <View style={{flexDirection: "row", gap: 8}}>
          <TextInput style={[styles.input, {flex: 2}]} placeholder="City" placeholderTextColor="#999999" value={city} onChangeText={setCity} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="ZIP" placeholderTextColor="#999999" keyboardType="numeric" value={zip} onChangeText={setZip} />
        </View>
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
        </View>
        <Text style={styles.sectionLabel}>Title Status</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "clean" && styles.toggleActive]} onPress={() => setTitleStatus("clean")}>
            <Text style={styles.toggleText}>Clean Title</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "rebuilt" && styles.toggleOrange]} onPress={() => setTitleStatus("rebuilt")}>
            <Text style={styles.toggleText}>Rebuilt Salvage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "salvage" && styles.toggleActiveRed]} onPress={() => setTitleStatus("salvage")}>
            <Text style={styles.toggleText}>Salvage Title</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Engine</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "good" && styles.toggleActive]} onPress={() => setEngineStatus("good")}>
            <Text style={styles.toggleText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "bad" && styles.toggleActiveRed]} onPress={() => setEngineStatus("bad")}>
            <Text style={styles.toggleText}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "unknown" && styles.toggleOrange]} onPress={() => setEngineStatus("unknown")}>
            <Text style={styles.toggleText}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Transmission</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "good" && styles.toggleActive]} onPress={() => setTransStatus("good")}>
            <Text style={styles.toggleText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "bad" && styles.toggleActiveRed]} onPress={() => setTransStatus("bad")}>
            <Text style={styles.toggleText}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "unknown" && styles.toggleOrange]} onPress={() => setTransStatus("unknown")}>
            <Text style={styles.toggleText}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Airbags</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, airbags === "deployed" && styles.toggleActiveRed]} onPress={() => setAirbags("deployed")}>
            <Text style={styles.toggleText}>One or more deployed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, airbags === "none" && styles.toggleActive]} onPress={() => setAirbags("none")}>
            <Text style={styles.toggleText}>No airbags deployed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Tires</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, tires === "all4" && styles.toggleActive]} onPress={() => setTires("all4")}>
            <Text style={styles.toggleText}>All 4 tires</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, tires === "missing" && styles.toggleActiveRed]} onPress={() => setTires("missing")}>
            <Text style={styles.toggleText}>Missing 1 or more</Text>
          </TouchableOpacity>
        </View>
        <Text style={{color: "#1a3a6b", fontSize: 16, fontWeight: "bold", marginTop: 8, textTransform: "uppercase"}}>Vehicle Delivery</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, {paddingVertical: 18}, needsTow ? styles.toggleActiveRed : styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={styles.toggleText}>{needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Damage Level</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "none" && styles.toggleActive]} onPress={() => setDamage("none")}>
            <Text style={styles.toggleText}>No Damage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "minor" && styles.toggleYellow]} onPress={() => setDamage("minor")}>
            <Text style={styles.toggleText}>Minor</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, damage === "moderate" && styles.toggleOrange]} onPress={() => setDamage("moderate")}>
            <Text style={styles.toggleText}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, damage === "major" && styles.toggleActiveRed]} onPress={() => setDamage("major")}>
            <Text style={styles.toggleText}>Major Damage</Text>
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
        }
      } catch(e) {}
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", userData.id), { firstName, lastName, phone, zipCode, companyName });
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch(e) { Alert.alert("Error", e.message); }
  };

  if (loading) return (
    <View style={styles.container}>
      <Text style={styles.emptyStateText}>Loading...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
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
            <Text style={{color: "#c0392b", fontWeight: "bold"}}>{editing ? "Cancel" : "Edit"}</Text>
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
            <TouchableOpacity style={styles.sellerButton} onPress={handleSave}>
              <Text style={styles.sellerButtonText}>Save Changes</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", padding: 24 },
  scrollContainer: { flex: 1, backgroundColor: "#f5f5f5", padding: 24 },
  scrollContent: { paddingBottom: 60 },
  header: { alignItems: "center", marginBottom: 60 },
  logo: { fontSize: 42, fontWeight: "bold", color: "#c0392b", marginBottom: 12, letterSpacing: 1 },
  tagline: { fontSize: 16, color: "#555555", textAlign: "center", marginBottom: 40 },
  form: { width: "100%", gap: 16 },
  formContainer: { gap: 16 },
  input: { backgroundColor: "#ffffff", color: "#1a1a1a", padding: 16, borderRadius: 12, fontSize: 16, width: "100%", borderWidth: 1, borderColor: "#dddddd" },
  textArea: { height: 120, textAlignVertical: "top" },
  buttons: { width: "100%", gap: 16 },
  sellerButton: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  sellerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  dealerButton: { backgroundColor: "#1a3a6b", padding: 18, borderRadius: 14, alignItems: "center" },
  dealerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  secondaryButton: { borderWidth: 1, borderColor: "#1a3a6b", padding: 18, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: "#1a3a6b", fontSize: 18 },
  activeToggle: { backgroundColor: "#c0392b", borderColor: "#c0392b" },
  backText: { color: "#555555", textAlign: "center", fontSize: 16, marginTop: 8 },
  dashboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 60, marginBottom: 24 },
  dashboardTitle: { fontSize: 30, fontWeight: "bold", color: "#1a3a6b" },
  logoutText: { color: "#c0392b", fontSize: 16 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptyStateSubtext: { color: "#555555", fontSize: 14 },
  sectionLabel: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  statNumber: { fontSize: 36, fontWeight: "bold", color: "#c0392b" },
  statLabel: { fontSize: 14, color: "#555555", marginTop: 4 },
  listingCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  listingCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  listingTitle: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold" },
  listingDetail: { color: "#555555", fontSize: 14, marginBottom: 4 },
  listingPhoto: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  bidListingPhoto: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  viewBidsText: { color: "#c0392b", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  bidButton2: { color: "#c0392b", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  soldCard: { opacity: 0.7, borderWidth: 1, borderColor: "#2ecc71" },
  soldBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold" },
  conditionBadge: { color: "#c0392b", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  bidCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" },
  acceptedCard: { borderWidth: 2, borderColor: "#2ecc71" },
  bidAmount: { color: "#1a1a1a", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  highestBadge: { color: "#c0392b", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptedBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
  acceptedButton: { backgroundColor: "#888888" },
  acceptButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 4, height: 58, overflow: "hidden", justifyContent: "center", borderWidth: 1, borderColor: "#dddddd" },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerHalf: { flex: 1 },
  picker: { color: "#000000" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  toggleButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#dddddd" },
  toggleActive: { backgroundColor: "#2ecc71", borderColor: "#2ecc71" },
  toggleActiveRed: { backgroundColor: "#c0392b", borderColor: "#c0392b" },
  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },
  toggleYellow: { backgroundColor: "#f1c40f", borderColor: "#f1c40f" },
  toggleText: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold" },
  photoButton: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1a3a6b", marginBottom: 8 },
  photoButtonText: { color: "#1a3a6b", fontSize: 16 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  photoWrapper: { position: "relative" },
  photoThumb: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: { position: "absolute", top: -8, right: -8, backgroundColor: "#c0392b", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  filterContainer: { gap: 8, marginBottom: 16 },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },
  eyeText: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold" },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  eyeButton: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#dddddd", justifyContent: "center" },
  eyeText: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold" },
  filterButton: { backgroundColor: "#c0392b", padding: 14, borderRadius: 12, alignItems: "center" },
  filterButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  zipRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  locationButton: { backgroundColor: "#1a3a6b", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", minWidth: 80 },
  locationButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
});
