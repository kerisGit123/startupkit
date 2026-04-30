"""
Auto-crop Element Forge grid images into individual thumbnails.
Detects card boundaries by scanning for non-dark regions.
"""
from PIL import Image
import numpy as np
import os

GRID_DIR = "public/storytica/element_forge/grids"
THUMB_DIR = "public/storytica/element_forge/thumbs"
DARK_THRESHOLD = 35  # pixels below this brightness are "background"

# Grid name -> list of output thumb filenames (left-to-right, top-to-bottom)
GRIDS = {
    "hair-color-grid.png": [
        "hair-color-black.jpg", "hair-color-brown.jpg", "hair-color-blonde.jpg",
        "hair-color-red.jpg", "hair-color-white.jpg", "hair-color-blue.jpg",
        "hair-color-pink.jpg", "hair-color-green.jpg",
    ],
    "ethnicity-grid.png": [
        "ethnicity-east-asian.jpg", "ethnicity-south-asian.jpg",
        "ethnicity-southeast-asian.jpg", "ethnicity-black.jpg",
        "ethnicity-white.jpg", "ethnicity-latino.jpg",
        "ethnicity-middle-eastern.jpg", "ethnicity-mixed.jpg",
        "ethnicity-other.jpg",
    ],
    "prop-category-grid.png": [
        "prop-cat-vehicle.jpg", "prop-cat-weapon.jpg", "prop-cat-tool.jpg",
        "prop-cat-furniture.jpg", "prop-cat-food.jpg", "prop-cat-technology.jpg",
        "prop-cat-clothing-accessory.jpg", "prop-cat-natural.jpg",
        "prop-cat-container.jpg", "prop-cat-musical-instrument.jpg",
        "prop-cat-misc.jpg",
    ],
    "prop-material-grid.png": [
        "prop-mat-metal.jpg", "prop-mat-wood.jpg", "prop-mat-plastic.jpg",
        "prop-mat-glass.jpg", "prop-mat-leather.jpg", "prop-mat-stone.jpg",
        "prop-mat-fabric.jpg", "prop-mat-crystal.jpg", "prop-mat-ceramic.jpg",
        "prop-mat-bone.jpg",
    ],
    "prop-era-grid.png": [
        "prop-era-ancient.jpg", "prop-era-medieval.jpg", "prop-era-victorian.jpg",
        "prop-era-modern.jpg", "prop-era-futuristic.jpg", "prop-era-steampunk.jpg",
        "prop-era-vintage.jpg", "prop-era-minimalist.jpg",
    ],
    "prop-size-grid.png": [
        "prop-size-tiny.jpg", "prop-size-small.jpg", "prop-size-medium.jpg",
        "prop-size-large.jpg", "prop-size-massive.jpg",
    ],
    "prop-condition-grid.png": [
        "prop-cond-pristine.jpg", "prop-cond-new.jpg", "prop-cond-worn.jpg",
        "prop-cond-damaged.jpg", "prop-cond-ancient.jpg", "prop-cond-weathered.jpg",
        "prop-cond-rusted.jpg",
    ],
    "env-setting-grid.png": [
        "env-set-chinese-traditional.jpg", "env-set-japanese.jpg",
        "env-set-korean.jpg", "env-set-southeast-asian.jpg",
        "env-set-indian.jpg", "env-set-middle-eastern.jpg",
        "env-set-medieval-european.jpg", "env-set-victorian.jpg",
        "env-set-gothic.jpg", "env-set-modern.jpg",
        "env-set-industrial.jpg", "env-set-futuristic.jpg",
        "env-set-cyberpunk.jpg", "env-set-fantasy.jpg",
        "env-set-post-apocalyptic.jpg", "env-set-nature.jpg",
    ],
    "env-time-grid.png": [
        "env-time-dawn.jpg", "env-time-morning.jpg", "env-time-noon.jpg",
        "env-time-afternoon.jpg", "env-time-golden-hour.jpg",
        "env-time-sunset.jpg", "env-time-dusk.jpg", "env-time-night.jpg",
        "env-time-midnight.jpg",
    ],
    "env-weather-grid.png": [
        "env-weather-clear.jpg", "env-weather-cloudy.jpg",
        "env-weather-rainy.jpg", "env-weather-foggy.jpg",
        "env-weather-snowy.jpg", "env-weather-stormy.jpg",
        "env-weather-dusty.jpg", "env-weather-misty.jpg",
    ],
    "env-mood-grid.png": [
        "env-mood-cozy.jpg", "env-mood-eerie.jpg", "env-mood-grand.jpg",
        "env-mood-intimate.jpg", "env-mood-vast.jpg",
        "env-mood-claustrophobic.jpg", "env-mood-serene.jpg",
        "env-mood-chaotic.jpg", "env-mood-mysterious.jpg",
        "env-mood-romantic.jpg",
    ],
    # Location grids
    "env-loc-chinese-traditional-grid.png": [
        "env-loc-imperial-palace.jpg", "env-loc-mountain-temple.jpg",
        "env-loc-bamboo-forest.jpg", "env-loc-tea-house.jpg",
        "env-loc-cn-fortress.jpg", "env-loc-cn-village.jpg",
        "env-loc-cn-marketplace.jpg",
    ],
    "env-loc-japanese-grid.png": [
        "env-loc-shrine.jpg", "env-loc-jp-castle.jpg",
        "env-loc-zen-garden.jpg", "env-loc-jp-village.jpg",
        "env-loc-onsen.jpg", "env-loc-dojo.jpg",
    ],
    "env-loc-korean-grid.png": [
        "env-loc-kr-palace.jpg", "env-loc-hanok-village.jpg",
        "env-loc-kr-temple.jpg", "env-loc-kr-marketplace.jpg",
    ],
    "env-loc-southeast-asian-grid.png": [
        "env-loc-temple-complex.jpg", "env-loc-floating-market.jpg",
        "env-loc-jungle-ruins.jpg", "env-loc-rice-terraces.jpg",
    ],
    "env-loc-indian-grid.png": [
        "env-loc-in-palace.jpg", "env-loc-in-temple.jpg",
        "env-loc-in-bazaar.jpg", "env-loc-in-garden.jpg",
        "env-loc-in-fort.jpg",
    ],
    "env-loc-middle-eastern-grid.png": [
        "env-loc-me-palace.jpg", "env-loc-me-bazaar.jpg",
        "env-loc-desert-oasis.jpg", "env-loc-mosque.jpg",
        "env-loc-caravanserai.jpg",
    ],
    "env-loc-medieval-european-grid.png": [
        "env-loc-castle.jpg", "env-loc-cathedral.jpg",
        "env-loc-me-village.jpg", "env-loc-tavern.jpg",
        "env-loc-dungeon.jpg", "env-loc-battlefield.jpg",
    ],
    "env-loc-victorian-grid.png": [
        "env-loc-mansion.jpg", "env-loc-vic-factory.jpg",
        "env-loc-vic-street.jpg", "env-loc-parlor.jpg",
        "env-loc-train-station.jpg",
    ],
    "env-loc-gothic-grid.png": [
        "env-loc-goth-cathedral.jpg", "env-loc-graveyard.jpg",
        "env-loc-haunted-manor.jpg", "env-loc-crypt.jpg",
    ],
    "env-loc-modern-grid.png": [
        "env-loc-office.jpg", "env-loc-apartment.jpg",
        "env-loc-warehouse.jpg", "env-loc-rooftop.jpg",
        "env-loc-mod-street.jpg", "env-loc-cafe.jpg",
        "env-loc-subway.jpg",
    ],
    "env-loc-industrial-grid.png": [
        "env-loc-ind-factory.jpg", "env-loc-shipyard.jpg",
        "env-loc-mine.jpg", "env-loc-power-plant.jpg",
        "env-loc-refinery.jpg",
    ],
    "env-loc-futuristic-grid.png": [
        "env-loc-space-station.jpg", "env-loc-colony.jpg",
        "env-loc-lab.jpg", "env-loc-bridge.jpg",
        "env-loc-megacity.jpg",
    ],
    "env-loc-cyberpunk-grid.png": [
        "env-loc-neon-alley.jpg", "env-loc-underground-club.jpg",
        "env-loc-hacker-den.jpg", "env-loc-megacorp-tower.jpg",
        "env-loc-black-market.jpg",
    ],
    "env-loc-fantasy-grid.png": [
        "env-loc-enchanted-forest.jpg", "env-loc-crystal-cave.jpg",
        "env-loc-floating-island.jpg", "env-loc-dark-tower.jpg",
        "env-loc-elven-city.jpg", "env-loc-dragon-lair.jpg",
    ],
    "env-loc-post-apocalyptic-grid.png": [
        "env-loc-ruins.jpg", "env-loc-wasteland.jpg",
        "env-loc-bunker.jpg", "env-loc-overgrown-city.jpg",
        "env-loc-survivor-camp.jpg",
    ],
    "env-loc-nature-grid.png": [
        "env-loc-beach.jpg", "env-loc-mountain.jpg",
        "env-loc-desert.jpg", "env-loc-rainforest.jpg",
        "env-loc-tundra.jpg", "env-loc-waterfall.jpg",
        "env-loc-volcano.jpg",
    ],
}


