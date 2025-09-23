// frontend/src/components/CommentList.js
import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import api from '../services/api';

export default function CommentList({ postId, canWrite, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const load = async () => {
    const { data } = await api.get(`/comments/post/${postId}`);
    setComments(data);
  };

  useEffect(() => { load(); }, [postId]);

  const add = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post(`/comments/post/${postId}`, { content: text.trim() });
      setText('');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;
    setLoading(true);
    try {
      await api.put(`/comments/${commentId}`, { content: editText.trim() });
      setEditingId(null);
      setEditText('');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setLoading(true);
      try {
        await api.delete(`/comments/${commentId}`);
        await load();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      {canWrite && (
        <Box display="flex" gap={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..." size="small"
          />
          <Button variant="contained" onClick={add} disabled={loading}>Post</Button>
        </Box>
      )}
      <List dense>
        {comments.map((c) => {
          const isOwner = currentUser && c.author && currentUser._id === c.author._id;
          const isEditing = editingId === c._id;

          return (
            <ListItem key={c._id} alignItems="flex-start" divider>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <span>{c.author?.nickname || 'Anon'}</span>
                    {isOwner && (
                      <Box>
                        {isEditing ? (
                          <>
                            <Tooltip title="Save">
                              <IconButton size="small" onClick={() => saveEdit(c._id)} disabled={loading}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={cancelEdit}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => startEdit(c)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => deleteComment(c._id)} disabled={loading}>
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                }
                secondary={
                  isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      size="small"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <span>{c.content}</span>
                  )
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
