f = open('App.js', 'r')
content = f.read()
f.close()

old = """  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!userSnap.empty) setUserName(userSnap.docs[0].data().firstName || "");
        const listingsSnap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", user.uid)));
        setListingCount(listingsSnap.size);
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
  }, []);"""

new = """  const [myListings, setMyListings] = useState([]);

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
  }, []);"""

content = content.replace(old, new)

old2 = """      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("MyListings")}>
        <Text style={styles.sellerButtonText}>My Listings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("BrowseCars")}>
        <Text style={styles.dealerButtonText}>Browse & Bid on Cars</Text>
      </TouchableOpacity>"""

new2 = """      <TouchableOpacity style={styles.sellerButton} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.sellerButtonText}>+ List a Car</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dealerButton} onPress={() => navigation.navigate("BrowseCars")}>
        <Text style={styles.dealerButtonText}>Browse & Bid on Cars</Text>
      </TouchableOpacity>
      {myListings.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>My Active Listings</Text>
          {myListings.map(listing => (
            <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => navigation.navigate("SellerBids", { listing })}>
              {listing.photos && listing.photos.length > 0 && (
                <Image source={{ uri: listing.photos[0] }} style={styles.listingPhoto} />
              )}
              <View style={styles.listingCardHeader}>
                <Text style={styles.listingTitle}>{listing.year} {listing.make} {listing.model}</Text>
              </View>
              <Text style={styles.listingDetail}>Mileage: {listing.mileage}</Text>
              <Text style={styles.listingDetail}>{listing.city}, {listing.zip}</Text>
              <Text style={styles.viewBidsText}>View Bids →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}"""

content = content.replace(old2, new2)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')