def find_card_bounds(img_array):
    """Find card bounding boxes by detecting non-dark rectangular regions."""
    h, w = img_array.shape[:2]
    gray = np.mean(img_array[:, :, :3], axis=2)
    bright = gray > DARK_THRESHOLD

    # Find column ranges with content
    col_has_content = np.any(bright, axis=0)
    # Find row ranges with content
    row_has_content = np.any(bright, axis=1)

    def find_runs(mask):
        """Find contiguous runs of True values."""
        runs = []
        in_run = False
        start = 0
        for i, v in enumerate(mask):
            if v and not in_run:
                start = i
                in_run = True
            elif not v and in_run:
                runs.append((start, i))
                in_run = False
        if in_run:
            runs.append((start, len(mask)))
        return runs

    col_runs = find_runs(col_has_content)
    row_runs = find_runs(row_has_content)

    # Merge runs that are very close (< 3px gap = rounding artifact)
    def merge_close_runs(runs, gap=3):
        if not runs:
            return runs
        merged = [runs[0]]
        for start, end in runs[1:]:
            if start - merged[-1][1] <= gap:
                merged[-1] = (merged[-1][0], end)
            else:
                merged.append((start, end))
        return merged

    col_runs = merge_close_runs(col_runs)
    row_runs = merge_close_runs(row_runs)

    # For single-row grids, row_runs might be one big run
    # For multi-row grids (4x4, 2x5, 2-row), we need to split rows
    # Detect if there are multiple row bands
    if len(row_runs) == 1:
        # Single content band - check for internal dark gaps in rows
        r_start, r_end = row_runs[0]
        row_slice = bright[r_start:r_end, :]
        inner_row_content = np.any(row_slice, axis=1)
        inner_runs = find_runs(inner_row_content)
        inner_runs = merge_close_runs(inner_runs, gap=5)
        # Filter tiny runs
        inner_runs = [(s, e) for s, e in inner_runs if e - s > 20]
        if len(inner_runs) > 1:
            row_runs = [(s + r_start, e + r_start) for s, e in inner_runs]

    # Build bounding boxes: for each row band, find which column bands have content
    cards = []
    for r_start, r_end in row_runs:
        row_strip = bright[r_start:r_end, :]
        strip_col_content = np.any(row_strip, axis=0)
        strip_col_runs = find_runs(strip_col_content)
        strip_col_runs = merge_close_runs(strip_col_runs, gap=3)
        # Filter tiny column runs (< 50px wide = noise)
        strip_col_runs = [(s, e) for s, e in strip_col_runs if e - s > 50]

        for c_start, c_end in strip_col_runs:
            # Tighten the vertical bounds for this specific card
            card_region = bright[r_start:r_end, c_start:c_end]
            card_row_content = np.any(card_region, axis=1)
            card_row_runs = find_runs(card_row_content)
            card_row_runs = merge_close_runs(card_row_runs, gap=3)
            if card_row_runs:
                tight_top = r_start + card_row_runs[0][0]
                tight_bottom = r_start + card_row_runs[-1][1]
                cards.append((c_start, tight_top, c_end, tight_bottom))

    # Cluster cards into rows (tolerance for y), then sort left-to-right within each row
    if not cards:
        return cards
    # Sort by y first to find row clusters
    cards.sort(key=lambda b: b[1])
    rows = []
    current_row = [cards[0]]
    for card in cards[1:]:
        # If this card's top is within 60px of current row's first card, same row
        if abs(card[1] - current_row[0][1]) < 60:
            current_row.append(card)
        else:
            rows.append(current_row)
            current_row = [card]
    rows.append(current_row)
    # Sort each row by x (left-to-right), then flatten
    sorted_cards = []
    for row in rows:
        row.sort(key=lambda b: b[0])
        sorted_cards.extend(row)
    return sorted_cards


