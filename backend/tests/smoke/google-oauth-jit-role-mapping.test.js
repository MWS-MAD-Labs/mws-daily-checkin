const mockUserSave = jest.fn().mockResolvedValue(undefined);

let lastUserConstructorArgs = null;
const UserMock = function UserMock(payload) {
  lastUserConstructorArgs = payload;
  Object.assign(this, payload);
  this._id = 'new-user-id';
  this.save = mockUserSave;
};
UserMock.findOne = jest.fn();

jest.mock('../../src/models/User', () => UserMock);

jest.mock('../../src/models/UserStudent', () => ({
  findOne: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../src/utils/studentCentralSync', () => ({
  // No student record for these emails - falls through to the staff check.
  syncStudentFromCentral: jest.fn().mockResolvedValue(null)
}));

const mockSyncEmployeeFromCentral = jest.fn();
jest.mock('../../src/utils/employeeCentralSync', () => ({
  syncEmployeeFromCentralWithFallback: mockSyncEmployeeFromCentral
}));

const passport = require('../../src/config/googleOAuth');
const { googleOAuthVerify } = passport;

const profile = {
  id: 'google-id-1',
  emails: [{ value: 'someone@millennia21.id' }],
  displayName: 'Someone'
};

describe('Google OAuth JIT role mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UserMock.findOne.mockResolvedValue(null);
    lastUserConstructorArgs = null;
  });

  test.each([
    ['Teacher', 'teacher'],
    ['SE Teacher', 'se_teacher'],
    ['Support Staff', 'support_staff'],
    ['Head Unit', 'head_unit'],
    ['Director', 'directorate'],
    ['Staff', 'staff']
  ])('new user with job_level %s is created with role %s', async (jobLevel, expectedRole) => {
    mockSyncEmployeeFromCentral.mockResolvedValue({
      name: 'Someone',
      employeeId: '99.99.999',
      jobPosition: 'Some Position',
      jobLevel,
      employmentStatus: 'PERMANENT',
      department: 'Elementary',
      unit: 'Elementary'
    });

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, expect.anything());
    expect(lastUserConstructorArgs.role).toBe(expectedRole);
  });

  test('new user with unrecognized job_level falls back to staff without throwing', async () => {
    mockSyncEmployeeFromCentral.mockResolvedValue({
      name: 'Someone',
      employeeId: '99.99.999',
      jobPosition: 'Some Position',
      jobLevel: 'Intern',
      employmentStatus: 'CONTRACT',
      department: 'Elementary',
      unit: 'Elementary'
    });

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, expect.anything());
    expect(lastUserConstructorArgs.role).toBe('staff');
  });

  test('central lookup throwing calls done(null, false, info) instead of an Error - so failureRedirect fires', async () => {
    mockSyncEmployeeFromCentral.mockRejectedValue(new Error('network error'));

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, false, { message: 'central_lookup_failed' });
  });

  test('inactive/missing central employee calls done(null, false, info) instead of an Error - so failureRedirect fires', async () => {
    mockSyncEmployeeFromCentral.mockResolvedValue(null);

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, false, { message: 'central_inactive' });
  });

  test('existing user role is left untouched on login refresh, regardless of central job_level', async () => {
    const existingUser = {
      _id: 'existing-user-id',
      email: 'someone@millennia21.id',
      role: 'admin',
      save: mockUserSave
    };
    UserMock.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);

    mockSyncEmployeeFromCentral.mockResolvedValue({
      name: 'Someone',
      employeeId: '99.99.999',
      jobPosition: 'Some Position',
      jobLevel: 'Support Staff',
      employmentStatus: 'PERMANENT',
      department: 'Elementary',
      unit: 'Elementary'
    });

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, existingUser);
    expect(existingUser.role).toBe('admin');
    expect(mockUserSave).toHaveBeenCalled();
  });

  test('passes the existing linked user\'s employeeId as the fallback identifier', async () => {
    const existingUser = {
      _id: 'existing-user-id',
      email: 'old.address@millennia21.id',
      employeeId: '15.24.756',
      role: 'staff',
      save: mockUserSave
    };
    // Found by googleId (first findOne call) - the live Google email may
    // no longer match what mws-data-center has on file, which is exactly
    // the scenario syncEmployeeFromCentralWithFallback's employeeId
    // fallback exists for.
    UserMock.findOne.mockResolvedValueOnce(existingUser);

    mockSyncEmployeeFromCentral.mockResolvedValue({
      name: 'Someone',
      email: 'someone@millennia21.id',
      employeeId: '15.24.756',
      jobPosition: 'Some Position',
      jobLevel: 'Support Staff',
      employmentStatus: 'PERMANENT',
      department: 'Elementary',
      unit: 'Elementary'
    });

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(mockSyncEmployeeFromCentral).toHaveBeenCalledWith(
      'someone@millennia21.id',
      '15.24.756',
    );
    expect(done).toHaveBeenCalledWith(null, existingUser);
    // Central's email is now trusted over the stale local one.
    expect(existingUser.email).toBe('someone@millennia21.id');
  });

  test('brand new account has no employeeId to fall back with', async () => {
    mockSyncEmployeeFromCentral.mockResolvedValue({
      name: 'Someone',
      employeeId: '99.99.999',
      jobPosition: 'Some Position',
      jobLevel: 'Staff',
      employmentStatus: 'PERMANENT',
      department: 'Elementary',
      unit: 'Elementary'
    });

    const done = jest.fn();
    await googleOAuthVerify('token', 'refresh', profile, done);

    expect(mockSyncEmployeeFromCentral).toHaveBeenCalledWith(
      'someone@millennia21.id',
      undefined,
    );
    expect(done).toHaveBeenCalledWith(null, expect.anything());
  });
});
