const ExcelJS = require('exceljs');
const axios = require('axios');

const GAMEWEEK = 19
const LEAGUE_INFO_URL = 'https://fantasy.premierleague.com/api/leagues-classic/4276/standings'
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
    // bootstrap = static data with several details about teams/players
    try {
        const response = await axios.get(BOOTSTRAP_URL);
        return new Promise((res, rej) => res(response.data));
    } catch (error) {
        console.log(error);
        return new Promise((res, rej) => rej(error));
    }
}

getTeamName = (bootstrap_obj, team_id) => {
    // get pl team name by team_id
    const team = bootstrap_obj.teams.filter(team_obj => team_obj.id === team_id)
    return team[0].short_name;
}

getPlayerName = (bootstrap_obj, player_id) => {
    // get pl player name by player_id
    const player = bootstrap_obj.elements.filter(player_obj => player_obj.id === player_id)
    return player[0].second_name;
}

getPlayerTeam = (bootstrap_obj, player_id) => {
    // get pl player team by player_id
    const player = bootstrap_obj.elements.filter(player_obj => player_obj.id === player_id)
    return player[0].team;
}

getPick = async (player_id) => {
    // get picks (15 players) for each player
    try {
        const response = await axios.get(PICKS_URL.replace('PLAYER_ID', player_id));
        return response.data.picks;
    } catch (error) {
        console.log(error);
    }
}

updateLeagueInfo = async (ws) => {
    // fill in players
    try {
        const response = await axios.get(LEAGUE_INFO_URL);

        const standingsArr = response.data.standings.results;
        var playersIdArr = []
        standingsArr.forEach(item => {
            ws.addRow([item.player_name, item.total, 0, 11]);
            playersIdArr.push({
                'id': item.entry,
                'name': item.player_name,
                'team': item.entry_name
            })
        });
        return new Promise((res, rej) => res(playersIdArr));
    } catch (error) {
        console.error(error);
    }
}

updateFixtures = async (ws, bootstrap_obj) => {
    // fill in fixtures
    try {
        const response = await axios.get(FIXTURES_URL);
        const fixtures = response.data;

        var startC = 5;
        for (let index = 1; index <= 10; index++) {
            ws.mergeCells(1, startC, 1, startC + 5);
            startC = startC + 6;
        }
        startC = 5;
        for await (var [i, fixture] of fixtures.entries()) {
            var team_h = getTeamName(bootstrap_obj, fixture.team_h);
            var team_a = getTeamName(bootstrap_obj, fixture.team_a);

            ws.spliceColumns(startC, 1, [
                `${team_h} - ${team_a}`
            ]);

            startC += 6;
        };

        return new Promise((res, rej) => res(fixtures));

    } catch (error) {
        console.error(error);
    }
}

mapPlayers = async (fixtures, playersIdArr, bootstrap_obj, ws) => {
    // maps player picks to correct player & fixture
    for await (var [fixture_i, fixture] of fixtures.entries()) {
        for await (var [fraier_i, player] of playersIdArr.entries()) {
            const picks = await getPick(player.id);
            console.log(`picks for -${player.name}: - for fixture ${getTeamName(bootstrap_obj, fixture.team_h)} - ${getTeamName(bootstrap_obj, fixture.team_a)}`);
            for await (var pick of picks) {
                const team = getPlayerTeam(bootstrap_obj, pick.element);
                const player = getPlayerName(bootstrap_obj, pick.element)
                if (team === fixture.team_h || team === fixture.team_a) {
                    console.log(player);
                    var row = fraier_i + 2;
                    var column = 4 + 6 * (fixture_i) + 1;
                    var cell = ws.getCell(row, column);
                    while (cell.value !== null) {
                        // there is a player from the same team, move to next cell
                        column++;
                        cell = ws.getCell(row, column);
                    }
                    ws.getCell(row, column).value = player;
                    if (pick.is_captain) {
                        ws.getCell(row, column).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'D0F0C0' },
                        };
                    }
                    if (pick.position >= 12) {
                        ws.getCell(row, column).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'F08080' },
                        };
                    }
                    column++;
                }
            }
        }
    }
    return new Promise((res, rej) => res(ws));
}

removeBlankColumns = async (ws) => {
    // beautify the excel
    var columnC = ws.columnCount;
    var rowC = ws.rowCount;
    for (var col = 5; col <= columnC; col++) {
        var isColEmpty = true;
        for (var row = 2; row <= rowC; row++) {
            var cell = ws.getCell(row, col);
            if (cell.value !== null) {
                isColEmpty = false;
            }
        }
        if (isColEmpty) {
            // hide blank column
            var column = ws.getColumn(col);
            column.hidden = true;
        }
    }

    // center contents of first row
    for (var i = 5; i < ws.columnCount; i++) {
        ws.getCell(1, i).alignment = { vertical: 'middle', horizontal: 'center' };
    }

    return new Promise((res, rej) => res(ws));
}

main = async () => {

    var { workbook, ws } = initWs();
    var bootstrap_obj = await getBoostrap();

    const playersIdArr = await updateLeagueInfo(ws);
    const fixtures = await updateFixtures(ws, bootstrap_obj);

    await mapPlayers(fixtures, playersIdArr, bootstrap_obj, ws);
    await removeBlankColumns(ws);

    await workbook.xlsx.writeFile(`gw_${GAMEWEEK}.xlsx`);

};

main();