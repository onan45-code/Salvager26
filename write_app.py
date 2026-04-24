f = open('App.js', 'r')
content = f.read()
f.close()

old = "import * as Notifications from 'expo-notifications';"
new = "import * as Notifications from 'expo-notifications';\nimport * as Location from 'expo-location';"

content = content.replace(old, new)

old2 = "  const [filtering, setFiltering] = useState(false);\n  const [yearFrom, setYearFrom] = useState(\"\");\n  const [yearTo, setYearTo] = useState(\"\");"
new2 = """  const [filtering, setFiltering] = useState(false);
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
  };"""

content = content.replace(old2, new2)

old3 = """        <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />"""
new3 = """        <View style={styles.zipRow}>
          <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
          <TouchableOpacity style={styles.locationButton} onPress={detectLocation}>
            <Text style={styles.locationButtonText}>{locationLoading ? "..." : "📍 Auto"}</Text>
          </TouchableOpacity>
        </View>"""

content = content.replace(old3, new3)

old4 = "  filterButtonText: { color: \"#ffffff\", fontSize: 16, fontWeight: \"bold\" },"
new4 = """  filterButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  zipRow: { flexDirection: "row", gap: 8 },
  locationButton: { backgroundColor: "#2a2a3e", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#5a5a8e" },
  locationButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },"""

content = content.replace(old4, new4)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')
