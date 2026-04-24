f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    '  const [pickupIncluded, setPickupIncluded] = useState(false);\n  const [towingIncluded, setTowingIncluded] = useState(false);',
    '  const [towingIncluded, setTowingIncluded] = useState(false);'
)

content = content.replace(
    'amount: parseFloat(amount), pickupIncluded, towingIncluded, note, status: "pending", createdAt: serverTimestamp(),',
    'amount: parseFloat(amount), towingIncluded, note, status: "pending", createdAt: serverTimestamp(),'
)

content = content.replace(
    '        <TouchableOpacity style={[styles.secondaryButton, pickupIncluded && styles.activeToggle]} onPress={() => setPickupIncluded(!pickupIncluded)}>\n          <Text style={styles.secondaryButtonText}>{pickupIncluded ? "Pickup Included" : "No Pickup"}</Text>\n        </TouchableOpacity>',
    ''
)

content = content.replace(
    '          <Text style={styles.listingDetail}>Pickup: {bid.pickupIncluded ? "Included" : "Not included"}</Text>',
    ''
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')