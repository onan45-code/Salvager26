f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    'sellerButton: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 8 },',
    'sellerButton: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 12 },'
)
content = content.replace(
    'dealerButton: { backgroundColor: "#1a3a6b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 8 },',
    'dealerButton: { backgroundColor: "#1a3a6b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 12 },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')