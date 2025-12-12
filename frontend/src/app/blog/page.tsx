'use client';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black pt-[var(--nav-height)]">
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
        <p className="text-gray-300 max-w-2xl">
          Insights, updates, and strategies from the Trading Maven team. New posts coming soon.
        </p>
      </section>
    </div>
  );
}