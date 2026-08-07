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
  syncEmployeeFromCentral: mockSyncEmployeeFromCentral
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
});
