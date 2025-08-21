build-PlantUMLLayer:
	mkdir -p "$(ARTIFACTS_DIR)/opt"
	
	# Download PlantUML JAR
	curl -L -o "$(ARTIFACTS_DIR)/opt/plantuml.jar" \
		"https://github.com/plantuml/plantuml/releases/download/v1.2024.0/plantuml-1.2024.0.jar"
	
	# Create minimal Graphviz setup for local testing
	mkdir -p "$(ARTIFACTS_DIR)/opt/bin"
	
	# For local testing, create a mock dot executable
	echo '#!/bin/bash' > "$(ARTIFACTS_DIR)/opt/bin/dot"
	echo 'echo "digraph G { A -> B }"' >> "$(ARTIFACTS_DIR)/opt/bin/dot"
	chmod +x "$(ARTIFACTS_DIR)/opt/bin/dot"
	
	# Create fonts directory
	mkdir -p "$(ARTIFACTS_DIR)/opt/fonts"
	
	@echo "PlantUML layer built successfully"