// models/fareTable.js
const { mongoose } = require('../db');

const fareTableSchema = new mongoose.Schema({
  fareLevel: { type: Number, unique: true, required: true },
  farePrice: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const FareTable = mongoose.model('FareTable', fareTableSchema);

module.exports = FareTable;
