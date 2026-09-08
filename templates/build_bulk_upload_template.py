"""
Builds the HyderabadNow bulk-project-upload template (.xlsx).

Three sheets:
  1. Instructions  - how to use the template
  2. Projects      - the sheet the admin actually fills in
  3. Amenity Keys  - valid values for the Amenities column

Run with: python3 build_bulk_upload_template.py
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

FONT_NAME = "Arial"

HEADER_FILL = PatternFill("solid", fgColor="1F4E3D")   # dark emerald, matches site brand
HEADER_FONT = Font(name=FONT_NAME, bold=True, color="FFFFFF", size=10)
REQUIRED_FILL = PatternFill("solid", fgColor="FFF2CC")  # pale amber for required-column headers
NOTE_FONT = Font(name=FONT_NAME, italic=True, color="666666", size=9)
EXAMPLE_FONT = Font(name=FONT_NAME, italic=True, color="808080", size=10)
BODY_FONT = Font(name=FONT_NAME, size=10)
TITLE_FONT = Font(name=FONT_NAME, bold=True, size=16, color="1F4E3D")
SUBTITLE_FONT = Font(name=FONT_NAME, size=11, color="444444")
SECTION_FONT = Font(name=FONT_NAME, bold=True, size=12, color="1F4E3D")
THIN = Side(style="thin", color="D9D9D9")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

wb = Workbook()

# ---------------------------------------------------------------------------
# Sheet 1: Instructions
# ---------------------------------------------------------------------------
ws = wb.active
ws.title = "Instructions"
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 4
ws.column_dimensions["B"].width = 34
ws.column_dimensions["C"].width = 90

ws["B2"] = "HyderabadNow — Bulk Project Upload Template"
ws["B2"].font = TITLE_FONT
ws["B3"] = "Fill in the 'Projects' sheet, one row per project. Photos, brochures as files, and anything you'd rather double-check stay manual — add those afterward in the admin panel."
ws["B3"].font = SUBTITLE_FONT
ws.merge_cells("B3:C3")
ws["B3"].alignment = Alignment(wrap_text=True, vertical="top")
ws.row_dimensions[3].height = 32

rows = [
    ("How to use this file", None),
    ("1.", "Open the 'Projects' sheet. Row 2 is a filled-in example — read it, then delete it before adding your own rows."),
    ("2.", "Add one project per row starting from row 2 (after removing/overwriting the example)."),
    ("3.", "Columns marked with * in the header are required. Everything else can be left blank and filled in later from the admin panel."),
    ("4.", "'Property Type' and 'Construction Status' are dropdowns — click the cell and choose from the list rather than typing free text."),
    ("5.", "'Amenities' takes a comma-separated list of amenity keys (not labels) — see the 'Amenity Keys' sheet for the exact spelling of each one, e.g. pool,gym,security,lift."),
    ("6.", "'BHK Options' is a comma-separated list of unit sizes offered in the project, e.g. 2,2.5,3,4 (half-BHK is a real, commonly-used unit type in Hyderabad listings)."),
    ("7.", "'YouTube Video Link' only accepts a YouTube or Vimeo URL — leave blank if you don't have one yet."),
    ("8.", "Save the file as .xlsx (don't convert to .csv — it would drop the dropdowns) and send it back for import."),
    ("What happens after import", None),
    ("•", "Each row becomes a project with a public page — its own auto-generated URL slug from the project name."),
    ("•", "Photos, the brochure PDF, and any details you skipped can be added afterward by editing the project in the admin panel — nothing here is one-shot or final."),
    ("•", "A blank optional cell just leaves that field empty on the project; it can be filled in later."),
]

r = 5
for a, b in rows:
    if b is None:
        ws.cell(row=r, column=2, value=a).font = SECTION_FONT
        r += 1
        continue
    c1 = ws.cell(row=r, column=2, value=a)
    c1.font = Font(name=FONT_NAME, bold=True, size=10, color="1F4E3D")
    c1.alignment = Alignment(vertical="top")
    c2 = ws.cell(row=r, column=3, value=b)
    c2.font = BODY_FONT
    c2.alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[r].height = 30
    r += 1

r += 1
ws.cell(row=r, column=2, value="Column reference").font = SECTION_FONT
r += 1
headers_ref = [
    ("Project Name *", "Text", "Display name, e.g. \"Aparna Cyber Heights\"."),
    ("Locality *", "Text", "Neighbourhood/area, e.g. \"Tellapur\"."),
    ("City *", "Text", "Defaults to Hyderabad if left blank."),
    ("Property Type *", "Dropdown", "apartment / villa / independent_house / plot / commercial."),
    ("Construction Status *", "Dropdown", "under_construction / ready_to_move."),
    ("Developer Name", "Text", "Builder/developer name."),
    ("Developer Website URL", "URL", "Developer's own site, if any."),
    ("Area (Acres)", "Number", "Total project land area."),
    ("Total Units", "Whole number", "Total number of units across the project."),
    ("Towers", "Whole number", "Number of towers/blocks."),
    ("Max Floors", "Whole number", "Tallest tower's floor count."),
    ("Units Per Floor", "Text", "Often a range, e.g. \"8-10\"."),
    ("Min Area (sqft)", "Whole number", "Smallest unit size offered."),
    ("Max Area (sqft)", "Whole number", "Largest unit size offered."),
    ("BHK Options", "Comma list", "e.g. \"2,2.5,3,4\"."),
    ("RERA Approval Year", "Year", "e.g. 2024."),
    ("Possession Year", "Year", "Expected/actual handover year."),
    ("Unit Density Per Acre", "Whole number", "Units per acre, if known."),
    ("Floor Area Ratio (FAR)", "Number", "e.g. 2.5."),
    ("Description", "Long text", "A paragraph or two about the project."),
    ("Amenities", "Comma list of keys", "See the 'Amenity Keys' sheet, e.g. \"pool,gym,security\"."),
    ("Brochure URL", "URL", "Link to a hosted brochure PDF, if any."),
    ("YouTube Video Link", "URL", "YouTube or Vimeo only."),
    ("Contact Phone", "Text", "Sales desk number for the project."),
    ("Enable WhatsApp Button", "Dropdown", "Yes / No — needs Contact Phone filled in to take effect."),
]
ws.cell(row=r, column=2, value="Column").font = Font(name=FONT_NAME, bold=True, size=10)
ws.cell(row=r, column=3, value="Type / valid values — details").font = Font(name=FONT_NAME, bold=True, size=10)
r += 1
for name, kind, note in headers_ref:
    ws.cell(row=r, column=2, value=name).font = BODY_FONT
    c = ws.cell(row=r, column=3, value=f"{kind} — {note}")
    c.font = BODY_FONT
    c.alignment = Alignment(wrap_text=True, vertical="top")
    r += 1

# ---------------------------------------------------------------------------
# Sheet 2: Projects (the actual data-entry sheet)
# ---------------------------------------------------------------------------
ps = wb.create_sheet("Projects")
ps.sheet_view.showGridLines = False

headers = [
    "Project Name *", "Locality *", "City *", "Property Type *", "Construction Status *",
    "Developer Name", "Developer Website URL", "Area (Acres)", "Total Units", "Towers",
    "Max Floors", "Units Per Floor", "Min Area (sqft)", "Max Area (sqft)", "BHK Options",
    "RERA Approval Year", "Possession Year", "Unit Density Per Acre", "Floor Area Ratio (FAR)",
    "Description", "Amenities", "Brochure URL", "YouTube Video Link", "Contact Phone",
    "Enable WhatsApp Button",
]
required_cols = {1, 2, 3, 4, 5}  # 1-indexed columns that are required

for col, name in enumerate(headers, start=1):
    cell = ps.cell(row=1, column=col, value=name)
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL if col not in required_cols else PatternFill("solid", fgColor="8A5A00")
    cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    cell.border = BORDER

ps.row_dimensions[1].height = 46
ps.freeze_panes = "A3"

col_widths = [26, 16, 12, 16, 18, 18, 24, 12, 10, 8, 10, 14, 12, 12, 14, 12, 12, 14, 14, 34, 26, 22, 24, 16, 18]
for i, w in enumerate(col_widths, start=1):
    ps.column_dimensions[get_column_letter(i)].width = w

# Note: earlier drafts used native Excel cell comments here for a few
# trickier columns, but ExcelJS (used server-side to parse the upload)
# fails to reconcile some comment XML shapes openpyxl writes, which broke
# the importer. The same guidance lives in the Instructions sheet's column
# reference table instead, so no comments are attached to any cell here.

# Example row (row 2) — italic grey, clearly a sample to delete
example = [
    "Aparna Cyber Heights", "Tellapur", "Hyderabad", "apartment", "under_construction",
    "Aparna Constructions", "https://www.aparnaconstructions.com", 7.1, 714, 5,
    22, "18-22", 1245, 2020, "2,2.5,3",
    2024, 2028, 100, 2.5,
    "A gated high-rise community with landscaped courtyards, close to the Financial District and the ORR.",
    "pool,gym,clubhouse,security,lift,parking", "https://example.com/brochure.pdf",
    "https://www.youtube.com/watch?v=example", "+91 90000 00000", "Yes",
]
for col, val in enumerate(example, start=1):
    c = ps.cell(row=2, column=col, value=val)
    c.font = EXAMPLE_FONT
    c.alignment = Alignment(wrap_text=True, vertical="top")
    c.border = BORDER
ps.row_dimensions[2].height = 60

# Blank editable rows styled with borders for the next ~200 projects
for row in range(3, 203):
    for col in range(1, len(headers) + 1):
        c = ps.cell(row=row, column=col)
        c.font = BODY_FONT
        c.border = BORDER
        c.alignment = Alignment(vertical="top", wrap_text=True)

# Data validation: Property Type (D), Construction Status (E), WhatsApp (Y)
dv_property = DataValidation(
    type="list",
    formula1='"apartment,villa,independent_house,plot,commercial"',
    allow_blank=True, showDropDown=False,
)
dv_property.error = "Choose one of: apartment, villa, independent_house, plot, commercial"
dv_property.errorTitle = "Invalid property type"
ps.add_data_validation(dv_property)
dv_property.add(f"D2:D203")

dv_status = DataValidation(
    type="list",
    formula1='"under_construction,ready_to_move"',
    allow_blank=True, showDropDown=False,
)
dv_status.error = "Choose one of: under_construction, ready_to_move"
dv_status.errorTitle = "Invalid construction status"
ps.add_data_validation(dv_status)
dv_status.add(f"E2:E203")

dv_whatsapp = DataValidation(
    type="list",
    formula1='"Yes,No"',
    allow_blank=True, showDropDown=False,
)
ps.add_data_validation(dv_whatsapp)
dv_whatsapp.add(f"Y2:Y203")

# ---------------------------------------------------------------------------
# Sheet 3: Amenity Keys (reference list for the Amenities column)
# ---------------------------------------------------------------------------
AMENITIES = [
    ("pool", "Swimming Pool"), ("gym", "Gym"), ("clubhouse", "Clubhouse"),
    ("multipurpose_hall", "Multipurpose Hall"), ("amphitheatre", "Amphitheatre"),
    ("guest_rooms", "Guest Rooms"), ("play_area", "Kids Play Area"),
    ("indoor_games", "Indoor Games"), ("garden", "Landscaped Garden"),
    ("jogging_track", "Jogging Track"), ("cricket_net", "Cricket Net"),
    ("badminton", "Badminton Court"), ("tennis", "Tennis Court"),
    ("pickleball", "Pickleball Court"), ("yoga", "Yoga Deck"),
    ("senior_area", "Senior Citizen Area"), ("spa", "Spa & Salon"), ("cafe", "Cafe"),
    ("grocery", "Grocery Store"), ("pharmacy", "Pharmacy & Clinic"),
    ("security", "24x7 Security"), ("power_backup", "Power Backup"), ("lift", "Lift"),
    ("parking", "Covered Parking"), ("pet_zone", "Pet Zone"), ("wifi", "Wi-Fi / Intercom"),
]

am = wb.create_sheet("Amenity Keys")
am.sheet_view.showGridLines = False
am.column_dimensions["A"].width = 22
am.column_dimensions["B"].width = 28
am["A1"] = "Use these exact keys in the 'Amenities' column (comma-separated). Anything not on this list is still accepted — the admin panel will file it under a generic icon rather than reject it."
am.merge_cells("A1:B1")
am["A1"].font = NOTE_FONT
am["A1"].alignment = Alignment(wrap_text=True)
am.row_dimensions[1].height = 30

am.cell(row=2, column=1, value="Key (use in spreadsheet)").font = HEADER_FONT
am.cell(row=2, column=1).fill = HEADER_FILL
am.cell(row=2, column=2, value="Label (shown on site)").font = HEADER_FONT
am.cell(row=2, column=2).fill = HEADER_FILL
for i, (key, label) in enumerate(AMENITIES, start=3):
    am.cell(row=i, column=1, value=key).font = BODY_FONT
    am.cell(row=i, column=2, value=label).font = BODY_FONT

wb.save("/home/claude/hyderabadnow/templates/HyderabadNow_Bulk_Project_Upload_Template.xlsx")
print("saved")
