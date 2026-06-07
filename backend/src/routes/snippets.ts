import { Router, Request, Response } from 'express';
import { insforgeAdmin } from '../config/insforge.js';

const router = Router();

// GET /api/snippets/training
router.get('/training', async (req: Request, res: Response) => {
  try {
    // Fetch some random snippets from the database. Since we mapped them to the `questions` table with `id` starting with `snip-`, we filter by that.
    const { data, error } = await insforgeAdmin.database
      .from('questions')
      .select('id, language, topic, difficulty, prompt, choices, explanation')
      .like('id', 'snip-%')
      .limit(50); // Get 50 snippets for the training session

    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }

    // Map back to Snippet format expected by the frontend
    const snippets = (data || []).map(q => ({
      id: q.id,
      language: q.language,
      topic: q.topic,
      difficulty: q.difficulty,
      code_snippet: q.prompt,
      expected_output: q.choices[0], // We stored the expected output as the first choice
      explanation: q.explanation
    }));

    // Randomize the order
    snippets.sort(() => Math.random() - 0.5);

    res.json({ snippets });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
