"""
Generates mock device inventory JSON for the CompatIQ fixture set.
Includes deliberate single-hop AND multi-hop transitive conflicts so the
knowledge graph traversal logic has real cases to prove itself against.
Run: python3 generate_devices.py
"""
import json
import random
import os

random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Component version pools (must match the PDFs / rules reference)
# ---------------------------------------------------------------------------
BIOS_VERSIONS = ["2.14.0", "2.15.2", "2.16.0", "2.17.1"]
TPM_VERSIONS = ["7.2.1", "7.2.3", "7.3.0"]
NIC_FW_VERSIONS = ["22.1", "22.5", "23.0"]
CHIPSET_DRIVER_VERSIONS = ["10.1.30", "10.1.40", "10.1.45"]
OS_VERSIONS = [
    {"name": "Windows 11 23H2", "build": "22631.0"},
    {"name": "Windows 11 24H2", "build": "26100.0"},
    {"name": "Windows 11 25H2", "build": "27000.0"},
    {"name": "Windows 10 22H2", "build": "19045.0"},
]
FALCON_VERSIONS = ["7.16.2", "7.17.0", "7.18.0"]
TANIUM_VERSIONS = ["7.4.2", "7.4.6", "7.5.0"]
DCU_VERSIONS = ["5.2.0", "5.3.1"]

SITES = ["HQ-Austin", "HQ-Dehradun", "Branch-Chicago", "Branch-Singapore", "Remote-WFH"]
DEPARTMENTS = ["Engineering", "Finance", "Sales", "IT Operations", "Legal", "Customer Support"]
MODELS = ["Dell OptiPlex 7020", "Dell OptiPlex 7010", "Dell Latitude 5450"]


def make_device(device_id, profile):
    """profile is a dict of deliberately chosen versions; fills in the rest randomly."""
    os_choice = profile.get("os") or random.choice(OS_VERSIONS)
    device = {
        "device_id": device_id,
        "hostname": f"WKS-{device_id.split('-')[1]}",
        "site": random.choice(SITES),
        "department": random.choice(DEPARTMENTS),
        "model": random.choice(MODELS),
        "last_checkin": "2026-06-18T14:32:00Z",
        "components": {
            "bios": {
                "vendor": "Dell",
                "version": profile.get("bios") or random.choice(BIOS_VERSIONS),
            },
            "tpm_firmware": {
                "version": profile.get("tpm") or random.choice(TPM_VERSIONS),
            },
            "nic_firmware": {
                "name": "Intel I219-LM",
                "version": profile.get("nic_fw") or random.choice(NIC_FW_VERSIONS),
            },
            "chipset_driver": {
                "name": "Intel INF",
                "version": profile.get("chipset_driver") or random.choice(CHIPSET_DRIVER_VERSIONS),
            },
            "operating_system": {
                "name": os_choice["name"],
                "build": os_choice["build"],
            },
            "endpoint_agents": {
                "crowdstrike_falcon": profile.get("falcon") or random.choice(FALCON_VERSIONS),
                "tanium_client": profile.get("tanium") or random.choice(TANIUM_VERSIONS),
                "dell_command_update": profile.get("dcu") or random.choice(DCU_VERSIONS),
            },
        },
    }
    return device


