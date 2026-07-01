export interface NotificationSettings {
  enabled: boolean;
  waterEnabled: boolean;
  waterFrequencyHours: number; // e.g., 1, 2, 3 hours
  mealsEnabled: boolean;
  breakfastEnabled: boolean;
  lunchEnabled: boolean;
  snackEnabled: boolean;
  dinnerEnabled: boolean;
  breakfastTime: string; // "08:30"
  lunchTime: string; // "13:30"
  snackTime: string; // "17:30"
  dinnerTime: string; // "20:30"
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  waterEnabled: false,
  waterFrequencyHours: 2,
  mealsEnabled: false,
  breakfastEnabled: true,
  lunchEnabled: true,
  snackEnabled: true,
  dinnerEnabled: true,
  breakfastTime: "08:30",
  lunchTime: "13:30",
  snackTime: "17:30",
  dinnerTime: "20:30",
};

const SETTINGS_KEY = "nutrixa_notification_settings";
const STATE_KEY = "nutrixa_notification_state";

interface NotificationState {
  lastWaterReminder: number; // Timestamp
  lastBreakfastReminderDate: string; // "YYYY-MM-DD"
  lastLunchReminderDate: string;
  lastSnackReminderDate: string;
  lastDinnerReminderDate: string;
}

const DEFAULT_STATE: NotificationState = {
  lastWaterReminder: 0,
  lastBreakfastReminderDate: "",
  lastLunchReminderDate: "",
  lastSnackReminderDate: "",
  lastDinnerReminderDate: "",
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const getNotificationState = (): NotificationState => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
};

const saveNotificationState = (state: NotificationState) => {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
};

/**
 * Checks if the browser supports notifications and returns permission status.
 */
export const checkNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
};

/**
 * Requests permission for browser native notifications.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  
  try {
    const permission = await Notification.requestPermission();
    const settings = getNotificationSettings();
    settings.enabled = permission === "granted";
    saveNotificationSettings(settings);
    return permission === "granted";
  } catch {
    return false;
  }
};

/**
 * Instantly triggers a system notification for testing purposes.
 */
export const sendTestNotification = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    requestNotificationPermission().then((granted) => {
      if (granted) triggerNativeAlert("✨ Reminders Enabled!", "Your Nutrixa reminders are now successfully configured!");
    });
  } else {
    triggerNativeAlert("✨ Reminders Enabled!", "Your Nutrixa reminders are now successfully configured!");
  }
};

const triggerNativeAlert = (title: string, body: string) => {
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico", // will fall back gracefully if missing
      badge: "/favicon.ico",
      tag: "nutrixa-reminder",
    });
  } catch (err) {
    console.warn("Failed to fire browser notification:", err);
  }
};

/**
 * Analyzes the scheduled settings and triggers reminders if due.
 * This should be run on a periodic check loop.
 */
export const checkAndTriggerReminders = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const state = getNotificationState();
  const now = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Water Reminder Checks
  if (settings.waterEnabled) {
    const intervalMs = settings.waterFrequencyHours * 60 * 60 * 1000;
    if (now - state.lastWaterReminder >= intervalMs) {
      triggerNativeAlert(
        "💧 Hydration Check!",
        "Time to drink some water and log your progress to hit your daily target."
      );
      state.lastWaterReminder = now;
      saveNotificationState(state);
    }
  }

  // Helper to check if current time matches target hour and minute
  const isTimeDue = (timeStr: string): boolean => {
    const [targetHour, targetMin] = timeStr.split(":").map(Number);
    const date = new Date();
    const currentHour = date.getHours();
    const currentMin = date.getMinutes();
    
    // Fire within a 5-minute window of target time
    if (currentHour === targetHour) {
      const diff = currentMin - targetMin;
      return diff >= 0 && diff <= 5;
    }
    return false;
  };

  // 2. Meal Reminders Checks
  if (settings.mealsEnabled) {
    // Breakfast
    if (settings.breakfastEnabled && state.lastBreakfastReminderDate !== todayStr && isTimeDue(settings.breakfastTime)) {
      triggerNativeAlert("🍳 Breakfast Time!", "Start your morning right. Scan or log your breakfast to power up your day!");
      state.lastBreakfastReminderDate = todayStr;
    }
    // Lunch
    if (settings.lunchEnabled && state.lastLunchReminderDate !== todayStr && isTimeDue(settings.lunchTime)) {
      triggerNativeAlert("🥗 Lunch Reminder!", "It's time for lunch. Remember to log your macros and stay on track!");
      state.lastLunchReminderDate = todayStr;
    }
    // Snack
    if (settings.snackEnabled && state.lastSnackReminderDate !== todayStr && isTimeDue(settings.snackTime)) {
      triggerNativeAlert("🥜 Healthy Snack Check!", "Time for a quick fuel-up. Log your afternoon snack now.");
      state.lastSnackReminderDate = todayStr;
    }
    // Dinner
    if (settings.dinnerEnabled && state.lastDinnerReminderDate !== todayStr && isTimeDue(settings.dinnerTime)) {
      triggerNativeAlert("🍽️ Dinner Reminder!", "Ready for dinner? Log your final meal of the day to complete your logging streak.");
      state.lastDinnerReminderDate = todayStr;
    }

    saveNotificationState(state);
  }
};

// Global periodic reminder loop registration
let loopInterval: any = null;

export const startNotificationLoop = () => {
  if (loopInterval) return;
  
  // Set initial water timer state so it doesn't trigger immediately on load
  const state = getNotificationState();
  if (state.lastWaterReminder === 0) {
    state.lastWaterReminder = Date.now();
    saveNotificationState(state);
  }

  // Run immediate check
  checkAndTriggerReminders();

  // Run check every 60 seconds
  loopInterval = setInterval(() => {
    checkAndTriggerReminders();
  }, 60 * 1000);
};

export const stopNotificationLoop = () => {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
};
