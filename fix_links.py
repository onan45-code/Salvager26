import re
with open('App.js', 'rb') as f:
    content = f.read()

# Try to find any bracket-like characters before listing.id
pos = content.find(b'listing.id](http')
if pos > 0:
    # Check 10 bytes before
    before = content[pos-10:pos]
    print('10 bytes before listing.id](http:', repr(before))
    # Find the bracket
    for i in range(10, 0, -1):
        char = before[-i]
        print(f'Char at -{i}:', hex(char), chr(char) if 32 <= char < 127 else '?')
