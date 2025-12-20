from reviewer.oracles.base import CanonicalOracle


class FibonacciOracle(CanonicalOracle):
    """
    Canonical oracle for Fibonacci series.
    """

    def expected(self, **inputs):
        # Normalize input
        if not inputs:
            n = 0
        else:
            # Accept any single argument key
            n = next(iter(inputs.values()))

        try:
            n = int(n)
        except Exception:
            return None

        if n <= 0:
            return []
        if n == 1:
            return [0]
        if n == 2:
            return [0, 1]

        fib = [0, 1]
        while len(fib) < n:
            fib.append(fib[-1] + fib[-2])

        return fib
