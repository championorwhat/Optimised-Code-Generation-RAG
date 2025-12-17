def chunk_code(document, max_lines=40):
    lines = document["text"].splitlines()
    chunks = []

    current_chunk = []

    for line in lines:
        current_chunk.append(line)
        if len(current_chunk) >= max_lines:
            chunks.append({
                "text": "\n".join(current_chunk),
                "language": document["language"],
                "category": document["category"]
            })
            current_chunk = []

    if current_chunk:
        chunks.append({
            "text": "\n".join(current_chunk),
            "language": document["language"],
            "category": document["category"]
        })

    return chunks
