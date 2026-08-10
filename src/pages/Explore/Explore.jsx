import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import GigCard from '../../components/Cards/GigCard';
import './Explore.css';

const Explore = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { getNearbyGigs } = useGigs();

  const filteredCategories = search
    ? CATEGORIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  const categoryGigs = selectedCategory
    ? getNearbyGigs(selectedCategory).filter(g => g.status === 'active')
    : [];

  return (
    <div className="page-content">
      <div className="explore-page">
        <header className="explore-header animate-fade-in">
          <h1>Explore Work</h1>
          <p className="text-secondary">Browse requirements by category</p>
        </header>

        {/* Search */}
        <div className="explore-search animate-fade-in-up">
          <div className="input-icon-wrapper">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search categories..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedCategory(null); }}
            />
          </div>
        </div>

        {/* If a category is selected, show its work */}
        {selectedCategory ? (
          <div className="explore-category-view animate-fade-in-up">
            <div className="explore-category-header">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedCategory(null)}
              >
                ← All Categories
              </button>
              <h2>{CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory} Work</h2>
              <span className="feed-count">{categoryGigs.length} available</span>
            </div>

            {categoryGigs.length > 0 ? (
              <div className="feed-list stagger-children">
                {categoryGigs.map(gig => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            ) : (
              <div className="feed-empty">
                <div className="feed-empty-icon">📭</div>
                <h3>No open work in this category</h3>
                <p>Be the first person to post a requirement!</p>
                <Link to="/post" className="btn btn-primary mt-4">Post Work</Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending Section */}
            <section className="explore-section animate-fade-in-up">
              <div className="section-header">
                <TrendingUp size={18} className="text-accent" />
                <h3>Popular Work Categories</h3>
              </div>
            </section>

            {/* Category Grid */}
            <div className="category-grid stagger-children">
              {filteredCategories.map(cat => {
                const Icon = cat.icon;
                const workCount = getNearbyGigs(cat.id).filter(g => g.status === 'active').length;
                return (
                  <button
                    key={cat.id}
                    className={`category-card glass-card ${cat.cssClass}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="category-card-icon">
                      <Icon size={28} />
                    </div>
                    <span className="category-card-name">{cat.name}</span>
                    <span className="category-card-count">{workCount} post{workCount !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
