import math

def exp_to_level(exp):
    """Exponential scaling from EXP to level"""
    return int((exp / 100) ** 0.5)

def level_to_exp(level):
    """Reverse: how much EXP is required to hit a level"""
    return int((level ** 2) * 100)

def get_level_badge(level):
    """Return badge type based on level"""
    if level >= 50:
        return "gold"
    elif level >= 30:
        return "silver"
    elif level >= 10:
        return "bronze"
    else:
        return "none"

def get_exp_bar_percent(exp):
    """Returns progress percentage within current level"""
    level = exp_to_level(exp)
    current_level_exp = level_to_exp(level)
    next_level_exp = level_to_exp(level + 1)
    progress = exp - current_level_exp
    total = next_level_exp - current_level_exp
    return int((progress / total) * 100) if total else 0