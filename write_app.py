f = open('App.js', 'r')
lines = f.readlines()
f.close()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'const [needsTow, setNeedsTow] = useState(false);' in line:
        new_lines.append('  const [damage, setDamage] = useState("");\n')
    if i == 634:
        new_lines.append('        <Text style={styles.sectionLabel}>Damage Level</Text>\n')
        new_lines.append('        <View style={styles.toggleRow}>\n')
        new_lines.append('          <TouchableOpacity style={[styles.toggleButton, damage === "none" && styles.toggleActive]} onPress={() => setDamage("none")}>\n')
        new_lines.append('            <Text style={styles.toggleText}>No Damage</Text>\n')
        new_lines.append('          </TouchableOpacity>\n')
        new_lines.append('          <TouchableOpacity style={[styles.toggleButton, damage === "minor" && styles.toggleYellow]} onPress={() => setDamage("minor")}>\n')
        new_lines.append('            <Text style={styles.toggleText}>Minor</Text>\n')
        new_lines.append('          </TouchableOpacity>\n')
        new_lines.append('        </View>\n')
        new_lines.append('        <View style={styles.toggleRow}>\n')
        new_lines.append('          <TouchableOpacity style={[styles.toggleButton, damage === "moderate" && styles.toggleOrange]} onPress={() => setDamage("moderate")}>\n')
        new_lines.append('            <Text style={styles.toggleText}>Moderate</Text>\n')
        new_lines.append('          </TouchableOpacity>\n')
        new_lines.append('          <TouchableOpacity style={[styles.toggleButton, damage === "major" && styles.toggleActiveRed]} onPress={() => setDamage("major")}>\n')
        new_lines.append('            <Text style={styles.toggleText}>Major Damage</Text>\n')
        new_lines.append('          </TouchableOpacity>\n')
        new_lines.append('        </View>\n')

content = ''.join(new_lines)

content = content.replace(
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos: uploadedPhotos,',
    'year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, damage, photos: uploadedPhotos,'
)

content = content.replace(
    '  toggleActiveRed: { backgroundColor: "#e94560", borderColor: "#e94560" },',
    '  toggleActiveRed: { backgroundColor: "#e94560", borderColor: "#e94560" },\n  toggleYellow: { backgroundColor: "#f1c40f", borderColor: "#f1c40f" },\n  toggleOrange: { backgroundColor: "#e67e22", borderColor: "#e67e22" },'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')