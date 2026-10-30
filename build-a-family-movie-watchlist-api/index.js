import express from 'express';
import jwt from 'jsonwebtoken';
import * as db from './utils/db.js';
import { authenticate } from './middleware/authenticate.js';
import { authorizeModification } from './middleware/authorize.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Auth Route ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const users = db.getUsers();
  const user = users.find(u => u.username === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  return res.status(200).json({ token });
});

// --- Watchlist Routes ---
app.get('/api/watchlist/:userId', authenticate, (req, res) => {
  const watchlist = db.getWatchlist(req.params.userId) || [];
  return res.status(200).json(watchlist);
});

app.post('/api/watchlist/:userId/movies', authenticate, authorizeModification, (req, res) => {
  const movie = req.body;
  const addFn = db.addMovieToWatchlist || db.addMovie;
  
  if (!addFn) {
    return res.status(500).json({ error: "Database add function not found." });
  }

  const updatedWatchlist = addFn(req.params.userId, movie);
  return res.status(201).json(updatedWatchlist);
});

app.put('/api/watchlist/:userId/movies/:movieId', authenticate, authorizeModification, (req, res) => {
  const movieData = req.body;
  const updateFn = db.updateMovieInWatchlist || db.updateMovie;
  const updatedWatchlist = updateFn(req.params.userId, req.params.movieId, movieData);
  return res.status(200).json(updatedWatchlist);
});

app.delete('/api/watchlist/:userId/movies/:movieId', authenticate, authorizeModification, (req, res) => {
  const removeFn = db.removeMovieFromWatchlist || db.deleteMovie;
  const updatedWatchlist = removeFn(req.params.userId, req.params.movieId);
  return res.status(200).json(updatedWatchlist);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Family Movie Watchlist API running on port ${PORT}`);
  });
}

export default app;