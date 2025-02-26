import * as _path from "jsr:@std/path";
import * as cheerio from "https://esm.sh/cheerio@1.0.0";

async function parse(path: string) {
  const results = await readTests(path);

  const allRuns: unknown[] = [];

  results.forEach((result) => {
    result.rounds.forEach((round) => {
      round.runs.forEach((run) => {
        allRuns.push({ site: result.site, ...run });
      });
    });
  });

  console.log(allRuns);
}

async function readTests(path: string) {
  const files = await readFiles(path);

  return Promise.all(
    files.map(async (p) => ({
      site: p.split("/").at(-1),
      path: p,
      rounds: await readRounds(p),
    }))
  );
}

async function readRounds(path: string) {
  const files = await readFiles(path);

  return Promise.all(
    files.map(async (p) => ({ path: p, runs: await readRuns(p) }))
  );
}

async function readRuns(path: string) {
  const files = await readFiles(path);

  return Promise.all(
    files.map(async (p) => ({
      path: p,
      index: await parseIndex(p),
      pages: await parsePages(p),
    }))
  );
}

async function parseIndex(path: string) {
  const files1 = await readFiles(_path.join(path, "pages"));

  if (!files1.length) {
    return;
  }

  const files2 = await readFiles(files1[0]);

  if (!files2.length) {
    return;
  }

  const f = files2[0];
  const [_, suffix] = f.split("--");
  const type = [
    suffix[0] === "c" ? "non-cached" : suffix[0] === "C" ? "cached" : "",
    suffix[1] === "s" ? "not-scrolled" : suffix[1] === "S" ? "scrolled" : "",
    suffix[2] === "r"
      ? "cookies-rejected"
      : suffix[2] === "A"
      ? "cookies-accepted"
      : "",
  ];

  const page = await Deno.readTextFile(_path.join(f, "index.html"));
  const $ = cheerio.load(page);

  // const pageMetrics = $('th:contains("Page metrics")');
  const powerConsumption = $('td:contains("Firefox CPU Power Consumption")')
    .next()
    .text();

  // const timingMetrics = $('th:contains("Timing metrics")');
  const timingTtfb = $('td:contains("TTFB [median]")').first().next().text();
  const firstPaintTtfb = $('td:contains("First Paint [median]")')
    .first()
    .next()
    .text()
    .trim();

  // const googleWebVitals = $('th:contains("Google Web Vitals")');
  const gwvFullyLoaded = $('td:contains("Fully Loaded [median]")')
    .next()
    .text();
  // Isn't this the same as "Timing metrics" TTFB?
  const gwvTtfb = $('td:contains("TTFB [median]")').last().next().text();
  const gwvFcp = $('td:contains("First Contentful Paint (FCP) [median]")')
    .next()
    .text()
    .trim();
  const gwvLcp = $('td:contains("Largest Contentful Paint (LCP) [median]")')
    .next()
    .text();

  return {
    type,
    powerConsumption: powerConsumption.split(" ")[0],
    timing: {
      ttfb: timingTtfb.split(" ")[0],
      firstPaint: firstPaintTtfb.split(" ")[0],
    },
    googleWebVitals: {
      gwvFullyLoaded: gwvFullyLoaded.split(" ")[0],
      ttfb: gwvTtfb.split(" ")[0],
      fcp: gwvFcp.split(" ")[0],
      lcp: gwvLcp.split(" ")[0],
    },
  };
}

async function parsePages(path: string) {
  const page = await Deno.readTextFile(_path.join(path, "pages.html"));
  const $ = cheerio.load(page);

  const fields = [
    "URL",
    "Total Transfer Size",
    "Total Requests",
    "CPU benchmark score",
    "Third Party Requests",
    "JavaScript Transfer Size",
    "CSS Transfer Size",
    "Image Transfer Size",
    "Coach Performance Score",
  ];

  return Object.fromEntries(
    fields.map((field) => [
      field,
      $(`td[data-title="${field}"]`).first().text(),
    ])
  );
}

async function readFiles(path: string) {
  const ret = [];

  try {
    for await (const dirEntry of Deno.readDir(path)) {
      const p = _path.join(path, dirEntry.name);

      ret.push(p);
    }
  } catch (_error) {
    // TODO: Catch only cases where path is not a directory!
    // Nothing to do
    console.error(_error);
  }

  return ret;
}

const p = Deno.args[0];

if (!p) {
  throw new Error("Missing a path to parse");
}

parse(p);
