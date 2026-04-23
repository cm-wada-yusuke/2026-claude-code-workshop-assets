"""曜日×時限の週マップを Rich Table で描画する."""

from __future__ import annotations

from rich.table import Table
from rich.text import Text

from .conflict import Conflict
from .loader import Course, VALID_DAYS

PERIODS = (1, 2, 3, 4, 5)


def build_timetable(courses: list[Course], conflicts: list[Conflict]) -> Table:
    conflict_cells = {(c.day, c.period) for c in conflicts}

    # (day, period) -> [course, ...]
    grid: dict[tuple[str, int], list[Course]] = {}
    for c in courses:
        grid.setdefault((c.day, c.period), []).append(c)

    table = Table(title="週間マップ", show_lines=True, title_style="bold")
    table.add_column("時限", justify="center", style="bold")
    for day in VALID_DAYS:
        table.add_column(day, justify="center")

    for period in PERIODS:
        row: list[Text | str] = [str(period)]
        for day in VALID_DAYS:
            cell = grid.get((day, period), [])
            if (day, period) in conflict_cells:
                ids = "/".join(c.id for c in cell)
                row.append(Text(f"[衝突] {ids}", style="bold red"))
            elif not cell:
                row.append(Text("—", style="dim"))
            else:
                row.append(cell[0].id)
        table.add_row(*row)

    return table
