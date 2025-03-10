import * as _path from "jsr:@std/path";
import * as cheerio from "https://esm.sh/cheerio@1.0.0";

async function parse(path: string) {
  const results = await readTests(path);

  const allRuns: Record<string, unknown>[] = [];

  results.forEach((result) => {
    result.rounds.forEach((round) => {
      round.runs.forEach((run) => {
        allRuns.push({ site: result.site, ...run });
      });
    });
  });

  const fields = [
    "path",
    "site",
    "index.country",
    "index.category",
    "index.type.caching",
    "index.type.scrolling",
    "index.type.cookies",
    "index.powerConsumption",
    "index.timing.ttfb",
    "index.timing.firstPaint",
    "index.googleWebVitals.gwvFullyLoaded",
    "index.googleWebVitals.ttfb",
    "index.googleWebVitals.fcp",
    "index.googleWebVitals.lcp",
    "pages.TotalTransferSize",
    "pages.TotalRequests",
    "pages.CPUbenchmarkscore",
    "pages.ThirdPartyRequests",
    "pages.JavaScriptTransferSize",
    "pages.CSSTransferSize",
    "pages.ImageTransferSize",
    "pages.CoachPerformanceScore",
  ];

  Deno.env.get("DEBUG") &&
    console.log(
      `Parsed ${allRuns.filter((r) => get(r, "index.country")).length} entries`
    );

  const csv =
    fields.join(",") +
    "\n" +
    allRuns
      .filter((r) => get(r, "index.country"))
      .map((r) => fields.map((f) => get(r, f)).join(",") + "\n")
      .join("");

  console.log(csv);
}

function get(o: Record<string, unknown>, k: string) {
  const parts = k.split(".");

  if (!o) {
    return;
  }

  const v = o[parts[0]];

  if (parts.length > 1) {
    return get(
      // @ts-expect-error This is fine for now
      v,
      parts.slice(1).join(".")
    );
  }

  return v;
}

async function readTests(path: string) {
  const files = await readFiles(path);
  const ret = [];

  for await (const p of files) {
    ret.push({
      site: p.split("/").at(-1),
      path: p,
      rounds: await readRounds(p),
    });
  }

  return ret;

  // Parallel version - this is heavy with many inputs!
  /*
  return Promise.all(
    files.map(async (p) => ({
      site: p.split("/").at(-1),
      path: p,
      rounds: await readRounds(p),
    }))
  );
  */
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
  let [_, suffix] = f.split("--");

  if (!suffix) {
    return;
  }

  // File format to parse: <url>--<country>-<category>-<S|n><A|r><F|c>-

  // For some names there's actually --- instead of --
  if (suffix[0] === "-") {
    suffix = suffix.slice(1);
  }

  const [country, category, meta] = suffix.split("-");

  const metaMap: Record<string, string> = {
    n: "not-scrolled",
    S: "scrolled",
    r: "cookies-rejected",
    A: "cookies-accepted",
    c: "non-cached",
    F: "cached",
  };

  try {
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
      country,
      category,
      type: {
        scrolling: metaMap[meta[0]],
        cookies: metaMap[meta[1]],
        caching: metaMap[meta[2]],
      },
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
  } catch (error: unknown) {
    if (
      error.message.startsWith("Not a directory") ||
      error.message.startsWith("No such file")
      // error instanceof Deno.errors.NotADirectory ||
      // error instanceof Deno.errors.NotFound
    ) {
      // no-op
    } else {
      throw error;
    }
  }
}

async function parsePages(path: string) {
  try {
    const page = await Deno.readTextFile(_path.join(path, "pages.html"));
    const $ = cheerio.load(page);

    const fields = [
      // "URL",
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
        field.replace(/ /g, ""),
        $(`td[data-title="${field}"]`).first().text(),
      ])
    );
  } catch (error: unknown) {
    if (
      error.message.startsWith("Not a directory") ||
      error.message.startsWith("No such file")
      // error instanceof Deno.errors.NotADirectory ||
      // error instanceof Deno.errors.NotFound
    ) {
      // no-op
    } else {
      throw error;
    }
  }
}

async function readFiles(path: string) {
  const ret = [];

  try {
    for await (const dirEntry of Deno.readDir(path)) {
      const p = _path.join(path, dirEntry.name);

      ret.push(p);
    }
  } catch (error: unknown) {
    if (
      error.message.startsWith("Not a directory") ||
      error.message.startsWith("No such file")
      // error instanceof Deno.errors.NotADirectory ||
      // error instanceof Deno.errors.NotFound
    ) {
      // no-op
    } else {
      throw error;
    }
  }

  return ret;
}

const p = Deno.args[0];

if (!p) {
  throw new Error("Missing a path to parse");
}

parse(p);
