import os

def consolidate_code(root_dir):
    """
    Traverses the given directory and its subdirectories to consolidate
    the content of .tsx, .ts, and .json files into a single string.
    Each file's content is prefixed with its path and type.
    """
    consolidated_output = []
    
    # Define file types to include
    file_types = {
        '.tsx': 'typescript-react',
        '.ts': 'typescript',
        '.json': 'json'
    }

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Exclude node_modules and .next directories
        dirnames[:] = [d for d in dirnames if d not in ['node_modules', '.next', '.git']]
        
        for filename in filenames:
            file_extension = os.path.splitext(filename)[1]
            if file_extension in file_types:
                file_path = os.path.join(dirpath, filename)
                relative_path = os.path.relpath(file_path, root_dir)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Format the output for easy parsing and context
                    consolidated_output.append(f"--- FILE_START ---\n")
                    consolidated_output.append(f"PATH: {relative_path}\n")
                    consolidated_output.append(f"TYPE: {file_types[file_extension]}\n")
                    consolidated_output.append(f"CONTENT:\n```\n{content}\n```\n")
                    consolidated_output.append(f"--- FILE_END ---\n\n")
                except Exception as e:
                    consolidated_output.append(f"--- FILE_START ---\n")
                    consolidated_output.append(f"PATH: {relative_path}\n")
                    consolidated_output.append(f"TYPE: {file_types[file_extension]}\n")
                    consolidated_output.append(f"ERROR: Could not read file - {e}\n")
                    consolidated_output.append(f"--- FILE_END ---\n\n")
    
    return "".join(consolidated_output)

if __name__ == "__main__":
    # Assuming the script is run from the root of your project
    project_root = os.getcwd() 
    
    print("Generating consolidated code output...\n")
    full_code_context = consolidate_code(project_root)
    print(full_code_context)
    print("Consolidation complete. You can copy the above output.")

