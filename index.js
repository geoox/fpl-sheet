const ExcelJS = require('exceljs');
const axios = require('axios');

const LEAGUE_INFO_URL = 'https://fantasy.premierleague.com/api/leagues-classic/4276/standings'
const GAMEWEEK = 15
const FIXTURES_URL = `https://fantasy.premierleague.com/api/fixtures?event=${GAMEWEEK}`
const BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/'

const workbook = new ExcelJS.Workbook();
const STATIC_BOOTSTRAP =

    getBoostrap = async () => {
        try {
            const response = await axios.get(BOOTSTRAP_URL);
            return new Promise((res, rej) => res(response.data));
        } catch (error) {
            console.log(error);
            return new Promise((res, rej) => rej(error));
        }
    }

updateLeagueInfo = async (ws) => {
    try {
        const response = await axios.get(LEAGUE_INFO_URL);
        // console.log('response', response);

        const standingsArr = response.data.standings.results;
        standingsArr.forEach(item => {
            ws.addRow([item.player_name, item.total, 0, 11]);
        });
        return new Promise((res, rej) => res());
    } catch (error) {
        console.error(error);
    }
}

updateFixtures = async (ws, bootstrap_obj) => {
    try {
        const response = await axios.get(FIXTURES_URL);
        const fixtures = response.data;

        for await (var [i, fixture] of fixtures.entries()) {
            var team_h = getTeamName(bootstrap_obj, fixture.team_h);
            var team_a = getTeamName(bootstrap_obj, fixture.team_a);
            ws.spliceColumns(i+5, 1, [
                `${team_h} - ${team_a}`
            ]);
        };

        return new Promise((res, rej) => res(fixtures));

    } catch (error) {
        console.error(error);
    }
}

getTeamName = (bootstrap_obj, team_id) => {
    const team = bootstrap_obj.teams.filter(team_obj => team_obj.id === team_id)
    return team[0].short_name;
}

function initWs() {
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

main = async () => {

    var { workbook, ws } = initWs();
    var bootstrap_obj = await getBoostrap();
    await updateLeagueInfo(ws);
    const fixtures = await updateFixtures(ws, bootstrap_obj);


    await workbook.xlsx.writeFile('test.xlsx');

};

main();