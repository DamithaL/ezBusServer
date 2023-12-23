// models/fareTable.js
const { mongoose } = require('../db');

const fareTableSchema = new mongoose.Schema({
  fareLevel: { type: Number, unique: true, required: true },
  farePrice: { type: Number, required: true },
});

const FareTable = mongoose.model('FareTable', fareTableSchema);

module.exports = FareTable;
