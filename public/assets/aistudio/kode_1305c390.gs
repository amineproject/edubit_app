// --- EDUBITS BACKEND (Code.gs) ---

const SS = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🛠️ Edubits Tools')
    .addItem('⚡ Inisialisasi Database', 'initDatabase')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Edubits - Light Pixel Hub')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheet(sheetName, headers) {
  let sheet = SS.getSheetByName(sheetName);
  if (!sheet) sheet = SS.insertSheet(sheetName);
  if (sheet.getLastRow() === 0 && headers && headers.length) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#FFDE59').setFontColor('#0F172A')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initDatabase() {
  getSheet('Users', ['id', 'username', 'password', 'full_name', 'role', 'created_at']);
  getSheet('Classes', ['id', 'class_name']);
  getSheet('Subjects', ['id', 'subject_name']);
  getSheet('SubjectClasses', ['id', 'subject_id', 'class_id', 'created_at']);
  getSheet('Students', ['id', 'user_id', 'nis', 'class_id']);
  getSheet('Announcements', ['id', 'title', 'content', 'target_class_id', 'start_date', 'end_date', 'created_at']);
  getSheet('Materials', ['id', 'subject_id', 'class_id', 'title', 'url', 'created_at']);
  getSheet('Assignments', ['id', 'subject_id', 'class_id', 'title', 'description', 'due_date', 'created_at']);
  getSheet('Evaluations', ['id', 'assignment_id', 'student_id', 'is_collected', 'teacher_notes', 'grade']);
  return { success: true, message: 'Database Edubits Berhasil Diinisialisasi!' };
}

function readSheetData(sheetName) {
  try {
    const sheet = SS.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return [];
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    return rows.slice(1).filter(row => row.some(v => v !== '' && v !== null)).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (val instanceof Date) val = val.toISOString();
        obj[h] = val;
      });
      return obj;
    });
  } catch (e) {
    return [];
  }
}

function login(username, password) {
  initDatabase();
  const users = readSheetData('Users');
  const user = users.find(u => (String(u.username) === String(username) || String(u.id) === String(username)) && String(u.password) === String(password));
  if (!user) throw new Error('Username atau Password salah!');
  
  let profile = null;
  const role = String(user.role || '').trim().toUpperCase();
  if (role === 'SISWA') {
    profile = readSheetData('Students').find(s => String(s.user_id) === String(user.id)) || {};
  }
  
  return {
    id: String(user.id),
    username: String(user.username),
    full_name: String(user.full_name),
    role: role,
    class_id: profile ? String(profile.class_id || '') : '',
    nis: profile ? String(profile.nis || '') : ''
  };
}

function fetchAppData(userRole, classId, userId) {
  try {
    initDatabase();
    const classes = readSheetData('Classes');
    const subjects = readSheetData('Subjects');
    const subjectClasses = readSheetData('SubjectClasses');
    const announcements = readSheetData('Announcements');
    const materials = readSheetData('Materials');
    const assignments = readSheetData('Assignments');
    const evaluations = readSheetData('Evaluations');
    const students = readSheetData('Students');
    const users = readSheetData('Users');
    const role = String(userRole || '').trim().toUpperCase();
    const targetClassId = String(classId || '').trim();

    const belongsToClass = (savedClassIds, cId) => {
      const raw = String(savedClassIds || '').trim();
      if (!raw || raw === 'ALL') return true;
      return raw.split(',').map(x => x.trim()).includes(String(cId));
    };

    let allowedSubjects = subjects;
    if (role === 'SISWA') {
      const linkedSubjectIds = new Set(
        subjectClasses
          .filter(sc => String(sc.class_id) === targetClassId)
          .map(sc => String(sc.subject_id))
      );
      allowedSubjects = subjects.filter(s => linkedSubjectIds.has(String(s.id)));
    }

    const filteredAnnouncements = announcements.filter(a => role === 'GURU' || role === 'ADMIN' || belongsToClass(a.target_class_id, targetClassId));
    const filteredMaterials = materials.filter(m => role === 'GURU' || role === 'ADMIN' || belongsToClass(m.class_id, targetClassId));
    const filteredAssignments = assignments.filter(a => role === 'GURU' || role === 'ADMIN' || belongsToClass(a.class_id, targetClassId));

    const studentList = students.map(s => {
      const u = users.find(user => String(user.id) === String(s.user_id)) || {};
      return {
        id: String(s.user_id || ''),
        nis: String(s.nis || ''),
        full_name: String(u.full_name || 'Tanpa Nama'),
        class_id: String(s.class_id || '')
      };
    });

    return {
      classes,
      subjects: allowedSubjects,
      subjectClasses,
      announcements: filteredAnnouncements,
      materials: filteredMaterials,
      assignments: filteredAssignments,
      evaluations,
      students: (role === 'GURU' || role === 'ADMIN') ? studentList : studentList.filter(s => String(s.class_id) === targetClassId)
    };
  } catch (err) {
    return {
      classes: [], subjects: [], subjectClasses: [], announcements: [],
      materials: [], assignments: [], evaluations: [], students: [], error: err.message
    };
  }
}