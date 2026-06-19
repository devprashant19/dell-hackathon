"""
Generates 4 realistic mock compatibility PDFs for the CompatIQ hackathon fixture set.
Run: python3 generate_pdfs.py
Outputs into ./output/
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

OUT = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUT, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="DocTitle", fontSize=18, leading=22, spaceAfter=6, textColor=colors.HexColor("#1a2b4a")))
styles.add(ParagraphStyle(name="DocSub", fontSize=10, leading=14, textColor=colors.HexColor("#555555"), spaceAfter=18))
styles.add(ParagraphStyle(name="SectionHead", fontSize=13, leading=16, spaceBefore=14, spaceAfter=8, textColor=colors.HexColor("#1a2b4a")))
styles.add(ParagraphStyle(name="Body", fontSize=9.5, leading=14, spaceAfter=8))
styles.add(ParagraphStyle(name="Footnote", fontSize=8, leading=11, textColor=colors.HexColor("#777777")))
styles.add(ParagraphStyle(name="Warning", fontSize=9.5, leading=14, spaceAfter=8, textColor=colors.HexColor("#a83232"), borderColor=colors.HexColor("#a83232")))

TABLE_HEADER_BG = colors.HexColor("#1a2b4a")
TABLE_ALT_BG = colors.HexColor("#f2f4f8")


cell_style = ParagraphStyle(name="Cell", fontSize=8.5, leading=10.5, textColor=colors.black)
header_style = ParagraphStyle(name="CellHeader", fontSize=8.5, leading=10.5, textColor=colors.white, fontName="Helvetica-Bold")


def wrap_cell(text, is_header=False):
    return Paragraph(str(text), header_style if is_header else cell_style)


def styled_table(data, col_widths=None):
    # Wrap every cell in a Paragraph so long header/cell text wraps instead of overlapping
    wrapped = []
    for r, row in enumerate(data):
        wrapped.append([wrap_cell(cell, is_header=(r == 0)) for cell in row])
    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), TABLE_ALT_BG))
    t.setStyle(TableStyle(style))
    return t


# ---------------------------------------------------------------------------
# DOC 1: Dell OptiPlex BIOS & Firmware Compatibility Matrix
# ---------------------------------------------------------------------------
def doc1():
    path = os.path.join(OUT, "DELL-BIOS-Compatibility-Matrix-2026-Q1.pdf")
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch,
                             leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    story.append(Paragraph("Dell OptiPlex 7000 Series", styles["DocTitle"]))
    story.append(Paragraph("BIOS &amp; Firmware Compatibility Matrix &mdash; Document No. DCM-2026-Q1-117 &mdash; Revision C &mdash; Published 2026-02-10", styles["DocSub"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 12))

    story.append(Paragraph("1. Purpose", styles["SectionHead"]))
    story.append(Paragraph(
        "This document defines the supported BIOS, TPM firmware, and NIC firmware combinations "
        "for the Dell OptiPlex 7000 series fleet. IT administrators must reference this matrix "
        "before approving any BIOS update via Dell Command | Update or fleet management tooling. "
        "Deviating from supported combinations may result in boot failures, degraded network "
        "performance, or security baseline non-compliance.", styles["Body"]))

    story.append(Paragraph("2. Supported BIOS Versions", styles["SectionHead"]))
    bios_data = [
        ["BIOS Version", "Release Date", "Status", "Minimum TPM FW", "Notes"],
        ["2.14.0", "2025-04-02", "Legacy", "7.2.1", "End of support 2026-06-30"],
        ["2.15.2", "2025-08-14", "Supported", "7.2.1", "—"],
        ["2.16.0", "2025-11-20", "Supported", "7.2.3", "Required for Windows 11 24H2 security baseline (see Sec. 4)"],
        ["2.17.1", "2026-01-30", "Current / Recommended", "7.3.0", "Latest stable release"],
    ]
    story.append(styled_table(bios_data, col_widths=[0.8*inch, 0.85*inch, 1.05*inch, 0.85*inch, 2.85*inch]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("3. Known NIC Firmware Conflicts", styles["SectionHead"]))
    story.append(Paragraph(
        "BIOS 2.16.0 and later enable a revised Secure Boot certificate chain that is "
        "incompatible with Intel I219-LM NIC firmware versions below 23.0. Devices that "
        "receive the BIOS 2.16.0 update while running NIC firmware 22.x will experience "
        "intermittent PXE boot failures and may drop from corporate Wi-Fi/Ethernet management "
        "VLANs during the POST handshake.", styles["Body"]))
    story.append(Paragraph(
        "<b>Required action:</b> NIC firmware must be upgraded to 23.0 or later "
        "<b>before</b> or in the same maintenance window as any BIOS upgrade to 2.16.0 or higher. "
        "This is a hard blocking dependency, not a recommendation.", styles["Warning"]))
    story.append(Spacer(1, 8))
    nic_data = [
        ["Component", "Affected Versions", "Constraint", "Severity"],
        ["Intel I219-LM NIC Firmware", "< 23.0", "CONFLICTS_WITH BIOS >= 2.16.0", "Critical"],
        ["Intel I219-LM NIC Firmware", ">= 23.0", "Compatible with all listed BIOS versions", "—"],
    ]
    story.append(styled_table(nic_data, col_widths=[1.8*inch, 1.3*inch, 2.5*inch, 0.9*inch]))

    story.append(Paragraph("4. TPM Firmware Requirements", styles["SectionHead"]))
    story.append(Paragraph(
        "BIOS 2.16.0 introduces an updated TPM measured-boot policy. Systems must be running "
        "TPM firmware 7.2.3 or later prior to applying this BIOS version. Systems on TPM 7.2.1 "
        "attempting to apply BIOS 2.16.0 directly will fail the firmware signature check and "
        "the update will be rejected by Dell Command | Update with error code DCU-0x442.", styles["Body"]))

    story.append(Paragraph("5. Chipset Driver Notes", styles["SectionHead"]))
    story.append(Paragraph(
        "Customers running BIOS 2.17.1 are advised to consider upgrading the Intel chipset "
        "INF driver to 10.1.45 or later for optimal power-management telemetry reporting "
        "to endpoint management agents. No functional issues have been reported on earlier "
        "chipset driver versions at this time.", styles["Body"]))
    story.append(Paragraph(
        "Footnote reference [1] — see Appendix A.", styles["Footnote"]))

    story.append(PageBreak())
    story.append(Paragraph("Appendix A &mdash; Footnotes", styles["SectionHead"]))
    story.append(Paragraph(
        "[Continued from prior internal revision; full footnote text intentionally withheld "
        "pending legal review for this public revision. Contact Dell Enterprise Support "
        "for the complete footnote text if required for compliance audits.]", styles["Footnote"]))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Document classification: Dell Enterprise Partner Distribution. "
                            "Subject to change without notice.", styles["Footnote"]))

    doc.build(story)
    print("Wrote", path)


# ---------------------------------------------------------------------------
# DOC 2: CrowdStrike Falcon Sensor Release Notes
# ---------------------------------------------------------------------------
def doc2():
    path = os.path.join(OUT, "CrowdStrike-Falcon-Sensor-7.18-Release-Notes.pdf")
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch,
                             leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    story.append(Paragraph("CrowdStrike Falcon Sensor for Windows", styles["DocTitle"]))
    story.append(Paragraph("Release Notes &mdash; Version 7.18.0 &mdash; Published 2026-03-05", styles["DocSub"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 12))

    story.append(Paragraph("What's New in 7.18.0", styles["SectionHead"]))
    story.append(Paragraph(
        "Falcon Sensor 7.18.0 introduces kernel-mode telemetry improvements for credential "
        "access detection and reduces sensor CPU overhead by approximately 12% on supported "
        "platforms. This release also adds support for the updated Windows 11 24H2 kernel "
        "callback model.", styles["Body"]))

    story.append(Paragraph("Operating System Requirements", styles["SectionHead"]))
    os_data = [
        ["Operating System", "Minimum Build", "Falcon 7.18 Support"],
        ["Windows 11 23H2", "22631.0", "Supported (legacy telemetry path)"],
        ["Windows 11 24H2", "26100.0", "Required for full kernel callback feature set"],
        ["Windows 11 25H2", "27000.0", "Supported"],
        ["Windows 10 22H2", "19045.0", "Supported until EOL 2026-10-14"],
    ]
    story.append(styled_table(os_data, col_widths=[2.0*inch, 1.4*inch, 3.1*inch]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "<b>Important:</b> The new kernel callback model used for credential access detection "
        "in this release REQUIRES Windows 11 24H2 (build 26100.0) or later. Sensors deployed "
        "to endpoints on Windows 11 23H2 or earlier will automatically fall back to the legacy "
        "telemetry path and will not receive the improved credential-theft detection coverage "
        "described in this release. This fallback is silent and does not generate an alert in "
        "the Falcon console by default.", styles["Warning"]))

    story.append(Paragraph("Hardware &amp; Firmware Prerequisites", styles["SectionHead"]))
    story.append(Paragraph(
        "No additional BIOS or firmware requirements are introduced directly by Falcon Sensor "
        "7.18.0. However, administrators should be aware that Windows 11 24H2 itself enforces "
        "a minimum platform security baseline; refer to Microsoft and OEM documentation "
        "(e.g., Dell DCM-2026-Q1-117) for BIOS-level requirements associated with 24H2 deployment.", styles["Body"]))

    story.append(Paragraph("Deprecation Notice", styles["SectionHead"]))
    story.append(Paragraph(
        "Support for the legacy user-mode-only sensor architecture (used by Falcon Sensor "
        "versions 6.x and earlier) will be deprecated in an upcoming release. Customers still "
        "running 6.x sensors should plan migration to 7.x in the near term; an exact end-of-life "
        "build number has not yet been finalized and will be announced in a future bulletin.", styles["Body"]))

    story.append(Paragraph("Known Issues", styles["SectionHead"]))
    issues_data = [
        ["ID", "Description", "Workaround"],
        ["FAL-2026-0091", "Sensor may report duplicate host records after in-place 23H2 -> 24H2 OS upgrade", "Re-run host registration script post-upgrade"],
        ["FAL-2026-0103", "Elevated CPU usage during initial 24H2 kernel callback registration (first boot only)", "None required; resolves after first boot"],
    ]
    story.append(styled_table(issues_data, col_widths=[1.2*inch, 3.6*inch, 1.7*inch]))

    doc.build(story)
    print("Wrote", path)


# ---------------------------------------------------------------------------
# DOC 3: Tanium Client Compatibility Bulletin
# ---------------------------------------------------------------------------
def doc3():
    path = os.path.join(OUT, "Tanium-Client-7.5-Compatibility-Bulletin.pdf")
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch,
                             leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    story.append(Paragraph("Tanium Client", styles["DocTitle"]))
    story.append(Paragraph("Compatibility Bulletin &mdash; Client Version 7.5.x &mdash; Bulletin TCB-2026-014 &mdash; Published 2026-01-22", styles["DocSub"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Scope", styles["SectionHead"]))
    story.append(Paragraph(
        "This bulletin describes co-existence requirements between Tanium Client 7.5.x and "
        "third-party endpoint security agents, with a focus on EDR sensors that hook the same "
        "kernel filter manager altitude range.", styles["Body"]))

    story.append(Paragraph("EDR Co-existence Matrix", styles["SectionHead"]))
    coexist_data = [
        ["Third-Party Agent", "Version", "Compatibility with Tanium 7.5.x"],
        ["CrowdStrike Falcon Sensor", "7.16.x", "Compatible, no special configuration"],
        ["CrowdStrike Falcon Sensor", "7.17.x", "Compatible, no special configuration"],
        ["CrowdStrike Falcon Sensor", "7.18.x", "Compatible — recommended minimum Tanium Client 7.4.6 due to filter altitude renegotiation"],
        ["SentinelOne Agent", "23.4.x", "Compatible, no special configuration"],
    ]
    story.append(styled_table(coexist_data, col_widths=[2.2*inch, 1.1*inch, 3.2*inch]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Tanium Client versions prior to 7.4.6 are not validated against Falcon Sensor 7.18.x's "
        "revised kernel filter altitude allocation and MUST be upgraded to 7.4.6 or later before "
        "Falcon Sensor 7.18.x is deployed to the same endpoint. Co-installing Falcon 7.18.x with "
        "Tanium Client below 7.4.6 has been observed to cause filter manager registration races "
        "during boot, resulting in delayed Tanium check-in (15-40 minutes) on affected endpoints.", styles["Body"]))

    story.append(Paragraph("Operating System Support", styles["SectionHead"]))
    tan_os_data = [
        ["Operating System", "Tanium Client 7.4.x", "Tanium Client 7.5.x"],
        ["Windows 11 23H2", "Supported", "Supported"],
        ["Windows 11 24H2", "Supported", "Supported"],
        ["Windows 11 25H2", "Not validated", "Supported"],
        ["Ubuntu 22.04 LTS", "Supported", "Supported"],
        ["Ubuntu 24.04 LTS", "Not validated", "Supported"],
    ]
    story.append(styled_table(tan_os_data, col_widths=[2.0*inch, 2.0*inch, 2.0*inch]))

    story.append(Paragraph("Recommended Upgrade Sequencing", styles["SectionHead"]))
    story.append(Paragraph(
        "1. Upgrade Tanium Client to 7.4.6 or later.<br/>"
        "2. Validate check-in and filter manager registration on a pilot ring (minimum 48 hours).<br/>"
        "3. Deploy CrowdStrike Falcon Sensor 7.18.x to the same ring.<br/>"
        "4. Monitor for FAL-2026-0091 / FAL-2026-0103 (see CrowdStrike release notes) before fleet-wide rollout.",
        styles["Body"]))

    doc.build(story)
    print("Wrote", path)


# ---------------------------------------------------------------------------
# DOC 4: Intel I219 NIC Firmware Advisory
# ---------------------------------------------------------------------------
def doc4():
    path = os.path.join(OUT, "Intel-I219-NIC-Firmware-Advisory-23.0.pdf")
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch,
                             leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    story.append(Paragraph("Intel Ethernet Controller I219-LM", styles["DocTitle"]))
    story.append(Paragraph("Firmware Advisory 23.0 &mdash; Security &amp; Compatibility Update &mdash; Published 2025-12-18", styles["DocSub"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Summary", styles["SectionHead"]))
    story.append(Paragraph(
        "Intel is releasing firmware version 23.0 for the I219-LM Ethernet controller family "
        "to address a Secure Boot certificate chain validation issue (CVE-2025-41822) affecting "
        "systems with BIOS implementations released after late 2025. This advisory also covers "
        "driver-level compatibility for the chipset INF driver package.", styles["Body"]))

    story.append(Paragraph("Affected Versions and Remediation", styles["SectionHead"]))
    fw_data = [
        ["Firmware Version", "Status", "Minimum Driver", "Action Required"],
        ["22.1", "Vulnerable", "10.1.40", "Upgrade to 23.0 immediately"],
        ["22.5", "Vulnerable", "10.1.40", "Upgrade to 23.0 immediately"],
        ["23.0", "Patched", "10.1.40", "No action — current"],
    ]
    story.append(styled_table(fw_data, col_widths=[1.4*inch, 1.1*inch, 1.3*inch, 2.7*inch]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Systems applying OEM BIOS updates that introduce the revised Secure Boot certificate "
        "chain (for example, Dell BIOS 2.16.0 and later per Dell document DCM-2026-Q1-117) "
        "MUST have NIC firmware 23.0 or later installed beforehand. Failure to sequence this "
        "correctly may result in the network controller failing POST validation, requiring "
        "manual BIOS recovery to restore network connectivity.", styles["Warning"]))

    story.append(Paragraph("Driver Compatibility", styles["SectionHead"]))
    story.append(Paragraph(
        "Firmware 23.0 requires chipset INF driver 10.1.40 or later. Earlier driver versions "
        "(10.1.3x and below) have not been validated against this firmware revision and may "
        "report incorrect link-speed negotiation values in Windows Device Manager, though no "
        "functional connectivity loss has been observed in internal testing.", styles["Body"]))

    story.append(Paragraph("Deployment Notes", styles["SectionHead"]))
    story.append(Paragraph(
        "This firmware can be deployed via standard OEM firmware update utilities (e.g., Dell "
        "Command | Update 5.x, Lenovo Vantage, HP Image Assistant). No reboot sequencing "
        "constraints apply beyond standard firmware update practices.", styles["Body"]))

    doc.build(story)
    print("Wrote", path)


if __name__ == "__main__":
    doc1()
    doc2()
    doc3()
    doc4()
    print("\nAll PDFs generated in", OUT)
