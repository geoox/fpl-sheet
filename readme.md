# How to use:
1. Clone repo
2. Install dependencies:
`npm i`
3. Run the script, it takes as argument the gameweek:
`node index.js 1` for gameweek 1

An xlsx file will get created with the following rules:
- First column contains player names
- First row contains fixtures based on specified gameweek
- Each player pick will get assigned to the correct player & fixture
- Cells colors are decided based on how differential the picks are (diff 1 = the pick was chosen by only 1 manager)

# Improvements:
- ~Remove empty columns in player picks - where the max amount of players > max possible players per fixture~ ☑️
- ~Compute & color differentials~ ☑️
- ~Create gameweek argument for the script~ ☑️
- ~Improve code performance :D~ ☑️
- Logic for aligning picks in gameweeks based on frequency

# Preview:
<img width="1159" alt="image" src="https://github.com/geoox/fpl-sheet/assets/24357659/a2698676-4329-4ba9-b428-110206979d78">

