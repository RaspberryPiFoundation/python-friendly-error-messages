#!/usr/bin/env python3
"""Export copydeck error messages to CSV for Google Sheets review.

Produces the column layout the learning team works with, so the export can seed
(or refresh) their review sheet directly:

    ID, Error_type, Link to demo / code, Has been reviewed by learning team?,
    variant_index, if_condition, Title, Summary, Why, Step_1 .. Step_5

  * ID                              - stable 1-based row number
  * Link to demo / code            - deep link to the matching demo example,
                                      built from docs/demo-examples.js
  * Has been reviewed ...          - defaults to FALSE (reviewers flip to TRUE)

The reviewed CSV is fed back in via import_copydeck_csv.py, which only applies
rows marked TRUE by default.

Usage:
    python scripts/export_copydeck_csv.py
    python scripts/export_copydeck_csv.py --copydeck copydecks/fr/copydeck.json --out review_fr.csv
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

COLUMNS = ["ID", "Error_type", "Link to demo / code", "Has been reviewed by learning team?",
           "variant_index", "if_condition", "Title", "Summary", "Why",
           "Step_1", "Step_2", "Step_3", "Step_4", "Step_5"]

DEFAULT_DEMO_BASE_URL = "https://raspberrypifoundation.github.io/python-friendly-error-messages"


def slugify(title: str) -> str:
    """Match docs/index.html getRowId(): lowercase, non-alphanumeric runs -> '-', trim '-'."""
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def load_demo_index(demo_path: Path) -> dict:
    """Map expectedVariantId -> (example_number, demo_title) by reading demo-examples.js in order.

    The demo page anchors each example as `example-{position}-{slug(demo_title)}`, so we need the
    example's display position and its (demo-specific) title, keyed by the variant it demonstrates.
    """
    text = demo_path.read_text(encoding="utf-8")
    pairs = re.findall(
        r'title:\s*"((?:[^"\\]|\\.)*)".*?expectedVariantId:\s*"([^"]+)"',
        text,
        re.S,
    )
    index = {}
    for position, (raw_title, variant_id) in enumerate(pairs, start=1):
        title = json.loads(f'"{raw_title}"')  # decode any JSON string escapes
        index[variant_id] = (position, title)
    return index


def export(copydeck_path: Path, out_path: Path, demo_path: Path, demo_base_url: str) -> None:
    with open(copydeck_path) as f:
        data = json.load(f)

    demo_index = load_demo_index(demo_path) if demo_path and demo_path.exists() else {}
    if not demo_index:
        print(f"Note: no demo examples found at {demo_path}; 'Link to demo / code' will be blank.",
              file=sys.stderr)

    rows = []
    row_id = 0
    missing_links = 0
    for error_type, error_def in data["errors"].items():
        for i, variant in enumerate(error_def["variants"]):
            row_id += 1
            variant_id = f"{error_type}/variants/{i}"

            link = ""
            if variant_id in demo_index:
                position, demo_title = demo_index[variant_id]
                link = f"{demo_base_url}/#example-{position}-{slugify(demo_title)}"
            elif demo_index:
                missing_links += 1

            steps = variant.get("steps", [])
            if_condition = variant.get("if")
            row = {
                "ID": row_id,
                "Error_type": error_type,
                "Link to demo / code": link,
                "Has been reviewed by learning team?": "FALSE",
                "variant_index": i,
                "if_condition": json.dumps(if_condition) if if_condition else "",
                "Title": variant.get("title", ""),
                "Summary": variant.get("summary", ""),
                "Why": variant.get("why", ""),
            }
            for j in range(1, 6):
                row[f"Step_{j}"] = steps[j - 1] if j - 1 < len(steps) else ""
            rows.append(row)

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported {len(rows)} variants to {out_path}")
    if missing_links:
        print(f"Warning: {missing_links} variant(s) had no matching demo example; their link is blank.",
              file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Export copydeck to CSV for review")
    parser.add_argument("--copydeck", default="copydecks/en/copydeck.json",
                        help="Path to source copydeck JSON (default: copydecks/en/copydeck.json)")
    parser.add_argument("--out", default="copydeck_review.csv",
                        help="Output CSV path (default: copydeck_review.csv)")
    parser.add_argument("--demo", default="docs/demo-examples.js",
                        help="Path to demo-examples.js used to build demo links (default: docs/demo-examples.js)")
    parser.add_argument("--demo-base-url", default=DEFAULT_DEMO_BASE_URL,
                        help="Base URL of the published demo (default: the project's GitHub Pages site)")
    args = parser.parse_args()

    copydeck_path = Path(args.copydeck)
    if not copydeck_path.exists():
        print(f"Error: {copydeck_path} not found", file=sys.stderr)
        sys.exit(1)

    export(copydeck_path, Path(args.out), Path(args.demo), args.demo_base_url.rstrip("/"))


if __name__ == "__main__":
    main()
