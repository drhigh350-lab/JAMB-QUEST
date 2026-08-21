import ast
import json
import sys
from pathlib import Path

def main() -> None:
    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    module = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path), mode="exec")
    assignments = []
    ignored_prints = []
    for node in module.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) and "EXPLANATIONS" in node.targets[0].id.upper():
            assignments.append(node)
        elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name) and node.value.func.id == "print":
            ignored_prints.append(node)
        elif isinstance(node, (ast.Expr, ast.Pass)) and (isinstance(node, ast.Pass) or isinstance(node.value, ast.Constant)):
            continue
        elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            continue
        else:
            raise ValueError(f"Unsupported executable or non-literal top-level node: {type(node).__name__}")
    if len(assignments) != 1:
        raise ValueError(f"Expected exactly one EXPLANATIONS-like literal assignment, found {len(assignments)}")
    explanations = ast.literal_eval(assignments[0].value)
    if not isinstance(explanations, dict) or not all(isinstance(key, str) and isinstance(value, str) for key, value in explanations.items()):
        raise ValueError("The explanation assignment must be a string-to-string literal dictionary")
    output = {
        "source": source_path.name,
        "assignment": assignments[0].targets[0].id,
        "recordCount": len(explanations),
        "ids": sorted(explanations),
        "minCharacters": min((len(value) for value in explanations.values()), default=0),
        "maxCharacters": max((len(value) for value in explanations.values()), default=0),
        "ignoredStatusPrintCount": len(ignored_prints),
        "explanations": explanations,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
