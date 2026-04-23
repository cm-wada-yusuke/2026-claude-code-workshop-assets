"""jiji の CLI エントリポイント."""

from __future__ import annotations

import sys
import unicodedata

import click
from rich.console import Console

from .conflict import Conflict, detect_conflicts
from .loader import CourseLoadError, load_courses
from .summary import CreditSummary, summarize_credits
from .timetable import build_timetable


console = Console()


@click.group()
@click.version_option()
def main() -> None:
    """履修候補CSVから時間割を分析する."""


@main.command()
@click.argument("csv_path", type=click.Path(dir_okay=False, readable=True))
def check(csv_path: str) -> None:
    """衝突 → 週マップ → 単位数サマリを表示する."""
    try:
        courses = load_courses(csv_path)
    except CourseLoadError as e:
        console.print(f"[bold red]読み込みエラー:[/bold red] {e}")
        sys.exit(1)

    conflicts = detect_conflicts(courses)
    _render_conflicts(conflicts)
    console.print()
    console.print(build_timetable(courses, conflicts))
    console.print()
    _render_summary(summarize_credits(courses, conflicts))


def _render_conflicts(conflicts: list[Conflict]) -> None:
    if not conflicts:
        console.print("[bold green][OK][/bold green] 時間割の衝突はありません")
        return

    for c in conflicts:
        console.print(f"[bold red][衝突][/bold red] {c.day}{c.period}限")
        for course in c.courses:
            console.print(
                f"  - {course.id} {course.name}     (priority: {course.priority})"
            )
        console.print("  [dim]→ どれか1科目を選択してください[/dim]")


def _render_summary(summary: CreditSummary) -> None:
    console.print("[bold]単位数サマリ:[/bold]")
    labels = [c.category for c in summary.per_category] + ["合計"]
    width = max((_visual_width(s) for s in labels), default=8)

    for cat in summary.per_category:
        label = f"  {_pad(cat.category, width)} : {cat.raw_credits:>2} 単位"
        if summary.has_conflict and cat.resolved_credits != cat.raw_credits:
            label += f"  [dim](※衝突解消後は {cat.resolved_credits} 単位)[/dim]"
        console.print(label)

    console.print("  " + "─" * (width + 12))
    total = f"  {_pad('合計', width)} : {summary.raw_total:>2} 単位"
    if summary.has_conflict and summary.resolved_total != summary.raw_total:
        total += f"  [dim](衝突解消後: {summary.resolved_total} 単位)[/dim]"
    console.print(f"[bold]{total}[/bold]")


def _visual_width(s: str) -> int:
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in s)


def _pad(s: str, width: int) -> str:
    return s + " " * max(0, width - _visual_width(s))


if __name__ == "__main__":
    main()
