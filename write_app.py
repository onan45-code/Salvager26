f = open('App.js', 'r')
content = f.read()
f.close()

# Background colors
content = content.replace('backgroundColor: "#1a1a2e"', 'backgroundColor: "#ffffff"')
content = content.replace('backgroundColor: "#2a2a3e"', 'backgroundColor: "#f0f0f0"')

# Text colors
content = content.replace('color: "#ffffff", fontSize: 18, fontWeight: "bold" },\n  sellerButton', 'color: "#ffffff", fontSize: 18, fontWeight: "bold" },\n  sellerButton')
content = content.replace('"color: "#ffffff"', '"color: "#1a1a1a"')

# Styles
content = content.replace(
    'container: { flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 24 }',
    'container: { flex: 1, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", padding: 24 }'
)
content = content.replace(
    'scrollContainer: { flex: 1, backgroundColor: "#ffffff", padding: 24 }',
    'scrollContainer: { flex: 1, backgroundColor: "#f5f5f5", padding: 24 }'
)
content = content.replace(
    'logo: { fontSize: 42, fontWeight: "bold", color: "#ffffff", marginBottom: 12, letterSpacing: 1 }',
    'logo: { fontSize: 42, fontWeight: "bold", color: "#c0392b", marginBottom: 12, letterSpacing: 1 }'
)
content = content.replace(
    'tagline: { fontSize: 16, color: "#aaaaaa", textAlign: "center", marginBottom: 40 }',
    'tagline: { fontSize: 16, color: "#555555", textAlign: "center", marginBottom: 40 }'
)
content = content.replace(
    'input: { backgroundColor: "#2a2a3e", color: "#ffffff", padding: 16, borderRadius: 12, fontSize: 16, width: "100%" }',
    'input: { backgroundColor: "#ffffff", color: "#1a1a1a", padding: 16, borderRadius: 12, fontSize: 16, width: "100%", borderWidth: 1, borderColor: "#dddddd" }'
)
content = content.replace(
    'sellerButton: { backgroundColor: "#e94560", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 }',
    'sellerButton: { backgroundColor: "#c0392b", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 }'
)
content = content.replace(
    'dealerButton: { backgroundColor: "#ffffff", padding: 18, borderRadius: 14, alignItems: "center" }',
    'dealerButton: { backgroundColor: "#1a3a6b", padding: 18, borderRadius: 14, alignItems: "center" }'
)
content = content.replace(
    'dealerButtonText: { color: "#1a1a2e", fontSize: 18, fontWeight: "bold" }',
    'dealerButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" }'
)
content = content.replace(
    'secondaryButton: { borderWidth: 1, borderColor: "#ffffff", padding: 18, borderRadius: 12, alignItems: "center" }',
    'secondaryButton: { borderWidth: 1, borderColor: "#1a3a6b", padding: 18, borderRadius: 12, alignItems: "center" }'
)
content = content.replace(
    'secondaryButtonText: { color: "#ffffff", fontSize: 18 }',
    'secondaryButtonText: { color: "#1a3a6b", fontSize: 18 }'
)
content = content.replace(
    'backText: { color: "#aaaaaa", textAlign: "center", fontSize: 16, marginTop: 8 }',
    'backText: { color: "#555555", textAlign: "center", fontSize: 16, marginTop: 8 }'
)
content = content.replace(
    'dashboardTitle: { fontSize: 30, fontWeight: "bold", color: "#ffffff" }',
    'dashboardTitle: { fontSize: 30, fontWeight: "bold", color: "#1a3a6b" }'
)
content = content.replace(
    'logoutText: { color: "#e94560", fontSize: 16 }',
    'logoutText: { color: "#c0392b", fontSize: 16 }'
)
content = content.replace(
    'emptyStateText: { color: "#ffffff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }',
    'emptyStateText: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold", marginBottom: 8 }'
)
content = content.replace(
    'emptyStateSubtext: { color: "#aaaaaa", fontSize: 14 }',
    'emptyStateSubtext: { color: "#555555", fontSize: 14 }'
)
content = content.replace(
    'sectionLabel: { color: "#aaaaaa", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" }',
    'sectionLabel: { color: "#1a3a6b", fontSize: 14, fontWeight: "bold", marginTop: 8, textTransform: "uppercase" }'
)
content = content.replace(
    'listingCard: { backgroundColor: "#2a2a3e", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }',
    'listingCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" }'
)
content = content.replace(
    'listingTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" }',
    'listingTitle: { color: "#1a1a1a", fontSize: 18, fontWeight: "bold" }'
)
content = content.replace(
    'listingDetail: { color: "#aaaaaa", fontSize: 14, marginBottom: 4 }',
    'listingDetail: { color: "#555555", fontSize: 14, marginBottom: 4 }'
)
content = content.replace(
    'viewBidsText: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" }',
    'viewBidsText: { color: "#c0392b", fontSize: 14, marginTop: 8, fontWeight: "bold" }'
)
content = content.replace(
    'bidButton2: { color: "#e94560", fontSize: 14, marginTop: 8, fontWeight: "bold" }',
    'bidButton2: { color: "#c0392b", fontSize: 14, marginTop: 8, fontWeight: "bold" }'
)
content = content.replace(
    'bidCard: { backgroundColor: "#2a2a3e", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }',
    'bidCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderWidth: 1, borderColor: "#eeeeee" }'
)
content = content.replace(
    'bidAmount: { color: "#ffffff", fontSize: 24, fontWeight: "bold", marginBottom: 8 }',
    'bidAmount: { color: "#1a1a1a", fontSize: 24, fontWeight: "bold", marginBottom: 8 }'
)
content = content.replace(
    'highestBadge: { color: "#e94560", fontSize: 12, fontWeight: "bold", marginBottom: 8 }',
    'highestBadge: { color: "#c0392b", fontSize: 12, fontWeight: "bold", marginBottom: 8 }'
)
content = content.replace(
    'toggleButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#2a2a3e", borderWidth: 1, borderColor: "#5a5a8e" }',
    'toggleButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#dddddd" }'
)
content = content.replace(
    'toggleText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" }',
    'toggleText: { color: "#1a1a1a", fontSize: 14, fontWeight: "bold" }'
)
content = content.replace(
    'photoButton: { backgroundColor: "#2a2a3e", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#5a5a8e", marginBottom: 8 }',
    'photoButton: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1a3a6b", marginBottom: 8 }'
)
content = content.replace(
    'photoButtonText: { color: "#ffffff", fontSize: 16 }',
    'photoButtonText: { color: "#1a3a6b", fontSize: 16 }'
)
content = content.replace(
    'filterButton: { backgroundColor: "#e94560", padding: 14, borderRadius: 12, alignItems: "center" }',
    'filterButton: { backgroundColor: "#c0392b", padding: 14, borderRadius: 12, alignItems: "center" }'
)
content = content.replace(
    'scanButton: { backgroundColor: "#2a2a3e", padding: 16, borderRadius: 12, justifyContent: "center", borderWidth: 1, borderColor: "#5a5a8e" }',
    'scanButton: { backgroundColor: "#f0f0f0", padding: 16, borderRadius: 12, justifyContent: "center", borderWidth: 1, borderColor: "#dddddd" }'
)
content = content.replace(
    'locationButton: { backgroundColor: "#2a2a3e", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#5a5a8e", minWidth: 80 }',
    'locationButton: { backgroundColor: "#1a3a6b", padding: 14, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#1a3a6b", minWidth: 80 }'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')