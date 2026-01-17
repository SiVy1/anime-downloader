import axios from "axios";

async function testTosho() {
  const malId = 59846;
  const ep = "2";
  const group = "SubsPlease";

  // 1. Resolve AID (Simplified)
  const title = "Saigo ni Hitotsu dake Onegai Shitemo Yoroshii Deshou ka";
  const searchUrl = `https://feed.animetosho.org/json?t=search&q=${encodeURIComponent(title)}`;
  console.log("Searching for AID:", searchUrl);
  const res1 = await axios.get(searchUrl);
  const aid = res1.data[0]?.anidb_aid;
  console.log("Resolved AID:", aid);

  if (!aid) return;

  // 2. Search with AID + EP
  const epQuery = `aid:${aid}+ep:${ep}`;
  const epUrl = `https://feed.animetosho.org/json?t=search&q=${encodeURIComponent(epQuery)}`;
  console.log("Searching for Episode:", epUrl);
  const res2 = await axios.get(epUrl);

  console.log(`Found ${res2.data.length} results.`);

  res2.data.forEach((entry: any, i: number) => {
    console.log(
      `${i}: ${entry.title} (Attachments: ${entry.attachments?.length || 0})`,
    );
    if (entry.attachments) {
      entry.attachments
        .slice(0, 3)
        .forEach((a: any) => console.log(`   - ${a.url}`));
    }
  });
}

testTosho();
