"""
Security Module

This module provides security features for safe code execution including:
- Code sandboxing and isolation
- Resource limits enforcement
- File system access control
- Network access restrictions
- Malicious code detection
- Execution environment hardening
"""

import os
import sys
import tempfile
import shutil
import subprocess
import asyncio
import re
import ast
from pathlib import Path
from typing import Dict, List, Optional, Set, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import logging
import hashlib
import json

from .code_reader import CodeReader, CodeFile, LanguageType

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security levels for code execution"""
    MINIMAL = "minimal"      # Basic validation only
    STANDARD = "standard"    # Standard security measures
    STRICT = "strict"        # Strict security with sandboxing
    PARANOID = "paranoid"    # Maximum security restrictions


class ThreatType(Enum):
    """Types of security threats"""
    MALICIOUS_IMPORT = "malicious_import"
    FILE_SYSTEM_ACCESS = "file_system_access"
    NETWORK_ACCESS = "network_access"
    SYSTEM_COMMAND = "system_command"
    RESOURCE_ABUSE = "resource_abuse"
    CODE_INJECTION = "code_injection"
    PRIVILEGE_ESCALATION = "privilege_escalation"


@dataclass
class SecurityThreat:
    """Represents a detected security threat"""
    threat_type: ThreatType
    severity: str  # low, medium, high, critical
    description: str
    location: Optional[str] = None
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    mitigation: Optional[str] = None


@dataclass
class SecurityConfig:
    """Security configuration settings"""
    security_level: SecurityLevel = SecurityLevel.STANDARD
    allowed_imports: Set[str] = field(default_factory=set)
    blocked_imports: Set[str] = field(default_factory=set)
    allow_file_read: bool = True
    allow_file_write: bool = False
    allow_network_access: bool = False
    allow_subprocess: bool = False
    max_execution_time: int = 300  # seconds
    max_memory_usage: int = 512    # MB
    max_cpu_usage: float = 1.0     # CPU cores
    sandbox_directory: Optional[Path] = None
    enable_code_analysis: bool = True
    whitelist_functions: Set[str] = field(default_factory=set)
    blacklist_functions: Set[str] = field(default_factory=set)


class CodeAnalyzer:
    """Analyzes code for security threats"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.threats: List[SecurityThreat] = []
        
        # Default dangerous patterns
        self.dangerous_patterns = {
            # Python dangerous functions
            'eval': ThreatType.CODE_INJECTION,
            'exec': ThreatType.CODE_INJECTION,
            'compile': ThreatType.CODE_INJECTION,
            '__import__': ThreatType.MALICIOUS_IMPORT,
            'subprocess': ThreatType.SYSTEM_COMMAND,
            'os.system': ThreatType.SYSTEM_COMMAND,
            'os.popen': ThreatType.SYSTEM_COMMAND,
            'os.spawn': ThreatType.SYSTEM_COMMAND,
            'open': ThreatType.FILE_SYSTEM_ACCESS,
            'file': ThreatType.FILE_SYSTEM_ACCESS,
            'input': ThreatType.CODE_INJECTION,
            'raw_input': ThreatType.CODE_INJECTION,
        }
        
        # Dangerous imports
        self.dangerous_imports = {
            'os': ['system', 'popen', 'spawn', 'remove', 'rmdir'],
            'subprocess': ['call', 'run', 'Popen', 'check_output'],
            'shutil': ['rmtree', 'move', 'copy'],
            'socket': ['socket', 'create_connection'],
            'urllib': ['urlopen', 'urlretrieve'],
            'requests': ['get', 'post', 'put', 'delete'],
            'ftplib': ['FTP'],
            'telnetlib': ['Telnet'],
            'pickle': ['load', 'loads'],
            'marshal': ['load', 'loads'],
            'ctypes': ['*'],
        }
    
    def analyze_code_file(self, code_file: CodeFile) -> List[SecurityThreat]:
        """Analyze a single code file for security threats"""
        self.threats = []
        
        if code_file.language == LanguageType.PYTHON:
            self._analyze_python_code(code_file)
        elif code_file.language in [LanguageType.JAVASCRIPT, LanguageType.TYPESCRIPT]:
            self._analyze_javascript_code(code_file)
        else:
            self._analyze_generic_code(code_file)
        
        return self.threats
    
    def _analyze_python_code(self, code_file: CodeFile):
        """Analyze Python code for security threats"""
        try:
            tree = ast.parse(code_file.content)
            
            for node in ast.walk(tree):
                self._check_python_node(node, code_file)
                
        except SyntaxError as e:
            self.threats.append(SecurityThreat(
                threat_type=ThreatType.CODE_INJECTION,
                severity="medium",
                description=f"Syntax error that could indicate code injection: {e}",
                location=str(code_file.path),
                line_number=getattr(e, 'lineno', None)
            ))
    
    def _check_python_node(self, node: ast.AST, code_file: CodeFile):
        """Check individual Python AST node for threats"""
        # Check function calls
        if isinstance(node, ast.Call):
            func_name = self._get_function_name(node.func)
            if func_name in self.dangerous_patterns:
                threat_type = self.dangerous_patterns[func_name]
                self.threats.append(SecurityThreat(
                    threat_type=threat_type,
                    severity="high",
                    description=f"Dangerous function call: {func_name}",
                    location=str(code_file.path),
                    line_number=getattr(node, 'lineno', None),
                    mitigation=f"Consider removing or replacing {func_name} with safer alternatives"
                ))
        
        # Check imports
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            self._check_import_node(node, code_file)
        
        # Check attribute access
        elif isinstance(node, ast.Attribute):
            attr_name = f"{self._get_attribute_chain(node)}"
            if any(dangerous in attr_name for dangerous in self.dangerous_patterns):
                self.threats.append(SecurityThreat(
                    threat_type=ThreatType.SYSTEM_COMMAND,
                    severity="medium",
                    description=f"Potentially dangerous attribute access: {attr_name}",
                    location=str(code_file.path),
                    line_number=getattr(node, 'lineno', None)
                ))
    
    def _get_function_name(self, node: ast.AST) -> str:
        """Extract function name from AST node"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return self._get_attribute_chain(node)
        return ""
    
    def _get_attribute_chain(self, node: ast.Attribute) -> str:
        """Get full attribute chain (e.g., os.system)"""
        if isinstance(node.value, ast.Name):
            return f"{node.value.id}.{node.attr}"
        elif isinstance(node.value, ast.Attribute):
            return f"{self._get_attribute_chain(node.value)}.{node.attr}"
        return node.attr
    
    def _check_import_node(self, node: Union[ast.Import, ast.ImportFrom], code_file: CodeFile):
        """Check import statements for dangerous modules"""
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_name = alias.name
                self._validate_import(module_name, code_file, getattr(node, 'lineno', None))
        
        elif isinstance(node, ast.ImportFrom):
            module_name = node.module or ""
            for alias in node.names:
                import_name = f"{module_name}.{alias.name}" if module_name else alias.name
                self._validate_import(import_name, code_file, getattr(node, 'lineno', None))
    
    def _validate_import(self, import_name: str, code_file: CodeFile, line_number: Optional[int]):
        """Validate individual import"""
        # Check blocked imports
        if import_name in self.config.blocked_imports:
            self.threats.append(SecurityThreat(
                threat_type=ThreatType.MALICIOUS_IMPORT,
                severity="high",
                description=f"Blocked import detected: {import_name}",
                location=str(code_file.path),
                line_number=line_number,
                mitigation="Remove this import or add it to allowed imports if necessary"
            ))
            return
        
        # Check dangerous imports
        for dangerous_module, dangerous_functions in self.dangerous_imports.items():
            if import_name.startswith(dangerous_module):
                severity = "high" if dangerous_functions == ['*'] else "medium"
                self.threats.append(SecurityThreat(
                    threat_type=ThreatType.MALICIOUS_IMPORT,
                    severity=severity,
                    description=f"Potentially dangerous import: {import_name}",
                    location=str(code_file.path),
                    line_number=line_number,
                    mitigation=f"Review usage of {import_name} for security implications"
                ))
    
    def _analyze_javascript_code(self, code_file: CodeFile):
        """Analyze JavaScript/TypeScript code for security threats"""
        content = code_file.content
        
        # Check for dangerous JavaScript patterns
        dangerous_js_patterns = [
            (r'eval\s*\(', ThreatType.CODE_INJECTION, "eval() function call"),
            (r'Function\s*\(', ThreatType.CODE_INJECTION, "Function constructor"),
            (r'document\.write\s*\(', ThreatType.CODE_INJECTION, "document.write() call"),
            (r'innerHTML\s*=', ThreatType.CODE_INJECTION, "innerHTML assignment"),
            (r'require\s*\(\s*[\'"]child_process[\'"]', ThreatType.SYSTEM_COMMAND, "child_process module"),
            (r'require\s*\(\s*[\'"]fs[\'"]', ThreatType.FILE_SYSTEM_ACCESS, "fs module"),
            (r'XMLHttpRequest', ThreatType.NETWORK_ACCESS, "XMLHttpRequest usage"),
            (r'fetch\s*\(', ThreatType.NETWORK_ACCESS, "fetch() call"),
        ]
        
        for pattern, threat_type, description in dangerous_js_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                line_number = content[:match.start()].count('\n') + 1
                self.threats.append(SecurityThreat(
                    threat_type=threat_type,
                    severity="medium",
                    description=f"Potentially dangerous JavaScript pattern: {description}",
                    location=str(code_file.path),
                    line_number=line_number,
                    code_snippet=match.group()
                ))
    
    def _analyze_generic_code(self, code_file: CodeFile):
        """Generic code analysis for other languages"""
        content = code_file.content
        
        # Check for common dangerous patterns across languages
        generic_patterns = [
            (r'system\s*\(', ThreatType.SYSTEM_COMMAND, "system() call"),
            (r'exec\s*\(', ThreatType.SYSTEM_COMMAND, "exec() call"),
            (r'shell_exec\s*\(', ThreatType.SYSTEM_COMMAND, "shell_exec() call"),
            (r'Runtime\.getRuntime\(\)\.exec', ThreatType.SYSTEM_COMMAND, "Java Runtime.exec()"),
            (r'ProcessBuilder', ThreatType.SYSTEM_COMMAND, "Java ProcessBuilder"),
            (r'cmd\.exe', ThreatType.SYSTEM_COMMAND, "Windows command execution"),
            (r'/bin/sh', ThreatType.SYSTEM_COMMAND, "Shell execution"),
        ]
        
        for pattern, threat_type, description in generic_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                line_number = content[:match.start()].count('\n') + 1
                self.threats.append(SecurityThreat(
                    threat_type=threat_type,
                    severity="medium",
                    description=f"Potentially dangerous pattern: {description}",
                    location=str(code_file.path),
                    line_number=line_number,
                    code_snippet=match.group()
                ))


class SandboxManager:
    """Manages sandboxed execution environments"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.sandbox_dir: Optional[Path] = None
        self.original_cwd: Optional[Path] = None
    
    async def create_sandbox(self) -> Path:
        """Create a sandboxed execution environment"""
        if self.config.sandbox_directory:
            self.sandbox_dir = self.config.sandbox_directory
        else:
            self.sandbox_dir = Path(tempfile.mkdtemp(prefix="code_execution_sandbox_"))
        
        self.sandbox_dir.mkdir(exist_ok=True)
        
        # Set restrictive permissions
        if os.name != 'nt':  # Unix-like systems
            os.chmod(self.sandbox_dir, 0o755)
        
        logger.info(f"Created sandbox directory: {self.sandbox_dir}")
        return self.sandbox_dir
    
    async def setup_sandbox_environment(self, project_path: Path) -> Path:
        """Setup sandbox with project files"""
        sandbox_path = await self.create_sandbox()
        
        # Copy project files to sandbox
        project_sandbox = sandbox_path / "project"
        shutil.copytree(project_path, project_sandbox, ignore=shutil.ignore_patterns(
            '*.pyc', '__pycache__', '.git', 'node_modules', '.next', 'target', 'build'
        ))
        
        # Create restricted environment
        await self._create_restricted_environment(project_sandbox)
        
        return project_sandbox
    
    async def _create_restricted_environment(self, sandbox_path: Path):
        """Create restricted execution environment"""
        # Create minimal Python environment if needed
        if (sandbox_path / "requirements.txt").exists() or any(f.suffix == '.py' for f in sandbox_path.rglob('*')):
            await self._setup_python_sandbox(sandbox_path)
        
        # Create minimal Node.js environment if needed
        if (sandbox_path / "package.json").exists() or any(f.suffix in ['.js', '.ts'] for f in sandbox_path.rglob('*')):
            await self._setup_node_sandbox(sandbox_path)
    
    async def _setup_python_sandbox(self, sandbox_path: Path):
        """Setup Python-specific sandbox restrictions"""
        # Create restricted Python script wrapper
        wrapper_script = sandbox_path / "_sandbox_wrapper.py"
        
        wrapper_content = '''
import sys
import os
import builtins

# Restrict dangerous builtins
original_import = builtins.__import__
original_open = builtins.open

def restricted_import(name, *args, **kwargs):
    blocked_modules = {'os', 'subprocess', 'socket', 'urllib', 'requests', 'ctypes'}
    if name in blocked_modules:
        raise ImportError(f"Import of '{name}' is not allowed in sandbox")
    return original_import(name, *args, **kwargs)

def restricted_open(file, mode='r', *args, **kwargs):
    if 'w' in mode or 'a' in mode or '+' in mode:
        raise PermissionError("Write access not allowed in sandbox")
    return original_open(file, mode, *args, **kwargs)

# Apply restrictions
builtins.__import__ = restricted_import
builtins.open = restricted_open

# Remove dangerous functions
if hasattr(builtins, 'eval'):
    delattr(builtins, 'eval')
if hasattr(builtins, 'exec'):
    delattr(builtins, 'exec')
'''
        
        with open(wrapper_script, 'w') as f:
            f.write(wrapper_content)
    
    async def _setup_node_sandbox(self, sandbox_path: Path):
        """Setup Node.js-specific sandbox restrictions"""
        # Create package.json with restricted dependencies
        restricted_package = {
            "name": "sandboxed-execution",
            "version": "1.0.0",
            "main": "index.js",
            "dependencies": {},
            "scripts": {
                "start": "node index.js"
            }
        }
        
        package_json_path = sandbox_path / "package.json"
        if package_json_path.exists():
            # Read existing package.json and filter dependencies
            with open(package_json_path, 'r') as f:
                existing_package = json.load(f)
            
            # Filter out dangerous dependencies
            dangerous_deps = {'child_process', 'fs-extra', 'shelljs', 'node-cmd'}
            if 'dependencies' in existing_package:
                filtered_deps = {k: v for k, v in existing_package['dependencies'].items() 
                               if k not in dangerous_deps}
                restricted_package['dependencies'] = filtered_deps
        
        with open(package_json_path, 'w') as f:
            json.dump(restricted_package, f, indent=2)
    
    def cleanup_sandbox(self):
        """Clean up sandbox environment"""
        if self.sandbox_dir and self.sandbox_dir.exists():
            try:
                shutil.rmtree(self.sandbox_dir)
                logger.info(f"Cleaned up sandbox: {self.sandbox_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup sandbox: {e}")
        
        if self.original_cwd:
            os.chdir(self.original_cwd)


