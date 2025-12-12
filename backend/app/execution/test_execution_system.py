"""
Comprehensive Test Suite for Application Execution System

This module provides extensive testing for the execution system including:
- Code reading and parsing
- Multi-language support
- Security validation
- Resource management
- Execution engine functionality
"""

import os
import tempfile
import shutil
import asyncio
import json
from pathlib import Path
from typing import Dict, List, Any
import logging

# Import our execution system modules
from .code_reader import CodeReader, LanguageType
from .execution_engine import ExecutionEngine, ExecutionConfig, ExecutionMode
from .security import SecurityManager, SecurityLevel
from .resource_manager import ResourceManager, ResourceLimits
from .config_manager import ConfigManager
from .language_support import (
    LanguageDetector, RuntimeManager, LanguageExecutor, 
    DependencyManager, get_runtime_manager, get_language_executor
)


class TestSample:
    """Represents a test code sample."""
    
    def __init__(self, name: str, language: LanguageType, code: str, 
                 expected_output: str = "", should_fail: bool = False,
                 dependencies: List[str] = None, security_issues: bool = False):
        self.name = name
        self.language = language
        self.code = code
        self.expected_output = expected_output
        self.should_fail = should_fail
        self.dependencies = dependencies or []
        self.security_issues = security_issues


class ExecutionSystemTester:
    """Main test runner for the execution system."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.test_results: Dict[str, Any] = {}
        self.temp_dir = None
        
        # Initialize system components
        self.code_reader = CodeReader()
        self.security_manager = SecurityManager()
        
        # Create default resource limits for testing
        from .resource_manager import ResourceLimits
        default_limits = ResourceLimits(
            max_memory_mb=512,
            max_cpu_percent=80.0,
            max_execution_time_seconds=60,
            max_processes=10
        )
        self.resource_manager = ResourceManager(default_limits)
        self.config_manager = ConfigManager()
        self.runtime_manager = get_runtime_manager()
        self.language_executor = get_language_executor()
        self.dependency_manager = DependencyManager(self.runtime_manager)
        
        # Create test samples
        self.test_samples = self._create_test_samples()
    
    def _create_test_samples(self) -> List[TestSample]:
        """Create comprehensive test samples for different languages."""
        samples = []
        
        # Python samples
        samples.extend([
            TestSample(
                name="python_hello_world",
                language=LanguageType.PYTHON,
                code='print("Hello, World!")',
                expected_output="Hello, World!"
            ),
            TestSample(
                name="python_with_imports",
                language=LanguageType.PYTHON,
                code='''
import os
import sys
print(f"Python version: {sys.version_info.major}.{sys.version_info.minor}")
print(f"Current directory: {os.getcwd()}")
''',
                expected_output="Python version:"
            ),
            TestSample(
                name="python_security_risk",
                language=LanguageType.PYTHON,
                code='''
import os
os.system("echo 'This is dangerous'")
''',
                security_issues=True,
                should_fail=True
            ),
            TestSample(
                name="python_infinite_loop",
                language=LanguageType.PYTHON,
                code='''
while True:
    pass
''',
                should_fail=True
            )
        ])
        
        # JavaScript samples
        samples.extend([
            TestSample(
                name="javascript_hello_world",
                language=LanguageType.JAVASCRIPT,
                code='console.log("Hello, World!");',
                expected_output="Hello, World!"
            ),
            TestSample(
                name="javascript_with_modules",
                language=LanguageType.JAVASCRIPT,
                code='''
const fs = require('fs');
const path = require('path');
console.log("Node.js version:", process.version);
console.log("Current directory:", process.cwd());
''',
                expected_output="Node.js version:"
            ),
            TestSample(
                name="javascript_security_risk",
                language=LanguageType.JAVASCRIPT,
                code='''
const { exec } = require('child_process');
exec('echo "This is dangerous"', (error, stdout, stderr) => {
    console.log(stdout);
});
''',
                security_issues=True,
                should_fail=True
            )
        ])
        
        # TypeScript samples
        samples.extend([
            TestSample(
                name="typescript_hello_world",
                language=LanguageType.TYPESCRIPT,
                code='''
interface Greeting {
    message: string;
}

const greeting: Greeting = { message: "Hello, TypeScript!" };
console.log(greeting.message);
''',
                expected_output="Hello, TypeScript!"
            )
        ])
        
        # Java samples
        samples.extend([
            TestSample(
                name="java_hello_world",
                language=LanguageType.JAVA,
                code='''
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
''',
                expected_output="Hello, Java!"
            )
        ])
        
        # Go samples
        samples.extend([
            TestSample(
                name="go_hello_world",
                language=LanguageType.GO,
                code='''
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
''',
                expected_output="Hello, Go!"
            )
        ])
        
        # Rust samples
        samples.extend([
            TestSample(
                name="rust_hello_world",
                language=LanguageType.RUST,
                code='''
fn main() {
    println!("Hello, Rust!");
}
''',
                expected_output="Hello, Rust!"
            )
        ])
        
        # C samples
        samples.extend([
            TestSample(
                name="c_hello_world",
                language=LanguageType.C,
                code='''
#include <stdio.h>

int main() {
    printf("Hello, C!\\n");
    return 0;
}
''',
                expected_output="Hello, C!"
            )
        ])
        
        # C++ samples
        samples.extend([
            TestSample(
                name="cpp_hello_world",
                language=LanguageType.CPP,
                code='''
#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}
''',
                expected_output="Hello, C++!"
            )
        ])
        
        # PHP samples
        samples.extend([
            TestSample(
                name="php_hello_world",
                language=LanguageType.UNKNOWN,  # PHP not in original LanguageType
                code='''
<?php
echo "Hello, PHP!\\n";
?>
''',
                expected_output="Hello, PHP!"
            )
        ])
        
        # Ruby samples
        samples.extend([
            TestSample(
                name="ruby_hello_world",
                language=LanguageType.UNKNOWN,  # Ruby not in original LanguageType
                code='puts "Hello, Ruby!"',
                expected_output="Hello, Ruby!"
            )
        ])
        
        return samples
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return comprehensive results."""
        self.logger.info("Starting comprehensive execution system tests...")
        
        # Create temporary directory for tests
        self.temp_dir = tempfile.mkdtemp(prefix="execution_test_")
        
        try:
            # Test results structure
            self.test_results = {
                "summary": {
                    "total_tests": 0,
                    "passed": 0,
                    "failed": 0,
                    "skipped": 0
                },
                "component_tests": {},
                "language_tests": {},
                "security_tests": {},
                "resource_tests": {},
                "integration_tests": {}
            }
            
            # Run component tests
            await self._test_code_reader()
            await self._test_language_detection()
            await self._test_runtime_manager()
            await self._test_security_manager()
            await self._test_resource_manager()
            await self._test_config_manager()
            
            # Run language-specific tests
            await self._test_language_execution()
            
            # Run security tests
            await self._test_security_validation()
            
            # Run resource management tests
            await self._test_resource_monitoring()
            
            # Run integration tests
            await self._test_full_execution_pipeline()
            
            # Calculate final summary
            self._calculate_summary()
            
            self.logger.info("All tests completed!")
            return self.test_results
            
        finally:
            # Cleanup
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
    
    async def _test_code_reader(self):
        """Test code reading functionality."""
        self.logger.info("Testing code reader...")
        
        test_results = []
        
        for sample in self.test_samples[:5]:  # Test first 5 samples
            try:
                # Create test file
                file_path = self._create_test_file(sample)
                
                # Test file reading
                code_file = await self.code_reader.read_file(file_path)
                
                # Validate results
                success = (
                    code_file.language == sample.language and
                    len(code_file.content) > 0
                )
                
                test_results.append({
                    "test": f"read_{sample.name}",
                    "passed": success,
                    "details": f"Language: {code_file.language}, Lines: {len(code_file.content.splitlines())}"
                })
                
            except Exception as e:
                test_results.append({
                    "test": f"read_{sample.name}",
                    "passed": False,
                    "error": str(e)
                })
        
        self.test_results["component_tests"]["code_reader"] = test_results
    
    async def _test_language_detection(self):
        """Test language detection functionality."""
        self.logger.info("Testing language detection...")
        
        test_results = []
        
        # Test file extension detection
        test_cases = [
            ("test.py", LanguageType.PYTHON),
            ("test.js", LanguageType.JAVASCRIPT),
            ("test.ts", LanguageType.TYPESCRIPT),
            ("test.java", LanguageType.JAVA),
            ("test.go", LanguageType.GO),
            ("test.rs", LanguageType.RUST),
            ("test.c", LanguageType.C),
            ("test.cpp", LanguageType.CPP),
            ("test.php", LanguageType.UNKNOWN),  # PHP not in original LanguageType
            ("test.rb", LanguageType.UNKNOWN),   # Ruby not in original LanguageType
        ]
        
        for filename, expected_lang in test_cases:
            try:
                file_path = os.path.join(self.temp_dir, filename)
                with open(file_path, 'w') as f:
                    f.write("# Test file")
                
                detected_lang = LanguageDetector.detect_from_file(file_path)
                success = detected_lang == expected_lang
                
                test_results.append({
                    "test": f"detect_{filename}",
                    "passed": success,
                    "expected": expected_lang.value,
                    "actual": detected_lang.value
                })
                
            except Exception as e:
                test_results.append({
                    "test": f"detect_{filename}",
                    "passed": False,
                    "error": str(e)
                })
        
        self.test_results["component_tests"]["language_detection"] = test_results
    
    async def _test_runtime_manager(self):
        """Test runtime manager functionality."""
        self.logger.info("Testing runtime manager...")
        
        test_results = []
        
        # Test runtime detection
        available_languages = self.runtime_manager.get_available_languages()
        
        test_results.append({
            "test": "runtime_detection",
            "passed": len(available_languages) > 0,
            "details": f"Available languages: {[lang.value for lang in available_languages]}"
        })
        
        # Test specific runtime checks
        for lang in [LanguageType.PYTHON, LanguageType.JAVASCRIPT]:
            runtime = self.runtime_manager.get_runtime(lang)
            if runtime:
                test_results.append({
                    "test": f"runtime_{lang.value}",
                    "passed": runtime.is_available,
                    "details": f"Version: {runtime.version}, Path: {runtime.executable_path}"
                })
            else:
                test_results.append({
                    "test": f"runtime_{lang.value}",
                    "passed": False,
                    "details": "Runtime not found"
                })
        
        self.test_results["component_tests"]["runtime_manager"] = test_results
    
    async def _test_security_manager(self):
        """Test security manager functionality."""
        self.logger.info("Testing security manager...")
        
        test_results = []
        
        # Test security analysis on samples with known security issues
        security_samples = [s for s in self.test_samples if s.security_issues]
        
        for sample in security_samples:
            try:
                file_path = self._create_test_file(sample)
                
                # Analyze security
                threats = await self.security_manager.analyze_project(os.path.dirname(file_path))
                
                # Should detect threats
                success = len(threats) > 0
                
                test_results.append({
                    "test": f"security_{sample.name}",
                    "passed": success,
                    "details": f"Threats detected: {len(threats)}"
                })
                
            except Exception as e:
                test_results.append({
                    "test": f"security_{sample.name}",
                    "passed": False,
                    "error": str(e)
                })
        
        self.test_results["component_tests"]["security_manager"] = test_results
    
    async def _test_resource_manager(self):
        """Test resource manager functionality."""
        self.logger.info("Testing resource manager...")
        
        test_results = []
        
        try:
            # Test resource monitoring initialization
            limits = ResourceLimits(
                max_memory_mb=512,
                max_cpu_percent=50.0,
                max_execution_time=30,
                max_processes=5
            )
            
            # Test system resource info
            system_info = self.resource_manager.get_system_resources()
            
            test_results.append({
                "test": "system_resources",
                "passed": system_info.total_memory > 0,
                "details": f"Memory: {system_info.total_memory}MB, CPU cores: {system_info.cpu_cores}"
            })
            
            # Test resource estimation
            sample_code = "print('Hello World')"
            estimated = self.resource_manager.estimate_resources(sample_code, LanguageType.PYTHON)
            
            test_results.append({
                "test": "resource_estimation",
                "passed": estimated.estimated_memory > 0,
                "details": f"Estimated memory: {estimated.estimated_memory}MB, time: {estimated.estimated_time}s"
            })
            
        except Exception as e:
            test_results.append({
                "test": "resource_manager_general",
                "passed": False,
                "error": str(e)
            })
        
        self.test_results["component_tests"]["resource_manager"] = test_results
    
    async def _test_config_manager(self):
        """Test configuration manager functionality."""
        self.logger.info("Testing configuration manager...")
        
        test_results = []
        
        try:
            # Test default configuration
            default_config = self.config_manager.get_default_config()
            
            test_results.append({
                "test": "default_config",
                "passed": default_config is not None,
                "details": f"Languages: {len(default_config.language_configs)}"
            })
            
            # Test configuration validation
            is_valid = self.config_manager.validate_config(default_config)
            
            test_results.append({
                "test": "config_validation",
                "passed": is_valid,
                "details": "Default configuration validation"
            })
            
        except Exception as e:
            test_results.append({
                "test": "config_manager_general",
                "passed": False,
                "error": str(e)
            })
        
        self.test_results["component_tests"]["config_manager"] = test_results
    
    async def _test_language_execution(self):
        """Test language-specific execution."""
        self.logger.info("Testing language execution...")
        
        # Group samples by language
        language_results = {}
        
        for sample in self.test_samples:
            if sample.language not in language_results:
                language_results[sample.language] = []
            
            # Skip if runtime not available
            if not self.runtime_manager.is_available(sample.language):
                language_results[sample.language].append({
                    "test": sample.name,
                    "passed": False,
                    "skipped": True,
                    "reason": "Runtime not available"
                })
                continue
            
            try:
                file_path = self._create_test_file(sample)
                
                # Prepare execution
                execution_cmd = self.language_executor.prepare_execution(
                    file_path, sample.language, os.path.dirname(file_path)
                )
                
                if execution_cmd:
                    # Test compilation if needed
                    if execution_cmd.requires_compilation:
                        compile_success, compile_error = self.language_executor.compile_if_needed(execution_cmd)
                        
                        language_results[sample.language].append({
                            "test": f"{sample.name}_compilation",
                            "passed": compile_success,
                            "details": compile_error if not compile_success else "Compilation successful"
                        })
                    
                    language_results[sample.language].append({
                        "test": sample.name,
                        "passed": True,
                        "details": f"Execution prepared: {' '.join(execution_cmd.command[:2])}"
                    })
                else:
                    language_results[sample.language].append({
                        "test": sample.name,
                        "passed": False,
                        "details": "Could not prepare execution"
                    })
                    
            except Exception as e:
                language_results[sample.language].append({
                    "test": sample.name,
                    "passed": False,
                    "error": str(e)
                })
        
        self.test_results["language_tests"] = {
            lang.value: results for lang, results in language_results.items()
        }
    
    async def _test_security_validation(self):
        """Test security validation pipeline."""
        self.logger.info("Testing security validation...")
        
        test_results = []
        
        # Test different security levels
        security_levels = [SecurityLevel.LOW, SecurityLevel.MEDIUM, SecurityLevel.HIGH]
        
        for level in security_levels:
            try:
                # Create a sample with potential security issues
                risky_sample = next(s for s in self.test_samples if s.security_issues)
                file_path = self._create_test_file(risky_sample)
                project_path = os.path.dirname(file_path)
                
                # Test security validation
                is_safe, report = await self.security_manager.validate_project_security(
                    project_path, level
                )
                
                # Should fail for risky code at higher security levels
                expected_result = level == SecurityLevel.LOW
                success = is_safe == expected_result
                
                test_results.append({
                    "test": f"security_level_{level.value}",
                    "passed": success,
                    "details": f"Safe: {is_safe}, Threats: {len(report.threats)}"
                })
                
            except Exception as e:
                test_results.append({
                    "test": f"security_level_{level.value}",
                    "passed": False,
                    "error": str(e)
                })
        
        self.test_results["security_tests"] = test_results
    
    async def _test_resource_monitoring(self):
        """Test resource monitoring during execution."""
        self.logger.info("Testing resource monitoring...")
        
        test_results = []
        
        try:
            # Test resource limits
            limits = ResourceLimits(
                max_memory_mb=100,
                max_cpu_percent=50.0,
                max_execution_time=10,
                max_processes=3
            )
            
            # Test monitoring setup
            monitor_active = self.resource_manager.monitor is not None
            
            test_results.append({
                "test": "monitor_initialization",
                "passed": monitor_active,
                "details": "Resource monitor initialized"
            })
            
            # Test alert generation (simulate high usage)
            alerts = self.resource_manager.check_limits(limits)
            
            test_results.append({
                "test": "alert_system",
                "passed": isinstance(alerts, list),
                "details": f"Alert system functional, {len(alerts)} alerts"
            })
            
        except Exception as e:
            test_results.append({
                "test": "resource_monitoring_general",
                "passed": False,
                "error": str(e)
            })
        
        self.test_results["resource_tests"] = test_results
    
    async def _test_full_execution_pipeline(self):
        """Test the complete execution pipeline integration."""
        self.logger.info("Testing full execution pipeline...")
        
        test_results = []
        
        # Test with a simple Python script (most likely to be available)
        if self.runtime_manager.is_available(LanguageType.PYTHON):
            try:
                # Create a simple test project
                project_dir = os.path.join(self.temp_dir, "integration_test")
                os.makedirs(project_dir, exist_ok=True)
                
                # Create main script
                main_file = os.path.join(project_dir, "main.py")
                with open(main_file, 'w') as f:
                    f.write('''
import sys
print("Integration test successful!")
print(f"Python version: {sys.version_info.major}.{sys.version_info.minor}")
''')
                
                # Test full pipeline
                # 1. Code reading
                code_file = await self.code_reader.read_file(main_file)
                
                # 2. Security analysis
                threats = await self.security_manager.analyze_project(project_dir)
                
                # 3. Resource estimation
                estimated = self.resource_manager.estimate_resources(
                    code_file.content, LanguageType.PYTHON
                )
                
                # 4. Execution preparation
                execution_cmd = self.language_executor.prepare_execution(
                    main_file, LanguageType.PYTHON, project_dir
                )
                
                success = (
                    code_file.language == LanguageType.PYTHON and
                    len(threats) == 0 and  # Should be safe
                    estimated.estimated_memory > 0 and
                    execution_cmd is not None
                )
                
                test_results.append({
                    "test": "full_pipeline_python",
                    "passed": success,
                    "details": f"Code read: ✓, Security: {len(threats)} threats, Resources: {estimated.estimated_memory}MB, Execution: {'✓' if execution_cmd else '✗'}"
                })
                
            except Exception as e:
                test_results.append({
                    "test": "full_pipeline_python",
                    "passed": False,
                    "error": str(e)
                })
        else:
            test_results.append({
                "test": "full_pipeline_python",
                "passed": False,
                "skipped": True,
                "reason": "Python runtime not available"
            })
        
        self.test_results["integration_tests"] = test_results
    
    def _create_test_file(self, sample: TestSample) -> str:
        """Create a temporary test file for a sample."""
        # Determine file extension
        extensions = {
            LanguageType.PYTHON: '.py',
            LanguageType.JAVASCRIPT: '.js',
            LanguageType.TYPESCRIPT: '.ts',
            LanguageType.JAVA: '.java',
            LanguageType.GO: '.go',
            LanguageType.RUST: '.rs',
            LanguageType.C: '.c',
            LanguageType.CPP: '.cpp',
            LanguageType.CSHARP: '.cs',
            LanguageType.PHP: '.php',
            LanguageType.RUBY: '.rb',
        }
        
        ext = extensions.get(sample.language, '.txt')
        filename = f"{sample.name}{ext}"
        
        # Special handling for Java (class name must match filename)
        if sample.language == LanguageType.JAVA:
            # Extract class name from code
            import re
            class_match = re.search(r'class\s+(\w+)', sample.code)
            if class_match:
                class_name = class_match.group(1)
                filename = f"{class_name}.java"
        
        file_path = os.path.join(self.temp_dir, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(sample.code)
        
        return file_path
    
    def _calculate_summary(self):
        """Calculate test summary statistics."""
        total_tests = 0
        passed = 0
        failed = 0
        skipped = 0
        
        # Count all test results
        for category, tests in self.test_results.items():
            if category == "summary":
                continue
            
            if isinstance(tests, dict):
                for subcategory, subtests in tests.items():
                    if isinstance(subtests, list):
                        for test in subtests:
                            total_tests += 1
                            if test.get("skipped", False):
                                skipped += 1
                            elif test.get("passed", False):
                                passed += 1
                            else:
                                failed += 1
            elif isinstance(tests, list):
                for test in tests:
                    total_tests += 1
                    if test.get("skipped", False):
                        skipped += 1
                    elif test.get("passed", False):
                        passed += 1
                    else:
                        failed += 1
        
        self.test_results["summary"] = {
            "total_tests": total_tests,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "success_rate": f"{(passed / total_tests * 100):.1f}%" if total_tests > 0 else "0%"
        }
    
    def generate_report(self) -> str:
        """Generate a human-readable test report."""
        if not self.test_results:
            return "No test results available."
        
        report = []
        report.append("=" * 60)
        report.append("APPLICATION EXECUTION SYSTEM TEST REPORT")
        report.append("=" * 60)
        
        # Summary
        summary = self.test_results.get("summary", {})
        report.append(f"\nSUMMARY:")
        report.append(f"  Total Tests: {summary.get('total_tests', 0)}")
        report.append(f"  Passed: {summary.get('passed', 0)}")
        report.append(f"  Failed: {summary.get('failed', 0)}")
        report.append(f"  Skipped: {summary.get('skipped', 0)}")
        report.append(f"  Success Rate: {summary.get('success_rate', '0%')}")
        
        # Detailed results
        for category, tests in self.test_results.items():
            if category == "summary":
                continue
            
            report.append(f"\n{category.upper().replace('_', ' ')}:")
            
            if isinstance(tests, dict):
                for subcategory, subtests in tests.items():
                    report.append(f"  {subcategory}:")
                    if isinstance(subtests, list):
                        for test in subtests:
                            status = "PASS" if test.get("passed") else "SKIP" if test.get("skipped") else "FAIL"
                            report.append(f"    [{status}] {test.get('test', 'Unknown')}")
                            if test.get("details"):
                                report.append(f"         {test['details']}")
                            if test.get("error"):
                                report.append(f"         Error: {test['error']}")
            elif isinstance(tests, list):
                for test in tests:
                    status = "PASS" if test.get("passed") else "SKIP" if test.get("skipped") else "FAIL"
                    report.append(f"  [{status}] {test.get('test', 'Unknown')}")
                    if test.get("details"):
                        report.append(f"       {test['details']}")
                    if test.get("error"):
                        report.append(f"       Error: {test['error']}")
        
        report.append("\n" + "=" * 60)
        return "\n".join(report)


# Convenience function to run tests
async def run_execution_system_tests() -> Dict[str, Any]:
    """Run comprehensive tests of the execution system."""
    tester = ExecutionSystemTester()
    results = await tester.run_all_tests()
    
    # Print report
    print(tester.generate_report())
    
    return results


if __name__ == "__main__":
    # Run tests if executed directly
    import asyncio
    asyncio.run(run_execution_system_tests())