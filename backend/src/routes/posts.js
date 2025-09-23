// backend/src/routes/posts.js
const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleBookmark,
  getPopularTags
} = require('../controllers/postController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', getPosts);
router.get('/tags/popular', getPopularTags);
router.get('/:id', getPost);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/bookmark', auth, toggleBookmark);

module.exports = router;