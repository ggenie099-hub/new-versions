"""
Execution Engine Module

This module provides comprehensive code execution capabilities including:
- Runtime environment setup and management
- Compilation and build process handling
- Application lifecycle management (startup, runtime, shutdown)
- Error handling and logging
- Resource monitoring and management
"""

import os
import sys
import subprocess
import asyncio
import signal
import tempfile
import shutil
import psutil
import time
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
import logging
from contextlib import asynccontextmanager

from .code_reader import CodeReader, ProjectStructure, LanguageType

logger = logging.getLogger(__name__)


class ExecutionStatus(Enum):
    """Execution status states"""
    IDLE = "idle"
    PREPARING = "preparing"
    COMPILING = "compiling"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TERMINATED = "terminated"


class ExecutionMode(Enum):
    """Execution modes"""
    DIRECT = "direct"  # Direct execution
    SANDBOXED = "sandboxed"  # Sandboxed execution
    CONTAINERIZED = "containerized"  # Docker container execution


@dataclass
class ExecutionConfig:
    """Configuration for code execution"""
    timeout: Optional[int] = 300  # 5 minutes default
    memory_limit: Optional[int] = 512  # MB
    cpu_limit: Optional[float] = 1.0  # CPU cores
    network_access: bool = True
    file_system_access: bool = True
    environment_variables: Dict[str, str] = field(default_factory=dict)
    working_directory: Optional[Path] = None
    execution_mode: ExecutionMode = ExecutionMode.DIRECT
    capture_output: bool = True
    log_level: str = "INFO"


@dataclass
class ExecutionResult:
    """Result of code execution"""
    status: ExecutionStatus
    exit_code: Optional[int] = None
    stdout: str = ""
    stderr: str = ""
    execution_time: float = 0.0
    memory_usage: float = 0.0  # MB
    cpu_usage: float = 0.0  # Percentage
    error_message: Optional[str] = None
    process_id: Optional[int] = None


@dataclass
class RuntimeEnvironment:
    """Runtime environment information"""
    language: LanguageType
    interpreter_path: Optional[Path] = None
    version: Optional[str] = None
    dependencies_installed: bool = False
    virtual_env_path: Optional[Path] = None
    build_artifacts: List[Path] = field(default_factory=list)


