f = open('App.js', 'r')
content = f.read()
f.close()

old = 'const TRIMS = ["Base", "LE", "SE", "XLE", "Limited", "Sport", "LT", "LTZ", "EX", "EX-L", "Touring", "Premium", "Luxury", "ST", "GT", "SS", "RS", "SXT", "R/T", "SRT", "Platinum", "King Ranch", "Lariat", "XLT", "Other"];'

new = '''const TRIM_DATA = {
  "Toyota": ["L", "LE", "XLE", "XSE", "SE", "TRD Off-Road", "TRD Sport", "TRD Pro", "Limited", "Platinum", "1794 Edition", "SR", "SR5", "Adventure", "Nightshade", "Other"],
  "Ford": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor", "S", "SE", "SEL", "Titanium", "ST", "ST-Line", "Tremor", "Other"],
  "Chevrolet": ["LS", "LT", "LTZ", "Z71", "Trail Boss", "High Country", "SS", "ZL1", "RST", "Premier", "Activ", "Sport", "Custom", "Other"],
  "Honda": ["LX", "Sport", "EX", "EX-L", "Touring", "Sport Touring", "Type R", "Si", "Other"],
  "Nissan": ["S", "SV", "SL", "SR", "Platinum", "Pro-4X", "Midnight Edition", "NISMO", "Other"],
  "Dodge": ["SXT", "GT", "R/T", "Scat Pack", "SRT 392", "SRT Hellcat", "Redeye", "SE", "Other"],
  "Jeep": ["Sport", "Sport S", "Sahara", "Rubicon", "Willys", "High Altitude", "Overland", "Summit", "Trailhawk", "Other"],
  "GMC": ["Base", "SLE", "SLT", "Denali", "AT4", "Pro", "Elevation", "Other"],
  "BMW": ["Base", "xDrive", "sDrive", "M Sport", "M", "M Competition", "Other"],
  "Mercedes-Benz": ["Base", "4MATIC", "AMG", "AMG Line", "Maybach", "Other"],
  "Hyundai": ["SE", "SEL", "N Line", "Limited", "Ultimate", "Blue", "Sport", "Other"],
  "Kia": ["LX", "S", "EX", "GT-Line", "SX", "SX Prestige", "GT", "X-Line", "Other"],
  "Subaru": ["Base", "Premium", "Sport", "Limited", "Touring", "Onyx Edition", "Wilderness", "Other"],
  "Volkswagen": ["S", "SE", "SEL", "R-Line", "GTI", "GLI", "R", "Other"],
  "Chrysler": ["Touring", "Touring-L", "Limited", "Pinnacle", "300S", "300C", "Other"],
  "Buick": ["Preferred", "Essence", "Sport Touring", "Avenir", "Other"],
  "Cadillac": ["Luxury", "Premium Luxury", "Sport", "Platinum", "V-Series", "Other"],
  "Lexus": ["Base", "L", "F Sport", "Ultra Luxury", "Other"],
  "Acura": ["Base", "A-Spec", "Technology", "Advance", "Type S", "Other"],
  "Infiniti": ["Pure", "Luxe", "Sensory", "Autograph", "Sport", "Other"],
  "Mazda": ["Sport", "Select", "Preferred", "Premium", "Carbon Edition", "Other"],
  "Mitsubishi": ["ES", "LE", "SE", "SEL", "GT", "Other"],
  "Pontiac": ["Base", "GT", "GTP", "GXP", "Other"],
  "Saturn": ["Base", "XE", "XR", "Other"],
  "Oldsmobile": ["Base", "GL", "GLS", "GX", "Other"],
  "Other": ["Base", "Standard", "Sport", "Premium", "Limited", "Other"]
};'''

content = content.replace(old, new)

content = content.replace(
    '  const makes = Object.keys(CAR_DATA).sort();',
    '  const makes = Object.keys(CAR_DATA).sort();\n  const trims = make && TRIM_DATA[make] ? TRIM_DATA[make] : ["Base", "Sport", "Limited", "Premium", "Other"];'
)

content = content.replace(
    '            {TRIMS.map(t => <Picker.Item key={t} label={t} value={t} />)}',
    '            {trims.map(t => <Picker.Item key={t} label={t} value={t} />)}'
)

f = open('App.js', 'w')
f.write(content)
f.close()
print('Done!')