"""category 別の単位数集計と、衝突解消後の見込みを算出する."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from .conflict import Conflict
from .loader import Course


PRIORITY_RANK = {"high": 0, "medium": 1, "low": 2}


@dataclass(frozen=True)
class CategoryCredits:
    category: str
    raw_credits: int
    resolved_credits: int


@dataclass(frozen=True)
class CreditSummary:
    per_category: tuple[CategoryCredits, ...]
    raw_total: int
    resolved_total: int
    has_conflict: bool


def summarize_credits(
    courses: list[Course], conflicts: list[Conflict]
) -> CreditSummary:
    dropped = _dropped_course_ids(conflicts)
    resolved = [c for c in courses if c.id not in dropped]

    raw_by_cat: dict[str, int] = defaultdict(int)
    resolved_by_cat: dict[str, int] = defaultdict(int)
    for c in courses:
        raw_by_cat[c.category] += c.credits
    for c in resolved:
        resolved_by_cat[c.category] += c.credits

    # 出現順を保ちつつ集計
    ordered_categories: list[str] = []
    seen: set[str] = set()
    for c in courses:
        if c.category not in seen:
            seen.add(c.category)
            ordered_categories.append(c.category)

    per_category = tuple(
        CategoryCredits(
            category=cat,
            raw_credits=raw_by_cat[cat],
            resolved_credits=resolved_by_cat.get(cat, 0),
        )
        for cat in ordered_categories
    )

    return CreditSummary(
        per_category=per_category,
        raw_total=sum(c.credits for c in courses),
        resolved_total=sum(c.credits for c in resolved),
        has_conflict=bool(conflicts),
    )


def _dropped_course_ids(conflicts: list[Conflict]) -> set[str]:
    """各衝突について priority 最上位を1件残し、残りを drop 対象として返す."""
    dropped: set[str] = set()
    for conflict in conflicts:
        sorted_courses = sorted(
            conflict.courses, key=lambda c: PRIORITY_RANK.get(c.priority, 99)
        )
        keep = sorted_courses[0]
        for c in conflict.courses:
            if c.id != keep.id:
                dropped.add(c.id)
    return dropped
