import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
}

const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYmY2OTIyYmMwNzk5NmViMzdlNjlmMzY3YWVlZmY4YiIsIm5iZiI6MTc2OTcxNTA4Ny40NDk5OTk4LCJzdWIiOiI2OTdiYjU4Zjk1OGM4ZDk1YTE3ZjdhMDEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.v2D1l-jBc0Z7UFNIUqyg5Z99mzrPXga-f4qyE59Na30";
const FLASK_URL = "http://127.0.0.1:5000/recommend";

// --- STAR RATER COMPONENT ---
const StarRating = ({ rating, onRate }: { rating: number, onRate: (n: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '5px 0' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ cursor: 'pointer', fontSize: '20px', color: (hover || rating) >= star ? '#ffc107' : '#555' }}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  );
};

// --- UPDATED: INTERACTIVE RECOMMENDED MOVIE COMPONENT ---
const RecommendedMovie = ({ title, onAdd }: { title: string, onAdd: (title: string, score: number) => void }) => {
  const [poster, setPoster] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const cleanTitle = title.replace(/\s\(\d{4}\)$/, "");
        const res = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${cleanTitle}`, {
          headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
        });
        if (res.data.results.length > 0) setPoster(res.data.results[0].poster_path);
      } catch (err) { console.error(err); }
    };
    fetchPoster();
  }, [title]);

  const handleAdd = () => {
    if (score === 0) { alert("Select stars first!"); return; }
    onAdd(title, score);
    setScore(0); // Reset after adding
  };

  return (
    <div style={{ minWidth: '140px', textAlign: 'center', backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px' }}>
      {poster ? (
        <img src={`https://image.tmdb.org/t/p/w200${poster}`} alt={title} style={{ width: '100%', borderRadius: '6px' }} />
      ) : (
        <div style={{ width: '100%', height: '180px', backgroundColor: '#333', borderRadius: '6px' }}>No Image</div>
      )}
      <p style={{ fontSize: '11px', margin: '5px 0', height: '30px', overflow: 'hidden' }}>{title}</p>
      
      <StarRating rating={score} onRate={(n) => setScore(n)} />
      
      <button onClick={handleAdd} style={{ width: '100%', backgroundColor: '#46d369', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
        Add to Profile
      </button>
    </div>
  );
};

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [myRatings, setMyRatings] = useState<[string, number][]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedScores, setSelectedScores] = useState<{[key: number]: number}>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMovies();
  };

  const searchMovies = async () => {
    if (!query) return;
    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${query}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
    });
    setResults(res.data.results);
  };

  const addRating = (title: string, score: number) => {
    // Check if movie already exists in profile
    if (myRatings.find(r => r[0] === title)) {
      alert("Movie already in your profile!");
      return;
    }
    setMyRatings([...myRatings, [title, score]]);
  };

  const removeRating = (index: number) => {
    const updated = [...myRatings];
    updated.splice(index, 1);
    setMyRatings(updated);
  };

  const getRecs = async () => {
    const res = await axios.post(FLASK_URL, { ratings: myRatings });
    setRecommendations(res.data.recommendations);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#141414', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: '#e50914' }}>🎬 Movie Picker AI</h1>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search for a movie..." 
          style={{ padding: '12px', width: '300px', borderRadius: '4px', border: 'none', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '12px 24px', marginLeft: '10px', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Search</button>
      </form>

      {/* SEARCH RESULTS */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', marginBottom: '40px', paddingBottom: '10px' }}>
        {results.map(movie => (
          <div key={movie.id} style={{ minWidth: '160px', backgroundColor: '#222', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} style={{ width: '100%', borderRadius: '6px' }} />
            <p style={{ fontSize: '14px', margin: '10px 0', height: '35px', overflow: 'hidden' }}>{movie.title}</p>
            <StarRating rating={selectedScores[movie.id] || 0} onRate={(n) => setSelectedScores({...selectedScores, [movie.id]: n})} />
            <button 
                onClick={() => {
                    const year = movie.release_date ? movie.release_date.split('-')[0] : "0000";
                    addRating(`${movie.title} (${year})`, selectedScores[movie.id] || 0);
                }} 
                style={{ width: '100%', backgroundColor: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Add
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        <div style={{ backgroundColor: '#1f1f1f', padding: '25px', borderRadius: '12px', alignSelf: 'start' }}>
          <h3>Your Profile ({myRatings.length})</h3>
          {myRatings.map((r, i) => (
            <div key={i} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
              <span><span style={{ color: '#ffc107' }}>{'★'.repeat(r[1])}</span> {r[0]}</span>
              <button onClick={() => removeRating(i)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button onClick={getRecs} style={{ marginTop: '20px', backgroundColor: '#46d369', color: 'white', padding: '12px', width: '100%', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Generate Recommendations</button>
        </div>

        <div style={{ backgroundColor: '#1f1f1f', padding: '25px', borderRadius: '12px' }}>
          <h3>AI Recommendations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
            {recommendations.map((title, i) => (
              <RecommendedMovie key={i} title={title} onAdd={addRating} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;