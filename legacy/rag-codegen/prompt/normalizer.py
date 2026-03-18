def normalize_prompt(user_task: str) -> dict:
    task = user_task.lower()

    intent = "general"
    inferred_constraints = []

    if "sum of n" in task or "sum n" in task:
        if "array" in task or "list" in task:
            intent = "sum_array"
        else:
            intent = "sum_first_n"
            inferred_constraints.append("Prefer mathematical formula over loops")

    if "duplicate" in task:
        intent = "find_duplicates"
        inferred_constraints.append("Optimize for O(n) time")

    if "substring" in task:
        intent = "string_problem"
        inferred_constraints.append("Use sliding window technique")

    return {
        "intent": intent,
        "constraints": inferred_constraints
    }
