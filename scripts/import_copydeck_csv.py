#!/usr/bin/env python3
"""Import revised copy from CSV back into a copydeck JSON.

Reads the reviewed CSV (produced by export_copydeck_csv.py), updates title/summary/why/steps
for each variant, and writes the result to a new JSON file. The original if_condition and
_placeholders metadata are preserved from the source copydeck.

Usage:
    python scripts/import_copydeck_csv.py
    python scripts/import_copydeck_csv.py --csv copydeck_review.csv --copydeck copydecks/en/copydeck.json --out copydecks/en/copydeck_revised.json
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def import_csv(csv_path: Path, copydeck_path: Path, out_path: Path) -> None:
    with open(copydeck_path) as f:
        data = json.load(f)

    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    updated = 0
    for row in rows:
        error_type = row["error_type"]
        variant_index = int(row["variant_index"])

        if error_type not in data["errors"]:
            print(f"Warning: error type '{error_type}' not found in copydeck, skipping", file=sys.stderr)
            continue

        variants = data["errors"][error_type]["variants"]
        if variant_index >= len(variants):
            print(f"Warning: variant index {variant_index} out of range for {error_type}, skipping", file=sys.stderr)
            continue

        variant = variants[variant_index]
        variant["title"] = row["title"]
        variant["summary"] = row["summary"]
        variant["why"] = row["why"]

        steps = [row[f"step_{j}"] for j in range(1, 6) if row.get(f"step_{j}", "").strip()]
        if steps:
            variant["steps"] = steps
        elif "steps" in variant:
            del variant["steps"]

        updated += 1

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated {updated} variants → {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Import reviewed CSV back into copydeck JSON")
    parser.add_argument("--csv", default="copydeck_review.csv",
                        help="Input CSV path (default: copydeck_review.csv)")
    parser.add_argument("--copydeck", default="copydecks/en/copydeck.json",
                        help="Source copydeck JSON to update (default: copydecks/en/copydeck.json)")
    parser.add_argument("--out", default="copydecks/en/copydeck.json",
                        help="Output JSON path (default: overwrites source copydeck)")
    args = parser.parse_args()

    for p in [Path(args.csv), Path(args.copydeck)]:
        if not p.exists():
            print(f"Error: {p} not found", file=sys.stderr)
            sys.exit(1)

    import_csv(Path(args.csv), Path(args.copydeck), Path(args.out))


if __name__ == "__main__":
    main()
