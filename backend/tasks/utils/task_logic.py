from datetime import timedelta
from django.utils import timezone

BASE_HONOR = 50

PRIORITY_MULTIPLIER = {
    'low': 1.0,
    'medium': 1.2,
    'high': 1.5
}

DIFFICULTY_MULTIPLIER = {
    'low': 0.8,
    'medium': 1.0,
    'high': 1.3
}

def total_time_in_work(task):
    logs = task.status_logs.filter(new_status='in_work').order_by('timestamp')
    total_time = timedelta()

    for i in range(0, len(logs) - 1, 2):
        start = logs[i].timestamp
        end = logs[i + 1].timestamp
        total_time += end - start

    # If still in work now (unclosed session)
    if len(logs) % 2 == 1:
        total_time += timezone.now() - logs[-1].timestamp

    return total_time.total_seconds() / 3600  # hours (float)

def calculate_exp(task):
    hours_spent = total_time_in_work(task)
    return int(hours_spent * 100)

def calculate_honor(task):
    priority = task.priority
    difficulty = task.difficulty
    ATC = task.approx_time or 1
    H = total_time_in_work(task)
    D = ((task.deadline - task.created_at).total_seconds() / 3600) if task.deadline else ATC
    Grace = D * 0.1

    is_late = task.deadline and timezone.now() > task.deadline
    perf_ratio = H / ATC
    deadline_ratio = H / D if D else 1

    perf_bonus = deadline_bonus = perf_penalty = deadline_penalty = 0

    if perf_ratio <= 1:
        perf_bonus = (1 - perf_ratio) * BASE_HONOR
    else:
        perf_penalty = (perf_ratio - 1) * BASE_HONOR

    if not is_late:
        deadline_bonus = (1 - deadline_ratio) * BASE_HONOR
    else:
        deadline_penalty = (deadline_ratio - 1) * BASE_HONOR

    honor = BASE_HONOR
    honor += (perf_bonus + deadline_bonus) if not is_late else -(perf_penalty + deadline_penalty)
    honor *= DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    honor *= PRIORITY_MULTIPLIER.get(priority, 1.0)

    return max(-100, min(200, int(honor)))
