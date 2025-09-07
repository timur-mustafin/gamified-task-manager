import humanize
from django.utils.timezone import localtime

def format_timestamp(dt):
    if not dt:
        return None

    dt_local = localtime(dt)
    exact = dt_local.strftime("%I:%M %p, %m/%d/%Y").lstrip("0").replace(" 0", " ")
    relative = humanize.naturaltime(dt_local)
    return f"{exact} — {relative}"
    