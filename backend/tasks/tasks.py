from datetime import timedelta

BaseHonor = 50

PRIORITY_MULTIPLIER = {
    'low': 1.0,
    'medium': 1.2,
    'high': 1.5,
}

DIFFICULTY_MULTIPLIER = {
    'low': 0.8,
    'medium': 1.0,
    'high': 1.3,
}

def total_time_in_work(task):
    total = timedelta()
    for log in task.status_logs.filter(new_status='in_work'):
        start_time = log.timestamp
        end_log = task.status_logs.filter(task=task, old_status='in_work', timestamp__gt=start_time).order_by('timestamp').first()
        end_time = end_log.timestamp if end_log else task.completed_at or task.updated_at
        total += end_time - start_time
    return total

def calculate_exp(task):
    time_spent = total_time_in_work(task)
    hours = int(time_spent.total_seconds() // 3600)
    return 100 * hours

def calculate_honor(task):
    if not task.deadline or not task.created_at or not task.completed_at:
        return 0

    priority = task.priority.lower()
    difficulty = task.difficulty.lower()

    D = (task.deadline - task.created_at).total_seconds() / 3600  # hours to deadline
    ATC = task.approx_time  # in hours
    H = total_time_in_work(task).total_seconds() / 3600  # total hours spent

    Grace = D * 0.1
    is_late = task.completed_at > task.deadline + timedelta(hours=Grace)

    performance_ratio = H / ATC if ATC else 1
    deadline_ratio = H / D if D else 1

    honor = BaseHonor

    if performance_ratio <= 1:
        perf_bonus = (1 - performance_ratio) * BaseHonor
        honor += perf_bonus
    else:
        perf_penalty = (performance_ratio - 1) * BaseHonor
        honor -= perf_penalty

    if not is_late:
        deadline_bonus = (1 - deadline_ratio) * BaseHonor
        honor += deadline_bonus
    else:
        deadline_penalty = (deadline_ratio - 1) * BaseHonor
        honor -= deadline_penalty

    honor *= DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    honor *= PRIORITY_MULTIPLIER.get(priority, 1.0)

    return max(-100, min(200, int(honor)))