def main():
    devices = []

    # ---- DV-0001: fully healthy baseline device (no violations) ----
    devices.append(make_device("DV-0001", {
        "bios": "2.17.1", "tpm": "7.3.0", "nic_fw": "23.0",
        "chipset_driver": "10.1.45", "os": OS_VERSIONS[2],  # 25H2
        "falcon": "7.18.0", "tanium": "7.5.0", "dcu": "5.3.1",
    }))

    # ---- DV-0002 to DV-0010: more healthy devices for baseline mass ----
    for i in range(2, 11):
        devices.append(make_device(f"DV-{i:04d}", {
            "bios": "2.17.1", "tpm": "7.3.0", "nic_fw": "23.0",
            "chipset_driver": "10.1.45",
        }))

    # ---- DV-0042: THE signature multi-hop transitive conflict ----
    # Falcon 7.18 -> requires Win11 24H2 -> requires BIOS >= 2.16.0 -> conflicts with NIC fw < 23.0
    # Direct pairwise checks (Falcon vs NIC fw) show nothing wrong; only the graph traversal catches it.
    devices.append(make_device("DV-0042", {
        "bios": "2.16.0",
        "tpm": "7.2.3",
        "nic_fw": "22.5",          # <-- the violation: should be >=23.0 given BIOS 2.16.0
        "chipset_driver": "10.1.40",
        "os": OS_VERSIONS[1],       # Windows 11 24H2 — required by Falcon 7.18
        "falcon": "7.18.0",
        "tanium": "7.5.0",
        "dcu": "5.2.0",
    }))

    # ---- DV-0043: same chain trigger, but caught at the FIRST hop only ----
    # (Falcon 7.18 on Windows 11 23H2 — silent fallback, not a hard block, but should be flagged
    #  as a "silent degradation" advisory rather than a hard violation)
    devices.append(make_device("DV-0043", {
        "bios": "2.15.2",
        "tpm": "7.2.1",
        "nic_fw": "23.0",
        "chipset_driver": "10.1.40",
        "os": OS_VERSIONS[0],  # 23H2 — Falcon will silently use legacy telemetry path
        "falcon": "7.18.0",
        "tanium": "7.5.0",
        "dcu": "5.2.0",
    }))

    # ---- DV-0044: direct single-hop conflict (BIOS 2.16.0 + NIC fw 22.1, no agent involvement) ----
    devices.append(make_device("DV-0044", {
        "bios": "2.16.0",
        "tpm": "7.2.3",
        "nic_fw": "22.1",   # direct CONFLICTS_WITH violation
        "chipset_driver": "10.1.40",
    }))

    # ---- DV-0045: TPM firmware too old for its BIOS (direct REQUIRES violation) ----
    devices.append(make_device("DV-0045", {
        "bios": "2.16.0",
        "tpm": "7.2.1",   # requires >= 7.2.3 for BIOS 2.16.0
        "nic_fw": "23.0",
        "chipset_driver": "10.1.40",
    }))

    # ---- DV-0046: Tanium/Falcon co-existence violation ----
    # Falcon 7.18.x deployed with Tanium Client < 7.4.6 -> filter manager registration race
    devices.append(make_device("DV-0046", {
        "bios": "2.17.1",
        "tpm": "7.3.0",
        "nic_fw": "23.0",
        "chipset_driver": "10.1.45",
        "falcon": "7.18.0",
        "tanium": "7.4.2",   # below the 7.4.6 minimum required for co-existence with Falcon 7.18.x
    }))

    # ---- DV-0047: double violation device (NIC conflict AND Tanium/Falcon race) ----
    devices.append(make_device("DV-0047", {
        "bios": "2.16.0",
        "tpm": "7.2.3",
        "nic_fw": "22.5",
        "chipset_driver": "10.1.30",
        "os": OS_VERSIONS[1],
        "falcon": "7.18.0",
        "tanium": "7.4.2",
    }))

    # ---- DV-0048: legacy device, multiple deprecated/EOL components but internally consistent ----
    devices.append(make_device("DV-0048", {
        "bios": "2.14.0",
        "tpm": "7.2.1",
        "nic_fw": "22.1",
        "chipset_driver": "10.1.30",
        "os": OS_VERSIONS[3],  # Windows 10 22H2
        "falcon": "7.16.2",
        "tanium": "7.4.2",
        "dcu": "5.2.0",
    }))

    # ---- Bulk-generate remaining devices (DV-0011 to DV-0041, DV-0049 to DV-0075) ----
    # Random mix, weighted towards mostly-compliant with a long tail of partial issues,
    # to make the fleet overview / scoring distribution look realistic.
    remaining_ids = list(range(11, 42)) + list(range(49, 76))
    for i in remaining_ids:
        # 60% chance of a "modern, compliant" profile; 40% chance of fully random (may or may not violate)
        if random.random() < 0.6:
            profile = {
                "bios": random.choice(["2.16.0", "2.17.1"]),
                "tpm": random.choice(["7.2.3", "7.3.0"]),
                "nic_fw": "23.0",
                "chipset_driver": random.choice(["10.1.40", "10.1.45"]),
            }
        else:
            profile = {}  # fully random from pools — may produce additional organic violations
        devices.append(make_device(f"DV-{i:04d}", profile))

    devices.sort(key=lambda d: d["device_id"])

    payload = {
        "schema_version": "1.0",
        "generated_at": "2026-06-18T15:00:00Z",
        "device_count": len(devices),
        "devices": devices,
    }

    out_path = os.path.join(OUT_DIR, "device_inventory.json")
    with open(out_path, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {out_path} with {len(devices)} devices")

    # Sanity check: print the signature devices for verification
    for d in devices:
        if d["device_id"] in ("DV-0001", "DV-0042", "DV-0043", "DV-0044", "DV-0045", "DV-0046", "DV-0047", "DV-0048"):
            print(json.dumps(d, indent=2))


if __name__ == "__main__":
    main()
