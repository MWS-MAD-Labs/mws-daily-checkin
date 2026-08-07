const mockSendSuccess = jest.fn();
const mockSendError = jest.fn();

const homeroomId = '507f1f77bcf86cd799439030';

const mockUserFind = jest.fn();
const mockUserFindOne = jest.fn();
jest.mock('../../src/models/User', () => ({
  find: mockUserFind,
  findOne: mockUserFindOne
}));

const mockGetStudentSupportContacts = jest.fn();
jest.mock('../../src/services/mwsDataCenterClient', () => ({
  getStudentSupportContacts: mockGetStudentSupportContacts
}));

jest.mock('../../src/utils/response', () => ({
  sendSuccess: mockSendSuccess,
  sendError: mockSendError
}));

const { getSupportContacts } = require('../../src/controllers/supportController');

function chainable(result) {
  return { select: () => ({ sort: () => Promise.resolve(result) }) };
}

describe('getSupportContacts central class-teacher lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFind.mockReturnValue(chainable([]));
  });

  test('marks a centrally-matched homeroom teacher as classTeacher', async () => {
    mockGetStudentSupportContacts.mockResolvedValue({
      current_class: 'Grade 7 Coding',
      teachers: [{ name: 'Mr. Himawan', email: 'himawan@millennia21.id', role: 'HOMEROOM', subject: null }]
    });
    // findOne is also hit by the principal/psychologist lookups earlier in
    // getSupportContacts (aria@/wina@) - only the homeroom teacher's own
    // email should resolve to a real user, everyone else is "not found".
    mockUserFindOne.mockImplementation(({ email }) => ({
      select: () => Promise.resolve(
        email === 'himawan@millennia21.id'
          ? { _id: homeroomId, name: 'Himawan', email, role: 'teacher', isActive: true }
          : null
      )
    }));

    const req = { user: { id: 'student-1', role: 'student', email: 'student@millennia21.id', department: 'Junior High' } };
    const res = {};
    await getSupportContacts(req, res);

    expect(mockSendError).not.toHaveBeenCalled();
    const contacts = mockSendSuccess.mock.calls[0][2];
    const himawan = contacts.find((c) => c.id === homeroomId);
    expect(himawan).toBeDefined();
    expect(himawan.isClassTeacher).toBe(true);
    expect(himawan.contactCategory).toBe('classTeacher');
  });

  test('falls back gracefully when the central lookup throws', async () => {
    mockGetStudentSupportContacts.mockRejectedValue(new Error('network error'));

    const req = { user: { id: 'student-1', role: 'student', email: 'student@millennia21.id', department: 'Junior High' } };
    const res = {};
    await getSupportContacts(req, res);

    expect(mockSendError).not.toHaveBeenCalled();
    expect(mockSendSuccess).toHaveBeenCalled();
  });
});
