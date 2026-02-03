#!/usr/bin/env python3
"""Generate a random color image and save it to the output directory."""

import random
from pathlib import Path
from PIL import Image


def main():
    output_dir = Path("/output" if Path("/output").exists() else "./output")
    output_dir.mkdir(exist_ok=True)

    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    hex_code = f"{color[0]:02x}{color[1]:02x}{color[2]:02x}"

    output_path = output_dir / f"color_{hex_code}.png"
    Image.new("RGB", (200, 200), color).save(output_path)

    print(f"Color: #{hex_code}")
    print(f"RGB: {color}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
