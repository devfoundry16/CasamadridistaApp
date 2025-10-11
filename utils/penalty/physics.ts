import { ShotResult } from '@/types/penalty/game';

export const calculateShot = (
  targetX: number,
  targetY: number,
  goalkeeperPosition: { x: number; y: number }
): ShotResult => {
  const goalWidth = 300;
  const goalHeight = 200;
  
  // Add some randomness to the shot
  const finalX = targetX + (Math.random() * 40 - 20);
  const finalY = targetY + (Math.random() * 40 - 20);
  
  // Check if shot is within goal bounds
  const isInGoal = finalX >= 0 && finalX <= goalWidth && 
                  finalY >= 0 && finalY <= goalHeight;
  
  if (!isInGoal) {
    return { isGoal: false, position: { x: finalX, y: finalY } };
  }
  
  // Check if goalkeeper saves the shot
  const distanceToGoalkeeper = Math.sqrt(
    Math.pow(finalX - goalkeeperPosition.x, 2) + 
    Math.pow(finalY - goalkeeperPosition.y, 2)
  );
  
  // Goalkeeper has a chance to save based on distance
  const saveProbability = Math.max(0, 1 - (distanceToGoalkeeper / 100));
  const isSaved = Math.random() < saveProbability;
  
  return { 
    isGoal: !isSaved, 
    position: { x: finalX, y: finalY } 
  };
};

export const moveGoalkeeper = (currentPosition: { x: number; y: number }): { x: number; y: number } => {
  const goalWidth = 300;
  const goalHeight = 200;
  
  // AI goalkeeper movement - tends to stay in the middle but can dive
  const moveX = currentPosition.x + (Math.random() * 100 - 50);
  const moveY = currentPosition.y + (Math.random() * 80 - 40);
  
  return {
    x: Math.max(20, Math.min(goalWidth - 20, moveX)),
    y: Math.max(20, Math.min(goalHeight - 20, moveY)),
  };
};