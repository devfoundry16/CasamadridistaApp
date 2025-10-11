import { BallBounds, GoalPosition } from '@/types/penalty/game';
import { Animated } from 'react-native';

/**
 * Processes a kick gesture, determining the ball's trajectory.
 * @param power The strength of the kick (0-1).
 * @param direction The horizontal direction of the kick (-1 for left, 0 for center, 1 for right).
 * @param currentBallPosition The Animated.ValueXY of the ball.
 * @param screenWidth The width of the screen.
 * @param screenHeight The height of the screen.
 * @returns An object containing the final X and Y coordinates and the animation duration.
 */
export const processKick = (
  power: number,
  direction: number,
  currentBallPosition: Animated.ValueXY,
  screenWidth: number,
  screenHeight: number
) => {
  const myball = Animated.ValueXY;
  myball
  const startX = (currentBallPosition as any).x; // Accessing internal value
  const startY = (currentBallPosition as any).y;

  // Base speed and deviation
  const baseDuration = 800; // milliseconds for a full powerful kick
  const minDuration = 400; // for a very light kick
  const maxHorizontalDeviation = screenWidth * 0.4; // Max horizontal movement from center

  // Adjust duration based on power (higher power = shorter duration = faster)
  const duration = baseDuration - (baseDuration - minDuration) * power;

  // Calculate target X position based on direction
  let targetX = screenWidth / 2 - 15; // Center of the goal roughly
  targetX += direction * maxHorizontalDeviation * power; // More power = more deviation

  // Ensure targetX stays within reasonable bounds (e.g., within screen width)
  targetX = Math.max(0, Math.min(screenWidth - 30, targetX)); // 30 is ball width

  // Target Y is generally towards the goal area at the top
  const targetY = screenHeight * 0.1; // Closer to the top for a goal

  return { finalX: targetX, finalY: targetY, duration };
};

/**
 * Checks if the ball has collided with the goal area.
 * This is a simplified check for a rectangle goal and a circular ball.
 * @param ballBounds The current position and radius of the ball.
 * @param goalPosition The position and dimensions of the goal.
 * @returns True if the ball is within the goal boundaries, false otherwise.
 */
export const calculateGoalCollision = (ballBounds: BallBounds, goalPosition: GoalPosition): boolean => {
  // Check if the ball's center is within the goal's horizontal bounds
  const isHorizontallyWithinGoal =
    ballBounds.x + ballBounds.radius > goalPosition.x &&
    ballBounds.x - ballBounds.radius < goalPosition.x + goalPosition.width;

  // Check if the ball's vertical position is near the goal line
  // This is a simplified check for a top-down perspective where the goal is a line.
  // In a more complex game, you'd check for Z-depth or a more precise 2D/3D collision.
  const isVerticallyNearGoal =
    ballBounds.y <= goalPosition.y + goalPosition.height &&
    ballBounds.y >= goalPosition.y;

  return isHorizontallyWithinGoal && isVerticallyNearGoal;
};

// Placeholder for future AI logic (e.g., AI goalkeeper save prediction)
export const getAIGoalkeeperSaveDirection = (): number => {
  // Simple AI: randomly choose left, center, or right
  const directions = [-1, 0, 1];
  return directions[Math.floor(Math.random() * directions.length)];
};