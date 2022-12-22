# How to use:
1. Open index.js, line 4, edit GAMEWEEK global variable.
e.g. const GAMEWEEK = 16
2. Run the script.
- `node index.js`

An xlsx file will get created with the following rules:
- First column contains player names
- First row contains fixtures based on specified gameweek
- Each player pick will get assigned to the correct player & fixture
- Players with green background are captains
- Players with red background are on the bench