class ResourceMonitor:
    """Monitor system resources during execution"""
    
    def __init__(self, process: psutil.Process):
        self.process = process
        self.monitoring = False
        self.max_memory = 0.0
        self.max_cpu = 0.0
        self.monitor_thread = None
    
    def start_monitoring(self):
        """Start resource monitoring"""
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
    
    def stop_monitoring(self):
        """Stop resource monitoring"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1.0)
    
    def _monitor_loop(self):
        """Resource monitoring loop"""
        while self.monitoring:
            try:
                if self.process.is_running():
                    # Memory usage in MB
                    memory_info = self.process.memory_info()
                    memory_mb = memory_info.rss / (1024 * 1024)
                    self.max_memory = max(self.max_memory, memory_mb)
                    
                    # CPU usage percentage
                    cpu_percent = self.process.cpu_percent()
                    self.max_cpu = max(self.max_cpu, cpu_percent)
                    
                    time.sleep(0.1)  # Monitor every 100ms
                else:
                    break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                break
    
    def get_stats(self) -> Dict[str, float]:
        """Get resource usage statistics"""
        return {
            'max_memory_mb': self.max_memory,
            'max_cpu_percent': self.max_cpu
        }


class ExecutionEngine:
    """Main execution engine for running code"""
    
    def __init__(self, config: ExecutionConfig = None):
        self.config = config or ExecutionConfig()
        self.code_reader = CodeReader()
        self.current_execution: Optional[subprocess.Popen] = None
        self.resource_monitor: Optional[ResourceMonitor] = None
        
        # Runtime environment cache
        self.runtime_environments: Dict[LanguageType, RuntimeEnvironment] = {}
        
        # Setup logging
        logging.basicConfig(level=getattr(logging, self.config.log_level))
    
    async def setup_runtime_environment(self, language: LanguageType, project_path: Path) -> RuntimeEnvironment:
        """Setup runtime environment for the specified language"""
        if language in self.runtime_environments:
            return self.runtime_environments[language]
        
        logger.info(f"Setting up runtime environment for {language.value}")
        
        runtime_env = RuntimeEnvironment(language=language)
        
        try:
            if language == LanguageType.PYTHON:
                runtime_env = await self._setup_python_environment(project_path)
            elif language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
                runtime_env = await self._setup_node_environment(project_path)
            elif language == LanguageType.JAVA:
                runtime_env = await self._setup_java_environment(project_path)
            elif language == LanguageType.GO:
                runtime_env = await self._setup_go_environment(project_path)
            elif language == LanguageType.RUST:
                runtime_env = await self._setup_rust_environment(project_path)
            else:
                logger.warning(f"Unsupported language: {language.value}")
                runtime_env.interpreter_path = None
            
            self.runtime_environments[language] = runtime_env
            return runtime_env
            
        except Exception as e:
            logger.error(f"Failed to setup runtime environment: {e}")
            runtime_env.interpreter_path = None
            return runtime_env
    
    async def _setup_python_environment(self, project_path: Path) -> RuntimeEnvironment:
        """Setup Python runtime environment"""
        runtime_env = RuntimeEnvironment(language=LanguageType.PYTHON)
        
        # Find Python interpreter
        python_executables = ['python3', 'python', 'py']
        for executable in python_executables:
            try:
                result = await asyncio.create_subprocess_exec(
                    executable, '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await result.communicate()
                
                if result.returncode == 0:
                    runtime_env.interpreter_path = Path(shutil.which(executable))
                    version_output = stdout.decode() or stderr.decode()
                    runtime_env.version = version_output.strip()
                    break
            except Exception:
                continue
        
        if not runtime_env.interpreter_path:
            raise RuntimeError("Python interpreter not found")
        
        # Check for requirements.txt and install dependencies
        requirements_file = project_path / 'requirements.txt'
        if requirements_file.exists():
            await self._install_python_dependencies(runtime_env, requirements_file)
        
        return runtime_env
    
    async def _setup_node_environment(self, project_path: Path) -> RuntimeEnvironment:
        """Setup Node.js runtime environment"""
        runtime_env = RuntimeEnvironment(language=LanguageType.JAVASCRIPT)
        
        # Find Node.js interpreter
        try:
            result = await asyncio.create_subprocess_exec(
                'node', '--version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.interpreter_path = Path(shutil.which('node'))
                runtime_env.version = stdout.decode().strip()
            else:
                raise RuntimeError("Node.js not found")
        except Exception as e:
            raise RuntimeError(f"Node.js setup failed: {e}")
        
        # Check for package.json and install dependencies
        package_json = project_path / 'package.json'
        if package_json.exists():
            await self._install_node_dependencies(runtime_env, project_path)
        
        return runtime_env
    
    async def _setup_java_environment(self, project_path: Path) -> RuntimeEnvironment:
        """Setup Java runtime environment"""
        runtime_env = RuntimeEnvironment(language=LanguageType.JAVA)
        
        # Find Java compiler and runtime
        try:
            # Check for javac (compiler)
            result = await asyncio.create_subprocess_exec(
                'javac', '-version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.interpreter_path = Path(shutil.which('java'))
                version_output = stderr.decode() or stdout.decode()
                runtime_env.version = version_output.strip()
            else:
                raise RuntimeError("Java compiler not found")
        except Exception as e:
            raise RuntimeError(f"Java setup failed: {e}")
        
        return runtime_env
    
    async def _setup_go_environment(self, project_path: Path) -> RuntimeEnvironment:
        """Setup Go runtime environment"""
        runtime_env = RuntimeEnvironment(language=LanguageType.GO)
        
        try:
            result = await asyncio.create_subprocess_exec(
                'go', 'version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.interpreter_path = Path(shutil.which('go'))
                runtime_env.version = stdout.decode().strip()
            else:
                raise RuntimeError("Go compiler not found")
        except Exception as e:
            raise RuntimeError(f"Go setup failed: {e}")
        
        return runtime_env
    
    async def _setup_rust_environment(self, project_path: Path) -> RuntimeEnvironment:
        """Setup Rust runtime environment"""
        runtime_env = RuntimeEnvironment(language=LanguageType.RUST)
        
        try:
            result = await asyncio.create_subprocess_exec(
                'rustc', '--version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.interpreter_path = Path(shutil.which('rustc'))
                runtime_env.version = stdout.decode().strip()
            else:
                raise RuntimeError("Rust compiler not found")
        except Exception as e:
            raise RuntimeError(f"Rust setup failed: {e}")
        
        return runtime_env
    
    async def _install_python_dependencies(self, runtime_env: RuntimeEnvironment, requirements_file: Path):
        """Install Python dependencies"""
        try:
            logger.info("Installing Python dependencies...")
            
            # Use pip to install requirements
            result = await asyncio.create_subprocess_exec(
                str(runtime_env.interpreter_path), '-m', 'pip', 'install', '-r', str(requirements_file),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.dependencies_installed = True
                logger.info("Python dependencies installed successfully")
            else:
                logger.error(f"Failed to install Python dependencies: {stderr.decode()}")
                
        except Exception as e:
            logger.error(f"Error installing Python dependencies: {e}")
    
    async def _install_node_dependencies(self, runtime_env: RuntimeEnvironment, project_path: Path):
        """Install Node.js dependencies"""
        try:
            logger.info("Installing Node.js dependencies...")
            
            # Use npm to install dependencies
            result = await asyncio.create_subprocess_exec(
                'npm', 'install',
                cwd=str(project_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.dependencies_installed = True
                logger.info("Node.js dependencies installed successfully")
            else:
                logger.error(f"Failed to install Node.js dependencies: {stderr.decode()}")
                
        except Exception as e:
            logger.error(f"Error installing Node.js dependencies: {e}")
    
    async def compile_if_needed(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> bool:
        """Compile code if compilation is required"""
        if runtime_env.language == LanguageType.JAVA:
            return await self._compile_java(project, runtime_env)
        elif runtime_env.language == LanguageType.GO:
            return await self._compile_go(project, runtime_env)
        elif runtime_env.language == LanguageType.RUST:
            return await self._compile_rust(project, runtime_env)
        else:
            # No compilation needed for interpreted languages
            return True
    
    async def _compile_java(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> bool:
        """Compile Java source files"""
        try:
            logger.info("Compiling Java source files...")
            
            # Find all Java files
            java_files = [str(f.path) for f in project.files if f.language == LanguageType.JAVA]
            
            if not java_files:
                return True
            
            # Create build directory
            build_dir = project.root_path / 'build'
            build_dir.mkdir(exist_ok=True)
            
            # Compile Java files
            cmd = ['javac', '-d', str(build_dir)] + java_files
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                runtime_env.build_artifacts.append(build_dir)
                logger.info("Java compilation successful")
                return True
            else:
                logger.error(f"Java compilation failed: {stderr.decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Error compiling Java: {e}")
            return False
    
    async def _compile_go(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> bool:
        """Compile Go source files"""
        try:
            logger.info("Compiling Go source files...")
            
            # Build the Go project
            result = await asyncio.create_subprocess_exec(
                'go', 'build', '-o', 'main',
                cwd=str(project.root_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                executable_path = project.root_path / 'main'
                if executable_path.exists():
                    runtime_env.build_artifacts.append(executable_path)
                logger.info("Go compilation successful")
                return True
            else:
                logger.error(f"Go compilation failed: {stderr.decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Error compiling Go: {e}")
            return False
    
    async def _compile_rust(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> bool:
        """Compile Rust source files"""
        try:
            logger.info("Compiling Rust source files...")
            
            # Build the Rust project
            result = await asyncio.create_subprocess_exec(
                'cargo', 'build', '--release',
                cwd=str(project.root_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                target_dir = project.root_path / 'target' / 'release'
                if target_dir.exists():
                    runtime_env.build_artifacts.append(target_dir)
                logger.info("Rust compilation successful")
                return True
            else:
                logger.error(f"Rust compilation failed: {stderr.decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Error compiling Rust: {e}")
            return False
    
    async def execute_project(self, project_path: Path) -> ExecutionResult:
        """Execute a complete project"""
        start_time = time.time()
        result = ExecutionResult(status=ExecutionStatus.PREPARING)
        
        try:
            # Analyze the project
            logger.info(f"Analyzing project at {project_path}")
            project = self.code_reader.analyze_project(project_path)
            
            if not project.main_language:
                result.status = ExecutionStatus.FAILED
                result.error_message = "Could not determine main programming language"
                return result
            
            # Setup runtime environment
            result.status = ExecutionStatus.PREPARING
            runtime_env = await self.setup_runtime_environment(project.main_language, project_path)
            
            if not runtime_env.interpreter_path:
                result.status = ExecutionStatus.FAILED
                result.error_message = f"Runtime environment setup failed for {project.main_language.value}"
                return result
            
            # Compile if needed
            result.status = ExecutionStatus.COMPILING
            compilation_success = await self.compile_if_needed(project, runtime_env)
            
            if not compilation_success:
                result.status = ExecutionStatus.FAILED
                result.error_message = "Compilation failed"
                return result
            
            # Execute the project
            result.status = ExecutionStatus.RUNNING
            execution_result = await self._execute_with_runtime(project, runtime_env)
            
            # Update result with execution data
            result.status = execution_result.status
            result.exit_code = execution_result.exit_code
            result.stdout = execution_result.stdout
            result.stderr = execution_result.stderr
            result.memory_usage = execution_result.memory_usage
            result.cpu_usage = execution_result.cpu_usage
            result.process_id = execution_result.process_id
            result.error_message = execution_result.error_message
            
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            result.status = ExecutionStatus.FAILED
            result.error_message = str(e)
        
        finally:
            result.execution_time = time.time() - start_time
        
        return result
    
    async def _execute_with_runtime(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> ExecutionResult:
        """Execute project with the configured runtime"""
        result = ExecutionResult(status=ExecutionStatus.RUNNING)
        
        try:
            # Determine execution command
            cmd = self._build_execution_command(project, runtime_env)
            
            if not cmd:
                result.status = ExecutionStatus.FAILED
                result.error_message = "Could not determine execution command"
                return result
            
            # Setup execution environment
            env = os.environ.copy()
            env.update(self.config.environment_variables)
            
            working_dir = self.config.working_directory or project.root_path
            
            # Execute the command
            logger.info(f"Executing command: {' '.join(cmd)}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE if self.config.capture_output else None,
                stderr=asyncio.subprocess.PIPE if self.config.capture_output else None,
                cwd=str(working_dir),
                env=env
            )
            
            result.process_id = process.pid
            
            # Start resource monitoring
            if process.pid:
                try:
                    psutil_process = psutil.Process(process.pid)
                    self.resource_monitor = ResourceMonitor(psutil_process)
                    self.resource_monitor.start_monitoring()
                except psutil.NoSuchProcess:
                    pass
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.config.timeout
                )
                
                result.exit_code = process.returncode
                result.stdout = stdout.decode() if stdout else ""
                result.stderr = stderr.decode() if stderr else ""
                
                if process.returncode == 0:
                    result.status = ExecutionStatus.COMPLETED
                else:
                    result.status = ExecutionStatus.FAILED
                    result.error_message = f"Process exited with code {process.returncode}"
                
            except asyncio.TimeoutError:
                logger.warning("Execution timeout reached, terminating process")
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    process.kill()
                
                result.status = ExecutionStatus.TERMINATED
                result.error_message = "Execution timeout"
            
            # Get resource usage statistics
            if self.resource_monitor:
                self.resource_monitor.stop_monitoring()
                stats = self.resource_monitor.get_stats()
                result.memory_usage = stats['max_memory_mb']
                result.cpu_usage = stats['max_cpu_percent']
            
        except Exception as e:
            logger.error(f"Execution error: {e}")
            result.status = ExecutionStatus.FAILED
            result.error_message = str(e)
        
        return result
    
    def _build_execution_command(self, project: ProjectStructure, runtime_env: RuntimeEnvironment) -> Optional[List[str]]:
        """Build the execution command for the project"""
        if not project.entry_point:
            return None
        
        if runtime_env.language == LanguageType.PYTHON:
            return [str(runtime_env.interpreter_path), str(project.entry_point)]
        
        elif runtime_env.language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
            return [str(runtime_env.interpreter_path), str(project.entry_point)]
        
        elif runtime_env.language == LanguageType.JAVA:
            # Assume main class is in the entry point file
            class_name = project.entry_point.stem
            build_dir = project.root_path / 'build'
            return ['java', '-cp', str(build_dir), class_name]
        
        elif runtime_env.language == LanguageType.GO:
            # Use compiled executable if available
            executable = project.root_path / 'main'
            if executable.exists():
                return [str(executable)]
            else:
                return ['go', 'run', str(project.entry_point)]
        
        elif runtime_env.language == LanguageType.RUST:
            return ['cargo', 'run']
        
        return None
    
    async def stop_execution(self):
        """Stop current execution"""
        if self.current_execution and self.current_execution.poll() is None:
            logger.info("Stopping current execution")
            self.current_execution.terminate()
            
            # Wait for graceful shutdown
            try:
                await asyncio.wait_for(self.current_execution.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Forcefully killing process")
                self.current_execution.kill()
        
        if self.resource_monitor:
            self.resource_monitor.stop_monitoring()
    
    def get_supported_languages(self) -> List[LanguageType]:
        """Get list of supported programming languages"""
        return [
            LanguageType.PYTHON,
            LanguageType.JAVASCRIPT,
            LanguageType.TYPESCRIPT,
            LanguageType.JAVA,
            LanguageType.GO,
            LanguageType.RUST
        ]