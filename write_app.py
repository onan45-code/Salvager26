f = open('App.js', 'r')
content = f.read()
f.close()

old = "import * as Notifications from 'expo-notifications';"
new = "import * as Notifications from 'expo-notifications';\nimport { getDistance } from 'geolib';"

content = content.replace(old, new)

old2 = """function BrowseCarsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "listings"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(data.filter(l => l.sellerId !== auth.currentUser.uid));
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    fetchListings();
  }, []);"""

new2 = """function BrowseCarsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("50");
  const [filtering, setFiltering] = useState(false);

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
      for (const listing of allListings) {
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
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = data.filter(l => l.sellerId !== auth.currentUser.uid);
        setListings(filtered);
        setFilteredListings(filtered);
      } catch (error) { Alert.alert("Error", error.message); }
      setLoading(false);
    };
    fetchListings();
  }, []);"""

content = content.replace(old2, new2)

old3 = """      {loading ? <Text style={styles.emptyStateText}>Loading...</Text> : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No listings yet.</Text>
          <Text style={styles.emptyStateSubtext}>Check back soon!</Text>
        </View>
      ) : listings.map(listing => ("""

new3 = """      <View style={styles.filterContainer}>
        <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={radius} onValueChange={(val) => setRadius(val)} style={styles.picker}>
            <Picker.Item label="25 miles" value="25" />
            <Picker.Item label="50 miles" value="50" />
            <Picker.Item label="100 miles" value="100" />
            <Picker.Item label="200 miles" value="200" />
            <Picker.Item label="Any distance" value="99999" />
          </Picker>
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
      ) : filteredListings.map(listing => ("""

content = content.replace(old3, new3)

old4 = "      ) : listings.map(listing => ("
new4 = "      ) : filteredListings.map(listing => ("
content = content.replace(old4, new4)

old5 = "          {listing.status !== \"sold\" && <Text style={styles.bidButton2}>Place Bid →</Text>}"
new5 = "          {listing.distanceMiles !== undefined && <Text style={styles.listingDetail}>{listing.distanceMiles} miles away</Text>}\n          {listing.status !== \"sold\" && <Text style={styles.bidButton2}>Place Bid →</Text>}"
content = content.replace(old5, new5)

old6 = "  removePhotoText: { color: \"#ffffff\", fontSize: 12, fontWeight: \"bold\" },"
new6 = """  removePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  filterContainer: { gap: 8, marginBottom: 16 },
  zipInput: { marginBottom: 0 },
  filterButton: { backgroundColor: "#e94560", padding: 14, borderRadius: 12, alignItems: "center" },
  filterButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },"""
content = content.replace(old6, new6)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')