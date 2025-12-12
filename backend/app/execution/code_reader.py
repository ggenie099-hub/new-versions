"""
Code Reader Module

This module provides comprehensive code reading functionality including:
- Source file parsing and analysis
- Dependency identification and resolution
- Code structure validation and syntax checking
- Multi-language support
"""

import ast
import os
import re
import json
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Set, Union, Any
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class LanguageType(Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    GO = "go"
    RUST = "rust"
    UNKNOWN = "unknown"


@dataclass
class Dependency:
    """Represents a code dependency"""
    name: str
    version: Optional[str] = None
    source: str = "unknown"  # pip, npm, maven, etc.
    required: bool = True
    installed: bool = False


@dataclass
class CodeFile:
    """Represents a source code file"""
    path: Path
    language: LanguageType
    content: str
    size: int
    encoding: str = "utf-8"
    syntax_valid: bool = False
    dependencies: List[Dependency] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    functions: List[str] = field(default_factory=list)
    classes: List[str] = field(default_factory=list)
    entry_points: List[str] = field(default_factory=list)


@dataclass
class ProjectStructure:
    """Represents the overall project structure"""
    root_path: Path
    files: List[CodeFile] = field(default_factory=list)
    dependencies: Set[Dependency] = field(default_factory=set)
    main_language: Optional[LanguageType] = None
    entry_point: Optional[Path] = None
    config_files: List[Path] = field(default_factory=list)


class CodeReader:
    """Main code reader class for analyzing source code"""
    
    def __init__(self):
        self.language_extensions = {
            '.py': LanguageType.PYTHON,
            '.js': LanguageType.JAVASCRIPT,
            '.ts': LanguageType.TYPESCRIPT,
            '.jsx': LanguageType.JAVASCRIPT,
            '.tsx': LanguageType.TYPESCRIPT,
            '.java': LanguageType.JAVA,
            '.cpp': LanguageType.CPP,
            '.cc': LanguageType.CPP,
            '.cxx': LanguageType.CPP,
            '.c': LanguageType.C,
            '.go': LanguageType.GO,
            '.rs': LanguageType.RUST,
        }
        
        self.config_files = {
            'requirements.txt': LanguageType.PYTHON,
            'pyproject.toml': LanguageType.PYTHON,
            'setup.py': LanguageType.PYTHON,
            'package.json': LanguageType.JAVASCRIPT,
            'package-lock.json': LanguageType.JAVASCRIPT,
            'yarn.lock': LanguageType.JAVASCRIPT,
            'pom.xml': LanguageType.JAVA,
            'build.gradle': LanguageType.JAVA,
            'go.mod': LanguageType.GO,
            'Cargo.toml': LanguageType.RUST,
        }

    def detect_language(self, file_path: Path) -> LanguageType:
        """Detect programming language from file extension"""
        extension = file_path.suffix.lower()
        return self.language_extensions.get(extension, LanguageType.UNKNOWN)

    def read_file_content(self, file_path: Path) -> tuple[str, str]:
        """Read file content with encoding detection"""
        encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                return content, encoding
            except UnicodeDecodeError:
                continue
        
        # Fallback to binary read if all encodings fail
        with open(file_path, 'rb') as f:
            content = f.read()
        return content.decode('utf-8', errors='ignore'), 'utf-8'

    def validate_syntax(self, content: str, language: LanguageType) -> bool:
        """Validate syntax for different programming languages"""
        try:
            if language == LanguageType.PYTHON:
                ast.parse(content)
                return True
            elif language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
                # Use node.js to validate syntax if available
                return self._validate_js_syntax(content)
            elif language == LanguageType.JAVA:
                return self._validate_java_syntax(content)
            elif language == LanguageType.GO:
                return self._validate_go_syntax(content)
            else:
                # For unsupported languages, assume valid
                return True
        except Exception as e:
            logger.warning(f"Syntax validation failed: {e}")
            return False

    def _validate_js_syntax(self, content: str) -> bool:
        """Validate JavaScript/TypeScript syntax using node"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(content)
                temp_file = f.name
            
            result = subprocess.run(
                ['node', '--check', temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            os.unlink(temp_file)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return True  # Assume valid if node is not available

    def _validate_java_syntax(self, content: str) -> bool:
        """Basic Java syntax validation"""
        # Simple heuristic checks for Java
        java_keywords = ['class', 'public', 'private', 'protected', 'static']
        has_keywords = any(keyword in content for keyword in java_keywords)
        
        # Check for balanced braces
        open_braces = content.count('{')
        close_braces = content.count('}')
        
        return has_keywords and open_braces == close_braces

    def _validate_go_syntax(self, content: str) -> bool:
        """Validate Go syntax using go fmt"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.go', delete=False) as f:
                f.write(content)
                temp_file = f.name
            
            result = subprocess.run(
                ['go', 'fmt', temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            os.unlink(temp_file)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return True  # Assume valid if go is not available

    def extract_python_info(self, content: str) -> Dict[str, List[str]]:
        """Extract Python-specific information"""
        try:
            tree = ast.parse(content)
            
            imports = []
            functions = []
            classes = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
                elif isinstance(node, ast.FunctionDef):
                    functions.append(node.name)
                elif isinstance(node, ast.ClassDef):
                    classes.append(node.name)
            
            return {
                'imports': imports,
                'functions': functions,
                'classes': classes
            }
        except Exception as e:
            logger.warning(f"Failed to extract Python info: {e}")
            return {'imports': [], 'functions': [], 'classes': []}

    def extract_javascript_info(self, content: str) -> Dict[str, List[str]]:
        """Extract JavaScript/TypeScript information using regex"""
        imports = []
        functions = []
        classes = []
        
        # Extract imports/requires
        import_patterns = [
            r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
            r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            imports.extend(matches)
        
        # Extract function declarations
        function_patterns = [
            r'function\s+(\w+)\s*\(',
            r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>',
            r'let\s+(\w+)\s*=\s*\([^)]*\)\s*=>',
            r'var\s+(\w+)\s*=\s*function'
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, content)
            functions.extend(matches)
        
        # Extract class declarations
        class_matches = re.findall(r'class\s+(\w+)', content)
        classes.extend(class_matches)
        
        return {
            'imports': imports,
            'functions': functions,
            'classes': classes
        }

    def parse_dependencies_from_file(self, file_path: Path) -> List[Dependency]:
        """Parse dependencies from configuration files"""
        dependencies = []
        
        if file_path.name == 'requirements.txt':
            dependencies.extend(self._parse_requirements_txt(file_path))
        elif file_path.name == 'package.json':
            dependencies.extend(self._parse_package_json(file_path))
        elif file_path.name == 'go.mod':
            dependencies.extend(self._parse_go_mod(file_path))
        elif file_path.name == 'Cargo.toml':
            dependencies.extend(self._parse_cargo_toml(file_path))
        
        return dependencies

    def _parse_requirements_txt(self, file_path: Path) -> List[Dependency]:
        """Parse Python requirements.txt file"""
        dependencies = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Parse package==version format
                        if '==' in line:
                            name, version = line.split('==', 1)
                            dependencies.append(Dependency(name.strip(), version.strip(), 'pip'))
                        else:
                            dependencies.append(Dependency(line, source='pip'))
        except Exception as e:
            logger.warning(f"Failed to parse requirements.txt: {e}")
        
        return dependencies

    def _parse_package_json(self, file_path: Path) -> List[Dependency]:
        """Parse Node.js package.json file"""
        dependencies = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Parse dependencies and devDependencies
            for dep_type in ['dependencies', 'devDependencies']:
                if dep_type in data:
                    for name, version in data[dep_type].items():
                        required = dep_type == 'dependencies'
                        dependencies.append(Dependency(name, version, 'npm', required))
        
        except Exception as e:
            logger.warning(f"Failed to parse package.json: {e}")
        
        return dependencies

    def _parse_go_mod(self, file_path: Path) -> List[Dependency]:
        """Parse Go go.mod file"""
        dependencies = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract require statements
            require_pattern = r'require\s+([^\s]+)\s+([^\s]+)'
            matches = re.findall(require_pattern, content)
            
            for name, version in matches:
                dependencies.append(Dependency(name, version, 'go'))
        
        except Exception as e:
            logger.warning(f"Failed to parse go.mod: {e}")
        
        return dependencies

    def _parse_cargo_toml(self, file_path: Path) -> List[Dependency]:
        """Parse Rust Cargo.toml file"""
        dependencies = []
        try:
            import toml
            with open(file_path, 'r', encoding='utf-8') as f:
                data = toml.load(f)
            
            if 'dependencies' in data:
                for name, version_info in data['dependencies'].items():
                    if isinstance(version_info, str):
                        version = version_info
                    elif isinstance(version_info, dict):
                        version = version_info.get('version', 'latest')
                    else:
                        version = 'latest'
                    
                    dependencies.append(Dependency(name, version, 'cargo'))
        
        except Exception as e:
            logger.warning(f"Failed to parse Cargo.toml: {e}")
        
        return dependencies

    def analyze_file(self, file_path: Path) -> CodeFile:
        """Analyze a single source code file"""
        content, encoding = self.read_file_content(file_path)
        language = self.detect_language(file_path)
        
        code_file = CodeFile(
            path=file_path,
            language=language,
            content=content,
            size=len(content),
            encoding=encoding
        )
        
        # Validate syntax
        code_file.syntax_valid = self.validate_syntax(content, language)
        
        # Extract language-specific information
        if language == LanguageType.PYTHON:
            info = self.extract_python_info(content)
        elif language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
            info = self.extract_javascript_info(content)
        else:
            info = {'imports': [], 'functions': [], 'classes': []}
        
        code_file.imports = info['imports']
        code_file.functions = info['functions']
        code_file.classes = info['classes']
        
        # Detect entry points
        if language == LanguageType.PYTHON and '__main__' in content:
            code_file.entry_points.append('__main__')
        elif language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
            if 'main(' in content or 'exports' in content:
                code_file.entry_points.append('main')
        
        return code_file

    def analyze_project(self, project_path: Path) -> ProjectStructure:
        """Analyze an entire project directory"""
        project = ProjectStructure(root_path=project_path)
        
        # Walk through all files in the project
        for root, dirs, files in os.walk(project_path):
            # Skip common ignore directories
            dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.next', 'target', 'build'}]
            
            for file in files:
                file_path = Path(root) / file
                
                # Check if it's a configuration file
                if file in self.config_files:
                    project.config_files.append(file_path)
                    dependencies = self.parse_dependencies_from_file(file_path)
                    project.dependencies.update(dependencies)
                
                # Check if it's a source code file
                language = self.detect_language(file_path)
                if language != LanguageType.UNKNOWN:
                    try:
                        code_file = self.analyze_file(file_path)
                        project.files.append(code_file)
                    except Exception as e:
                        logger.warning(f"Failed to analyze {file_path}: {e}")
        
        # Determine main language
        if project.files:
            language_counts = {}
            for file in project.files:
                language_counts[file.language] = language_counts.get(file.language, 0) + 1
            
            project.main_language = max(language_counts, key=language_counts.get)
        
        # Try to detect entry point
        project.entry_point = self._detect_entry_point(project)
        
        return project

    def _detect_entry_point(self, project: ProjectStructure) -> Optional[Path]:
        """Detect the main entry point of the project"""
        # Common entry point file names
        entry_candidates = [
            'main.py', 'app.py', 'run.py', '__main__.py',
            'index.js', 'main.js', 'app.js', 'server.js',
            'main.go', 'main.java', 'Main.java'
        ]
        
        for file in project.files:
            if file.path.name in entry_candidates:
                return file.path
            
            # Check for files with entry points
            if file.entry_points:
                return file.path
        
        return None

    def get_project_summary(self, project: ProjectStructure) -> Dict[str, Any]:
        """Generate a summary of the project analysis"""
        return {
            'root_path': str(project.root_path),
            'main_language': project.main_language.value if project.main_language else None,
            'entry_point': str(project.entry_point) if project.entry_point else None,
            'total_files': len(project.files),
            'total_dependencies': len(project.dependencies),
            'languages_used': list(set(f.language.value for f in project.files)),
            'config_files': [str(f) for f in project.config_files],
            'syntax_errors': [str(f.path) for f in project.files if not f.syntax_valid],
            'total_size': sum(f.size for f in project.files)
        }