def clean_output(text: str) -> dict:
    code = ""
    explanation = ""

    if "<CODE>" in text and "</CODE>" in text:
        code = text.split("<CODE>")[1].split("</CODE>")[0].strip()

    if "<EXPLANATION>" in text and "</EXPLANATION>" in text:
        explanation = text.split("<EXPLANATION>")[1].split("</EXPLANATION>")[0].strip()

    return {
        "code": code,
        "explanation": explanation
    }