def make_even_grid(img_w, img_h, num_cols, num_rows, padding=30, gap=16):
    """Fallback: generate evenly spaced card regions for a known grid layout."""
    total_gap_x = gap * (num_cols - 1) + padding * 2
    total_gap_y = gap * (num_rows - 1) + padding * 2
    card_w = (img_w - total_gap_x) // num_cols
    card_h = (img_h - total_gap_y) // num_rows
    cards = []
    for r in range(num_rows):
        for c in range(num_cols):
            x1 = padding + c * (card_w + gap)
            y1 = padding + r * (card_h + gap)
            cards.append((x1, y1, x1 + card_w, y1 + card_h))
    return cards


# Known grid layouts: grid_name -> (cols, rows)
KNOWN_LAYOUTS = {
    "env-setting-grid.png": (4, 4),
    "prop-category-grid.png": (6, 2),  # 6 top + 5 bottom, handle separately
}

# Grids that ALWAYS use even grid (dark cards break auto-detection)
FORCE_EVEN_GRID = {
    "env-mood-grid.png": (5, 2),
}


def crop_grid(grid_name, thumb_names):
    grid_path = os.path.join(GRID_DIR, grid_name)
    if not os.path.exists(grid_path):
        print(f"  SKIP {grid_name} (not found)")
        return

    img = Image.open(grid_path).convert("RGB")
    arr = np.array(img)
    expected = len(thumb_names)

    # Force even grid for problematic grids with very dark cards
    if grid_name in FORCE_EVEN_GRID:
        cols, rows_count = FORCE_EVEN_GRID[grid_name]
        cards = make_even_grid(img.width, img.height, cols, rows_count)
        cards = cards[:expected]
        found = len(cards)
        print(f"  Using forced even grid ({cols}x{rows_count})")
    else:
        cards = find_card_bounds(arr)
        found = len(cards)

    if found != expected:
        print(f"  WARNING {grid_name}: expected {expected} cards, found {found}")
        # If we found more, try filtering by minimum size
        if found > expected:
            avg_area = np.mean([(x2-x1)*(y2-y1) for x1,y1,x2,y2 in cards])
            cards = [c for c in cards if (c[2]-c[0])*(c[3]-c[1]) > avg_area * 0.3]
            # Re-cluster into rows after filtering
            cards.sort(key=lambda b: b[1])
            rows = []
            current_row = [cards[0]]
            for card in cards[1:]:
                if abs(card[1] - current_row[0][1]) < 60:
                    current_row.append(card)
                else:
                    rows.append(current_row)
                    current_row = [card]
            rows.append(current_row)
            cards = []
            for row in rows:
                row.sort(key=lambda b: b[0])
                cards.extend(row)
            found = len(cards)
            print(f"    After filtering: {found} cards")

        # Still wrong? Use even grid fallback for known layouts
        if found != expected and grid_name in KNOWN_LAYOUTS:
            cols, rows_count = KNOWN_LAYOUTS[grid_name]
            cards = make_even_grid(img.width, img.height, cols, rows_count)
            # For prop-category (6+5), trim the last cell if needed
            cards = cards[:expected]
            found = len(cards)
            print(f"    Using even grid fallback ({cols}x{rows_count}): {found} cards")

    count = min(found, expected)
    for i in range(count):
        x1, y1, x2, y2 = cards[i]
        thumb = img.crop((x1, y1, x2, y2))
        # Resize to consistent thumb size
        thumb = thumb.resize((300, 300) if (x2-x1) > (y2-y1) * 1.3 else (300, 400) if (y2-y1) > (x2-x1) * 1.3 else (300, 300), Image.LANCZOS)
        out_path = os.path.join(THUMB_DIR, thumb_names[i])
        thumb.save(out_path, "JPEG", quality=90)

    print(f"  OK {grid_name}: cropped {count} thumbs")


if __name__ == "__main__":
    os.makedirs(THUMB_DIR, exist_ok=True)
    for grid_name, thumb_names in GRIDS.items():
        crop_grid(grid_name, thumb_names)
    print("\nDone!")
