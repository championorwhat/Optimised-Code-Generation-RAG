def find_duplicates(nums):
    """
    LeetCode-style solution.
    Time: O(n)
    Space: O(n)
    """
    seen = set()
    duplicates = set()

    for n in nums:
        if n in seen:
            duplicates.add(n)
        else:
            seen.add(n)

    return list(duplicates)
