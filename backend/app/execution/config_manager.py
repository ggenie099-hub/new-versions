"""
Configuration Manager for Application Execution System

This module provides comprehensive configuration management for the execution system,
including environment settings, resource limits, security policies, and language-specific configurations.
"""

import os
import json
import yaml
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum


class ConfigFormat(Enum):
    """Supported configuration file formats."""
    JSON = "json"
    YAML = "yaml"
    ENV = "env"


class LogLevel(Enum):
    """Logging levels for execution monitoring."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ResourceLimits:
    """Resource limitation configuration."""
    max_memory_mb: int = 512
    max_cpu_percent: float = 50.0
    max_execution_time_seconds: int = 300
    max_file_size_mb: int = 100
    max_network_connections: int = 10
    max_processes: int = 5


@dataclass
class SecurityConfig:
    """Security configuration for code execution."""
    enable_sandbox: bool = True
    allowed_imports: List[str] = field(default_factory=lambda: [
        "os", "sys", "json", "math", "datetime", "collections", "itertools"
    ])
    blocked_imports: List[str] = field(default_factory=lambda: [
        "subprocess", "socket", "urllib", "requests", "http"
    ])
    allow_file_operations: bool = False
    allow_network_access: bool = False
    allow_system_calls: bool = False
    max_recursion_depth: int = 1000


@dataclass
class LanguageConfig:
    """Language-specific configuration."""
    version: str = "latest"
    runtime_args: List[str] = field(default_factory=list)
    environment_variables: Dict[str, str] = field(default_factory=dict)
    package_manager: str = ""
    build_command: str = ""
    run_command: str = ""
    file_extensions: List[str] = field(default_factory=list)


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: LogLevel = LogLevel.INFO
    enable_file_logging: bool = True
    log_file_path: str = "execution.log"
    max_log_size_mb: int = 10
    log_rotation_count: int = 5
    include_timestamps: bool = True
    include_process_info: bool = True


@dataclass
class ExecutionConfig:
    """Main execution configuration."""
    # Basic settings
    project_root: str = ""
    working_directory: str = ""
    output_directory: str = "output"
    temp_directory: str = "temp"
    
    # Resource management
    resource_limits: ResourceLimits = field(default_factory=ResourceLimits)
    
    # Security settings
    security: SecurityConfig = field(default_factory=SecurityConfig)
    
    # Language configurations
    languages: Dict[str, LanguageConfig] = field(default_factory=dict)
    
    # Logging
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    
    # Environment variables
    environment_variables: Dict[str, str] = field(default_factory=dict)
    
    # Execution modes
    debug_mode: bool = False
    verbose_output: bool = False
    cleanup_on_exit: bool = True
    
    # Timeout settings
    startup_timeout: int = 30
    shutdown_timeout: int = 10
    health_check_interval: int = 5


class ConfigManager:
    """Manages configuration for the execution system."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_path: Path to the configuration file
        """
        self.config_path = config_path
        self.config = ExecutionConfig()
        self._default_language_configs = self._get_default_language_configs()
        
        if config_path and os.path.exists(config_path):
            self.load_config(config_path)
        else:
            self._setup_default_config()
    
    def _get_default_language_configs(self) -> Dict[str, LanguageConfig]:
        """Get default configurations for supported languages."""
        return {
            "python": LanguageConfig(
                version="3.9+",
                runtime_args=["-u"],  # Unbuffered output
                package_manager="pip",
                run_command="python",
                file_extensions=[".py"],
                environment_variables={"PYTHONPATH": "."}
            ),
            "javascript": LanguageConfig(
                version="16+",
                runtime_args=["--no-warnings"],
                package_manager="npm",
                run_command="node",
                file_extensions=[".js", ".mjs"],
                environment_variables={"NODE_ENV": "development"}
            ),
            "typescript": LanguageConfig(
                version="16+",
                runtime_args=["--no-warnings"],
                package_manager="npm",
                build_command="tsc",
                run_command="node",
                file_extensions=[".ts"],
                environment_variables={"NODE_ENV": "development"}
            ),
            "java": LanguageConfig(
                version="11+",
                runtime_args=["-Xmx512m"],
                package_manager="maven",
                build_command="javac",
                run_command="java",
                file_extensions=[".java"]
            ),
            "go": LanguageConfig(
                version="1.19+",
                build_command="go build",
                run_command="go run",
                file_extensions=[".go"],
                environment_variables={"GO111MODULE": "on"}
            ),
            "rust": LanguageConfig(
                version="1.60+",
                package_manager="cargo",
                build_command="cargo build",
                run_command="cargo run",
                file_extensions=[".rs"]
            )
        }
    
    def _setup_default_config(self):
        """Setup default configuration."""
        self.config.languages = self._default_language_configs.copy()
        
        # Set default directories
        self.config.working_directory = os.getcwd()
        self.config.output_directory = os.path.join(os.getcwd(), "output")
        self.config.temp_directory = os.path.join(os.getcwd(), "temp")
        
        # Create directories if they don't exist
        for directory in [self.config.output_directory, self.config.temp_directory]:
            os.makedirs(directory, exist_ok=True)
    
    def load_config(self, config_path: str) -> bool:
        """
        Load configuration from file.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            config_format = self._detect_config_format(config_path)
            
            with open(config_path, 'r', encoding='utf-8') as f:
                if config_format == ConfigFormat.JSON:
                    data = json.load(f)
                elif config_format == ConfigFormat.YAML:
                    data = yaml.safe_load(f)
                elif config_format == ConfigFormat.ENV:
                    data = self._parse_env_file(f.read())
                else:
                    raise ValueError(f"Unsupported config format: {config_format}")
            
            self._merge_config(data)
            return True
            
        except Exception as e:
            print(f"Error loading config from {config_path}: {e}")
            return False
    
    def save_config(self, config_path: Optional[str] = None) -> bool:
        """
        Save current configuration to file.
        
        Args:
            config_path: Path to save the configuration file
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            path = config_path or self.config_path
            if not path:
                raise ValueError("No config path specified")
            
            config_format = self._detect_config_format(path)
            config_dict = asdict(self.config)
            
            # Convert enums to strings
            config_dict = self._serialize_config(config_dict)
            
            with open(path, 'w', encoding='utf-8') as f:
                if config_format == ConfigFormat.JSON:
                    json.dump(config_dict, f, indent=2)
                elif config_format == ConfigFormat.YAML:
                    yaml.dump(config_dict, f, default_flow_style=False)
                else:
                    raise ValueError(f"Saving not supported for format: {config_format}")
            
            return True
            
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
    
    def _detect_config_format(self, config_path: str) -> ConfigFormat:
        """Detect configuration file format from extension."""
        ext = Path(config_path).suffix.lower()
        
        if ext in ['.json']:
            return ConfigFormat.JSON
        elif ext in ['.yaml', '.yml']:
            return ConfigFormat.YAML
        elif ext in ['.env']:
            return ConfigFormat.ENV
        else:
            return ConfigFormat.JSON  # Default
    
    def _parse_env_file(self, content: str) -> Dict[str, Any]:
        """Parse environment file content."""
        data = {}
        for line in content.strip().split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    data[key.strip()] = value.strip().strip('"\'')
        return data
    
    def _merge_config(self, data: Dict[str, Any]):
        """Merge loaded configuration with current config."""
        # Start with default language configs
        self.config.languages = self._default_language_configs.copy()
        
        # Update with loaded data
        for key, value in data.items():
            if hasattr(self.config, key):
                if key == 'resource_limits' and isinstance(value, dict):
                    for limit_key, limit_value in value.items():
                        if hasattr(self.config.resource_limits, limit_key):
                            setattr(self.config.resource_limits, limit_key, limit_value)
                
                elif key == 'security' and isinstance(value, dict):
                    for sec_key, sec_value in value.items():
                        if hasattr(self.config.security, sec_key):
                            setattr(self.config.security, sec_key, sec_value)
                
                elif key == 'logging' and isinstance(value, dict):
                    for log_key, log_value in value.items():
                        if hasattr(self.config.logging, log_key):
                            if log_key == 'level' and isinstance(log_value, str):
                                setattr(self.config.logging, log_key, LogLevel(log_value))
                            else:
                                setattr(self.config.logging, log_key, log_value)
                
                elif key == 'languages' and isinstance(value, dict):
                    for lang, lang_config in value.items():
                        if lang in self.config.languages:
                            # Update existing language config
                            for lang_key, lang_value in lang_config.items():
                                if hasattr(self.config.languages[lang], lang_key):
                                    setattr(self.config.languages[lang], lang_key, lang_value)
                        else:
                            # Add new language config
                            self.config.languages[lang] = LanguageConfig(**lang_config)
                
                else:
                    setattr(self.config, key, value)
    
    def _serialize_config(self, config_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Convert enums and other non-serializable objects to strings."""
        def convert_value(value):
            if isinstance(value, Enum):
                return value.value
            elif isinstance(value, dict):
                return {k: convert_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [convert_value(v) for v in value]
            else:
                return value
        
        return convert_value(config_dict)
    
    def get_language_config(self, language: str) -> Optional[LanguageConfig]:
        """Get configuration for a specific language."""
        return self.config.languages.get(language.lower())
    
    def update_language_config(self, language: str, config: LanguageConfig):
        """Update configuration for a specific language."""
        self.config.languages[language.lower()] = config
    
    def get_resource_limits(self) -> ResourceLimits:
        """Get current resource limits."""
        return self.config.resource_limits
    
    def update_resource_limits(self, **kwargs):
        """Update resource limits."""
        for key, value in kwargs.items():
            if hasattr(self.config.resource_limits, key):
                setattr(self.config.resource_limits, key, value)
    
    def get_security_config(self) -> SecurityConfig:
        """Get current security configuration."""
        return self.config.security
    
    def is_import_allowed(self, import_name: str) -> bool:
        """Check if an import is allowed based on security configuration."""
        security = self.config.security
        
        # Check if explicitly blocked
        if import_name in security.blocked_imports:
            return False
        
        # Check if explicitly allowed
        if import_name in security.allowed_imports:
            return True
        
        # Default behavior based on security level
        return not security.enable_sandbox
    
    def get_environment_variables(self, language: Optional[str] = None) -> Dict[str, str]:
        """Get environment variables for execution."""
        env_vars = self.config.environment_variables.copy()
        
        if language and language in self.config.languages:
            lang_env = self.config.languages[language].environment_variables
            env_vars.update(lang_env)
        
        return env_vars
    
    def validate_config(self) -> List[str]:
        """Validate current configuration and return list of issues."""
        issues = []
        
        # Validate resource limits
        if self.config.resource_limits.max_memory_mb <= 0:
            issues.append("max_memory_mb must be positive")
        
        if self.config.resource_limits.max_cpu_percent <= 0 or self.config.resource_limits.max_cpu_percent > 100:
            issues.append("max_cpu_percent must be between 0 and 100")
        
        if self.config.resource_limits.max_execution_time_seconds <= 0:
            issues.append("max_execution_time_seconds must be positive")
        
        # Validate directories
        if self.config.working_directory and not os.path.exists(self.config.working_directory):
            issues.append(f"working_directory does not exist: {self.config.working_directory}")
        
        # Validate language configurations
        for lang, lang_config in self.config.languages.items():
            if not lang_config.file_extensions:
                issues.append(f"Language {lang} has no file extensions defined")
        
        return issues
    
    def create_sample_config(self, output_path: str) -> bool:
        """Create a sample configuration file."""
        try:
            sample_config = ExecutionConfig()
            sample_config.languages = self._default_language_configs
            
            config_dict = asdict(sample_config)
            config_dict = self._serialize_config(config_dict)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                if output_path.endswith('.yaml') or output_path.endswith('.yml'):
                    yaml.dump(config_dict, f, default_flow_style=False)
                else:
                    json.dump(config_dict, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error creating sample config: {e}")
            return False


# Global configuration instance
_config_manager: Optional[ConfigManager] = None


def get_config_manager(config_path: Optional[str] = None) -> ConfigManager:
    """Get the global configuration manager instance."""
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigManager(config_path)
    
    return _config_manager


def initialize_config(config_path: Optional[str] = None) -> ConfigManager:
    """Initialize the global configuration manager."""
    global _config_manager
    _config_manager = ConfigManager(config_path)
    return _config_manager