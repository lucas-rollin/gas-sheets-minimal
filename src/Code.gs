/**
 * Entry points. Every function WITHOUT a trailing underscore can be called from
 * the browser via google.script.run, so validate all input here.
 * Functions ending in "_" are private: Apps Script blocks them from the client.
 */

const APP_TITLE = 'GAS App';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Used by index.html: <?!= include('StyleSheet') ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ---- API called from JavaScript.html ----------------------------------

function listTasks() {
  return dbList_('tasks');
}

function createTask(title) {
  title = String(title || '').trim();
  if (!title) throw new Error('Title is required');
  if (title.length > 200) throw new Error('Title is too long (max 200 characters)');
  return dbInsert_('tasks', { title: title, done: false });
}

function toggleTask(id) {
  const task = dbGet_('tasks', id);
  if (!task) throw new Error('Task not found');
  return dbUpdate_('tasks', id, { done: !task.done });
}

function deleteTask(id) {
  dbRemove_('tasks', id);
}
