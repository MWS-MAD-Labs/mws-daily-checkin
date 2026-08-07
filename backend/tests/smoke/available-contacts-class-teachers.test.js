const mockSendSuccess = jest.fn();
const mockSendError = jest.fn();

const teacherId = '507f1f77bcf86cd799439020';
const otherTeacherId = '507f1f77bcf86cd799439021';

const mockUserFind = jest.fn();
jest.mock('../../src/models/User', () => ({
  find: mockUserFind
}));

const mockGetStudentSupportContacts = jest.fn();
jest.mock('../../src/services/mwsDataCenterClient', () => ({
  getStudentSupportContacts: mockGetStudentSupportContacts
}));

jest.mock('../../src/utils/response', () => ({
  sendSuccess: mockSendSuccess,
  sendError: mockSendError
}));

const { getAvailableContacts } = require('../../src/controllers/checkinController');

function chainable(result) {
  return { select: () => ({ sort: () => Promise.resolve(result) }) };
}

describe('getAvailableContacts class-teacher enrichment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('flags a contact that matches the student\'s current class teachers', async () => {
    mockGetStudentSupportContacts.mockResolvedValue({
      current_class: 'Grade 7 Coding',
      teachers: [{ name: 'Mr. Himawan', email: 'himawan@millennia21.id', role: 'HOMEROOM', subject: null }]
    });
    mockUserFind.mockReturnValue(
      chainable([
        { _id: teacherId, name: 'Mr. Himawan', email: 'himawan@millennia21.id', role: 'teacher' },
        { _id: otherTeacherId, name: 'Ms. Nadia', email: 'nadia@millennia21.id', role: 'teacher' }
      ])
    );

    const req = { user: { id: 'student-1', role: 'student', email: 'student@millennia21.id' } };
    const res = {};
    await getAvailableContacts(req, res);

    expect(mockSendError).not.toHaveBeenCalled();
    const contacts = mockSendSuccess.mock.calls[0][2].contacts;
    const himawan = contacts.find((c) => c.id === teacherId);
    const nadia = contacts.find((c) => c.id === otherTeacherId);

    expect(himawan.isClassTeacher).toBe(true);
    expect(himawan.classTeacherRole).toBe('HOMEROOM');
    expect(nadia.isClassTeacher).toBe(false);
  });

  test('falls back to the generic list when the central lookup fails', async () => {
    mockGetStudentSupportContacts.mockRejectedValue(new Error('network error'));
    mockUserFind.mockReturnValue(
      chainable([{ _id: teacherId, name: 'Mr. Himawan', email: 'himawan@millennia21.id', role: 'teacher' }])
    );

    const req = { user: { id: 'student-1', role: 'student', email: 'student@millennia21.id' } };
    const res = {};
    await getAvailableContacts(req, res);

    expect(mockSendError).not.toHaveBeenCalled();
    const contacts = mockSendSuccess.mock.calls[0][2].contacts;
    expect(contacts.find((c) => c.id === teacherId).isClassTeacher).toBe(false);
  });
});
