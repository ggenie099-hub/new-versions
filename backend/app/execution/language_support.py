"""
Multi-Language Support for Application Execution System

This module provides comprehensive support for multiple programming languages,
including language detection, environment setup, compilation, and execution.
"""

import os
import subprocess
import shutil
import tempfile
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum
import json
import logging


class LanguageType(Enum):
    """Supported programming languages."""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"
    UNKNOWN = "unknown"


class CompilationType(Enum):
    """Types of compilation required."""
    NONE = "none"          # Interpreted languages
    COMPILE = "compile"    # Compiled languages
    TRANSPILE = "transpile"  # Languages that need transpilation
    BUILD = "build"        # Languages with build systems


@dataclass
class LanguageRuntime:
    """Runtime information for a programming language."""
    language: LanguageType
    version: str = ""
    executable_path: str = ""
    is_available: bool = False
    package_manager: str = ""
    build_tool: str = ""
    compilation_type: CompilationType = CompilationType.NONE


@dataclass
class ExecutionCommand:
    """Command configuration for executing code."""
    command: List[str]
    working_directory: str
    environment_variables: Dict[str, str] = field(default_factory=dict)
    requires_compilation: bool = False
    compilation_command: Optional[List[str]] = None
    cleanup_files: List[str] = field(default_factory=list)


class LanguageDetector:
    """Detects programming language from file extensions and content."""
    
    EXTENSION_MAP = {
        '.py': LanguageType.PYTHON,
        '.js': LanguageType.JAVASCRIPT,
        '.mjs': LanguageType.JAVASCRIPT,
        '.ts': LanguageType.TYPESCRIPT,
        '.tsx': LanguageType.TYPESCRIPT,
        '.java': LanguageType.JAVA,
        '.go': LanguageType.GO,
        '.rs': LanguageType.RUST,
        '.cpp': LanguageType.CPP,
        '.cxx': LanguageType.CPP,
        '.cc': LanguageType.CPP,
        '.c': LanguageType.C,
        '.cs': LanguageType.CSHARP,
        '.php': LanguageType.PHP,
        '.rb': LanguageType.RUBY,
    }
    
    SHEBANG_MAP = {
        'python': LanguageType.PYTHON,
        'node': LanguageType.JAVASCRIPT,
        'php': LanguageType.PHP,
        'ruby': LanguageType.RUBY,
    }
    
    @classmethod
    def detect_from_file(cls, file_path: str) -> LanguageType:
        """Detect language from file path and content."""
        # First try extension
        ext = Path(file_path).suffix.lower()
        if ext in cls.EXTENSION_MAP:
            return cls.EXTENSION_MAP[ext]
        
        # Try shebang line
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#!'):
                    for interpreter, lang in cls.SHEBANG_MAP.items():
                        if interpreter in first_line:
                            return lang
        except Exception:
            pass
        
        return LanguageType.UNKNOWN
    
    @classmethod
    def detect_from_project(cls, project_path: str) -> LanguageType:
        """Detect primary language from project structure."""
        language_counts = {}
        
        for root, dirs, files in os.walk(project_path):
            # Skip hidden directories and common build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'target', 'build', '__pycache__']]
            
            for file in files:
                file_path = os.path.join(root, file)
                lang = cls.detect_from_file(file_path)
                if lang != LanguageType.UNKNOWN:
                    language_counts[lang] = language_counts.get(lang, 0) + 1
        
        if not language_counts:
            return LanguageType.UNKNOWN
        
        # Return the most common language
        return max(language_counts, key=language_counts.get)


