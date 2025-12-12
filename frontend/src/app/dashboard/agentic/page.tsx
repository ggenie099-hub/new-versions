'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Play, Power, Trash2 } from 'lucide-react';

interface Workflow {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
}

export default function AgenticPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/agentic/workflows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/workflows/${workflowId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const createSampleWorkflow = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const sampleWorkflow = {
        name: 'Simple Price Alert',
        description: 'Get EURUSD price and send notification',
        nodes: [
          {
            id: 'node-1',
            type: 'GetLivePrice',
            data: { symbol: 'EURUSD' },
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'DashboardNotification',
            data: { 
              title: 'Price Alert',
              message: 'EURUSD price fetched',
              type: 'info'
            },
            position: { x: 300, y: 100 }
          }
        ],
        connections: [
          {
            source: 'node-1',
            target: 'node-2'
          }
        ],
        settings: {},
        trigger_type: 'manual'
      };
      
      const response = await fetch('http://localhost:8000/api/agentic/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleWorkflow)
      });
      
      if (response.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const executeWorkflow = async (workflowId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/executions/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_mode: false })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Workflow executed! Execution ID: ${data.execution_id}`);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-xl text-white">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold">Agentic Trading System</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/agentic/builder')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create New Workflow
          </button>
          <button
            onClick={createSampleWorkflow}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create Sample
          </button>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus size={48} className="text-gray-500" />
            </div>
            <p className="text-2xl mb-2">No workflows yet</p>
            <p className="text-gray-400 mb-8">Create your first automated trading workflow</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard/agentic/builder')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create New Workflow
            </button>
            <button
              onClick={createSampleWorkflow}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create Sample Workflow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{workflow.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workflow.is_active 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400">{workflow.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Trigger: {workflow.trigger_type} • Created: {new Date(workflow.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => executeWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play size={16} />
                  Execute Now
                </button>
                <button
                  onClick={() => toggleWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Power size={16} />
                  {workflow.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => router.push(`/dashboard/agentic/builder?id=${workflow.id}`)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
