f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    '{listing.status !== "sold" && bid.status !== "accepted" && (\n            <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptOffer(bid)} disabled={accepting}>\n              <Text style={styles.acceptButtonText}>{accepting ? "Processing..." : "Accept Offer"}</Text>\n            </TouchableOpacity>\n          )}',
    '{listing.status !== "sold" ? (\n            <TouchableOpacity style={[styles.acceptButton, bid.status === "accepted" && styles.acceptedButton]} onPress={() => bid.status !== "accepted" && handleAcceptOffer(bid)} disabled={accepting || bid.status === "accepted"}>\n              <Text style={styles.acceptButtonText}>{bid.status === "accepted" ? "Offer Accepted ✓" : accepting ? "Processing..." : "Accept Offer"}</Text>\n            </TouchableOpacity>\n          ) : null}'
)

content = content.replace(
    'acceptButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 }',
    'acceptButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },\n  acceptedButton: { backgroundColor: "#888888" }'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')