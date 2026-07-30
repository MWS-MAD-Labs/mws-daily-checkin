const axios = require("axios");

const BASE_URL = process.env.MWS_DATA_CENTER_API_URL;
const API_TOKEN = process.env.MWS_DATA_CENTER_API_TOKEN;

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

module.exports = { lookupEmployeeByEmail, listActiveEmployees };
