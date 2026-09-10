const mockListStudentsByStatus = jest.fn();

jest.mock('../../src/services/mwsDataCenterClient', () => ({
  listStudentsByStatus: mockListStudentsByStatus
}));

const mockUserStudentFind = jest.fn();
jest.mock('../../src/models/UserStudent', () => ({
  find: mockUserStudentFind
}));

const { syncStudentRoster } = require('../../src/jobs/studentRosterSync');

function makeStudent(overrides = {}) {
  const student = {
    email: 'student@millennia21.id',
    name: 'A Student',
    currentGrade: 'Grade 7',
    className: 'Grade 7 A',
    isActive: true,
    ...overrides
  };
  student.save = jest.fn().mockResolvedValue(undefined);
  return student;
}

function makeCentralStudent(overrides = {}) {
  return {
    email: 'student@millennia21.id',
    full_name: 'A Student',
    nick_name: 'Student',
    current_grade: 'Grade 7',
    current_class: 'Grade 7 A',
    ...overrides
  };
}

describe('studentRosterSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deactivates a student no longer in either REGISTERED or ACTIVE roster', async () => {
    const student = makeStudent({ isActive: true });
    mockUserStudentFind.mockResolvedValue([student]);
    mockListStudentsByStatus.mockResolvedValue([]);

    const result = await syncStudentRoster();

    expect(student.isActive).toBe(false);
    expect(student.save).toHaveBeenCalled();
    expect(result.deactivated).toBe(1);
  });

  test('reactivates and updates a previously-inactive student found in the roster', async () => {
    const student = makeStudent({ isActive: false, currentGrade: 'Grade 6', className: 'Grade 6 A' });
    mockUserStudentFind.mockResolvedValue([student]);
    mockListStudentsByStatus.mockImplementation((status) =>
      status === 'ACTIVE' ? [makeCentralStudent()] : []);

    await syncStudentRoster();

    expect(student.isActive).toBe(true);
    expect(student.currentGrade).toBe('Grade 7');
    expect(student.save).toHaveBeenCalled();
  });

  test('REGISTERED counts as enrolled, same as ACTIVE - not deactivated', async () => {
    const student = makeStudent({ isActive: true });
    mockUserStudentFind.mockResolvedValue([student]);
    mockListStudentsByStatus.mockImplementation((status) =>
      status === 'REGISTERED' ? [makeCentralStudent()] : []);

    await syncStudentRoster();

    expect(student.isActive).toBe(true);
  });

  test('does not save when nothing changed', async () => {
    const student = makeStudent({
      isActive: true,
      nickname: 'Student',
      unit: 'Junior High',
      department: 'Junior High'
    });
    mockUserStudentFind.mockResolvedValue([student]);
    mockListStudentsByStatus.mockImplementation((status) =>
      status === 'ACTIVE' ? [makeCentralStudent()] : []);

    await syncStudentRoster();

    expect(student.save).not.toHaveBeenCalled();
  });

  test('skips the run (no writes) when Central is unreachable', async () => {
    mockListStudentsByStatus.mockRejectedValue(new Error('network down'));

    const result = await syncStudentRoster();

    expect(result.skipped).toBe(true);
    expect(mockUserStudentFind).not.toHaveBeenCalled();
  });
});
