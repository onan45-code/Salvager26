f = open('App.js', 'r')
content = f.read()
f.close()

# Fix corrupted links
content = content.replace('[listing.id](http://listing.id)', 'listing.id')
content = content.replace('[listing.photos](http://listing.photos)', 'listing.photos')
content = content.replace('[listing.city](http://listing.city)', 'listing.city')
content = content.replace('[listing.zip](http://listing.zip)', 'listing.zip')
content = content.replace('[user.email](http://user.email)', 'user.email')
content = content.replace('[snapshot.docs.map](http://snapshot.docs.map)', 'snapshot.docs.map')
content = content.replace('[d.id](http://d.id)', 'd.id')
content = content.replace('[d.data](http://d.data)', 'd.data')
content = content.replace('[years.map](http://years.map)', 'years.map')
content = content.replace('[userSnap.docs](http://userSnap.docs)', 'userSnap.docs')

# Add MyBid screen to navigator
content = content.replace(
    '        <Stack.Screen name="EditListing" component={EditListingScreen} />',
    '        <Stack.Screen name="EditListing" component={EditListingScreen} />\n        <Stack.Screen name="MyBid" component={MyBidScreen} />'
)

# Update Browse Cars to navigate to MyBid if already bid
content = content.replace(
    '        <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => navigation.navigate("PlaceBid", { listing })}>',
    '        <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => myBidListingIds.includes(listing.id) ? navigation.navigate("MyBid", { listing, myBids }) : navigation.navigate("PlaceBid", { listing })}>'
)

# Add MyBidScreen before styles
content = content.replace(
    'function EditListingScreen',
    '''function MyBidScreen({ route, navigation }) {
  const { listing } = route.params;
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [towingIncluded, setTowingIncluded] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
          setNote(bidData.note || "");
        }
      } catch(e) {}
      setLoading(false);
    };
    fetchMyBid();
  }, []);

  const handleRaiseBid = async () => {
    if (!amount) { Alert.alert("Error", "Please enter a bid amount"); return; }
    if (parseFloat(amount) <= (myBid?.amount || 0)) {
      Alert.alert("Error", "New bid must be higher than your current bid of $" + myBid.amount);
      return;
    }
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "bids", myBid.id), { amount: parseFloat(amount), towingIncluded, note });
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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>My Bid</Text>
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
        {listing.runs === false && <Text style={styles.conditionBadge}>Not Running</Text>}
        {listing.needsTow === true && <Text style={styles.conditionBadge}>Needs Tow</Text>}
        {listing.titleStatus && <Text style={styles.listingDetail}>Title: {listing.titleStatus}</Text>}
        {listing.engineStatus && <Text style={styles.listingDetail}>Engine: {listing.engineStatus}</Text>}
        {listing.damage && <Text style={styles.listingDetail}>Damage: {listing.damage}</Text>}
        {listing.notes ? <Text style={styles.listingDetail}>Notes: {listing.notes}</Text> : null}
      </View>
      {myBid && (
        <View style={styles.listingCard}>
          <Text style={styles.sectionLabel}>Your Current Bid</Text>
          <Text style={styles.bidAmount}>${myBid.amount}</Text>
          <Text style={styles.listingDetail}>Status: {myBid.status === "accepted" ? "Accepted" : "Pending"}</Text>
          {myBid.towingIncluded && <Text style={styles.listingDetail}>Towing included in bid</Text>}
          {myBid.note ? <Text style={styles.listingDetail}>Note: {myBid.note}</Text> : null}
        </View>
      )}
      {myBid && myBid.status !== "accepted" && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Raise Your Bid</Text>
          <TextInput style={styles.input} placeholder="New Bid Amount ($)" placeholderTextColor="#999999" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          {listing.needsTow && (
            <TouchableOpacity style={[styles.secondaryButton, towingIncluded && styles.activeToggle]} onPress={() => setTowingIncluded(!towingIncluded)}>
              <Text style={[styles.secondaryButtonText, towingIncluded && {color: "#ffffff"}]}>{towingIncluded ? "Towing Included" : "Towing NOT Included"}</Text>
            </TouchableOpacity>
          )}
          <TextInput style={styles.input} placeholder="Note to seller (optional)" placeholderTextColor="#999999" value={note} onChangeText={setNote} />
          <TouchableOpacity style={styles.sellerButton} onPress={handleRaiseBid}>
            <Text style={styles.sellerButtonText}>{submitting ? "Updating..." : "Update Bid"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function EditListingScreen'''
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')