class SecurityManager:
    """Main security manager for code execution"""
    
    def __init__(self, config: SecurityConfig = None):
        self.config = config or SecurityConfig()
        self.code_analyzer = CodeAnalyzer(self.config)
        self.sandbox_manager = SandboxManager(self.config)
        self.code_reader = CodeReader()
    
    async def validate_project_security(self, project_path: Path) -> Dict[str, Any]:
        """Validate security of an entire project"""
        logger.info(f"Validating security for project: {project_path}")
        
        # Analyze project structure
        project = self.code_reader.analyze_project(project_path)
        
        all_threats = []
        file_analysis = {}
        
        # Analyze each code file
        for code_file in project.files:
            threats = self.code_analyzer.analyze_code_file(code_file)
            all_threats.extend(threats)
            
            file_analysis[str(code_file.path)] = {
                'language': code_file.language.value,
                'threats_count': len(threats),
                'threats': [self._threat_to_dict(threat) for threat in threats],
                'syntax_valid': code_file.syntax_valid
            }
        
        # Calculate security score
        security_score = self._calculate_security_score(all_threats)
        
        # Determine if execution should be allowed
        execution_allowed = self._should_allow_execution(all_threats, security_score)
        
        return {
            'security_score': security_score,
            'execution_allowed': execution_allowed,
            'total_threats': len(all_threats),
            'threat_summary': self._summarize_threats(all_threats),
            'file_analysis': file_analysis,
            'recommendations': self._generate_recommendations(all_threats)
        }
    
    def _threat_to_dict(self, threat: SecurityThreat) -> Dict[str, Any]:
        """Convert threat object to dictionary"""
        return {
            'type': threat.threat_type.value,
            'severity': threat.severity,
            'description': threat.description,
            'location': threat.location,
            'line_number': threat.line_number,
            'code_snippet': threat.code_snippet,
            'mitigation': threat.mitigation
        }
    
    def _calculate_security_score(self, threats: List[SecurityThreat]) -> float:
        """Calculate security score (0-100, higher is better)"""
        if not threats:
            return 100.0
        
        severity_weights = {
            'low': 1,
            'medium': 3,
            'high': 7,
            'critical': 15
        }
        
        total_weight = sum(severity_weights.get(threat.severity, 1) for threat in threats)
        
        # Normalize to 0-100 scale (assuming max reasonable weight is 100)
        score = max(0, 100 - (total_weight * 2))
        return score
    
    def _should_allow_execution(self, threats: List[SecurityThreat], security_score: float) -> bool:
        """Determine if execution should be allowed based on security analysis"""
        if self.config.security_level == SecurityLevel.MINIMAL:
            return True
        elif self.config.security_level == SecurityLevel.STANDARD:
            return security_score >= 70 and not any(t.severity == 'critical' for t in threats)
        elif self.config.security_level == SecurityLevel.STRICT:
            return security_score >= 85 and not any(t.severity in ['critical', 'high'] for t in threats)
        elif self.config.security_level == SecurityLevel.PARANOID:
            return security_score >= 95 and len(threats) == 0
        
        return False
    
    def _summarize_threats(self, threats: List[SecurityThreat]) -> Dict[str, int]:
        """Summarize threats by type and severity"""
        summary = {
            'by_type': {},
            'by_severity': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        }
        
        for threat in threats:
            # Count by type
            threat_type = threat.threat_type.value
            summary['by_type'][threat_type] = summary['by_type'].get(threat_type, 0) + 1
            
            # Count by severity
            summary['by_severity'][threat.severity] += 1
        
        return summary
    
    def _generate_recommendations(self, threats: List[SecurityThreat]) -> List[str]:
        """Generate security recommendations based on detected threats"""
        recommendations = []
        
        threat_types = set(threat.threat_type for threat in threats)
        
        if ThreatType.CODE_INJECTION in threat_types:
            recommendations.append("Remove or replace eval(), exec(), and similar dynamic code execution functions")
        
        if ThreatType.SYSTEM_COMMAND in threat_types:
            recommendations.append("Avoid system command execution; use safer alternatives or validate inputs thoroughly")
        
        if ThreatType.FILE_SYSTEM_ACCESS in threat_types:
            recommendations.append("Restrict file system access to necessary directories only")
        
        if ThreatType.NETWORK_ACCESS in threat_types:
            recommendations.append("Review network access requirements and implement proper validation")
        
        if ThreatType.MALICIOUS_IMPORT in threat_types:
            recommendations.append("Review imported modules and remove unnecessary dangerous imports")
        
        # Add general recommendations based on security level
        if self.config.security_level in [SecurityLevel.STRICT, SecurityLevel.PARANOID]:
            recommendations.extend([
                "Consider running code in a containerized environment",
                "Implement comprehensive input validation",
                "Use principle of least privilege for execution"
            ])
        
        return recommendations
    
    async def prepare_secure_execution(self, project_path: Path) -> Optional[Path]:
        """Prepare project for secure execution"""
        # Validate security first
        security_report = await self.validate_project_security(project_path)
        
        if not security_report['execution_allowed']:
            logger.error("Project failed security validation")
            return None
        
        # Create sandbox if required
        if self.config.security_level in [SecurityLevel.STRICT, SecurityLevel.PARANOID]:
            sandbox_path = await self.sandbox_manager.setup_sandbox_environment(project_path)
            return sandbox_path
        
        return project_path
    
    def cleanup_security_resources(self):
        """Clean up security-related resources"""
        self.sandbox_manager.cleanup_sandbox()
    
    def get_security_config(self) -> Dict[str, Any]:
        """Get current security configuration"""
        return {
            'security_level': self.config.security_level.value,
            'allowed_imports': list(self.config.allowed_imports),
            'blocked_imports': list(self.config.blocked_imports),
            'allow_file_read': self.config.allow_file_read,
            'allow_file_write': self.config.allow_file_write,
            'allow_network_access': self.config.allow_network_access,
            'allow_subprocess': self.config.allow_subprocess,
            'max_execution_time': self.config.max_execution_time,
            'max_memory_usage': self.config.max_memory_usage,
            'max_cpu_usage': self.config.max_cpu_usage
        }