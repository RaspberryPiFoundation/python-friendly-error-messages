#!/usr/bin/env python3
"""Export copydeck error messages to CSV for Google Sheets review.

Usage:
    python scripts/export_copydeck_csv.py
    python scripts/export_copydeck_csv.py --copydeck copydecks/fr/copydeck.json --out review_fr.csv
"""

import argparse
import csv
import json
import sys
from pathlib import Path

COLUMNS = ["error_type", "variant_index", "if_condition", "title", "summary", "why",
           "step_1", "step_2", "step_3", "step_4", "step_5"]


def export(copydeck_path: Path, out_path: Path) -> None:
    with open(copydeck_path) as f:
        data = json.load(f)

    rows = []
    for error_type, error_def in data["errors"].items():
        for i, variant in enumerate(error_def["variants"]):
            steps = variant.get("steps", [])
            if_condition = variant.get("if")
            row = {
                "error_type": error_type,
                "variant_index": i,
                "if_condition": json.dumps(if_condition) if if_condition else "",
                "title": variant.get("title", ""),
                "summary": variant.get("summary", ""),
                "why": variant.get("why", ""),
            }
            for j in range(1, 6):
                row[f"step_{j}"] = steps[j - 1] if j - 1 < len(steps) else ""
            rows.append(row)

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported {len(rows)} variants to {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Export copydeck to CSV for review")
    parser.add_argument("--copydeck", default="copydecks/en/copydeck.json",
                        help="Path to source copydeck JSON (default: copydecks/en/copydeck.json)")
    parser.add_argument("--out", default="copydeck_review.csv",
                        help="Output CSV path (default: copydeck_review.csv)")
    args = parser.parse_args()

    copydeck_path = Path(args.copydeck)
    if not copydeck_path.exists():
        print(f"Error: {copydeck_path} not found", file=sys.stderr)
        sys.exit(1)

    export(copydeck_path, Path(args.out))


if __name__ == "__main__":
    main()
