#!/usr/bin/env python3
"""Tests for color_generator module."""

import pytest
from color_generator import generate_random_color, rgb_to_hex, create_color_image


class TestGenerateRandomColor:
    def test_returns_tuple_of_three_integers(self):
        color = generate_random_color()
        assert isinstance(color, tuple)
        assert len(color) == 3
        assert all(isinstance(c, int) for c in color)

    def test_values_in_valid_range(self):
        for _ in range(100):
            color = generate_random_color()
            assert all(0 <= c <= 255 for c in color)


class TestRgbToHex:
    def test_black(self):
        assert rgb_to_hex((0, 0, 0)) == "000000"

    def test_white(self):
        assert rgb_to_hex((255, 255, 255)) == "ffffff"

    def test_red(self):
        assert rgb_to_hex((255, 0, 0)) == "ff0000"

    def test_green(self):
        assert rgb_to_hex((0, 255, 0)) == "00ff00"

    def test_blue(self):
        assert rgb_to_hex((0, 0, 255)) == "0000ff"

    def test_arbitrary_color(self):
        assert rgb_to_hex((161, 168, 155)) == "a1a89b"


class TestCreateColorImage:
    def test_default_size(self):
        image = create_color_image((255, 0, 0))
        assert image.size == (200, 200)

    def test_custom_size(self):
        image = create_color_image((255, 0, 0), size=(100, 50))
        assert image.size == (100, 50)

    def test_color_is_applied(self):
        color = (128, 64, 32)
        image = create_color_image(color)
        assert image.getpixel((0, 0)) == color
        assert image.getpixel((100, 100)) == color

    def test_rgb_mode(self):
        image = create_color_image((255, 255, 255))
        assert image.mode == "RGB"
