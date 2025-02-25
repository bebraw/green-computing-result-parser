import * as _path from "jsr:@std/path";
import * as cheerio from "https://esm.sh/cheerio@1.0.0";

async function parse(path: string) {
  const tests = await readTests(path);

  console.log("parse now", JSON.stringify(tests[0], null, 2));
}

async function readTests(path: string) {
  const files = await readFiles(path);

  return Promise.all(
    files.map(async (p) => ({ path: p, rounds: await readRounds(p) }))
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
      // pages: await parsePages(p),
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

  const page = await Deno.readTextFile(_path.join(files2[0], "index.html"));
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
    powerConsumption: powerConsumption.split(" "),
    timing: {
      ttfb: timingTtfb.split(" "),
      firstPaint: firstPaintTtfb.split(" "),
    },
    googleWebVitals: {
      gwvFullyLoaded: gwvFullyLoaded.split(" "),
      ttfb: gwvTtfb.split(" "),
      fcp: gwvFcp.split(" "),
      lcp: gwvLcp.split(" "),
    },
  };
}

async function parsePages(path: string) {
  const page = await Deno.readTextFile(_path.join(path, "pages.html"));
  const $ = cheerio.load(page);

  // TODO: Parse pages.html now
  // TODO: Check table + associated values per columns and rows

  return {};
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
