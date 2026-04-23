f = open('App.js', 'r')
content = f.read()
f.close()

content = content.replace(
    "  const [filtering, setFiltering] = useState(false);",
    "  const [filtering, setFiltering] = useState(false);\n  const [yearFrom, setYearFrom] = useState(\"\");\n  const [yearTo, setYearTo] = useState(\"\");"
)

content = content.replace(
    "      const nearby = [];",
    """      const nearby = [];
      const fromYear = yearFrom ? parseInt(yearFrom) : 0;
      const toYear = yearTo ? parseInt(yearTo) : 9999;"""
)

content = content.replace(
    "        if (distanceMiles <= parseFloat(radius)) {",
    """        const listingYear = parseInt(listing.year) || 0;
        if (distanceMiles <= parseFloat(radius) && listingYear >= fromYear && listingYear <= toYear) {"""
)

content = content.replace(
    """      <View style={styles.filterContainer}>
        <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={radius} onValueChange={(val) => setRadius(val)} style={styles.picker}>
            <Picker.Item label="25 miles" value="25" />
            <Picker.Item label="50 miles" value="50" />
            <Picker.Item label="100 miles" value="100" />
            <Picker.Item label="200 miles" value="200" />
            <Picker.Item label="Any distance" value="99999" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => applyRadiusFilter(listings)}>
          <Text style={styles.filterButtonText}>{filtering ? "Filtering..." : "Search"}</Text>
        </TouchableOpacity>
      </View>""",
    """      <View style={styles.filterContainer}>
        <TextInput style={[styles.input, styles.zipInput]} placeholder="Your ZIP code" placeholderTextColor="#aaaaaa" keyboardType="numeric" maxLength={5} value={zipCode} onChangeText={setZipCode} />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={radius} onValueChange={(val) => setRadius(val)} style={styles.picker}>
            <Picker.Item label="25 miles" value="25" />
            <Picker.Item label="50 miles" value="50" />
            <Picker.Item label="100 miles" value="100" />
            <Picker.Item label="200 miles" value="200" />
            <Picker.Item label="Any distance" value="99999" />
          </Picker>
        </View>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={yearFrom} onValueChange={(val) => setYearFrom(val)} style={styles.picker}>
              <Picker.Item label="From Year" value="" />
              {Array.from({length: 46}, (_, i) => (2025 - i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
          <View style={[styles.pickerContainer, styles.pickerHalf]}>
            <Picker selectedValue={yearTo} onValueChange={(val) => setYearTo(val)} style={styles.picker}>
              <Picker.Item label="To Year" value="" />
              {Array.from({length: 46}, (_, i) => (2025 - i).toString()).map(y => <Picker.Item key={y} label={y} value={y} />)}
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => applyRadiusFilter(listings)}>
          <Text style={styles.filterButtonText}>{filtering ? "Filtering..." : "Search"}</Text>
        </TouchableOpacity>
      </View>"""
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')