import { questions } from './questions.js';
import { insforgeAdmin } from '../config/insforge.js';

export async function seedQuestions(): Promise<void> {
  try {
    // Check if table exists and has records
    const { data, error } = await insforgeAdmin.database
      .from('questions')
      .select('id')
      .limit(1);

    if (error) {
      console.log('⚠️ [seed] "questions" table not found or not accessible. Skipping auto-seeding. Make sure you run the SQL migration!');
      console.error('Exact error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`🌱 [seed] Database questions table is empty. Seeding ${questions.length} questions...`);
      
      const batchSize = 25;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize).map(q => ({
          id: q.id,
          language: q.language,
          topic: q.topic,
          difficulty: q.difficulty,
          prompt: q.prompt,
          choices: q.choices,
          correct_index: q.correct_index,
          explanation: q.explanation
        }));

        const { error: insertError } = await insforgeAdmin.database
          .from('questions')
          .insert(batch);

        if (insertError) {
          console.error(`❌ [seed] Failed to seed batch starting at index ${i}:`, insertError.message);
          return;
        }
      }
      console.log('✅ [seed] Auto-seeding questions completed successfully!');
    } else {
      console.log('ℹ️ [seed] Database questions table already contains records. No seeding needed.');
    }
  } catch (err: any) {
    console.error('❌ [seed] Error occurred while seeding:', err?.message ?? err);
  }
}
