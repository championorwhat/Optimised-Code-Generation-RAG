def code_generation_prompt(user_task, language, context):
    return f"""
You are a senior software engineer.

TASK:
{user_task}

LANGUAGE:
{language}

REFERENCE CONTEXT:
{context}

STRICT OUTPUT RULES:
- Output MUST follow this format exactly
- NO headings
- NO markdown explanations before code
- NO extra commentary

IMPORTANT RULES:
- Return ONLY valid Python code.
- Define ONLY functions or classes.
- DO NOT include print statements.
- DO NOT include example usage or test calls.
- The function must RETURN values, not print them.

FORMAT:
<CODE>
{language.lower()} code only
</CODE>

<EXPLANATION>
Maximum 4 lines explaining the optimization
</EXPLANATION>

Generate optimized, production-quality code.
"""
