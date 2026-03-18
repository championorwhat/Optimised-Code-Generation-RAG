def get_test_cases(intent: str):
    """
    Return canonical test cases based on inferred intent.
    """

    if intent == "sum_first_n":
        return [
            {
                "name": "n_equals_0",
                "input": {"n": 0},
                "expected": 0,
            },
            {
                "name": "n_equals_1",
                "input": {"n": 1},
                "expected": 1,
            },
            {
                "name": "n_equals_5",
                "input": {"n": 5},
                "expected": 15,
            },
        ]

    if intent == "find_duplicates":
        return [
            {
                "name": "basic_case",
                "input": {"nums": [1, 2, 3, 2]},
                "expected": [2],
            },
            {
                "name": "no_duplicates",
                "input": {"nums": [1, 2, 3]},
                "expected": [],
            },
        ]
    if intent == "fibonacci":
        return [
            {
                "name": "n_0",
                "input": {"n": 0},
                "expected": []
            },
            {
                "name": "n_1",
                "input": {"n": 1},
                "expected": [0]
            },
            {
                "name": "n_5",
                "input": {"n": 5},
                "expected": [0, 1, 1, 2, 3]
            },
            {
                "name": "n_negative",
                "input": {"n": -3},
                "expected": []
            }
        ]

    # Fallback: no canonical tests available
    return []
