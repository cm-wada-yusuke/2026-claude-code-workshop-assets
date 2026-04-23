"""CSV の読み込み・型変換・バリデーション."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


VALID_DAYS = ("月", "火", "水", "木", "金")
VALID_PRIORITIES = ("high", "medium", "low")
REQUIRED_COLUMNS = ("id", "name", "day", "period", "credits", "category")


@dataclass(frozen=True)
class Course:
    id: str
    name: str
    day: str
    period: int
    credits: int
    category: str
    priority: str = "medium"


class CourseLoadError(Exception):
    """CSV 読み込み時の検証エラー."""


def load_courses(csv_path: str | Path) -> list[Course]:
    path = Path(csv_path)
    if not path.exists():
        raise CourseLoadError(f"CSV が見つかりません: {path}")

    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise CourseLoadError("CSV にヘッダー行がありません")

        missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
        if missing:
            raise CourseLoadError(f"必須カラムが不足しています: {', '.join(missing)}")

        courses: list[Course] = []
        for line_no, row in enumerate(reader, start=2):
            courses.append(_build_course(row, line_no))

    _ensure_unique_ids(courses)
    return courses


def _build_course(row: dict[str, str], line_no: int) -> Course:
    def required(key: str) -> str:
        value = (row.get(key) or "").strip()
        if not value:
            raise CourseLoadError(f"{line_no}行目: '{key}' が空です")
        return value

    day = required("day")
    if day not in VALID_DAYS:
        raise CourseLoadError(
            f"{line_no}行目: day は {'/'.join(VALID_DAYS)} のいずれかです（実際: {day!r}）"
        )

    try:
        period = int(required("period"))
    except ValueError as e:
        raise CourseLoadError(f"{line_no}行目: period は整数で指定してください") from e

    try:
        credits = int(required("credits"))
    except ValueError as e:
        raise CourseLoadError(f"{line_no}行目: credits は整数で指定してください") from e

    priority = (row.get("priority") or "medium").strip() or "medium"
    if priority not in VALID_PRIORITIES:
        raise CourseLoadError(
            f"{line_no}行目: priority は {'/'.join(VALID_PRIORITIES)} のいずれかです（実際: {priority!r}）"
        )

    return Course(
        id=required("id"),
        name=required("name"),
        day=day,
        period=period,
        credits=credits,
        category=required("category"),
        priority=priority,
    )


def _ensure_unique_ids(courses: list[Course]) -> None:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for c in courses:
        if c.id in seen:
            duplicates.add(c.id)
        seen.add(c.id)
    if duplicates:
        raise CourseLoadError(
            "id が重複しています: " + ", ".join(sorted(duplicates))
        )
