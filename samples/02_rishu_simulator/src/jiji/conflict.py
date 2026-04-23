"""(day, period) が重複する科目を検出する."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from .loader import Course


@dataclass(frozen=True)
class Conflict:
    day: str
    period: int
    courses: tuple[Course, ...]


def detect_conflicts(courses: list[Course]) -> list[Conflict]:
    buckets: dict[tuple[str, int], list[Course]] = defaultdict(list)
    for c in courses:
        buckets[(c.day, c.period)].append(c)

    conflicts: list[Conflict] = []
    for (day, period), group in buckets.items():
        if len(group) >= 2:
            conflicts.append(Conflict(day=day, period=period, courses=tuple(group)))

    # 曜日→時限の順にソート
    from .loader import VALID_DAYS

    day_order = {d: i for i, d in enumerate(VALID_DAYS)}
    conflicts.sort(key=lambda c: (day_order.get(c.day, 99), c.period))
    return conflicts
