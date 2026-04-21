f = open('App.js', 'r')
content = f.read()
f.close()

car_data = """
const CAR_DATA = {
  "Toyota": ["Camry", "Corolla", "RAV4", "Tacoma", "Tundra", "Highlander", "4Runner", "Sienna", "Prius", "Avalon", "Yaris", "Sequoia", "Land Cruiser", "Venza", "C-HR"],
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Edge", "Ranger", "Expedition", "Bronco", "Focus", "Fusion", "Taurus", "Maverick", "Transit", "EcoSport"],
  "Chevrolet": ["Silverado", "Equinox", "Malibu", "Traverse", "Colorado", "Tahoe", "Suburban", "Blazer", "Trailblazer", "Camaro", "Corvette", "Impala", "Spark", "Trax"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "Ridgeline", "HR-V", "Passport", "Fit", "Insight"],
  "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Titan", "Murano", "Maxima", "Versa", "Armada", "Kicks", "370Z", "GT-R"],
  "Dodge": ["Ram 1500", "Charger", "Challenger", "Durango", "Journey", "Grand Caravan", "Dakota"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator", "Liberty", "Patriot"],
  "GMC": ["Sierra", "Canyon", "Terrain", "Acadia", "Yukon", "Envoy", "Jimmy", "Safari"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M3", "M5", "4 Series", "2 Series"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "A-Class", "CLA", "GLA", "AMG GT"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Accent", "Veloster", "Ioniq"],
  "Kia": ["Optima", "Sorento", "Sportage", "Soul", "Forte", "Telluride", "Stinger", "Niro", "Carnival"],
  "Subaru": ["Outback", "Forester", "Crosstrek", "Impreza", "Legacy", "Ascent", "WRX", "BRZ"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "GTI", "Beetle", "Touareg"],
  "Chrysler": ["300", "Pacifica", "Town and Country", "200", "PT Cruiser"],
  "Buick": ["Enclave", "Encore", "LaCrosse", "Verano", "Envision", "Regal"],
  "Cadillac": ["Escalade", "XT5", "CTS", "ATS", "SRX", "Eldorado", "DeVille"],
  "Lexus": ["RX", "ES", "IS", "GX", "LX", "NX", "LS", "UX"],
  "Acura": ["MDX", "RDX", "TLX", "ILX", "NSX", "TSX", "TL"],
  "Infiniti": ["Q50", "Q60", "QX60", "QX80", "QX50", "G35", "G37"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5 Miata", "CX-3", "CX-30"],
  "Mitsubishi": ["Outlander", "Eclipse Cross", "Galant", "Lancer", "Montero"],
  "Pontiac": ["Grand Prix", "Grand Am", "Firebird", "Trans Am", "Bonneville", "G6"],
  "Saturn": ["Vue", "Ion", "Aura", "Sky"],
  "Oldsmobile": ["Alero", "Bravada", "Cutlass", "Intrigue", "Silhouette"],
  "Other": ["Other"]
};

const TRIMS = ["Base", "LE", "SE", "XLE", "Limited", "Sport", "LT", "LTZ", "EX", "EX-L", "Touring", "Premium", "Luxury", "ST", "GT", "SS", "RS", "SXT", "R/T", "SRT", "Platinum", "King Ranch", "Lariat", "XLT", "Other"];
"""

old = "const Stack = createStackNavigator();"
new = "const Stack = createStackNavigator();\n" + car_data

content = content.replace(old, new)

old2 = """  const years = Array.from({length: 46}, (_, i) => (2025 - i).toString());
  const [year, setYear] = useState("2025");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");"""

new2 = """  const years = Array.from({length: 46}, (_, i) => (2025 - i).toString());
  const makes = Object.keys(CAR_DATA).sort();
  const [year, setYear] = useState("2025");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");"""

content = content.replace(old2, new2)

old3 = "        year, make, model, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos,"
new3 = "        year, make, model, trim, mileage, city, zip, notes, runs, hasKeys, hasTitle, needsTow, photos,"

content = content.replace(old3, new3)

old4 = """        <TextInput style={styles.input} placeholder="Make (e.g. Toyota)" placeholderTextColor="#aaaaaa" value={make} onChangeText={setMake} />
        <TextInput style={styles.input} placeholder="Model (e.g. Camry)" placeholderTextColor="#aaaaaa" value={model} onChangeText={setModel} />"""

new4 = """        <View style={styles.pickerContainer}>
          <Picker selectedValue={make} onValueChange={(val) => { setMake(val); setModel(""); }} style={styles.picker}>
            <Picker.Item label="Select Make" value="" />
            {makes.map(m => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={model} onValueChange={(val) => setModel(val)} style={styles.picker} enabled={make !== ""}>
            <Picker.Item label={make ? "Select Model" : "Select Make First"} value="" />
            {make ? CAR_DATA[make].map(m => <Picker.Item key={m} label={m} value={m} />) : []}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={trim} onValueChange={(val) => setTrim(val)} style={styles.picker}>
            <Picker.Item label="Select Trim" value="" />
            {TRIMS.map(t => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>"""

content = content.replace(old4, new4)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')