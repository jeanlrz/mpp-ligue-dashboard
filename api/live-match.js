// Serverless function (Vercel) - cache la clé API-Football côté serveur.
// Usage: /api/live-match?home=France&away=Senegal&date=2026-06-16

const FR_TO_EN = {
  "senegal": "senegal", "sénégal": "senegal",
  "irak": "iraq",
  "norvege": "norway", "norvège": "norway",
  "argentine": "argentina",
  "algerie": "algeria", "algérie": "algeria",
  "autriche": "austria",
  "jordanie": "jordan",
  "congo": "congo dr",
  "angleterre": "england",
  "croatie": "croatia",
  "ouzbekistan": "uzbekistan", "ouzbékistan": "uzbekistan",
  "colombie": "colombia",
  "mexique": "mexico",
  "afrique du sud": "south africa",
  "coree du sud": "south korea", "corée du sud": "south korea",
  "tchequie": "czech republic", "tchéquie": "czech republic",
  "bosnie": "bosnia",
  "etats-unis": "usa", "usa": "usa",
  "paraguay": "paraguay",
  "suisse": "switzerland",
  "bresil": "brazil", "brésil": "brazil",
  "maroc": "morocco",
  "haiti": "haiti", "haïti": "haiti",
  "ecosse": "scotland", "écosse": "scotland",
  "australie": "australia",
  "turquie": "turkey",
  "allemagne": "germany",
  "curacao": "curacao", "curaçao": "curacao",
  "pays-bas": "netherlands",
  "japon": "japan",
  "cote d'ivoire": "ivory coast", "côte d'ivoire": "ivory coast",
  "equateur": "ecuador", "équateur": "ecuador",
  "suede": "sweden", "suède": "sweden",
  "tunisie": "tunisia",
  "espagne": "spain",
  "cap-vert": "cape verde",
  "belgique": "belgium",
  "egypte": "egypt", "égypte": "egypt",
  "arabie saoudite": "saudi arabia",
  "uruguay": "uruguay",
  "iran": "iran",
  "nouvelle-zelande": "new zealand", "nouvelle-zélande": "new zealand"
};

function normalize(name) {
  const stripped = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  return FR_TO_EN[name.toLowerCase().trim()] || FR_TO_EN[stripped] || stripped;
}

module.exports = async (req, res) => {
  const { home, away, date } = req.query;
  if (!home || !away || !date) {
    res.status(400).json({ found: false, error: "missing home/away/date" });
    return;
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    res.status(500).json({ found: false, error: "API key not configured" });
    return;
  }

  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();

    const wantHome = normalize(home);
    const wantAway = normalize(away);

    const fixture = (data.response || []).find(f => {
      const h = normalize(f.teams.home.name);
      const a = normalize(f.teams.away.name);
      return (h.includes(wantHome) || wantHome.includes(h)) &&
             (a.includes(wantAway) || wantAway.includes(a));
    });

    if (!fixture) {
      res.status(200).json({ found: false });
      return;
    }

    res.status(200).json({
      found: true,
      status: fixture.fixture.status.short, // NS, 1H, HT, 2H, FT, ...
      elapsed: fixture.fixture.status.elapsed,
      goalsHome: fixture.goals.home,
      goalsAway: fixture.goals.away,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name
    });
  } catch (err) {
    res.status(500).json({ found: false, error: "fetch failed" });
  }
};
