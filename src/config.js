// config.js

const FIXTURE_ROWS = [
  { date: '2026-04-30', teamA: 'GT', teamB: 'RCB' },
  { date: '2026-05-01', teamA: 'RR', teamB: 'DC' },
  { date: '2026-05-02', teamA: 'CSK', teamB: 'MI' },
  { date: '2026-05-03', teamA: 'SRH', teamB: 'KKR' },
  { date: '2026-05-03', teamA: 'GT', teamB: 'PBKS' },
  { date: '2026-05-04', teamA: 'MI', teamB: 'LSG' },
  { date: '2026-05-05', teamA: 'DC', teamB: 'CSK' },
  { date: '2026-05-06', teamA: 'SRH', teamB: 'PBKS' },
  { date: '2026-05-07', teamA: 'LSG', teamB: 'RCB' },
  { date: '2026-05-08', teamA: 'DC', teamB: 'KKR' },
  { date: '2026-05-09', teamA: 'RR', teamB: 'GT' },
  { date: '2026-05-10', teamA: 'CSK', teamB: 'LSG' },
  { date: '2026-05-10', teamA: 'RCB', teamB: 'MI' },
  { date: '2026-05-11', teamA: 'PBKS', teamB: 'DC' },
  { date: '2026-05-12', teamA: 'GT', teamB: 'SRH' },
  { date: '2026-05-13', teamA: 'RCB', teamB: 'KKR' },
  { date: '2026-05-14', teamA: 'PBKS', teamB: 'MI' },
  { date: '2026-05-15', teamA: 'LSG', teamB: 'CSK' },
  { date: '2026-05-16', teamA: 'KKR', teamB: 'GT' },
  { date: '2026-05-17', teamA: 'PBKS', teamB: 'RCB' },
  { date: '2026-05-17', teamA: 'DC', teamB: 'RR' },
  { date: '2026-05-18', teamA: 'CSK', teamB: 'SRH' },
  { date: '2026-05-19', teamA: 'RR', teamB: 'LSG' },
  { date: '2026-05-20', teamA: 'KKR', teamB: 'MI' },
  { date: '2026-05-21', teamA: 'CSK', teamB: 'GT' },
  { date: '2026-05-22', teamA: 'SRH', teamB: 'RCB' },
  { date: '2026-05-23', teamA: 'LSG', teamB: 'PBKS' },
  { date: '2026-05-24', teamA: 'MI', teamB: 'RR' },
  { date: '2026-05-24', teamA: 'KKR', teamB: 'DC' }
];

function buildFixtures() {
  const grouped = FIXTURE_ROWS.reduce((acc, fixture) => {
    acc[fixture.date] = acc[fixture.date] || [];
    acc[fixture.date].push(fixture);
    return acc;
  }, {});

  const fixtures = [];

  Object.keys(grouped).forEach((date) => {
    const dayFixtures = grouped[date];
    if (dayFixtures.length === 1) {
      fixtures.push({
        ...dayFixtures[0],
        freezeTime: '19:00',
        id: `${dayFixtures[0].teamA}_vs_${dayFixtures[0].teamB}_${date}`
      });
      return;
    }

    dayFixtures.forEach((fixture, index) => {
      fixtures.push({
        ...fixture,
        freezeTime: index === 0 ? '15:00' : '19:00',
        id: `${fixture.teamA}_vs_${fixture.teamB}_${date}`
      });
    });
  });

  return fixtures;
}

const FIXTURES = buildFixtures();

function getTodayFixtures() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;
  return FIXTURES.filter((fixture) => fixture.date === todayKey);
}

module.exports = { FIXTURES, getTodayFixtures };