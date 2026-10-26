/**
 * AssignMate Google Apps Script API starter
 * 1. Create a Google Sheet with tabs: Assignments, Submissions, Users
 * 2. Open Extensions > Apps Script and paste this file.
 * 3. Set SHEET_ID below, deploy as Web app.
 * NOTE: This starter is for learning. Do not treat role/email checks as secure authentication.
 */
const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'health';
  const result = route_(action, e ? e.parameter : {});
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (_) {}
  const result = route_(body.action || '', body);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function route_(action, p) {
  try {
    if (action === 'health') return {ok:true, message:'AssignMate Apps Script API is running'};
    if (action === 'listAssignments') return {ok:true, data: rows_('Assignments')};
    if (action === 'listSubmissions') return {ok:true, data: rows_('Submissions')};
    if (action === 'createAssignment') {
      const sh = sheet_('Assignments');
      sh.appendRow([new Date(), p.title || '', p.course || '', p.code || '', p.due || '', p.marks || '', p.description || '', p.type || '', p.faculty || '']);
      return {ok:true, message:'Assignment created'};
    }
    if (action === 'submitAssignment') {
      const sh = sheet_('Submissions');
      sh.appendRow([new Date(), p.assignmentId || '', p.title || '', p.student || '', p.roll || '', p.course || '', p.link || '', p.comment || '', 'Submitted', '', p.email || '']);
      return {ok:true, message:'Submission saved'};
    }
    if (action === 'gradeSubmission') {
      const sh = sheet_('Submissions');
      const data = sh.getDataRange().getValues();
      const id = String(p.id || '');
      for (let i=1;i<data.length;i++) {
        if (String(data[i][0]) === id || String(data[i][1]) === id) {
          sh.getRange(i+1,9).setValue('Graded');
          sh.getRange(i+1,10).setValue(p.marks || '');
          return {ok:true, message:'Grade saved'};
        }
      }
      return {ok:false, message:'Submission not found'};
    }
    return {ok:false, message:'Unknown action: ' + action};
  } catch (err) { return {ok:false, message:String(err)}; }
}
function sheet_(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const headers = {
      Assignments:['Created At','Title','Course','Code','Due Date','Marks','Description','Submission Type','Faculty'],
      Submissions:['Submitted At','Assignment ID','Title','Student','Roll Number','Course','Link','Comment','Status','Marks','Email'],
      Users:['Email','Name','Role','Password Hash']
    };
    sh.appendRow(headers[name] || []);
  }
  return sh;
}
function rows_(name) {
  const sh = sheet_(name), values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.map(row => headers.reduce((o,h,i) => { o[String(h)] = row[i] instanceof Date ? row[i].toISOString() : row[i]; return o; }, {}));
}
