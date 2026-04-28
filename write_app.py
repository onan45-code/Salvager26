f = open('App.js', 'r')
content = f.read()
f.close()

# Add new states
content = content.replace(
    '  const [needsTow, setNeedsTow] = useState(false);\n  const [damage, setDamage] = useState("");',
    '  const [needsTow, setNeedsTow] = useState(false);\n  const [damage, setDamage] = useState("");\n  const [titleStatus, setTitleStatus] = useState("");\n  const [engineStatus, setEngineStatus] = useState("");\n  const [transStatus, setTransStatus] = useState("");\n  const [airbags, setAirbags] = useState("");\n  const [tires, setTires] = useState("");'
)

# Add new fields to save
content = content.replace(
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, photos: uploadedPhotos,',
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, titleStatus, engineStatus, transStatus, airbags, tires, photos: uploadedPhotos,'
)

# Replace old toggles with new expanded set
content = content.replace(
    '''        <Text style={styles.sectionLabel}>Condition - tap to toggle</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, runs ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setRuns(!runs)}>
            <Text style={styles.toggleText}>{runs ? "Runs" : "Not Running"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, hasKeys ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasKeys(!hasKeys)}>
            <Text style={styles.toggleText}>{hasKeys ? "Has Keys" : "No Keys"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, hasTitle ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasTitle(!hasTitle)}>
            <Text style={styles.toggleText}>{hasTitle ? "Drivable" : "Not Drivable"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, needsTow ? styles.toggleActiveRed : styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={styles.toggleText}>{needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
          </TouchableOpacity>
        </View>''',
    '''        <Text style={styles.sectionLabel}>Condition - tap to toggle</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, runs ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setRuns(!runs)}>
            <Text style={styles.toggleText}>{runs ? "Runs" : "Not Running"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, hasKeys ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasKeys(!hasKeys)}>
            <Text style={styles.toggleText}>{hasKeys ? "Has Keys" : "No Keys"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, hasTitle ? styles.toggleActive : styles.toggleActiveRed]} onPress={() => setHasTitle(!hasTitle)}>
            <Text style={styles.toggleText}>{hasTitle ? "Drivable" : "Not Drivable"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Title Status</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "clean" && styles.toggleActive]} onPress={() => setTitleStatus("clean")}>
            <Text style={styles.toggleText}>Clean Title</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "rebuilt" && styles.toggleOrange]} onPress={() => setTitleStatus("rebuilt")}>
            <Text style={styles.toggleText}>Rebuilt Salvage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, titleStatus === "salvage" && styles.toggleActiveRed]} onPress={() => setTitleStatus("salvage")}>
            <Text style={styles.toggleText}>Salvage Title</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Engine</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "good" && styles.toggleActive]} onPress={() => setEngineStatus("good")}>
            <Text style={styles.toggleText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "bad" && styles.toggleActiveRed]} onPress={() => setEngineStatus("bad")}>
            <Text style={styles.toggleText}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, engineStatus === "unknown" && styles.toggleOrange]} onPress={() => setEngineStatus("unknown")}>
            <Text style={styles.toggleText}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Transmission</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "good" && styles.toggleActive]} onPress={() => setTransStatus("good")}>
            <Text style={styles.toggleText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "bad" && styles.toggleActiveRed]} onPress={() => setTransStatus("bad")}>
            <Text style={styles.toggleText}>Bad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, transStatus === "unknown" && styles.toggleOrange]} onPress={() => setTransStatus("unknown")}>
            <Text style={styles.toggleText}>Unknown</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Airbags</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, airbags === "deployed" && styles.toggleActiveRed]} onPress={() => setAirbags("deployed")}>
            <Text style={styles.toggleText}>One or more deployed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, airbags === "none" && styles.toggleActive]} onPress={() => setAirbags("none")}>
            <Text style={styles.toggleText}>No airbags deployed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Tires</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, tires === "all4" && styles.toggleActive]} onPress={() => setTires("all4")}>
            <Text style={styles.toggleText}>All 4 tires</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, tires === "missing" && styles.toggleActiveRed]} onPress={() => setTires("missing")}>
            <Text style={styles.toggleText}>Missing 1 or more</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, needsTow ? styles.toggleActiveRed : styles.toggleActive]} onPress={() => setNeedsTow(!needsTow)}>
            <Text style={styles.toggleText}>{needsTow ? "Buyer responsible for towing" : "Will Deliver"}</Text>
          </TouchableOpacity>
        </View>'''
)

# Add toggleOrange style if not there
content = content.replace(
    '  toggleActiveRed: { backgroundColor: "#c0392b", borderColor: "#c0392b" },',
    '  toggleActiveRed: { backgroundColor: "#c0392b", borderColor: "#c0392b" },\n  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')