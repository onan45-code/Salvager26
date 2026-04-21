import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

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

const TRIMS = ["Base", "LE", "SE", "XLE", "Limited", "Sport", "LT", "LTZ", "EX", "EX-L", "Touring", "Premium", "Luxury", "ST", "GT", "SS", "RS", "SXT", "R/T", "SRT", "Platinum", "King Ranch", "Lariat", "XLT", "Other"];


export default function App() {
  const [initialRoute, setInitialRoute] = useState("Welcome");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const snap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
          if (!snap.empty) {
            const userType = snap.docs[0].data().userType;
            setInitialRoute(userType === "dealer" ? "DealerDashboard" : "SellerDashboard");
          } else {
            setInitialRoute("Welcome");
          }
        } catch(e) {
          setInitialRoute("Welcome");
        }
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
        <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
        <Stack.Screen name="DealerLogin" component={DealerLoginScreen} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
        <Stack.Screen name="SellerBids" component={SellerBidsScreen} />
        <Stack.Screen name="DealerDashboard" component={DealerDashboard} />
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
        <Text style={styles.tagline}>Sell your car fast. Get real offers.</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("SellerLogin")}>
          <Text style={styles.sellerButtonText}>I want to sell my car</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("DealerLogin")}>
          <Text style={styles.dealerButtonText}>I am a dealer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SellerLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "users"), { uid: cred.user.uid, email, userType: "seller" });
      navigation.navigate("SellerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.logo}>Seller Login</Text>
      <Text style={styles.tagline}>Enter your details to continue</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaaaaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaaaaa" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.sellerButton} onPress={handleLogin}>
          <Text style={styles.sellerButtonText}>{loading ? "Loading..." : "Log In"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DealerLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("DealerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert("Error", "Please enter email and password"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "users"), { uid: cred.user.uid, email, userType: "dealer" });
      navigation.navigate("DealerDashboard");
    } catch (error) { Alert.alert("Error", error.message); }
    setLoading(false);
  };
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.logo}>Dealer Login</Text>
      <Text style={styles.tagline}>Enter your details to continue</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaaaaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaaaaa" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.dealerButton} onPress={handleLogin}>
          <Text style={styles.dealerButtonText}>{loading ? "Loading..." : "Log In"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SellerDashboard({ navigation }) {
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
  useEffect(() => { fetchListings(); }, []);
  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate("Welcome");
  };
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Listings</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
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
          await updateDoc(doc(db, "listings", listing.id), { status: "sold", soldPrice: bid.amount, soldToEmail: bid.dealerEmail });
          await updateDoc(doc(db, "bids", bid.id), { status: "accepted" });
          Alert.alert("Deal Done!", "Sold for $" + bid.amount + ". Dealer: " + bid.dealerEmail);
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
        {listing.status === "sold" && <Text style={styles.soldBadge}>SOLD - \${listing.soldPrice}</Text>}
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : bids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No bids yet.</Text>
          <Text style={styles.emptyStateSubtext}>Dealers will be notified!</Text>
        </View>
      ) : bids.map((bid, index) => (
        <View key={bid.id} style={[styles.bidCard, bid.status === "accepted" && styles.acceptedCard]}>
          {index === 0 && listing.status !== "sold" && <Text style={styles.highestBadge}>HIGHEST OFFER</Text>}
          {bid.status === "accepted" && <Text style={styles.acceptedBadge}>ACCEPTED</Text>}
          <Text style={styles.bidAmount}>\${bid.amount}</Text>
          <Text style={styles.listingDetail}>Pickup: {bid.pickupIncluded ? "Included" : "Not included"}</Text>
          <Text style={styles.listingDetail}>Dealer: {bid.dealerEmail}</Text>
          {bid.note ? <Text style={styles.listingDetail}>Note: {bid.note}</Text> : null}
          {listing.status !== "sold" && (
            <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptOffer(bid)} disabled={accepting}>
              <Text style={styles.acceptButtonText}>{accepting ? "Processing..." : "Accept Offer"}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function DealerDashboard({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "listings"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(data);
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    fetchListings();
  }, []);
  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate("Welcome");
  };
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Available Cars</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No listings yet.</Text>
          <Text style={styles.emptyStateSubtext}>Check back soon!</Text>
        </View>
      ) : listings.map(listing => (
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
          {listing.status !== "sold" && <Text style={styles.bidButton2}>Place Bid →</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PlaceBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [amount, setAmount] = useState("");
  const [pickupIncluded, setPickupIncluded] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmitBid = async () => {
    if (!amount) { Alert.alert("Error", "Please enter a bid amount"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "bids"), {
        listingId: listing.id, dealerId: user.uid, dealerEmail: user.email,
        amount: parseFloat(amount), pickupIncluded, note, status: "pending", createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Your bid has been placed!");
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
        <TouchableOpacity style={[styles.secondaryButton, pickupIncluded && styles.activeToggle]} onPress={() => setPickupIncluded(!pickupIncluded)}>
          <Text style={styles.secondaryButtonText}>{pickupIncluded ? "Pickup Included" : "No Pickup"}</Text>
        </TouchableOpacity>
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

  const handleSubmit = async () => {
    if (!year || !make || !model) { Alert.alert("Error", "Please enter year, make and model"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "listings"), {
        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos,
        sellerId: user.uid, sellerEmail: user.email, createdAt: serverTimestamp(), status: "active",
      });
      Alert.alert("Success", "Listing created! Dealers will be notified.");
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
        <View style={styles.pickerContainer}>
          <Picker selectedValue={year} onValueChange={(val) => setYear(val)} style={styles.picker}>
            <Picker.Item label="Select Year" value="" />
            {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={make} onValueChange={(val) => { setMake(val); setModel(""); }} style={styles.picker}>
            <Picker.Item label="Select Make" value="" />
            {makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={model} onValueChange={(val) => setModel(val)} style={styles.picker} enabled={make !== ""}>
            <Picker.Item label={make ? "Select Model" : "Select Make First"} value="" />
            {make ? CAR_DATA[make].map(m => <Picker.Item key={m} label={m} value={m} />) : []}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={trim} onValueChange={(val) => setTrim(val)} style={styles.picker}>
            <Picker.Item label="Select Trim" value="" />
            {TRIMS.map(t => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>
        <TextInput style={styles.input} placeholder="Mileage" placeholderTextColor="#aaaaaa" keyboardType="numeric" value={mileage} onChangeText={setMileage} />
        <Text style={styles.sectionLabel}>Location</Text>
        <TextInput style={styles.input} placeholder="City" placeholderTextColor="#aaaaaa" value={city} onChangeText={setCity} />
        <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#aaaaaa" keyboardType="numeric" value={zip} onChangeText={setZip} />
        <Text style={styles.sectionLabel}>Condition - tap to toggle</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, runs && styles.toggleActive]} onPress={() => setRuns(!runs)}>
            <Text style={styles.toggleText}>{runs ? "Runs" : "Not Running"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, hasKeys && styles.toggleActive]} onPress={() => setHasKeys(!hasKeys)}>
            <Text style={styles.toggleText}>{hasKeys ? "Has Keys" : "No Keys"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, hasTitle && styles.toggleActive]} onPress={() => setHasTitle(!hasTitle)}>
            <Text style={styles.toggleText}>{hasTitle ? "Has Title" : "No Title"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, needsTow && styles.toggleActiveRed]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={styles.toggleText}>{needsTow ? "Needs Tow" : "Self Drive"}</Text>
          </TouchableOpacity>
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
  logo: { fontSize: 36, fontWeight: "bold", color: "#ffffff", marginBottom: 12 },
  tagline: { fontSize: 16, color: "#aaaaaa", textAlign: "center", marginBottom: 40 },
  form: { width: "100%", gap: 16 },
  formContainer: { gap: 16 },
  input: { backgroundColor: "#2a2a3e", color: "#ffffff", padding: 16, borderRadius: 12, fontSize: 16, width: "100%" },
  textArea: { height: 120, textAlignVertical: "top" },
  buttons: { width: "100%", gap: 16 },
  sellerButton: { backgroundColor: "#e94560", padding: 18, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  sellerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  dealerButton: { backgroundColor: "#ffffff", padding: 18, borderRadius: 12, alignItems: "center" },
  dealerButtonText: { color: "#1a1a2e", fontSize: 18, fontWeight: "bold" },
  secondaryButton: { borderWidth: 1, borderColor: "#ffffff", padding: 18, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: "#ffffff", fontSize: 18 },
  activeToggle: { backgroundColor: "#e94560", borderColor: "#e94560" },
  backText: { color: "#aaaaaa", textAlign: "center", fontSize: 16, marginTop: 8 },
  dashboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 60, marginBottom: 24 },
  dashboardTitle: { fontSize: 28, fontWeight: "bold", color: "#ffffff" },
  logoutText: { color: "#e94560", fontSize: 16 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#ffffff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptyStateSubtext: { color: "#aaaaaa", fontSize: 14 },
  sectionLabel: { color: "#aaaaaa", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" },
  listingCard: { backgroundColor: "#2a2a3e", borderRadius: 12, padding: 16, marginBottom: 16 },
  listingCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  listingTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  listingDetail: { color: "#aaaaaa", fontSize: 14, marginBottom: 4 },
  listingPhoto: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12 },
  bidListingPhoto: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  viewBidsText: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  bidButton2: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" },
  soldCard: { opacity: 0.7, borderWidth: 1, borderColor: "#2ecc71" },
  soldBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold" },
  conditionBadge: { color: "#e94560", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  bidCard: { backgroundColor: "#2a2a3e", borderRadius: 12, padding: 16, marginBottom: 16 },
  acceptedCard: { borderWidth: 2, borderColor: "#2ecc71" },
  bidAmount: { color: "#ffffff", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  highestBadge: { color: "#e94560", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptedBadge: { color: "#2ecc71", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  acceptButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
  acceptButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 4, height: 55, overflow: "hidden", justifyContent: "center" },
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
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  removePhoto: { position: "absolute", top: -8, right: -8, backgroundColor: "#e94560", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
});
