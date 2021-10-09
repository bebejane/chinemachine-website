const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LanguageSchema = new Schema({
  name: {
    type: String,
    unique:true,
    required:[true, 'Language name required']
  },
  langCode: {
    type: String,
    minlength:2,
    maxlength:2,
    unique:true,
    required:[true, 'Language code required']
  }
})
module.exports = mongoose.models.Language || mongoose.model('Language', LanguageSchema);