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
- Players with green background are captains
- Players with red background are on the bench


# Improvements:
- ~Remove empty columns in player picks - where the max amount of players > max possible players per fixture~ ☑️
- ~Compute & color differentials~ ☑️
- ~Create gameweek argument for the script~ ☑️
- ~Improve code performance :D~ ☑️
- Logic for aligning picks in gameweeks based on frequency

### Old:
<img width="1036" alt="image" src="https://user-images.githubusercontent.com/24357659/209521843-b2434a49-160d-4901-a7b9-e655fd520048.png">

### Updated:
<img width="885" alt="image" src="https://user-images.githubusercontent.com/24357659/210437286-47b1c3fa-097f-4be8-a3e6-e399291b342e.png">
