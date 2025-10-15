#!/bin/bash
# File: generate_dependency_graph.sh
# PRF-COMPLIANT: Generates a dependency graph for App.tsx, services, and types

OUTPUT_DOT="dependency_graph.dot"
echo "digraph G {" > $OUTPUT_DOT
echo '  rankdir=LR;' >> $OUTPUT_DOT
echo '  node [shape=box, style=filled, color=lightblue];' >> $OUTPUT_DOT

# Map App.tsx dependencies
APP_FILE="src/App.tsx"
echo "  \"App.tsx\";" >> $OUTPUT_DOT

# Extract services imports from App.tsx
grep -oP "from '\.\./services/\K[^']+" $APP_FILE | while read service; do
    echo "  \"$service\";" >> $OUTPUT_DOT
    echo "  \"App.tsx\" -> \"$service\";" >> $OUTPUT_DOT
done

# Map service dependencies on types
for service_file in services/*.ts; do
    echo "  \"$(basename $service_file)\";" >> $OUTPUT_DOT
    grep -oP "from '\.\./types'\K[^']*" $service_file >/dev/null  # confirms types usage
    if [ $? -eq 0 ]; then
        echo "  \"types.ts\";" >> $OUTPUT_DOT
        echo "  \"$(basename $service_file)\" -> \"types.ts\";" >> $OUTPUT_DOT
    fi
done

echo "}" >> $OUTPUT_DOT
echo "DOT file generated at $OUTPUT_DOT"

# Generate PNG graph
dot -Tpng $OUTPUT_DOT -o dependency_graph.png
echo "Graph image generated at dependency_graph.png"
