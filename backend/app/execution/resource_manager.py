"""
Resource Manager for Application Execution System

This module provides comprehensive resource monitoring and management capabilities
for controlling memory, CPU, network, and other system resources during code execution.
"""

import os
import time
import psutil
import threading
import asyncio
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging


class ResourceType(Enum):
    """Types of system resources to monitor."""
    MEMORY = "memory"
    CPU = "cpu"
    DISK = "disk"
    NETWORK = "network"
    PROCESSES = "processes"
    FILE_HANDLES = "file_handles"


class AlertLevel(Enum):
    """Alert levels for resource monitoring."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class ResourceUsage:
    """Current resource usage statistics."""
    timestamp: datetime = field(default_factory=datetime.now)
    memory_mb: float = 0.0
    memory_percent: float = 0.0
    cpu_percent: float = 0.0
    disk_usage_mb: float = 0.0
    disk_io_read_mb: float = 0.0
    disk_io_write_mb: float = 0.0
    network_sent_mb: float = 0.0
    network_recv_mb: float = 0.0
    process_count: int = 0
    file_handle_count: int = 0
    thread_count: int = 0


@dataclass
class ResourceLimits:
    """Resource limits configuration."""
    max_memory_mb: int = 512
    max_cpu_percent: float = 50.0
    max_disk_usage_mb: int = 1024
    max_network_mb: int = 100
    max_processes: int = 10
    max_file_handles: int = 100
    max_execution_time_seconds: int = 300


@dataclass
class ResourceAlert:
    """Resource usage alert."""
    resource_type: ResourceType
    level: AlertLevel
    message: str
    current_value: float
    limit_value: float
    timestamp: datetime = field(default_factory=datetime.now)
    process_id: Optional[int] = None


@dataclass
class ProcessInfo:
    """Information about a monitored process."""
    pid: int
    name: str
    command: str
    start_time: datetime
    cpu_percent: float = 0.0
    memory_mb: float = 0.0
    status: str = "running"
    parent_pid: Optional[int] = None


class ResourceMonitor:
    """Monitors system resource usage for a specific process or process group."""
    
    def __init__(self, 
                 process_id: Optional[int] = None,
                 monitor_children: bool = True,
                 sampling_interval: float = 1.0):
        """
        Initialize the resource monitor.
        
        Args:
            process_id: Process ID to monitor (None for current process)
            monitor_children: Whether to monitor child processes
            sampling_interval: Sampling interval in seconds
        """
        self.process_id = process_id or os.getpid()
        self.monitor_children = monitor_children
        self.sampling_interval = sampling_interval
        
        self.is_monitoring = False
        self.monitor_thread: Optional[threading.Thread] = None
        self.usage_history: List[ResourceUsage] = []
        self.max_history_size = 1000
        
        # Process tracking
        self.monitored_processes: Dict[int, ProcessInfo] = {}
        self.process_tree: Dict[int, List[int]] = {}
        
        # Callbacks
        self.usage_callbacks: List[Callable[[ResourceUsage], None]] = []
        self.alert_callbacks: List[Callable[[ResourceAlert], None]] = []
        
        # Initial baseline
        self.baseline_usage: Optional[ResourceUsage] = None
        
        # Logger
        self.logger = logging.getLogger(__name__)
    
    def add_usage_callback(self, callback: Callable[[ResourceUsage], None]):
        """Add a callback for resource usage updates."""
        self.usage_callbacks.append(callback)
    
    def add_alert_callback(self, callback: Callable[[ResourceAlert], None]):
        """Add a callback for resource alerts."""
        self.alert_callbacks.append(callback)
    
    def start_monitoring(self):
        """Start resource monitoring in a separate thread."""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        # Capture baseline
        self.baseline_usage = self._collect_usage()
        
        self.logger.info(f"Started monitoring process {self.process_id}")
    
    def stop_monitoring(self):
        """Stop resource monitoring."""
        self.is_monitoring = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5.0)
        
        self.logger.info("Stopped resource monitoring")
    
    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.is_monitoring:
            try:
                usage = self._collect_usage()
                
                # Store usage history
                self.usage_history.append(usage)
                if len(self.usage_history) > self.max_history_size:
                    self.usage_history.pop(0)
                
                # Update process information
                self._update_process_info()
                
                # Notify callbacks
                for callback in self.usage_callbacks:
                    try:
                        callback(usage)
                    except Exception as e:
                        self.logger.error(f"Error in usage callback: {e}")
                
                time.sleep(self.sampling_interval)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(self.sampling_interval)
    
    def _collect_usage(self) -> ResourceUsage:
        """Collect current resource usage."""
        usage = ResourceUsage()
        
        try:
            # Get main process
            main_process = psutil.Process(self.process_id)
            processes = [main_process]
            
            # Add child processes if monitoring children
            if self.monitor_children:
                try:
                    children = main_process.children(recursive=True)
                    processes.extend(children)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            # Aggregate resource usage
            total_memory = 0.0
            total_cpu = 0.0
            total_processes = len(processes)
            total_threads = 0
            total_file_handles = 0
            
            for proc in processes:
                try:
                    # Memory usage
                    memory_info = proc.memory_info()
                    total_memory += memory_info.rss / (1024 * 1024)  # Convert to MB
                    
                    # CPU usage
                    total_cpu += proc.cpu_percent()
                    
                    # Thread count
                    total_threads += proc.num_threads()
                    
                    # File handles
                    try:
                        total_file_handles += proc.num_fds() if hasattr(proc, 'num_fds') else 0
                    except (psutil.AccessDenied, AttributeError):
                        pass
                    
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            usage.memory_mb = total_memory
            usage.cpu_percent = total_cpu
            usage.process_count = total_processes
            usage.thread_count = total_threads
            usage.file_handle_count = total_file_handles
            
            # System memory percentage
            system_memory = psutil.virtual_memory()
            usage.memory_percent = (total_memory / (system_memory.total / (1024 * 1024))) * 100
            
            # Disk I/O (if available)
            try:
                disk_io = main_process.io_counters()
                usage.disk_io_read_mb = disk_io.read_bytes / (1024 * 1024)
                usage.disk_io_write_mb = disk_io.write_bytes / (1024 * 1024)
            except (psutil.AccessDenied, AttributeError):
                pass
            
            # Network I/O (system-wide approximation)
            try:
                net_io = psutil.net_io_counters()
                if net_io:
                    usage.network_sent_mb = net_io.bytes_sent / (1024 * 1024)
                    usage.network_recv_mb = net_io.bytes_recv / (1024 * 1024)
            except Exception:
                pass
            
        except Exception as e:
            self.logger.error(f"Error collecting resource usage: {e}")
        
        return usage
    
    def _update_process_info(self):
        """Update information about monitored processes."""
        try:
            main_process = psutil.Process(self.process_id)
            processes = [main_process]
            
            if self.monitor_children:
                try:
                    children = main_process.children(recursive=True)
                    processes.extend(children)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            current_pids = set()
            
            for proc in processes:
                try:
                    pid = proc.pid
                    current_pids.add(pid)
                    
                    if pid not in self.monitored_processes:
                        # New process
                        self.monitored_processes[pid] = ProcessInfo(
                            pid=pid,
                            name=proc.name(),
                            command=' '.join(proc.cmdline()) if proc.cmdline() else proc.name(),
                            start_time=datetime.fromtimestamp(proc.create_time()),
                            parent_pid=proc.ppid()
                        )
                    
                    # Update process info
                    process_info = self.monitored_processes[pid]
                    process_info.cpu_percent = proc.cpu_percent()
                    process_info.memory_mb = proc.memory_info().rss / (1024 * 1024)
                    process_info.status = proc.status()
                    
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            # Remove processes that are no longer running
            dead_pids = set(self.monitored_processes.keys()) - current_pids
            for pid in dead_pids:
                del self.monitored_processes[pid]
            
        except Exception as e:
            self.logger.error(f"Error updating process info: {e}")
    
    def get_current_usage(self) -> Optional[ResourceUsage]:
        """Get the most recent resource usage."""
        return self.usage_history[-1] if self.usage_history else None
    
    def get_usage_history(self, duration_minutes: Optional[int] = None) -> List[ResourceUsage]:
        """Get resource usage history."""
        if duration_minutes is None:
            return self.usage_history.copy()
        
        cutoff_time = datetime.now() - timedelta(minutes=duration_minutes)
        return [usage for usage in self.usage_history if usage.timestamp >= cutoff_time]
    
    def get_peak_usage(self) -> Optional[ResourceUsage]:
        """Get peak resource usage from history."""
        if not self.usage_history:
            return None
        
        peak_memory = max(self.usage_history, key=lambda x: x.memory_mb)
        peak_cpu = max(self.usage_history, key=lambda x: x.cpu_percent)
        
        # Create combined peak usage
        peak = ResourceUsage()
        peak.memory_mb = peak_memory.memory_mb
        peak.memory_percent = peak_memory.memory_percent
        peak.cpu_percent = peak_cpu.cpu_percent
        peak.process_count = max(usage.process_count for usage in self.usage_history)
        peak.thread_count = max(usage.thread_count for usage in self.usage_history)
        peak.file_handle_count = max(usage.file_handle_count for usage in self.usage_history)
        
        return peak
    
    def get_average_usage(self, duration_minutes: Optional[int] = None) -> Optional[ResourceUsage]:
        """Get average resource usage."""
        history = self.get_usage_history(duration_minutes)
        if not history:
            return None
        
        avg = ResourceUsage()
        count = len(history)
        
        avg.memory_mb = sum(usage.memory_mb for usage in history) / count
        avg.memory_percent = sum(usage.memory_percent for usage in history) / count
        avg.cpu_percent = sum(usage.cpu_percent for usage in history) / count
        avg.process_count = sum(usage.process_count for usage in history) / count
        avg.thread_count = sum(usage.thread_count for usage in history) / count
        avg.file_handle_count = sum(usage.file_handle_count for usage in history) / count
        
        return avg
    
    def get_process_info(self) -> Dict[int, ProcessInfo]:
        """Get information about monitored processes."""
        return self.monitored_processes.copy()


class ResourceManager:
    """Manages resource limits and enforcement for code execution."""
    
    def __init__(self, limits: ResourceLimits):
        """
        Initialize the resource manager.
        
        Args:
            limits: Resource limits configuration
        """
        self.limits = limits
        self.monitors: Dict[int, ResourceMonitor] = {}
        self.alerts: List[ResourceAlert] = []
        self.enforcement_enabled = True
        
        # Alert thresholds (percentage of limit)
        self.warning_threshold = 0.8  # 80%
        self.critical_threshold = 0.95  # 95%
        
        self.logger = logging.getLogger(__name__)
    
    def create_monitor(self, 
                      process_id: Optional[int] = None,
                      monitor_children: bool = True,
                      sampling_interval: float = 1.0) -> ResourceMonitor:
        """
        Create a new resource monitor.
        
        Args:
            process_id: Process ID to monitor
            monitor_children: Whether to monitor child processes
            sampling_interval: Sampling interval in seconds
            
        Returns:
            ResourceMonitor instance
        """
        monitor = ResourceMonitor(process_id, monitor_children, sampling_interval)
        
        # Add alert callback
        monitor.add_usage_callback(self._check_limits)
        
        if process_id:
            self.monitors[process_id] = monitor
        
        return monitor
    
    def start_monitoring(self, process_id: int) -> bool:
        """
        Start monitoring a process.
        
        Args:
            process_id: Process ID to monitor
            
        Returns:
            True if monitoring started successfully
        """
        try:
            if process_id not in self.monitors:
                self.monitors[process_id] = self.create_monitor(process_id)
            
            self.monitors[process_id].start_monitoring()
            return True
            
        except Exception as e:
            self.logger.error(f"Error starting monitoring for process {process_id}: {e}")
            return False
    
    def stop_monitoring(self, process_id: int):
        """Stop monitoring a process."""
        if process_id in self.monitors:
            self.monitors[process_id].stop_monitoring()
            del self.monitors[process_id]
    
    def stop_all_monitoring(self):
        """Stop monitoring all processes."""
        for monitor in self.monitors.values():
            monitor.stop_monitoring()
        self.monitors.clear()
    
    def _check_limits(self, usage: ResourceUsage):
        """Check resource usage against limits and generate alerts."""
        alerts = []
        
        # Memory check
        if usage.memory_mb > self.limits.max_memory_mb:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.MEMORY,
                level=AlertLevel.CRITICAL,
                message=f"Memory usage exceeded limit: {usage.memory_mb:.1f}MB > {self.limits.max_memory_mb}MB",
                current_value=usage.memory_mb,
                limit_value=self.limits.max_memory_mb
            ))
        elif usage.memory_mb > self.limits.max_memory_mb * self.warning_threshold:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.MEMORY,
                level=AlertLevel.WARNING,
                message=f"Memory usage approaching limit: {usage.memory_mb:.1f}MB",
                current_value=usage.memory_mb,
                limit_value=self.limits.max_memory_mb
            ))
        
        # CPU check
        if usage.cpu_percent > self.limits.max_cpu_percent:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.CPU,
                level=AlertLevel.CRITICAL,
                message=f"CPU usage exceeded limit: {usage.cpu_percent:.1f}% > {self.limits.max_cpu_percent}%",
                current_value=usage.cpu_percent,
                limit_value=self.limits.max_cpu_percent
            ))
        elif usage.cpu_percent > self.limits.max_cpu_percent * self.warning_threshold:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.CPU,
                level=AlertLevel.WARNING,
                message=f"CPU usage approaching limit: {usage.cpu_percent:.1f}%",
                current_value=usage.cpu_percent,
                limit_value=self.limits.max_cpu_percent
            ))
        
        # Process count check
        if usage.process_count > self.limits.max_processes:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.PROCESSES,
                level=AlertLevel.CRITICAL,
                message=f"Process count exceeded limit: {usage.process_count} > {self.limits.max_processes}",
                current_value=usage.process_count,
                limit_value=self.limits.max_processes
            ))
        
        # File handle check
        if usage.file_handle_count > self.limits.max_file_handles:
            alerts.append(ResourceAlert(
                resource_type=ResourceType.FILE_HANDLES,
                level=AlertLevel.WARNING,
                message=f"File handle count high: {usage.file_handle_count} > {self.limits.max_file_handles}",
                current_value=usage.file_handle_count,
                limit_value=self.limits.max_file_handles
            ))
        
        # Store and process alerts
        for alert in alerts:
            self.alerts.append(alert)
            self._handle_alert(alert)
    
    def _handle_alert(self, alert: ResourceAlert):
        """Handle a resource alert."""
        self.logger.warning(f"Resource Alert [{alert.level.value}]: {alert.message}")
        
        # Enforcement actions
        if self.enforcement_enabled and alert.level == AlertLevel.CRITICAL:
            if alert.resource_type == ResourceType.MEMORY:
                self._enforce_memory_limit(alert)
            elif alert.resource_type == ResourceType.CPU:
                self._enforce_cpu_limit(alert)
            elif alert.resource_type == ResourceType.PROCESSES:
                self._enforce_process_limit(alert)
    
    def _enforce_memory_limit(self, alert: ResourceAlert):
        """Enforce memory limits by terminating processes."""
        self.logger.critical(f"Enforcing memory limit: {alert.message}")
        # Implementation would terminate or suspend processes
        # This is a placeholder for actual enforcement logic
    
    def _enforce_cpu_limit(self, alert: ResourceAlert):
        """Enforce CPU limits by throttling processes."""
        self.logger.critical(f"Enforcing CPU limit: {alert.message}")
        # Implementation would throttle or suspend processes
        # This is a placeholder for actual enforcement logic
    
    def _enforce_process_limit(self, alert: ResourceAlert):
        """Enforce process limits by preventing new processes."""
        self.logger.critical(f"Enforcing process limit: {alert.message}")
        # Implementation would prevent new process creation
        # This is a placeholder for actual enforcement logic
    
    def get_resource_summary(self) -> Dict[str, Any]:
        """Get a summary of resource usage across all monitored processes."""
        summary = {
            "monitored_processes": len(self.monitors),
            "total_alerts": len(self.alerts),
            "recent_alerts": len([a for a in self.alerts if a.timestamp > datetime.now() - timedelta(minutes=5)]),
            "limits": {
                "memory_mb": self.limits.max_memory_mb,
                "cpu_percent": self.limits.max_cpu_percent,
                "processes": self.limits.max_processes,
                "execution_time_seconds": self.limits.max_execution_time_seconds
            },
            "current_usage": {}
        }
        
        # Aggregate current usage
        total_memory = 0.0
        total_cpu = 0.0
        total_processes = 0
        
        for monitor in self.monitors.values():
            current = monitor.get_current_usage()
            if current:
                total_memory += current.memory_mb
                total_cpu += current.cpu_percent
                total_processes += current.process_count
        
        summary["current_usage"] = {
            "memory_mb": total_memory,
            "cpu_percent": total_cpu,
            "processes": total_processes
        }
        
        return summary
    
    def get_alerts(self, 
                   level: Optional[AlertLevel] = None,
                   resource_type: Optional[ResourceType] = None,
                   since_minutes: Optional[int] = None) -> List[ResourceAlert]:
        """Get filtered alerts."""
        alerts = self.alerts
        
        if level:
            alerts = [a for a in alerts if a.level == level]
        
        if resource_type:
            alerts = [a for a in alerts if a.resource_type == resource_type]
        
        if since_minutes:
            cutoff = datetime.now() - timedelta(minutes=since_minutes)
            alerts = [a for a in alerts if a.timestamp >= cutoff]
        
        return alerts
    
    def clear_alerts(self):
        """Clear all stored alerts."""
        self.alerts.clear()
    
    def set_enforcement(self, enabled: bool):
        """Enable or disable resource enforcement."""
        self.enforcement_enabled = enabled
        self.logger.info(f"Resource enforcement {'enabled' if enabled else 'disabled'}")
    
    def update_limits(self, **kwargs):
        """Update resource limits."""
        for key, value in kwargs.items():
            if hasattr(self.limits, key):
                setattr(self.limits, key, value)
                self.logger.info(f"Updated limit {key} to {value}")


# Utility functions for resource management
def get_system_resources() -> Dict[str, Any]:
    """Get current system resource information."""
    return {
        "cpu": {
            "count": psutil.cpu_count(),
            "percent": psutil.cpu_percent(interval=1),
            "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
        },
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage('/')._asdict(),
        "network": psutil.net_io_counters()._asdict() if psutil.net_io_counters() else None,
        "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat()
    }


def estimate_resource_requirements(code_content: str, language: str) -> ResourceLimits:
    """
    Estimate resource requirements based on code analysis.
    
    Args:
        code_content: Source code content
        language: Programming language
        
    Returns:
        Estimated resource limits
    """
    limits = ResourceLimits()
    
    # Basic heuristics based on code size and complexity
    code_lines = len(code_content.split('\n'))
    code_size_kb = len(code_content.encode('utf-8')) / 1024
    
    # Adjust memory based on code size
    if code_size_kb > 100:
        limits.max_memory_mb = min(1024, int(limits.max_memory_mb * (1 + code_size_kb / 1000)))
    
    # Adjust based on language characteristics
    if language.lower() == 'python':
        limits.max_memory_mb = int(limits.max_memory_mb * 1.2)  # Python uses more memory
    elif language.lower() in ['java', 'scala']:
        limits.max_memory_mb = int(limits.max_memory_mb * 1.5)  # JVM overhead
    elif language.lower() in ['c', 'cpp', 'rust']:
        limits.max_memory_mb = int(limits.max_memory_mb * 0.8)  # More efficient
    
    # Adjust execution time based on code complexity
    if code_lines > 1000:
        limits.max_execution_time_seconds = min(600, limits.max_execution_time_seconds * 2)
    
    return limits