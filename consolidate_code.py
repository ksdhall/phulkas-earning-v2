import os

def consolidate_code(root_dir):
    """
    Traverses the given directory and its subdirectories to consolidate
    the content of .tsx, .ts, and .json files into a single string.
    Excludes specific files and directories.
    Each file's content is prefixed with its path and type.
    """
    consolidated_output = []
    
    # Define file types to include
    file_types = {
        '.tsx': 'typescript-react',
        '.ts': 'typescript',
        '.json': 'json',
        '.prisma': 'prisma' # Include prisma schema files
    }

    # Directories to exclude from traversal
    excluded_dirs = ['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage']
    
    # Specific filenames to exclude regardless of directory
    excluded_filenames = [
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', # Package manager lock files
        'tsconfig.json', 'tsconfig.ts-node.json', 'next-env.d.ts', # TypeScript config and Next.js types
        'jest.config.ts', 'babel.config.js', 'next.config.js', # Build/test configs
        'postcss.config.js', 'tailwind.config.js', # CSS configs
        'README.md', 'LICENSE', '.gitignore', '.env', '.env.local', # Documentation and environment files
        'middleware.ts', # Next.js middleware, often stable
        'auth.ts', # Next-Auth setup, usually stable
        'routing.ts', # next-intl routing, usually stable
        'request.ts' # next-intl request config, usually stable
    ]

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Filter out excluded directories for the current level
        dirnames[:] = [d for d in dirnames if d not in excluded_dirs]
        
        for filename in filenames:
            if filename in excluded_filenames:
                continue # Skip explicitly excluded files

            file_extension = os.path.splitext(filename)[1]
            
            # Special handling for 'schema.prisma' which doesn't have a .prisma extension
            if filename == 'schema.prisma':
                file_type_to_use = 'prisma'
            elif file_extension in file_types:
                file_type_to_use = file_types[file_extension]
            else:
                continue # Skip files with unlisted extensions

            file_path = os.path.join(dirpath, filename)
            relative_path = os.path.relpath(file_path, root_dir)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Format the output for easy parsing and context
                consolidated_output.append(f"--- FILE_START ---\n")
                consolidated_output.append(f"PATH: {relative_path}\n")
                consolidated_output.append(f"TYPE: {file_type_to_use}\n")
                consolidated_output.append(f"CONTENT:\n```\n{content}\n```\n")
                consolidated_output.append(f"--- FILE_END ---\n\n")
            except Exception as e:
                consolidated_output.append(f"--- FILE_START ---\n")
                consolidated_output.append(f"PATH: {relative_path}\n")
                consolidated_output.append(f"TYPE: {file_type_to_use}\n")
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
