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
      pages: await parsePages(p),
    }))
  );
}

async function parseIndex(path: string) {
  const page = await Deno.readTextFile(_path.join(path, "index.html"));
  const $ = cheerio.load(page);

  const powerConsumption = $('td:contains("Firefox CPU Power Consumption")')
    // .next()
    .text();

  // console.log({ powerConsumption });

  // TODO: Find index.html - /pages/<>--<>/index.html
  // TODO: Parse index.html now - Page Metrics - "Firefox CPU Power Consumption"
  // TODO: Parse index.html now - Timing Metrics - ("TTFB [median]", "First Paint [median]")
  // TODO: Parse index.html now - Google Web Vitals - ("Fully Loaded [median]", "TTFB [median]", "First Contentful Paint [median]", "Largest Contentful Paint [median]")

  return { powerConsumption };
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
