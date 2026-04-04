"""Board position utilities."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Position:
    row: int  # 0-7, 0 = rank 8 (top for Black)
    col: int  # 0-7, 0 = file a

    def is_valid(self) -> bool:
        return 0 <= self.row < 8 and 0 <= self.col < 8

    def __add__(self, other: "Position") -> "Position":
        return Position(self.row + other.row, self.col + other.col)

    def __repr__(self) -> str:
        file_ = chr(ord("a") + self.col)
        rank  = 8 - self.row
        return f"{file_}{rank}"
