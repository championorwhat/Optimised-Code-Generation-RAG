# EGRR Pipeline

Execution-Grounded Retrieval Refinement Pipeline for Code Generation.

## Overview

This system uses an iterative RAG pipeline with execution feedback to generate high-quality code.

## Quick Start

```bash
# Install dependencies
poetry install

# Configure environment
cp .env.example .env
# Edit .env with your HF_API_KEY

# Run server
poetry run uvicorn src.main:app --reload
```

## Architecture

See `EGRR_BUILD_GUIDE.md` in parent directory for full documentation.
