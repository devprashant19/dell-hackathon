# CompatIQ Fixture Package

Mock data for the **Dynamic Compatibility & Configuration Compliance Engine** hackathon
project. Hand this folder to Antigravity alongside the build prompt — it gives the agent
real (if synthetic) source documents and a device fleet with deliberately engineered test
cases, so the resulting prototype can be demoed convincingly rather than tested against
toy data.

## Contents

| File | Purpose |
|---|---|
| `DELL-BIOS-Compatibility-Matrix-2026-Q1.pdf` | Vendor BIOS/firmware compatibility matrix (3 pages, tables + prose) |
| `CrowdStrike-Falcon-Sensor-7.18-Release-Notes.pdf` | EDR agent release notes with OS requirements |
| `Tanium-Client-7.5-Compatibility-Bulletin.pdf` | Agent co-existence bulletin (Tanium vs. CrowdStrike) |
| `Intel-I219-NIC-Firmware-Advisory-23.0.pdf` | NIC firmware security advisory, cross-references the Dell doc |
| `device_inventory.json` | 75 mock devices with realistic version skew |
| `extracted_rules_reference.json` | Ground-truth rules a correct extraction pipeline should produce from the 4 PDFs |

All four documents deliberately cross-reference each other (the Intel and CrowdStrike
docs both mention the Dell BIOS document by name), mirroring how real enterprise
compatibility documentation is scattered across multiple vendors.

## Why this data is useful (not just filler)

### 1. A genuine multi-hop transitive conflict — `DV-0042`
This is the headline scenario for proving the knowledge graph actually does graph
traversal instead of pairwise checks:

```
CrowdStrike Falcon 7.18  --requires-->  Windows 11 24H2
Windows 11 24H2          --requires-->  BIOS >= 2.16.0
BIOS >= 2.16.0           --conflicts--> NIC firmware < 23.0
```

`DV-0042` runs Falcon 7.18 + Win 11 24H2 + BIOS 2.16.0 + **NIC firmware 22.5**. No single
pairwise rule check catches this — Falcon doesn't mention NIC firmware, and the BIOS doc
doesn't mention CrowdStrike. Only a 3-hop graph walk surfaces it. Use this device in your
demo script as the "look how deep the reasoning goes" moment.

### 2. A "silent degradation" vs. "hard block" distinction — `DV-0043`
Falcon 7.18 on Windows 11 23H2 doesn't fail — it silently falls back to a weaker telemetry
path with no console alert. This is a good case for showing your severity-weighting model
isn't binary (pass/fail) but captures *degraded-but-functional* states differently from
*broken* states.

### 3. Direct single-hop violations — `DV-0044`, `DV-0045`, `DV-0046`
Simple, one-edge violations (NIC/BIOS conflict, TPM/BIOS requirement, Tanium/Falcon
co-existence) for testing the basic compliance check before you've built graph traversal.

### 4. A compound/double-violation device — `DV-0047`
Two independent violations on one device, useful for testing that your compliance score
aggregates multiple findings correctly and your explanation UI doesn't just show one and
stop.

### 5. A legacy-but-internally-consistent device — `DV-0048`
Old on every axis (BIOS 2.14.0, Windows 10, Falcon 7.16.2) but every component is
*mutually compatible* — nothing here violates a rule, it's just outdated. Good negative
test case: your engine should NOT flag this as non-compliant just because it's old.
Compliance ≠ recency.

### 6. Deliberately ambiguous extractions (see `extracted_rules_reference.json`)
Three intentionally fuzzy passages so your Human-in-the-Loop review queue has real work
to do instead of always seeing clean, confident extractions:
- Soft "customers are advised to consider" language (chipset driver recommendation) —
  should NOT be extracted as a hard requirement.
- A footnote reference whose actual content was withheld from the document — extraction
  should flag low confidence / incomplete source rather than guessing.
- A deprecation notice with no concrete version or date ("an upcoming release") —
  extraction should not invent a cutoff version.

### 7. A cross-document duplicate/corroborating rule
The BIOS↔NIC-firmware conflict is independently stated in *both* the Dell document and
the Intel document. A well-built ingestion pipeline should detect this as the same
underlying rule (same subject + conflict pair) and merge provenance onto one graph edge
rather than creating two redundant edges — `extracted_rules_reference.json` calls this
out explicitly as RULE-002/RULE-010.

## Suggested demo flow using this data

1. Upload `Tanium-Client-7.5-Compatibility-Bulletin.pdf` → show extracted rules land in
   the review queue, including the ambiguous OS-table inference (RULE-008).
2. Approve the rules → show the graph add new nodes/edges.
3. Trigger a re-score → show `DV-0046` flip to non-compliant (Tanium/Falcon conflict).
4. Open `DV-0042` → walk through the 3-hop explanation, citing all three source documents
   by name and page.
5. Show the ranked remediation options for `DV-0042` (likely: upgrade NIC firmware to
   23.0 — fewer downstream changes than downgrading BIOS or Falcon).
6. Show `DV-0048` as a "calm" example — flagged as outdated/EOL-relevant in dashboards but
   *not* as a compliance violation, to prove the system distinguishes the two.

## Regenerating the fixtures

```bash
pip install reportlab pdfplumber pypdf --break-system-packages
python3 generate_pdfs.py      # writes the 4 PDFs to ./output
python3 generate_devices.py   # writes device_inventory.json to ./output
```

Both scripts use a fixed random seed (`42`) for the bulk-generated filler devices, so
re-running them reproduces the same fleet — only `DV-0001` through `DV-0048` are hand-
specified and guaranteed stable across regenerations.
