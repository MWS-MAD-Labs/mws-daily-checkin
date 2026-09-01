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

module.exports = {
  lookupEmployeeByEmail,
  lookupEmployeeByEmployeeId,
  listActiveEmployees,
  lookupStudentByEmail,
  getStudentSupportContacts,
};
