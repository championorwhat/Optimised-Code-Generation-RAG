from reviewer.oracles.fibonacci import FibonacciOracle


ORACLE_REGISTRY = {
    "fibonacci": FibonacciOracle(),
    "general": FibonacciOracle(),   # 👈 ADD THIS
}


def get_oracle(intent: str):
    return ORACLE_REGISTRY.get(intent)
