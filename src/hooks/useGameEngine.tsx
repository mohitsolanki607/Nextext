import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LEVELS = ['Aspirant', 'Expert', 'Topper', 'Master', 'Legend'];

export function useGameEngine() {
  const { user, profile } = useAuth();

  const awardNexCoins = async (amount: number, reason: string) => {
    if (!user || !profile) return;

    const userRef = doc(db, 'users', user.uid);
    const newCoins = (profile.nexCoins || 0) + amount;
    const currentLevelIndex = LEVELS.indexOf(profile.level || 'Aspirant');
    const newLevelIndex = Math.floor(newCoins / 100);
    
    const updates: any = {
      nexCoins: increment(amount)
    };

    let levelUpMessage = '';
    if (newLevelIndex > currentLevelIndex && newLevelIndex < LEVELS.length) {
      const newLevel = LEVELS[newLevelIndex];
      updates.level = newLevel;
      levelUpMessage = `\n\nLevel Up! You've reached '${newLevel}' level! 🚀`;
    }

    try {
      await updateDoc(userRef, updates);
      
      const streakMessage = `Streak Saved! You're on a ${profile.streak}-day roll. Don't let the fire go out! 🔥`;
      
      toast.success(`+${amount} NexCoins for ${reason}!`, {
        description: `${streakMessage}${levelUpMessage}`,
        duration: 5000,
      });

      return {
        coinsAwarded: amount,
        newLevel: updates.level || profile.level,
        message: `+${amount} NexCoins for ${reason}! ${streakMessage}${levelUpMessage}`
      };
    } catch (error) {
      console.error("Error awarding NexCoins:", error);
    }
  };

  const getShareChallenge = (topic: string, time?: string) => {
    const timeStr = time ? ` in ${time}` : '';
    return `I just solved a Level 5 ${topic} problem${timeStr} on NexText. Can you beat me? https://nextext.ai/challenge`;
  };

  return { awardNexCoins, getShareChallenge };
}
