'use client';

import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Eye, MoreHorizontal, Calendar, User, Tag, Image, Bold, Italic, Link, List, Code, Save, X } from 'lucide-react';

interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled';
  views: number;
  createdAt: string;
  publishedAt?: string;
  image?: string;
}

const mockBlogs: Blog[] = [
  { id: 1, title: 'Getting Started with Algorithmic Trading', slug: 'getting-started-algo-trading', excerpt: 'Learn the basics of algorithmic trading...', content: '# Getting Started\n\nAlgorithmic trading...', author: 'Admin', category: 'Trading', tags: ['algo', 'beginner'], status: 'published', views: 1250, createdAt: '2024-12-01', publishedAt: '2024-12-01' },
  { id: 2, title: 'Top 10 Trading Strategies for 2025', slug: 'top-10-strategies-2025', excerpt: 'Discover the best trading strategies...', content: '# Top Strategies\n\n1. Mean Reversion...', author: 'Admin', category: 'Strategy', tags: ['strategy', 'tips'], status: 'published', views: 890, createdAt: '2024-12-05', publishedAt: '2024-12-05' },
  { id: 3, title: 'Understanding Risk Management', slug: 'understanding-risk-management', excerpt: 'Risk management is crucial...', content: '# Risk Management\n\nEvery trader...', author: 'Admin', category: 'Education', tags: ['risk', 'education'], status: 'draft', views: 0, createdAt: '2024-12-10' },
  { id: 4, title: 'Pine Script v6 Complete Guide', slug: 'pine-script-v6-guide', excerpt: 'Master Pine Script v6...', content: '# Pine Script v6\n\nTradingView...', author: 'Admin', category: 'Technical', tags: ['pinescript', 'tradingview'], status: 'scheduled', views: 0, createdAt: '2024-12-12', publishedAt: '2024-12-15' },
];

const categories = ['Trading', 'Strategy', 'Education', 'Technical', 'News', 'Analysis'];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>(mockBlogs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);

  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Trading');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('draft');

  const filtered = blogs.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  const openEditor = (blog?: Blog) => {
    if (blog) {
      setEditBlog(blog);
      setTitle(blog.title);
      setContent(blog.content);
      setExcerpt(blog.excerpt);
      setCategory(blog.category);
      setTags(blog.tags.join(', '));
      setStatus(blog.status);
    } else {
      setEditBlog(null);
      setTitle('');
      setContent('');
      setExcerpt('');
      setCategory('Trading');
      setTags('');
      setStatus('draft');
    }
    setShowEditor(true);
  };

  const saveBlog = () => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newBlog: Blog = {
      id: editBlog?.id || Date.now(),
      title,
      slug,
      content,
      excerpt,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status,
      author: 'Admin',
      views: editBlog?.views || 0,
      createdAt: editBlog?.createdAt || new Date().toISOString().split('T')[0],
      publishedAt: status === 'published' ? new Date().toISOString().split('T')[0] : undefined,
    };

    if (editBlog) {
      setBlogs(blogs.map(b => b.id === editBlog.id ? newBlog : b));
    } else {
      setBlogs([newBlog, ...blogs]);
    }
    setShowEditor(false);
  };

  const deleteBlog = (id: number) => {
    if (confirm('Are you sure you want to delete this blog?')) {
      setBlogs(blogs.filter(b => b.id !== id));
    }
    setMenuId(null);
  };

  const publishBlog = (id: number) => {
    setBlogs(blogs.map(b => b.id === id ? { ...b, status: 'published', publishedAt: new Date().toISOString().split('T')[0] } : b));
    setMenuId(null);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Management</h1>
          <p className="text-gray-400 text-sm">Create and manage blog posts</p>
        </div>
        <button onClick={() => openEditor()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all">
          <Plus size={18}/><span>New Post</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="Search blogs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft', 'scheduled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Blog List */}
      <div className="grid gap-4">
        {filtered.map(blog => (
          <div key={blog.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${blog.status === 'published' ? 'bg-green-500/20 text-green-400' : blog.status === 'draft' ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {blog.status}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400">{blog.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{blog.title}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{blog.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><User size={12}/> {blog.author}</span>
                  <span className="flex items-center gap-1"><Calendar size={12}/> {blog.createdAt}</span>
                  <span className="flex items-center gap-1"><Eye size={12}/> {blog.views} views</span>
                  <span className="flex items-center gap-1"><Tag size={12}/> {blog.tags.join(', ')}</span>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setMenuId(menuId === blog.id ? null : blog.id)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                  <MoreHorizontal size={18}/>
                </button>
                {menuId === blog.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                    <button onClick={() => { openEditor(blog); setMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                      <Edit3 size={14}/> Edit
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                      <Eye size={14}/> Preview
                    </button>
                    {blog.status !== 'published' && (
                      <button onClick={() => publishBlog(blog.id)} className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2">
                        <Eye size={14}/> Publish
                      </button>
                    )}
                    <div className="border-t border-gray-700 my-1"/>
                    <button onClick={() => deleteBlog(blog.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                      <Trash2 size={14}/> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            No blogs found
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{editBlog ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20}/></button>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter blog title..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="trading, strategy, tips..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Excerpt</label>
                <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description..." rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none resize-none"/>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Content (Markdown)</label>
                <div className="flex gap-2 mb-2">
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><Bold size={16}/></button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><Italic size={16}/></button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><Link size={16}/></button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><List size={16}/></button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><Code size={16}/></button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"><Image size={16}/></button>
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your blog content in Markdown..." rows={12}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none resize-none font-mono text-sm"/>
              </div>
            </div>

            {/* Editor Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
              <button onClick={saveBlog} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                <Save size={18}/><span>Save Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
