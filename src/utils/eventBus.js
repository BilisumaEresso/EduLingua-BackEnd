const EventEmitter = require('events');
const ActivityLog = require('../models/ActivityLog');

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

eventBus.on('logActivity', async (data) => {
  try {
    await ActivityLog.create(data);
  } catch (err) {
    console.error('Failed to log activity details:', err);
  }
});

module.exports = eventBus;
