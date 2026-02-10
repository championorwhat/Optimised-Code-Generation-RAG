from pipeline.rag_pipeline import RAGPipeline
from utils.logger import log_run
from utils.metrics import compute_metrics

def main():
    print("\n==== RAG-Based Code Generation System ====\n")

    task = input("Enter your coding task/problem statement:\n> ").strip()
    if not task:
        print("Error: Task cannot be empty.")
        return

    language = input("\nEnter programming language (default: Python):\n> ").strip()
    if not language:
        language = "Python"

    mode = input("\nUse Retrieval-Augmented Generation? (y/n, default: y):\n> ").strip().lower()
    use_rag = True if mode in ["", "y", "yes"] else False

    print("\nGenerating optimized solution...\n")

    rag = RAGPipeline()
    output = rag.run(task, language, use_rag=use_rag)

    # ✅ ALWAYS compute metrics before logging
    metrics = compute_metrics(output["code"], output["explanation"])

    print("\n==================== GENERATED CODE ====================\n")
    print(output["code"])

    print("\n==================== EXPLANATION ====================\n")
    print(output["explanation"])

    print("\n==================== METRICS ====================\n")
    for k, v in metrics.items():
        print(f"{k}: {v}")

    log_data = {
        "task": task,
        "language": language,
        "use_rag": use_rag,
        "retrieved_context": output["retrieved_context"],
        "generated_code": output["code"],
        "explanation": output["explanation"],
        "metrics": metrics
    }

    log_path = log_run(log_data)
    print(f"\nRun logged to: {log_path}\n")


if __name__ == "__main__":
    main()
