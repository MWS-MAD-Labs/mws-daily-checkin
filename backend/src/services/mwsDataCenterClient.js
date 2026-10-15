const axios = require("axios");

// Komodo's env for this service now names these CENTRAL_API_* - keep the
// old MWS_DATA_CENTER_API_* names as a fallback for any environment that
// hasn't been renamed yet.
const BASE_URL = process.env.MWS_DATA_CENTER_API_URL || process.env.CENTRAL_API_BASE_URL;
const API_TOKEN = process.env.MWS_DATA_CENTER_API_TOKEN || process.env.CENTRAL_API_TOKEN;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_TOKEN}` },
  timeout: 5000,
});

async function lookupEmployeeByEmail(email) {
  try {
    const { data } = await client.get("/employees/lookup", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function lookupEmployeeByPersonId(personId) {
  try {
    const { data } = await client.get("/employees/lookup", { params: { id: personId } });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) return null;
    throw error;
  }
}

// employee_id is the stable identifier - unlike email, it doesn't change
// when someone updates their address in mws-data-center. Used as a fallback
// when an already-linked local account's live Google email no longer
// matches what's on file centrally (see syncEmployeeFromCentral).
async function lookupEmployeeByEmployeeId(employeeId) {
  try {
    const { data } = await client.get("/employees/lookup", {
      params: { employee_id: employeeId },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function lookupStudentByEmail(email) {
  try {
    const { data } = await client.get("/students/lookup", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function lookupStudentByPersonId(personId) {
  try {
    const { data } = await client.get("/students/lookup", { params: { id: personId } });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) return null;
    throw error;
  }
}

// Returns { current_class, teachers: [{name, email, role, subject}] } or
// null if the student has no active record centrally (404). A missing
// current class is not an error - returns teachers: [] in that case.
async function getStudentSupportContacts(email) {
  try {
    const { data } = await client.get("/students/support-contacts", {
      params: { email },
    });
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

const LIST_PAGE_SIZE = 100;

// Fetches every ACTIVE employee, walking all pages. Throws on any page
// failure instead of returning a partial roster - callers diff a local
// roster against this and must never act on an incomplete result.
async function listActiveEmployees() {
  const employees = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/employees", {
      params: { status: "ACTIVE", size: LIST_PAGE_SIZE, page },
    });
    employees.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return employees;
}

// Central paginates at 100/page max and defaults to status=ACTIVE
// server-side if omitted - always pass one explicitly rather than relying
// on that default, since a caller comparing across lifecycle states (e.g.
// studentRosterSync.js's REGISTERED-and-ACTIVE-both-count-as-enrolled
// check) needs to choose the status itself.
async function listStudentsByStatus(status) {
  const students = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/students", {
      params: { page, size: LIST_PAGE_SIZE, status },
    });
    students.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return students;
}

// Same bulk-diff posture as listActiveEmployees() - walks every page,
// throws on any page failure rather than returning a partial list.
async function listClassTeacherAssignments() {
  const assignments = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/class-teacher-assignments", {
      params: { page, size: LIST_PAGE_SIZE },
    });
    assignments.push(...data.data);
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return assignments;
}

// What Central says this person may do in Daily Check-in (role, permissions, whether it is active), or null when it
// has nothing for them. A retired application gives nobody access.
async function lookupApplicationEntitlement(personId) {
  try {
    const { data } = await client.get("/application-entitlements/lookup", {
      params: { person_id: personId, application_id: "daily-checkin" },
    });
    return data.data ?? null;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.code === "application_retired") return null;
    throw error;
  }
}

// A short key that changes only when something Daily keeps about a person's access changes (name, email, role,
// permissions or who is a member). Asking for it is one small call, so it can be asked every minute.
async function getApplicationEntitlementKey(applicationId = "daily-checkin") {
  const { data } = await client.get("/application-entitlements/version", {
    params: { application_id: applicationId },
  });
  return data.data?.key ?? null;
}

// Everybody Central lists for this application, with the key of the moment they were read. Throws on any page
// failure instead of returning a partial list: callers revoke whoever is missing.
async function listApplicationEntitlements(applicationId = "daily-checkin") {
  const rows = [];
  let key = null;
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await client.get("/application-entitlements", {
      params: { application_id: applicationId, page, size: LIST_PAGE_SIZE },
    });
    rows.push(...data.data);
    // A change between two pages gives a different key; the last one is the one to keep.
    key = data.key ?? key;
    totalPages = data.paging.total_page;
    page += 1;
  } while (page <= totalPages);

  return { rows, key };
}

module.exports = {
  getApplicationEntitlementKey,
  listApplicationEntitlements,
  lookupApplicationEntitlement,
  lookupEmployeeByEmail,
  lookupEmployeeByPersonId,
  lookupEmployeeByEmployeeId,
  listActiveEmployees,
  listStudentsByStatus,
  lookupStudentByEmail,
  lookupStudentByPersonId,
  getStudentSupportContacts,
  listClassTeacherAssignments,
};