class RuntimeManager:
    """Manages runtime environments for different programming languages."""
    
    def __init__(self):
        self.runtimes: Dict[LanguageType, LanguageRuntime] = {}
        self.logger = logging.getLogger(__name__)
        self._detect_runtimes()
    
    def _detect_runtimes(self):
        """Detect available runtime environments."""
        detection_configs = {
            LanguageType.PYTHON: {
                'executables': ['python', 'python3', 'py'],
                'version_flag': '--version',
                'package_manager': 'pip'
            },
            LanguageType.JAVASCRIPT: {
                'executables': ['node'],
                'version_flag': '--version',
                'package_manager': 'npm'
            },
            LanguageType.TYPESCRIPT: {
                'executables': ['tsc', 'npx tsc'],
                'version_flag': '--version',
                'package_manager': 'npm',
                'build_tool': 'tsc'
            },
            LanguageType.JAVA: {
                'executables': ['java'],
                'version_flag': '-version',
                'package_manager': 'maven',
                'build_tool': 'javac'
            },
            LanguageType.GO: {
                'executables': ['go'],
                'version_flag': 'version',
                'package_manager': 'go mod',
                'build_tool': 'go build'
            },
            LanguageType.RUST: {
                'executables': ['rustc'],
                'version_flag': '--version',
                'package_manager': 'cargo',
                'build_tool': 'cargo build'
            },
            LanguageType.CPP: {
                'executables': ['g++', 'clang++'],
                'version_flag': '--version',
                'build_tool': 'make'
            },
            LanguageType.C: {
                'executables': ['gcc', 'clang'],
                'version_flag': '--version',
                'build_tool': 'make'
            },
            LanguageType.CSHARP: {
                'executables': ['dotnet'],
                'version_flag': '--version',
                'package_manager': 'dotnet',
                'build_tool': 'dotnet build'
            },
            LanguageType.PHP: {
                'executables': ['php'],
                'version_flag': '--version',
                'package_manager': 'composer'
            },
            LanguageType.RUBY: {
                'executables': ['ruby'],
                'version_flag': '--version',
                'package_manager': 'gem'
            }
        }
        
        for lang, config in detection_configs.items():
            runtime = self._detect_runtime(lang, config)
            self.runtimes[lang] = runtime
    
    def _detect_runtime(self, language: LanguageType, config: Dict[str, Any]) -> LanguageRuntime:
        """Detect runtime for a specific language."""
        runtime = LanguageRuntime(language=language)
        
        # Try to find executable
        for executable in config['executables']:
            exe_path = shutil.which(executable.split()[0])  # Handle commands like 'npx tsc'
            if exe_path:
                runtime.executable_path = executable
                runtime.is_available = True
                break
        
        if runtime.is_available:
            # Get version
            try:
                version_cmd = [runtime.executable_path] + config['version_flag'].split()
                result = subprocess.run(version_cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    runtime.version = result.stdout.strip().split('\n')[0]
            except Exception as e:
                self.logger.warning(f"Could not get version for {language.value}: {e}")
            
            # Set package manager and build tool
            runtime.package_manager = config.get('package_manager', '')
            runtime.build_tool = config.get('build_tool', '')
        
        return runtime
    
    def get_runtime(self, language: LanguageType) -> Optional[LanguageRuntime]:
        """Get runtime information for a language."""
        return self.runtimes.get(language)
    
    def is_available(self, language: LanguageType) -> bool:
        """Check if runtime is available for a language."""
        runtime = self.get_runtime(language)
        return runtime is not None and runtime.is_available
    
    def get_available_languages(self) -> List[LanguageType]:
        """Get list of available languages."""
        return [lang for lang, runtime in self.runtimes.items() if runtime.is_available]


class LanguageExecutor:
    """Executes code in different programming languages."""
    
    def __init__(self, runtime_manager: RuntimeManager):
        self.runtime_manager = runtime_manager
        self.logger = logging.getLogger(__name__)
    
    def prepare_execution(self, 
                         file_path: str, 
                         language: LanguageType,
                         working_dir: Optional[str] = None) -> Optional[ExecutionCommand]:
        """
        Prepare execution command for a file.
        
        Args:
            file_path: Path to the source file
            language: Programming language
            working_dir: Working directory for execution
            
        Returns:
            ExecutionCommand or None if not supported
        """
        if not self.runtime_manager.is_available(language):
            self.logger.error(f"Runtime not available for {language.value}")
            return None
        
        runtime = self.runtime_manager.get_runtime(language)
        working_dir = working_dir or os.path.dirname(file_path)
        
        if language == LanguageType.PYTHON:
            return self._prepare_python_execution(file_path, runtime, working_dir)
        elif language == LanguageType.JAVASCRIPT:
            return self._prepare_javascript_execution(file_path, runtime, working_dir)
        elif language == LanguageType.TYPESCRIPT:
            return self._prepare_typescript_execution(file_path, runtime, working_dir)
        elif language == LanguageType.JAVA:
            return self._prepare_java_execution(file_path, runtime, working_dir)
        elif language == LanguageType.GO:
            return self._prepare_go_execution(file_path, runtime, working_dir)
        elif language == LanguageType.RUST:
            return self._prepare_rust_execution(file_path, runtime, working_dir)
        elif language in [LanguageType.C, LanguageType.CPP]:
            return self._prepare_c_cpp_execution(file_path, runtime, working_dir, language)
        elif language == LanguageType.CSHARP:
            return self._prepare_csharp_execution(file_path, runtime, working_dir)
        elif language == LanguageType.PHP:
            return self._prepare_php_execution(file_path, runtime, working_dir)
        elif language == LanguageType.RUBY:
            return self._prepare_ruby_execution(file_path, runtime, working_dir)
        else:
            self.logger.error(f"Execution not implemented for {language.value}")
            return None
    
    def _prepare_python_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare Python execution."""
        return ExecutionCommand(
            command=[runtime.executable_path, file_path],
            working_directory=working_dir,
            environment_variables={'PYTHONPATH': working_dir}
        )
    
    def _prepare_javascript_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare JavaScript execution."""
        return ExecutionCommand(
            command=[runtime.executable_path, file_path],
            working_directory=working_dir,
            environment_variables={'NODE_ENV': 'development'}
        )
    
    def _prepare_typescript_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare TypeScript execution."""
        # TypeScript needs compilation first
        output_file = file_path.replace('.ts', '.js')
        
        return ExecutionCommand(
            command=['node', output_file],
            working_directory=working_dir,
            environment_variables={'NODE_ENV': 'development'},
            requires_compilation=True,
            compilation_command=['tsc', file_path],
            cleanup_files=[output_file]
        )
    
    def _prepare_java_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare Java execution."""
        # Java needs compilation
        class_name = Path(file_path).stem
        class_file = os.path.join(working_dir, f"{class_name}.class")
        
        return ExecutionCommand(
            command=['java', class_name],
            working_directory=working_dir,
            requires_compilation=True,
            compilation_command=['javac', file_path],
            cleanup_files=[class_file]
        )
    
    def _prepare_go_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare Go execution."""
        # Check if it's a module or single file
        if os.path.exists(os.path.join(working_dir, 'go.mod')):
            return ExecutionCommand(
                command=['go', 'run', '.'],
                working_directory=working_dir,
                environment_variables={'GO111MODULE': 'on'}
            )
        else:
            return ExecutionCommand(
                command=['go', 'run', file_path],
                working_directory=working_dir,
                environment_variables={'GO111MODULE': 'on'}
            )
    
    def _prepare_rust_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare Rust execution."""
        # Check if it's a Cargo project
        if os.path.exists(os.path.join(working_dir, 'Cargo.toml')):
            return ExecutionCommand(
                command=['cargo', 'run'],
                working_directory=working_dir
            )
        else:
            # Single file compilation
            executable = file_path.replace('.rs', '.exe' if os.name == 'nt' else '')
            return ExecutionCommand(
                command=[executable],
                working_directory=working_dir,
                requires_compilation=True,
                compilation_command=['rustc', file_path],
                cleanup_files=[executable]
            )
    
    def _prepare_c_cpp_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str, language: LanguageType) -> ExecutionCommand:
        """Prepare C/C++ execution."""
        executable = file_path.replace(Path(file_path).suffix, '.exe' if os.name == 'nt' else '')
        compiler = 'g++' if language == LanguageType.CPP else 'gcc'
        
        return ExecutionCommand(
            command=[executable],
            working_directory=working_dir,
            requires_compilation=True,
            compilation_command=[compiler, file_path, '-o', executable],
            cleanup_files=[executable]
        )
    
    def _prepare_csharp_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare C# execution."""
        # Check if it's a project
        if os.path.exists(os.path.join(working_dir, '*.csproj')):
            return ExecutionCommand(
                command=['dotnet', 'run'],
                working_directory=working_dir
            )
        else:
            # Single file execution (C# 9.0+)
            return ExecutionCommand(
                command=['dotnet', 'run', file_path],
                working_directory=working_dir
            )
    
    def _prepare_php_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare PHP execution."""
        return ExecutionCommand(
            command=[runtime.executable_path, file_path],
            working_directory=working_dir
        )
    
    def _prepare_ruby_execution(self, file_path: str, runtime: LanguageRuntime, working_dir: str) -> ExecutionCommand:
        """Prepare Ruby execution."""
        return ExecutionCommand(
            command=[runtime.executable_path, file_path],
            working_directory=working_dir
        )
    
    def compile_if_needed(self, execution_cmd: ExecutionCommand) -> Tuple[bool, str]:
        """
        Compile code if compilation is required.
        
        Args:
            execution_cmd: Execution command configuration
            
        Returns:
            Tuple of (success, error_message)
        """
        if not execution_cmd.requires_compilation or not execution_cmd.compilation_command:
            return True, ""
        
        try:
            self.logger.info(f"Compiling with command: {' '.join(execution_cmd.compilation_command)}")
            
            result = subprocess.run(
                execution_cmd.compilation_command,
                cwd=execution_cmd.working_directory,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                error_msg = f"Compilation failed: {result.stderr}"
                self.logger.error(error_msg)
                return False, error_msg
            
            return True, ""
            
        except subprocess.TimeoutExpired:
            return False, "Compilation timed out"
        except Exception as e:
            return False, f"Compilation error: {str(e)}"
    
    def cleanup_files(self, execution_cmd: ExecutionCommand):
        """Clean up temporary files created during execution."""
        for file_path in execution_cmd.cleanup_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    self.logger.debug(f"Cleaned up file: {file_path}")
            except Exception as e:
                self.logger.warning(f"Could not clean up file {file_path}: {e}")


class DependencyManager:
    """Manages dependencies for different programming languages."""
    
    def __init__(self, runtime_manager: RuntimeManager):
        self.runtime_manager = runtime_manager
        self.logger = logging.getLogger(__name__)
    
    def install_dependencies(self, project_path: str, language: LanguageType) -> Tuple[bool, str]:
        """
        Install dependencies for a project.
        
        Args:
            project_path: Path to the project directory
            language: Programming language
            
        Returns:
            Tuple of (success, message)
        """
        if not self.runtime_manager.is_available(language):
            return False, f"Runtime not available for {language.value}"
        
        runtime = self.runtime_manager.get_runtime(language)
        
        try:
            if language == LanguageType.PYTHON:
                return self._install_python_dependencies(project_path, runtime)
            elif language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
                return self._install_node_dependencies(project_path, runtime)
            elif language == LanguageType.JAVA:
                return self._install_java_dependencies(project_path, runtime)
            elif language == LanguageType.GO:
                return self._install_go_dependencies(project_path, runtime)
            elif language == LanguageType.RUST:
                return self._install_rust_dependencies(project_path, runtime)
            elif language == LanguageType.CSHARP:
                return self._install_csharp_dependencies(project_path, runtime)
            elif language == LanguageType.PHP:
                return self._install_php_dependencies(project_path, runtime)
            elif language == LanguageType.RUBY:
                return self._install_ruby_dependencies(project_path, runtime)
            else:
                return True, f"No dependency management needed for {language.value}"
                
        except Exception as e:
            return False, f"Error installing dependencies: {str(e)}"
    
    def _install_python_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Python dependencies."""
        requirements_file = os.path.join(project_path, 'requirements.txt')
        if not os.path.exists(requirements_file):
            return True, "No requirements.txt found"
        
        cmd = ['pip', 'install', '-r', requirements_file]
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Dependencies installed successfully"
        else:
            return False, f"Failed to install dependencies: {result.stderr}"
    
    def _install_node_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Node.js dependencies."""
        package_file = os.path.join(project_path, 'package.json')
        if not os.path.exists(package_file):
            return True, "No package.json found"
        
        cmd = ['npm', 'install']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Dependencies installed successfully"
        else:
            return False, f"Failed to install dependencies: {result.stderr}"
    
    def _install_java_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Java dependencies."""
        pom_file = os.path.join(project_path, 'pom.xml')
        if os.path.exists(pom_file):
            cmd = ['mvn', 'compile']
            result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                return True, "Maven dependencies resolved"
            else:
                return False, f"Maven build failed: {result.stderr}"
        
        return True, "No Maven project found"
    
    def _install_go_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Go dependencies."""
        mod_file = os.path.join(project_path, 'go.mod')
        if not os.path.exists(mod_file):
            return True, "No go.mod found"
        
        cmd = ['go', 'mod', 'download']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Go modules downloaded successfully"
        else:
            return False, f"Failed to download Go modules: {result.stderr}"
    
    def _install_rust_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Rust dependencies."""
        cargo_file = os.path.join(project_path, 'Cargo.toml')
        if not os.path.exists(cargo_file):
            return True, "No Cargo.toml found"
        
        cmd = ['cargo', 'fetch']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Cargo dependencies fetched successfully"
        else:
            return False, f"Failed to fetch Cargo dependencies: {result.stderr}"
    
    def _install_csharp_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install C# dependencies."""
        # Look for .csproj files
        csproj_files = list(Path(project_path).glob('*.csproj'))
        if not csproj_files:
            return True, "No .csproj file found"
        
        cmd = ['dotnet', 'restore']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "NuGet packages restored successfully"
        else:
            return False, f"Failed to restore NuGet packages: {result.stderr}"
    
    def _install_php_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install PHP dependencies."""
        composer_file = os.path.join(project_path, 'composer.json')
        if not os.path.exists(composer_file):
            return True, "No composer.json found"
        
        cmd = ['composer', 'install']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Composer dependencies installed successfully"
        else:
            return False, f"Failed to install Composer dependencies: {result.stderr}"
    
    def _install_ruby_dependencies(self, project_path: str, runtime: LanguageRuntime) -> Tuple[bool, str]:
        """Install Ruby dependencies."""
        gemfile = os.path.join(project_path, 'Gemfile')
        if not os.path.exists(gemfile):
            return True, "No Gemfile found"
        
        cmd = ['bundle', 'install']
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return True, "Bundle dependencies installed successfully"
        else:
            return False, f"Failed to install Bundle dependencies: {result.stderr}"


# Global instances
_runtime_manager: Optional[RuntimeManager] = None
_language_executor: Optional[LanguageExecutor] = None
_dependency_manager: Optional[DependencyManager] = None


def get_runtime_manager() -> RuntimeManager:
    """Get the global runtime manager instance."""
    global _runtime_manager
    if _runtime_manager is None:
        _runtime_manager = RuntimeManager()
    return _runtime_manager


def get_language_executor() -> LanguageExecutor:
    """Get the global language executor instance."""
    global _language_executor
    if _language_executor is None:
        _language_executor = LanguageExecutor(get_runtime_manager())
    return _language_executor


def get_dependency_manager() -> DependencyManager:
    """Get the global dependency manager instance."""
    global _dependency_manager
    if _dependency_manager is None:
        _dependency_manager = DependencyManager(get_runtime_manager())
    return _dependency_manager