const ExcelJS = require('exceljs');
const axios = require('axios');

const LEAGUE_INFO_URL = 'https://fantasy.premierleague.com/api/leagues-classic/4276/standings'
const GAMEWEEK = 15
const FIXTURES_URL = `https://fantasy.premierleague.com/api/fixtures?event=${GAMEWEEK}`
const BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/'
const PICKS_URL = `https://fantasy.premierleague.com/api/entry/PLAYER_ID/event/${GAMEWEEK}/picks/`


initWs = () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(`GW${GAMEWEEK}`);

    ws.columns = [
        { header: 'Fraier', key: 'fraier' },
        { header: 'OVR', key: 'ovr' },
        { header: 'GW', key: 'gw' },
        { header: 'To play', key: 'toPlay' }
    ];

    return { workbook, ws };
}

getBoostrap = async () => {
    try {
        const response = await axios.get(BOOTSTRAP_URL);
        return new Promise((res, rej) => res(response.data));
    } catch (error) {
        console.log(error);
        return new Promise((res, rej) => rej(error));
    }
}

getTeamName = (bootstrap_obj, team_id) => {
    const team = bootstrap_obj.teams.filter(team_obj => team_obj.id === team_id)
    return team[0].short_name;
}

getPlayerName = (bootstrap_obj, player_id) => {
    const player = bootstrap_obj.elements.filter(player_obj => player_obj.id === player_id)
    return player[0].second_name;
}

getPlayerTeam = (bootstrap_obj, player_id) => {
    const player = bootstrap_obj.elements.filter(player_obj => player_obj.id === player_id)
    return player[0].team;
}

getPick = async (player_id) => {
    try {
        const response = await axios.get(PICKS_URL.replace('PLAYER_ID', player_id));

        return response.data.picks;
    } catch (error) {
        console.log(error);
    }
}


updateLeagueInfo = async (ws) => {
    try {
        const response = await axios.get(LEAGUE_INFO_URL);

        const standingsArr = response.data.standings.results;
        var playersIdArr = []
        standingsArr.forEach(item => {
            ws.addRow([item.player_name, item.total, 0, 11]);
            playersIdArr.push(item.entry)
        });
        return new Promise((res, rej) => res(playersIdArr));
    } catch (error) {
        console.error(error);
    }
}

updateFixtures = async (ws, bootstrap_obj) => {
    try {
        const response = await axios.get(FIXTURES_URL);
        const fixtures = response.data;

        var startC = 5;
        for (let index = 1; index <= 10; index++) {
            ws.mergeCells(1, startC, 1, startC + 2);
            startC = startC + 3;
        }
        startC = 5;
        for await (var [i, fixture] of fixtures.entries()) {
            var team_h = getTeamName(bootstrap_obj, fixture.team_h);
            var team_a = getTeamName(bootstrap_obj, fixture.team_a);

            ws.spliceColumns(startC, 1, [
                `${team_h} - ${team_a}`
            ]);

            startC+=3;
        };

        return new Promise((res, rej) => res(fixtures));

    } catch (error) {
        console.error(error);
    }
}

mapPlayers = async (fixtures, playersIdArr, bootstrap_obj) => {
    for await (var [i, fixture] of fixtures.entries()) {
        for await (var player_id of playersIdArr) {
            const picks = await getPick(player_id);
            console.log(`picks for -${player_id}: - for fixture ${getTeamName(bootstrap_obj, fixture.team_h)} - ${getTeamName(bootstrap_obj, fixture.team_a)}`);
            for await (var pick of picks) {
                if (getPlayerTeam(bootstrap_obj, pick.element) === fixture.team_h || getPlayerTeam(bootstrap_obj, pick.element) === fixture.team_a) {
                    console.log(getPlayerName(bootstrap_obj, pick.element));
                    ws.spliceRows(i + 5, 1, [
                        getPlayerName(bootstrap_obj, pick.element)
                    ]);
                }
            }
        }
    }
}


main = async () => {

    var { workbook, ws } = initWs();
    var bootstrap_obj = await getBoostrap();

    const playersIdArr = await updateLeagueInfo(ws);
    const fixtures = await updateFixtures(ws, bootstrap_obj);

    mapPlayers(fixtures, playersIdArr, bootstrap_obj);
    await workbook.xlsx.writeFile('test.xlsx');

};

main();