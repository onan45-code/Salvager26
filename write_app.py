f = open('App.js', 'r')
content = f.read()
f.close()

# Add Profile screen to navigator
content = content.replace(
    '        <Stack.Screen name="CreateListing" component={CreateListingScreen} />',
    '        <Stack.Screen name="CreateListing" component={CreateListingScreen} />\n        <Stack.Screen name="Profile" component={ProfileScreen} />'
)

# Add Profile button to dashboard
content = content.replace(
    '      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>',
    '      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("Profile")}>\n        <Text style={styles.dealerButtonText}>My Profile</Text>\n      </TouchableOpacity>\n      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>'
)

# Add Profile screen before styles
content = content.replace(
    'const styles = StyleSheet.create({',
    '''function ProfileScreen({ navigation }) {
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

const styles = StyleSheet.create({'''
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')