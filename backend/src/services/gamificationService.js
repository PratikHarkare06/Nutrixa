const { UserProfile } = require("../models/UserProfile");

// Define XP thresholds per level (e.g., Level 1 = 0-100, Level 2 = 100-300, etc.)
const calculateLevel = (totalXp) => {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
};

// Define badges
const BADGES = {
  FIRST_MEAL: "First Meal Logged",
  HYDRATION_HERO: "Hydration Hero",
  CALORIE_SNIPER: "Calorie Sniper",
  CONSISTENCY_KING: "Consistency King",
};

const awardXP = async (userId, action, value = 0) => {
  try {
    const profile = await UserProfile.findOne({ profile_key: "primary" });
    if (!profile) return;

    let xpGain = 0;
    let newBadges = [];

    // Rule Engine
    switch (action) {
      case "LOG_MEAL":
        xpGain = 50;
        if (!profile.unlocked_badges.includes(BADGES.FIRST_MEAL)) {
          newBadges.push(BADGES.FIRST_MEAL);
          xpGain += 100; // Bonus for first meal
        }
        break;
      case "LOG_WATER":
        // 10 XP for every 250ml
        xpGain = Math.floor(value / 25) * 1;
        break;
      case "GOAL_REACHED_WATER":
        xpGain = 100;
        if (!profile.unlocked_badges.includes(BADGES.HYDRATION_HERO)) {
          newBadges.push(BADGES.HYDRATION_HERO);
        }
        break;
      case "LOG_SLEEP":
        xpGain = 50;
        break;
      case "LOG_PROGRESS":
        xpGain = 100;
        break;
      // Add more cases as needed
    }

    if (xpGain > 0) {
      const newXp = profile.xp + xpGain;
      const newLevel = calculateLevel(newXp);

      const uniqueBadges = [...new Set([...profile.unlocked_badges, ...newBadges])];

      await UserProfile.findOneAndUpdate(
        { profile_key: "primary" },
        { 
          xp: newXp, 
          level: newLevel,
          unlocked_badges: uniqueBadges
        }
      );
    }
  } catch (error) {
    console.error("Gamification Error:", error);
  }
};

module.exports = { awardXP, BADGES };
