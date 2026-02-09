import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
        <div className="text-center animate-stagger max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-amber-400 mb-6 tracking-tight leading-[1.1]">
            Yellow Page
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-stagger">
            Discover local businesses, services, and classifieds in your area. Post your ads and reach thousands of potential customers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-stagger">
            <Link to="/classifieds" className="btn-primary text-lg !px-10 !py-4">
              Browse Classifieds
            </Link>
            <Link to="/register" className="btn-secondary text-lg !px-10 !py-4">
              Post Your Ad
            </Link>
          </div>
        </div>

        <div className="mt-28 md:mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 animate-stagger">
          <div className="card p-8 group hover:border-amber-500/20 transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors duration-300">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="font-display text-xl text-amber-400 mb-3">Location-Based</h3>
            <p className="text-slate-400 leading-relaxed">
              Filter classifieds by your city to find what&apos;s near you.
            </p>
          </div>
          <div className="card p-8 group hover:border-amber-500/20 transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors duration-300">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-display text-xl text-amber-400 mb-3">Free to Browse</h3>
            <p className="text-slate-400 leading-relaxed">
              Anyone can view classifieds. Login only required to post ads.
            </p>
          </div>
          <div className="card p-8 group hover:border-amber-500/20 transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors duration-300">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="font-display text-xl text-amber-400 mb-3">Easy to Manage</h3>
            <p className="text-slate-400 leading-relaxed">
              Create, edit, and delete your ads. Choose where they appear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
