const core = require('@actions/core');
const fs = require('fs');
const git = require('./git');
const uploader = require('./uploader');

jest.mock('@actions/core');
jest.mock('./git');
jest.mock('./uploader');

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    promises: {
      mkdir: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
    }
  };
});

const { runAsync } = require('./initialise');

describe('initialise', () => {
  const gitState = { branchName: 'main' };

  beforeEach(() => {
    jest.resetAllMocks();
    git.generateGitStateAsync.mockResolvedValue(gitState);
    uploader.uploadArtifactAsync.mockResolvedValue(true);
  })

  it('fetches the git state', async () => {
    await runAsync();
    expect(git.generateGitStateAsync).toHaveBeenCalledTimes(1);
  });

  it('writes the git state to file', async () => {
    await runAsync();

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.writeFile.mock.calls[0][0]).toBe('manifest_git_state');
    const writtenState = JSON.parse(fs.promises.writeFile.mock.calls[0][1]);
    expect(writtenState).toStrictEqual(gitState);
  });

  it('uploads the git state as an artifact', async () => {
    await runAsync();

    expect(uploader.uploadArtifactAsync).toHaveBeenCalledTimes(1);
    expect(uploader.uploadArtifactAsync).toHaveBeenCalledWith(
      'manifest_git_state',
      'manifest_git_state'
    );
  });

  it('fails when the upload fails', async () => {
    uploader.uploadArtifactAsync.mockResolvedValue(false);

    await runAsync();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

});
