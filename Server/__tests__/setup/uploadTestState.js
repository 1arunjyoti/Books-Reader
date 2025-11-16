const defaultFile = () => ({
  buffer: Buffer.from('mock-cover'),
  originalname: 'cover.png',
  mimetype: 'image/png',
  size: 1024,
});

const uploadFileState = {
  shouldAttach: true,
  file: defaultFile(),
};

function setUploadFileState({ shouldAttach, file } = {}) {
  if (typeof shouldAttach === 'boolean') {
    uploadFileState.shouldAttach = shouldAttach;
  }
  if (file) {
    uploadFileState.file = {
      ...defaultFile(),
      ...file,
    };
  }
}

function resetUploadFileState() {
  uploadFileState.shouldAttach = true;
  uploadFileState.file = defaultFile();
}

module.exports = {
  uploadFileState,
  setUploadFileState,
  resetUploadFileState,
};
