#!/usr/bin/env python3
"""Import revised copy from a reviewed CSV back into a copydeck JSON.

Reads a reviewed CSV (originally produced by export_copydeck_csv.py, then edited
in a spreadsheet) and updates title/summary/why/steps for each variant, writing
the result to a JSON file. The original if_condition and any other metadata are
preserved from the source copydeck - reviewers cannot change match logic.

The reader tolerates the mutations a spreadsheet round-trip introduces:
  * blank rows above the header (eg. a frozen spacer row)
  * header capitalisation ("Title", "Error_type", "Step_1", ...)
  * extra columns added by reviewers (ID, links, status flags), in any order

Review gating:
  If the CSV has a "reviewed" column (any header containing "reviewed"), only
  rows marked TRUE are applied by default; unreviewed rows keep their current
  copydeck wording. Pass --all to apply every row regardless, or --reviewed-only
  to force gating (errors if the column is missing).

Usage:
    python scripts/import_copydeck_csv.py --csv copydeck-import_en.csv
    python scripts/import_copydeck_csv.py --csv reviewed.csv --out copydecks/en/copydeck_revised.json --all
"""

import argparse
import csv
import json
import sys
from pathlib import Path

# Columns that must be present (after normalisation) for a row to be a header.
REQUIRED = {"error_type", "variant_index", "title", "summary"}
# Values (normalised) treated as "reviewed = yes".
TRUTHY = {"true", "yes", "y", "1", "x", "✓", "checked", "done"}


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def read_rows(csv_path: Path):
    """Return (normalised_header, [row_dict, ...]).

    Skips any blank lead rows, locates the real header by its column names, and
    normalises header keys so case/extra columns don't matter downstream.
    """
    with open(csv_path, newline="", encoding="utf-8") as f:
        raw = list(csv.reader(f))

    header_idx = next(
        (i for i, row in enumerate(raw) if REQUIRED <= {_norm(c) for c in row}),
        None,
    )
    if header_idx is None:
        print(
            f"Error: could not find a header row containing {sorted(REQUIRED)} in {csv_path}.\n"
            "       Is this the reviewed export CSV?",
            file=sys.stderr,
        )
        sys.exit(1)

    header = [_norm(c) for c in raw[header_idx]]
    rows = []
    for row in raw[header_idx + 1:]:
        if not any(cell.strip() for cell in row):
            continue  # skip blank rows
        rows.append({header[j]: (row[j] if j < len(row) else "") for j in range(len(header))})
    return header, rows


def import_csv(csv_path: Path, copydeck_path: Path, out_path: Path, mode: str) -> None:
    with open(copydeck_path) as f:
        data = json.load(f)

    header, rows = read_rows(csv_path)

    reviewed_col = next((h for h in header if "reviewed" in h), None)
    if mode == "reviewed-only" and reviewed_col is None:
        print("Error: --reviewed-only was set but no 'reviewed' column was found in the CSV.", file=sys.stderr)
        sys.exit(1)
    gating = reviewed_col is not None and mode != "all"

    updated = 0
    skipped_unreviewed = 0
    for row in rows:
        error_type = (row.get("error_type") or "").strip()
        vi_raw = (row.get("variant_index") or "").strip()
        if not error_type or not vi_raw:
            continue  # not a real data row

        if gating and _norm(row.get(reviewed_col, "")) not in TRUTHY:
            skipped_unreviewed += 1
            continue

        try:
            variant_index = int(vi_raw)
        except ValueError:
            print(f"Warning: non-numeric variant_index '{vi_raw}' for {error_type}, skipping", file=sys.stderr)
            continue

        if error_type not in data["errors"]:
            print(f"Warning: error type '{error_type}' not found in copydeck, skipping", file=sys.stderr)
            continue

        variants = data["errors"][error_type]["variants"]
        if variant_index >= len(variants):
            print(f"Warning: variant index {variant_index} out of range for {error_type}, skipping", file=sys.stderr)
            continue

        variant = variants[variant_index]
        variant["title"] = row.get("title", "")
        variant["summary"] = row.get("summary", "")
        variant["why"] = row.get("why", "")

        steps = [row.get(f"step_{j}", "") for j in range(1, 6) if row.get(f"step_{j}", "").strip()]
        if steps:
            variant["steps"] = steps
        elif "steps" in variant:
            del variant["steps"]

        updated += 1

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Applied {updated} variant(s) → {out_path}")
    if gating:
        print(f"Skipped {skipped_unreviewed} unreviewed row(s) (column '{reviewed_col}'). Pass --all to include them.")
    elif reviewed_col:
        print(f"Applied all rows; review column '{reviewed_col}' was ignored (--all).")


def main():
    parser = argparse.ArgumentParser(description="Import a reviewed CSV back into a copydeck JSON")
    parser.add_argument("--csv", default="copydeck_review.csv",
                        help="Input CSV path (default: copydeck_review.csv)")
    parser.add_argument("--copydeck", default="copydecks/en/copydeck.json",
                        help="Source copydeck JSON to update (default: copydecks/en/copydeck.json)")
    parser.add_argument("--out", default="copydecks/en/copydeck.json",
                        help="Output JSON path (default: overwrites source copydeck)")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true",
                       help="Apply every row, ignoring any review-status column")
    group.add_argument("--reviewed-only", action="store_true",
                       help="Only apply rows whose review column is TRUE (errors if no such column)")
    args = parser.parse_args()

    for p in [Path(args.csv), Path(args.copydeck)]:
        if not p.exists():
            print(f"Error: {p} not found", file=sys.stderr)
            sys.exit(1)

    mode = "all" if args.all else "reviewed-only" if args.reviewed_only else "auto"
    import_csv(Path(args.csv), Path(args.copydeck), Path(args.out), mode)


if __name__ == "__main__":
    main()
