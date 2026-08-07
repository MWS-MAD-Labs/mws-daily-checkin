const mockListActiveEmployees = jest.fn();

jest.mock('../../src/services/mwsDataCenterClient', () => ({
  listActiveEmployees: mockListActiveEmployees
}));

const mockUserFind = jest.fn();
jest.mock('../../src/models/User', () => ({
  find: mockUserFind
}));

const { syncEmployeeRoster } = require('../../src/jobs/employeeRosterSync');

function makeUser(overrides = {}) {
  const user = {
    email: 'someone@millennia21.id',
    role: 'staff',
    name: 'Someone',
    employeeId: '99.99.999',
    jobLevel: 'Staff',
    jobPosition: 'Some Position',
    employmentStatus: 'PERMANENT',
    department: 'Elementary',
    unit: 'Elementary',
    isActive: true,
    ...overrides
  };
  user.save = jest.fn().mockResolvedValue(undefined);
  return user;
}

function makeEmployee(overrides = {}) {
  return {
    email: 'someone@millennia21.id',
    full_name: 'Someone',
    employee_id: '99.99.999',
    job_position: 'Some Position',
    job_level: 'Staff',
    employment_type: 'PERMANENT',
    unit: 'Elementary',
    ...overrides
  };
}

describe('employeeRosterSync role sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('promotes a staff-role user when central job_level is more specific', async () => {
    const user = makeUser({ role: 'staff' });
    mockUserFind.mockResolvedValue([user]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Teacher' })]);

    await syncEmployeeRoster();

    expect(user.role).toBe('teacher');
    expect(user.save).toHaveBeenCalled();
  });

  test('demotes a teacher-role user when central job_level reverts to Staff', async () => {
    const user = makeUser({ role: 'teacher', jobLevel: 'Teacher' });
    mockUserFind.mockResolvedValue([user]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Staff' })]);

    await syncEmployeeRoster();

    expect(user.role).toBe('staff');
    expect(user.save).toHaveBeenCalled();
  });

  test('overwrites a manually-set counselor role to match central job_level (accepted tradeoff)', async () => {
    const user = makeUser({ role: 'counselor' });
    mockUserFind.mockResolvedValue([user]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Head Unit' })]);

    await syncEmployeeRoster();

    expect(user.role).toBe('head_unit');
    expect(user.save).toHaveBeenCalled();
  });

  test('does not save when nothing changed (role and other fields already match)', async () => {
    const user = makeUser({ role: 'staff', jobLevel: 'Staff' });
    mockUserFind.mockResolvedValue([user]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Staff' })]);

    await syncEmployeeRoster();

    expect(user.role).toBe('staff');
    expect(user.save).not.toHaveBeenCalled();
  });

  test('leaves role untouched for an unrecognized job_level', async () => {
    const user = makeUser({ role: 'staff' });
    mockUserFind.mockResolvedValue([user]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Intern', job_position: 'Something New' })]);

    await syncEmployeeRoster();

    expect(user.role).toBe('staff');
  });

  test('admin/superadmin users are excluded from the sync candidates query entirely', async () => {
    mockUserFind.mockResolvedValue([]);
    mockListActiveEmployees.mockResolvedValue([makeEmployee({ job_level: 'Teacher' })]);

    await syncEmployeeRoster();

    expect(mockUserFind).toHaveBeenCalledWith(
      expect.objectContaining({
        role: { $nin: ['admin', 'superadmin'] }
      })
    );
  });
});
