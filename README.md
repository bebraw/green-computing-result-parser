# Measurement scripts builder

To run, use

```bash
php build-scripts.php
```

The scripts will be created in scripts folder using the sites in sitelist.csv file.

The measurement scripts use measure.sh shell script that uses config.json configuration file and measure.mjs sitespeed.io script.

# Clean results

To run, use

```bash
./remove.sh
```

This script removes the big extra files from the results directory.

# Green computing result parser

To run, use

```bash
deno run --allow-env --allow-read ./mod.ts ../results > results.csv
```

and then give it rights as the script asks for them. The assumption is that the results to parse exist in a sibling directory.
