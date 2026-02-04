#!/usr/bin/env python3
"""Generate a random color image and save it to the output directory."""

import random
from pathlib import Path
from PIL import Image


def generate_random_color():
    """Generate a random RGB color tuple."""
    return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))


def rgb_to_hex(color: tuple[int, int, int]) -> str:
    """Convert an RGB tuple to a hex string (without #)."""
    return f"{color[0]:02x}{color[1]:02x}{color[2]:02x}"


def create_color_image(color, size=(200, 200)):
    """Create a PIL Image filled with the given color."""
    return Image.new("RGB", size, color)


def get_output_dir():
    """Get the output directory path."""
    return Path("/output" if Path("/output").exists() else "./output")


def main():
    output_dir = get_output_dir()
    output_dir.mkdir(exist_ok=True)

    color = generate_random_color()
    hex_code = rgb_to_hex(color)

    output_path = output_dir / f"color_{hex_code}.png"
    create_color_image(color).save(output_path)

    print(f"Color: #{hex_code}")
    print(f"RGB: {color}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
